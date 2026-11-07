import { Movie, UserPreferences, WatchlistEntry } from '../types';

export interface ConversationResponse {
  replyText: string;
  isReadyForRecommendations: boolean;
  suggestedChips?: string[];
  extractedFilters: {
    contentType?: 'movie' | 'tv' | 'all';
    mood?: string;
    genres?: string[];
    rejectedGenres?: string[];
    maxDurationMinutes?: number;
    preferredYearRange?: string;
    viewingContext?: string;
    streamings?: string[];
    keywords?: string[];
    excludedTitles?: string[];
  };
}

export interface RecommendationResponse {
  topMatch: Movie | null;
  recommendations: Movie[];
  secondaryCandidates: Movie[];
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

export interface CoupleMatchResponse {
  topMatch: Movie;
  jointScore: number;
  explanation: string;
}

export interface ViewingHistoryEntry {
  id: string;
  userId: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  interactionType: string;
  createdAt: string;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getAnonymousUserId(): string {
  const key = 'cinematch-anonymous-user';
  let userId = localStorage.getItem(key);
  if (!userId) {
    userId = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, userId);
  }
  return userId;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  let body: { success?: boolean; data?: T; error?: string };
  try {
    body = await response.json() as typeof body;
  } catch {
    throw new ApiError('O servidor retornou uma resposta inválida.', response.status);
  }
  if (!response.ok || body.success === false) {
    throw new ApiError(body.error || 'Não foi possível concluir a solicitação.', response.status);
  }
  return body.data as T;
}

function jsonBody(value: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  };
}

const userId = () => getAnonymousUserId();

export const api = {
  getFeaturedCatalog: () => request<Movie[]>('/api/movies/featured'),

  searchMovies: (query: string) =>
    request<Movie[]>(`/api/movies/search?q=${encodeURIComponent(query)}`),

  searchTv: (query: string) =>
    request<Movie[]>(`/api/tv/search?q=${encodeURIComponent(query)}`),

  getMovieDetails: (id: string, mediaType: 'movie' | 'tv' = 'movie', trackView = true) => {
    const tmdbId = id.replace(/^tmdb-/, '');
    const resource = mediaType === 'movie' ? 'movies' : 'tv';
    const params = new URLSearchParams({ userId: userId(), track: String(trackView) });
    return request<Movie>(`/api/${resource}/${encodeURIComponent(tmdbId)}?${params}`);
  },

  sendConversationMessage: (params: {
    messageHistory: Array<{ sender: 'ai' | 'user'; text: string }>;
    latestMessage: string;
    activeStreamings: string[];
    sessionId?: string;
  }) => request<ConversationResponse>('/api/ai/conversation', jsonBody({
    ...params,
    sessionId: params.sessionId || userId(),
  })),

  getRecommendations: (params: {
    userId?: string;
    userPrompt?: string;
    contentType?: 'movie' | 'tv' | 'all';
    preferredDuration?: UserPreferences['preferredDuration'];
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
  }) => request<RecommendationResponse>('/api/ai/recommendations', jsonBody({
    ...params,
    mood: params.mood?.slice(0, 160),
    userId: params.userId || userId(),
  })),

  calculateCoupleMatch: (params: {
    user1Tastes: string[];
    user2Taste: 'drama' | 'scifi' | 'comedy' | 'thriller';
  }) => request<CoupleMatchResponse>('/api/ai/couple-match', jsonBody({
    ...params,
    userId: userId(),
  })),

  getWatchlist: (ownerId = userId()) =>
    request<WatchlistEntry[]>(`/api/watchlist?userId=${encodeURIComponent(ownerId)}`),

  getHistory: (ownerId = userId()) =>
    request<ViewingHistoryEntry[]>(`/api/history?userId=${encodeURIComponent(ownerId)}`),

  addToWatchlist: (movie: Movie, ownerId = userId()) =>
    request<WatchlistEntry>('/api/watchlist', jsonBody({
      userId: ownerId,
      tmdbId: movie.tmdbId,
      mediaType: movie.mediaType || 'movie',
      title: movie.title,
      posterPath: movie.posterUrl,
      releaseYear: movie.releaseYear,
      durationMinutes: movie.durationMinutes,
      genres: movie.genres,
    })),

  removeFromWatchlist: (id: string, ownerId = userId()) =>
    request<boolean>(`/api/watchlist/${encodeURIComponent(id)}?userId=${encodeURIComponent(ownerId)}`, {
      method: 'DELETE',
    }),

  toggleWatched: (id: string, rating?: number, note?: string, ownerId = userId()) =>
    request<WatchlistEntry>(`/api/watchlist/${encodeURIComponent(id)}/toggle-watched`, jsonBody({
      userId: ownerId,
      rating,
      note,
    })),

  getPreferences: (ownerId = userId()) =>
    request<UserPreferences>(`/api/preferences?userId=${encodeURIComponent(ownerId)}`),

  updatePreferences: (updates: Partial<UserPreferences>, ownerId = userId()) =>
    request<UserPreferences>('/api/preferences', jsonBody({ userId: ownerId, ...updates })),
};
