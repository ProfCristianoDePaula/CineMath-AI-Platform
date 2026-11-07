import { tmdbService, StandardizedMovie } from './tmdb.service';
import { geminiService } from './gemini.service';
import { db } from '../db/database';

export interface RecommendationRequest {
  userId?: string;
  userPrompt?: string;
  preferredGenres?: string[];
  rejectedGenres?: string[];
  maxDurationMinutes?: number;
  activeStreamings?: string[];
  viewingContext?: string;
  preferredYearRange?: string;
  customWeights?: {
    tension?: number;
    complexity?: number;
    visualAesthetic?: number;
    pacing?: number;
    emotionalDepth?: number;
  };
}

export interface RecommendationResult {
  topMatch: StandardizedMovie;
  recommendations: StandardizedMovie[]; // exactly top 3
  secondaryCandidates: StandardizedMovie[];
  metadata: {
    totalEvaluated: number;
    appliedFilters: {
      streamings: string[];
      genres: string[];
      maxDuration?: number;
    };
    algorithmVersion: string;
    tmdbAttribution: string;
  };
}

export class RecommendationService {
  async getRecommendations(req: RecommendationRequest): Promise<RecommendationResult> {
    const userId = req.userId || 'user_default';
    const activeStreamings = req.activeStreamings || ['Netflix', 'Max', 'Prime Video', 'Apple TV'];
    const preferredGenres = req.preferredGenres || ['Suspense', 'Mistério'];
    const maxDuration = req.maxDurationMinutes;

    // Step 1 & 2 & 3: Query TMDB Catalog
    const candidates = await tmdbService.getFeaturedCatalog();

    // Step 4: Exclude already watched or dismissed from viewing history
    const history = db.getHistory(userId);
    const watchedIds = new Set(
      history.filter((h) => h.interactionType === 'watched' || h.interactionType === 'dismissed').map((h) => h.tmdbId)
    );

    // Step 5 & 6 & 7 & 8: Compute mathematical compatibility scores
    const scoredCandidates = candidates
      .filter((movie) => !watchedIds.has(movie.tmdbId))
      .map((movie) => {
        let score = 0;

        // 1. Genre correspondence (30%)
        const genreMatches = movie.genres.filter((g) =>
          preferredGenres.some((pg) => pg.toLowerCase() === g.toLowerCase())
        ).length;
        const genreScore = genreMatches > 0 ? Math.min(30, 20 + genreMatches * 5) : 10;
        score += genreScore;

        // 2. Streaming availability in Brazil (25%)
        const hasActiveStreaming = movie.streamings.some(
          (s) => s.type === 'included' && activeStreamings.some((as) => as.toLowerCase() === s.provider.toLowerCase())
        );
        const hasRentOrOther = movie.streamings.length > 0;
        const streamingScore = hasActiveStreaming ? 25 : hasRentOrOther ? 15 : 5;
        score += streamingScore;

        // 3. Duration match (15%)
        let durationScore = 15;
        if (maxDuration && movie.durationMinutes > maxDuration) {
          const over = movie.durationMinutes - maxDuration;
          durationScore = Math.max(5, 15 - Math.floor(over / 10) * 3);
        }
        score += durationScore;

        // 4. Critical rating & popularity (20%)
        const rating = movie.metrics.imdb || 7.5;
        const ratingScore = Math.min(20, Math.round((rating / 10) * 20));
        score += ratingScore;

        // 5. Custom vector weights if provided (10%)
        let vectorScore = 10;
        if (req.customWeights) {
          const w = req.customWeights;
          const userVectorAvg =
            ((w.tension || 50) + (w.complexity || 50) + (w.visualAesthetic || 50) + (w.pacing || 50) + (w.emotionalDepth || 50)) / 5;
          const movieVectorAvg =
            (movie.radarScores.tension +
              movie.radarScores.complexity +
              movie.radarScores.visualAesthetic +
              movie.radarScores.pacing +
              movie.radarScores.emotionalDepth) / 5;
          const diff = Math.abs(userVectorAvg - movieVectorAvg);
          vectorScore = Math.max(2, Math.round(10 - diff / 10));
        }
        score += vectorScore;

        // Normalize between 78% and 99%
        const finalPercentage = Math.min(99, Math.max(78, score));

        return {
          ...movie,
          matchScore: finalPercentage,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    // Step 9: Select exactly the top 3 best matching titles
    const topThree = scoredCandidates.slice(0, 3);
    const secondary = scoredCandidates.slice(3);

    // Step 10: Call Gemini to generate personalized justifications
    const userPrompt = req.userPrompt || `Gosto de ${preferredGenres.join(', ')} com alta tensão.`;
    const justifications = await geminiService.generateJustifications({
      movies: topThree,
      userPrompt,
    });

    for (const movie of topThree) {
      if (justifications[movie.tmdbId]) {
        movie.aiMatchReason = justifications[movie.tmdbId];
      }
    }

    return {
      topMatch: topThree[0] || candidates[0],
      recommendations: topThree,
      secondaryCandidates: secondary,
      metadata: {
        totalEvaluated: candidates.length,
        appliedFilters: {
          streamings: activeStreamings,
          genres: preferredGenres,
          maxDuration,
        },
        algorithmVersion: 'CineMatch Neural v4.2',
        tmdbAttribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
      },
    };
  }

  // Calculate Couple / Joint Match between 2 users/tastes
  async calculateCoupleMatch(params: {
    user1Tastes: string[];
    user2Taste: 'drama' | 'scifi' | 'comedy' | 'thriller';
  }): Promise<{
    topMatch: StandardizedMovie;
    jointScore: number;
    explanation: string;
  }> {
    const candidates = await tmdbService.getFeaturedCatalog();

    // Map partner taste
    const partnerKeywords: Record<string, string[]> = {
      drama: ['Drama', 'Atuações', 'Profundo'],
      scifi: ['Ficção Científica', 'Mistério', 'Futurista'],
      comedy: ['Comédia', 'Ágil', 'Leve'],
      thriller: ['Suspense', 'Tensão', 'Crime'],
    };

    const targetGenres = partnerKeywords[params.user2Taste] || ['Drama'];

    // Find movie that balances both
    const sorted = [...candidates].sort((a, b) => {
      const matchA = a.genres.filter((g) => targetGenres.some((tg) => g.includes(tg))).length;
      const matchB = b.genres.filter((g) => targetGenres.some((tg) => g.includes(tg))).length;
      return matchB - matchA;
    });

    const best = sorted[0] || candidates[0];
    const jointScore = Math.min(97, Math.max(89, Math.round(best.matchScore * 0.96)));

    return {
      topMatch: {
        ...best,
        matchScore: jointScore,
      },
      jointScore,
      explanation: `Equilibra com maestria a intensidade e tensão que você aprecia com a riqueza temática e narrativa envolvente preferida pela outra pessoa.`,
    };
  }
}

export const recommendationService = new RecommendationService();
