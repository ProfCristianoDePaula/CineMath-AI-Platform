export interface CastMember {
  name: string;
  role: string;
  avatarUrl: string;
}

export interface StreamingOption {
  provider: string;
  logoText: string;
  badgeColor: string;
  quality: string;
  type: 'included' | 'rent' | 'buy' | 'free' | 'ads';
  price?: string;
  audioInfo: string;
  externalUrl?: string;
  logoUrl?: string;
}

export interface Movie {
  id: string;
  tmdbId?: number;
  mediaType?: 'movie' | 'tv';
  title: string;
  tagline: string;
  originalTitle?: string;
  director: string;
  releaseYear: number;
  durationMinutes: number;
  numberOfSeasons?: number;
  ageRating: string;
  qualityBadge: string;
  matchScore: number;
  genres: string[];
  posterUrl: string;
  backdropUrl: string;
  trailerStillUrl?: string;
  trailerYoutubeKey?: string;
  synopsis: string;
  aiMatchReason: string;
  matchHighlights: string[];
  metrics: {
    tmdb: number;
    voteCount: number;
  };
  voteCount?: number;
  radarScores?: {
    tension: number;
    complexity: number;
    visualAesthetic: number;
    pacing: number;
    emotionalDepth: number;
  };
  emotionalArc?: {
    act: string;
    title: string;
    intensity: number;
    description: string;
  }[];
  streamings: StreamingOption[];
  cast: CastMember[];
  similarMovieIds: string[];
  watchLink?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  chips?: string[];
  previewMovieId?: string;
  showFilters?: boolean;
}

export interface UserPreferences {
  userId: string;
  favoriteGenres: string[];
  rejectedGenres: string[];
  streamingProviders: string[];
  preferredContentType: 'all' | 'movie' | 'tv';
  preferredDuration: 'any' | 'short' | 'standard' | 'epic';
  preferredLanguage: string;
  preferredYearRange?: string;
  contentRestrictions: string[];
  familyFriendly: boolean;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string;
  releaseYear: number;
  durationMinutes: number;
  genres: string[];
  addedAt: string;
  watched: boolean;
  userRating?: number;
  userNote?: string;
}
