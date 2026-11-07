import { db } from '../db/database';
import { geminiService } from './gemini.service';
import {
  containsRestrictedContent,
  getYearRange,
  isFamilyFriendly,
  normalize,
  scoreCompatibility,
} from './recommendation-scoring';
import { StandardizedMovie, tmdbService } from './tmdb.service';

export { containsRestrictedContent, isFamilyFriendly, scoreCompatibility } from './recommendation-scoring';

const GENRE_IDS: Record<string, number> = {
  acao: 28,
  aventura: 12,
  animacao: 16,
  comedia: 35,
  crime: 80,
  documentario: 99,
  drama: 18,
  familia: 10751,
  fantasia: 14,
  historia: 36,
  terror: 27,
  musica: 10402,
  misterio: 9648,
  romance: 10749,
  'ficcao cientifica': 878,
  suspense: 53,
  guerra: 10752,
  faroeste: 37,
};

export interface RecommendationRequest {
  userId?: string;
  userPrompt?: string;
  contentType?: 'movie' | 'tv' | 'all';
  mood?: string;
  preferredGenres?: string[];
  rejectedGenres?: string[];
  maxDurationMinutes?: number;
  activeStreamings?: string[];
  viewingContext?: string;
  preferredYearRange?: string;
  excludedTitles?: string[];
  contentRestrictions?: string[];
  familyFriendly?: boolean;
  preferredDuration?: 'any' | 'short' | 'standard' | 'epic';
  minDurationMinutes?: number;
}

export interface RecommendationResult {
  topMatch: StandardizedMovie | null;
  recommendations: StandardizedMovie[];
  secondaryCandidates: StandardizedMovie[];
  metadata: {
    totalEvaluated: number;
    appliedFilters: {
      streamings: string[];
      genres: string[];
      maxDuration?: number;
      region: 'BR';
    };
    algorithmVersion: string;
    tmdbAttribution: string;
    shortfall: number;
    message?: string;
  };
}

export class RecommendationService {
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    const userId = request.userId || 'anonymous';
    const savedPreferences = db.getPreferences(userId);
    const unique = (values: string[]) => Array.from(new Set(values));
    const durationPreference = request.maxDurationMinutes !== undefined
      ? 'any'
      : request.preferredDuration || savedPreferences.preferredDuration;
    const durationBounds = {
      any: { min: undefined, max: undefined },
      short: { min: undefined, max: 90 },
      standard: { min: 90, max: 120 },
      epic: { min: 121, max: undefined },
    }[durationPreference];
    const effectiveRequest: RecommendationRequest = {
      ...request,
      userId,
      contentType: request.contentType && request.contentType !== 'all'
        ? request.contentType
        : savedPreferences.preferredContentType,
      preferredGenres: unique([...savedPreferences.favoriteGenres, ...(request.preferredGenres || [])]),
      rejectedGenres: unique([...savedPreferences.rejectedGenres, ...(request.rejectedGenres || [])]),
      activeStreamings: request.activeStreamings?.length
        ? request.activeStreamings
        : savedPreferences.streamingProviders,
      preferredYearRange: request.preferredYearRange || savedPreferences.preferredYearRange,
      contentRestrictions: unique([...savedPreferences.contentRestrictions, ...(request.contentRestrictions || [])]),
      familyFriendly: request.familyFriendly === true || savedPreferences.familyFriendly,
      minDurationMinutes: durationBounds.min,
      maxDurationMinutes: request.maxDurationMinutes ?? durationBounds.max,
    };
    const languageCode = savedPreferences.preferredLanguage === 'any'
      ? undefined
      : savedPreferences.preferredLanguage.toLowerCase().startsWith('en')
        ? 'en'
        : savedPreferences.preferredLanguage.toLowerCase().startsWith('es') ? 'es' : 'pt';
    const activeStreamings = effectiveRequest.activeStreamings || [];
    const preferredGenres = effectiveRequest.preferredGenres || [];
    const genreIds = Array.from(new Set(preferredGenres
      .map((genre) => GENRE_IDS[normalize(genre)])
      .filter((id): id is number => id !== undefined)));
    const discovered = await tmdbService.discoverTitles({
      mediaType: effectiveRequest.contentType || 'all',
      genreIds,
      minDurationMinutes: effectiveRequest.minDurationMinutes,
      maxDurationMinutes: effectiveRequest.maxDurationMinutes,
      originalLanguage: languageCode,
      preferredYear: (() => {
        const range = getYearRange(effectiveRequest.preferredYearRange);
        return range && range.min === range.max ? range.min : undefined;
      })(),
    });

    const history = db.getHistory(userId);
    const excludedIds = new Set(
      history.filter((entry) => entry.interactionType === 'watched' || entry.interactionType === 'dismissed')
        .map((entry) => `${entry.mediaType}:${entry.tmdbId}`),
    );
    const excludedTitles = (effectiveRequest.excludedTitles || []).map(normalize);
    const genreFiltered = discovered.filter((movie) =>
      !excludedIds.has(`${movie.mediaType}:${movie.tmdbId}`) &&
      !excludedTitles.includes(normalize(movie.title)) &&
      !movie.genres.some((genre) =>
        (effectiveRequest.rejectedGenres || [])
          .some((rejected) => normalize(genre).includes(normalize(rejected))),
      ),
    );

    const withProviders = tmdbService.filterByProviders(genreFiltered, activeStreamings);
    const details = await Promise.all(withProviders.slice(0, 20).map((movie) =>
      tmdbService.getTitleDetails(movie.tmdbId, movie.mediaType),
    ));
    const scored = details
      .filter((movie): movie is StandardizedMovie => movie !== null)
      .filter((movie) => !effectiveRequest.minDurationMinutes || !movie.durationMinutes ||
        movie.durationMinutes >= effectiveRequest.minDurationMinutes)
      .filter((movie) => !effectiveRequest.maxDurationMinutes || !movie.durationMinutes ||
        movie.durationMinutes <= effectiveRequest.maxDurationMinutes)
      .filter((movie) => {
        const range = getYearRange(effectiveRequest.preferredYearRange);
        return !range || (movie.releaseYear >= range.min && movie.releaseYear <= range.max);
      })
      .filter((movie) => {
        if (!effectiveRequest.familyFriendly) return true;
        return isFamilyFriendly(movie);
      })
      .filter((movie) => !containsRestrictedContent(movie, effectiveRequest.contentRestrictions || []))
      .map((movie) => ({
        ...movie,
        matchScore: scoreCompatibility(movie, effectiveRequest),
      }))
      .filter((movie) => movie.matchScore > 0)
      .sort((left, right) => right.matchScore - left.matchScore);

    const recommendations = scored.slice(0, 3);
    if (recommendations.length) {
      const justifications = await geminiService.generateJustifications({
        movies: recommendations,
        userPrompt: effectiveRequest.userPrompt || 'Encontre títulos que combinem com minhas preferências.',
      });
      for (const movie of recommendations) {
        const justification = justifications[movie.tmdbId];
        if (!justification) {
          throw Object.assign(new Error('A IA não retornou justificativa para uma das recomendações.'), { status: 502 });
        }
        movie.aiMatchReason = justification;
      }
    }

    const shortfall = Math.max(0, 3 - recommendations.length);
    return {
      topMatch: recommendations[0] || null,
      recommendations,
      secondaryCandidates: scored.slice(3),
      metadata: {
        totalEvaluated: discovered.length,
        appliedFilters: {
          streamings: activeStreamings,
          genres: preferredGenres,
          maxDuration: effectiveRequest.maxDurationMinutes,
          region: 'BR',
        },
        algorithmVersion: 'CineMatch 1.0',
        tmdbAttribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
        shortfall,
        message: shortfall
          ? `Encontramos ${recommendations.length} de 3 opções com disponibilidade confirmada. Tente ampliar os filtros ou aceitar aluguel e compra.`
          : undefined,
      },
    };
  }

  async calculateCoupleMatch(params: {
    user1Tastes: string[];
    user2Taste: 'drama' | 'scifi' | 'comedy' | 'thriller';
  }): Promise<{
    topMatch: StandardizedMovie;
    jointScore: number;
    explanation: string;
  }> {
    const secondTaste: Record<typeof params.user2Taste, string> = {
      drama: 'Drama',
      scifi: 'Ficção Científica',
      comedy: 'Comédia',
      thriller: 'Suspense',
    };
    const result = await this.getRecommendations({
      preferredGenres: [...params.user1Tastes, secondTaste[params.user2Taste]],
      activeStreamings: [],
    });
    const topMatch = result.topMatch;
    if (!topMatch) {
      throw Object.assign(new Error('Não há recomendações com disponibilidade confirmada para estas preferências.'), { status: 404 });
    }
    return {
      topMatch,
      jointScore: topMatch.matchScore,
      explanation: topMatch.aiMatchReason,
    };
  }
}

export const recommendationService = new RecommendationService();
