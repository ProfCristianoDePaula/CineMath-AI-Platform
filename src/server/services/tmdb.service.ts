import { StreamingOption, CastMember, Movie } from '../../types';

type MediaType = 'movie' | 'tv';

interface TmdbTitle {
  id: number;
  media_type?: MediaType;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  genres?: Array<{ id: number; name: string }>;
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_seasons?: number;
  tagline?: string;
  credits?: {
    cast?: Array<{ name: string; character?: string; profile_path?: string | null }>;
    crew?: Array<{ name: string; job: string }>;
  };
  videos?: {
    results?: Array<{ key: string; site: string; type: string }>;
  };
  release_dates?: {
    results?: Array<{
      iso_3166_1: string;
      release_dates: Array<{ certification?: string }>;
    }>;
  };
  content_ratings?: {
    results?: Array<{ iso_3166_1: string; rating: string }>;
  };
}

interface TmdbProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

interface TmdbProviderRegion {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
  free?: TmdbProvider[];
  ads?: TmdbProvider[];
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const GENRES: Record<number, string> = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  10770: 'Cinema TV',
  53: 'Suspense',
  10752: 'Guerra',
  37: 'Faroeste',
  10759: 'Ação e Aventura',
  10762: 'Infantil',
  10763: 'Notícias',
  10764: 'Reality',
  10765: 'Ficção Científica e Fantasia',
  10766: 'Novela',
  10767: 'Talk Show',
  10768: 'Guerra e Política',
};

const PROVIDER_COLORS: Record<string, string> = {
  Netflix: '#E50914',
  Max: '#002BE7',
  'HBO Max': '#002BE7',
  'Amazon Prime Video': '#00A8E1',
  'Prime Video': '#00A8E1',
  'Apple TV': '#000000',
  'Apple TV Plus': '#000000',
  'Disney Plus': '#113CCF',
  'Disney+': '#113CCF',
  'Paramount Plus': '#0064FF',
  'Paramount+': '#0064FF',
  Globoplay: '#FB0B15',
};

const cache = new Map<string, CacheEntry>();

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function providerMatches(actual: string, selected: string): boolean {
  const left = normalize(actual);
  const right = normalize(selected);
  if (left === right) return true;
  if (left.includes('amazon') && right.includes('prime')) return true;
  return left.includes(right) || right.includes(left);
}

export interface StandardizedMovie extends Movie {
  tmdbId: number;
  mediaType: MediaType;
  voteCount: number;
  watchLink?: string;
}

export interface DiscoverOptions {
  mediaType?: MediaType | 'all';
  genreIds?: number[];
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  originalLanguage?: string;
  preferredYear?: number;
  page?: number;
}

export class TmdbService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly apiKey = process.env.TMDB_API_KEY || '';

  hasValidKey(): boolean {
    return this.apiKey.length > 0;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.hasValidKey()) {
      throw Object.assign(new Error('TMDB_API_KEY não configurada no servidor.'), { status: 503 });
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('language', 'pt-BR');
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        const status = response.status === 401 ? 502 : response.status === 404 ? 404 : 502;
        throw Object.assign(new Error('O catálogo TMDB não conseguiu concluir a solicitação.'), { status });
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && 'status' in error) throw error;
      throw Object.assign(new Error('Não foi possível conectar ao catálogo TMDB.'), { status: 502 });
    } finally {
      clearTimeout(timer);
    }
  }

  private async cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const entry = cache.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.value as T;
    if (entry) cache.delete(key);
    const value = await load();
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }

  private async getProviders(tmdbId: number, mediaType: MediaType): Promise<{ options: StreamingOption[]; link?: string }> {
    return this.cached(`providers:${mediaType}:${tmdbId}:BR`, 6 * 60 * 60 * 1000, async () => {
      let response: { results?: Record<string, TmdbProviderRegion> };
      try {
        response = await this.request<{ results?: Record<string, TmdbProviderRegion> }>(
          `/${mediaType}/${tmdbId}/watch/providers`,
        );
      } catch (error) {
        const status = typeof error === 'object' && error !== null && 'status' in error
          ? error.status
          : undefined;
        if (status === 503) throw error;
        console.warn('TMDB availability could not be verified.', { mediaType, tmdbId, status });
        return { options: [] };
      }
      const region = response.results?.BR;
      if (!region) return { options: [] };
      const categories: Array<['flatrate' | 'free' | 'ads' | 'rent' | 'buy', StreamingOption['type']]> = [
        ['flatrate', 'included'],
        ['free', 'free'],
        ['ads', 'ads'],
        ['rent', 'rent'],
        ['buy', 'buy'],
      ];
      const options = categories.flatMap(([category, type]) =>
        (region[category] || []).map((provider) => ({
          provider: provider.provider_name,
          logoText: provider.provider_name,
          badgeColor: PROVIDER_COLORS[provider.provider_name] || '#a078ff',
          quality: '',
          type,
          audioInfo: '',
          externalUrl: region.link,
          logoUrl: provider.logo_path ? `${IMAGE_BASE}/w92${provider.logo_path}` : '',
        })),
      );
      return { options, link: region.link };
    });
  }

  private standardize(
    raw: TmdbTitle,
    mediaType: MediaType,
    streamings: StreamingOption[] = [],
    watchLink?: string,
  ): StandardizedMovie {
    const releaseDate = mediaType === 'movie' ? raw.release_date : raw.first_air_date;
    const year = releaseDate ? Number(releaseDate.slice(0, 4)) : 0;
    const genres = raw.genres?.map((genre) => genre.name) ||
      raw.genre_ids?.map((id) => GENRES[id]).filter((genre): genre is string => !!genre) || [];
    const rating = Number(raw.vote_average || 0);
    const posterPath = raw.poster_path || '';
    const backdropPath = raw.backdrop_path || '';
    const runtime = raw.runtime || raw.episode_run_time?.[0] || 0;
    const cast: CastMember[] = (raw.credits?.cast || []).slice(0, 8).map((person) => ({
      name: person.name,
      role: person.character || '',
      avatarUrl: person.profile_path ? `${IMAGE_BASE}/w185${person.profile_path}` : '',
    }));
    const trailer = raw.videos?.results?.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer',
    );
    const director = raw.credits?.crew?.find((person) => person.job === 'Director')?.name || '';
    const certification = mediaType === 'movie'
      ? raw.release_dates?.results?.find((item) => item.iso_3166_1 === 'BR')?.release_dates
          .find((item) => item.certification)?.certification
      : raw.content_ratings?.results?.find((item) => item.iso_3166_1 === 'BR')?.rating;
    const highlights = [
      rating > 0 ? `Avaliação TMDB: ${rating.toFixed(1)}/10 (${raw.vote_count || 0} votos).` : '',
      runtime > 0 ? `Duração informada pelo TMDB: ${runtime} min.` : '',
      streamings.length ? `Opções no Brasil: ${streamings.map((item) => item.provider).join(', ')}.` : '',
    ].filter(Boolean);

    return {
      id: `tmdb-${raw.id}`,
      tmdbId: raw.id,
      mediaType,
      title: raw.title || raw.name || '',
      numberOfSeasons: mediaType === 'tv' ? raw.number_of_seasons : undefined,
      originalTitle: raw.original_title || raw.original_name || raw.title || raw.name || '',
      tagline: raw.tagline || '',
      director,
      releaseYear: year,
      durationMinutes: runtime,
      ageRating: certification || '',
      qualityBadge: '',
      matchScore: 0,
      genres,
      posterUrl: posterPath ? `${IMAGE_BASE}/w500${posterPath}` : '',
      backdropUrl: backdropPath ? `${IMAGE_BASE}/original${backdropPath}` : '',
      trailerStillUrl: backdropPath ? `${IMAGE_BASE}/w780${backdropPath}` : '',
      trailerYoutubeKey: trailer?.key,
      synopsis: raw.overview || '',
      aiMatchReason: '',
      matchHighlights: highlights,
      metrics: { tmdb: rating, voteCount: raw.vote_count || 0 },
      streamings,
      cast,
      similarMovieIds: [],
      voteCount: raw.vote_count || 0,
      watchLink,
    };
  }

  async getTitleDetails(tmdbId: number, mediaType: MediaType = 'movie'): Promise<StandardizedMovie | null> {
    if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) return null;
    return this.cached(`details:${mediaType}:${tmdbId}`, 60 * 60 * 1000, async () => {
      const raw = await this.request<TmdbTitle>(`/${mediaType}/${tmdbId}`, {
        append_to_response: mediaType === 'movie'
          ? 'credits,videos,release_dates'
          : 'credits,videos,content_ratings',
      });
      const providers = await this.getProviders(tmdbId, mediaType);
      return this.standardize(raw, mediaType, providers.options, providers.link);
    });
  }

  async getWatchProviders(tmdbId: number, mediaType: MediaType = 'movie'): Promise<StreamingOption[]> {
    if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) return [];
    const result = await this.getProviders(tmdbId, mediaType);
    return result.options;
  }

  async searchTitles(query: string, mediaType: MediaType = 'movie'): Promise<StandardizedMovie[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];
    const key = `search:${mediaType}:${normalizedQuery.toLowerCase()}`;
    return this.cached(key, 30 * 60 * 1000, async () => {
      const response = await this.request<{ results?: TmdbTitle[] }>(`/search/${mediaType}`, {
        query: normalizedQuery,
        include_adult: 'false',
        region: 'BR',
      });
      return (response.results || []).slice(0, 20).map((raw) => this.standardize(raw, mediaType));
    });
  }

  async getFeaturedCatalog(): Promise<StandardizedMovie[]> {
    return this.cached('featured:BR', 30 * 60 * 1000, async () => {
      const response = await this.request<{ results?: TmdbTitle[] }>('/trending/all/week', {
        page: '1',
      });
      const titles = (response.results || [])
        .filter((title) => title.media_type === 'movie' || title.media_type === 'tv')
        .slice(0, 12);
      return Promise.all(titles.map(async (title) => {
        const mediaType = title.media_type as MediaType;
        const providers = await this.getProviders(title.id, mediaType);
        return this.standardize(title, mediaType, providers.options, providers.link);
      }));
    });
  }

  async getGenres(mediaType: MediaType = 'movie'): Promise<Array<{ id: number; name: string }>> {
    return this.cached(`genres:${mediaType}`, 24 * 60 * 60 * 1000, async () => {
      const response = await this.request<{ genres?: Array<{ id: number; name: string }> }>(
        `/genre/${mediaType}/list`,
      );
      return response.genres || [];
    });
  }

  async getProviderCatalog(mediaType: MediaType = 'movie'): Promise<TmdbProvider[]> {
    return this.cached(`provider-list:${mediaType}:BR`, 24 * 60 * 60 * 1000, async () => {
      const response = await this.request<{ results?: TmdbProvider[] }>(
        `/watch/providers/${mediaType}`,
        { watch_region: 'BR' },
      );
      return response.results || [];
    });
  }

  async discoverTitles(options: DiscoverOptions = {}): Promise<StandardizedMovie[]> {
    const cacheKey = `discover:${JSON.stringify(options)}`;
    return this.cached(cacheKey, 30 * 60 * 1000, async () => {
    const mediaTypes: MediaType[] = options.mediaType === 'movie' || options.mediaType === 'tv'
      ? [options.mediaType]
      : ['movie', 'tv'];
    const results = await Promise.all(mediaTypes.map(async (mediaType) => {
      const filters: Record<string, string> = {
        sort_by: 'popularity.desc',
        include_adult: 'false',
        page: String(options.page || 1),
        'vote_count.gte': '50',
      };
      if (options.genreIds?.length) filters.with_genres = options.genreIds.join(',');
      if (options.originalLanguage) filters.with_original_language = options.originalLanguage;
      if (options.preferredYear) {
        filters[mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = String(options.preferredYear);
      }
      if (options.maxDurationMinutes) {
        filters[mediaType === 'movie' ? 'with_runtime.lte' : 'with_runtime.lte'] = String(options.maxDurationMinutes);
      }
      if (options.minDurationMinutes) {
        filters['with_runtime.gte'] = String(options.minDurationMinutes);
      }
      const response = await this.request<{ results?: TmdbTitle[] }>(`/discover/${mediaType}`, filters);
      return (response.results || []).slice(0, 20).map((title) => ({ title, mediaType }));
    }));

    const titles = results.flat().sort((a, b) => (b.title.popularity || 0) - (a.title.popularity || 0));
    return Promise.all(titles.map(async ({ title, mediaType }) => {
      const providers = await this.getProviders(title.id, mediaType);
      return this.standardize(title, mediaType, providers.options, providers.link);
    }));
    });
  }

  filterByProviders(titles: StandardizedMovie[], selectedProviders: string[]): StandardizedMovie[] {
    if (!selectedProviders.length) return titles.filter((title) => title.streamings.length > 0);
    return titles.filter((title) =>
      title.streamings.some((option) =>
        option.type === 'included' &&
        selectedProviders.some((provider) => providerMatches(option.provider, provider)),
      ),
    );
  }
}

export const tmdbService = new TmdbService();
