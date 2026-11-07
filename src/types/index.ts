export interface CastMember {
  name: string;
  role: string;
  avatarUrl: string;
}

export interface StreamingOption {
  provider: 'Netflix' | 'Prime Video' | 'Max' | 'Apple TV' | 'Disney+' | 'Paramount+';
  logoText: string;
  badgeColor: string;
  quality: string;
  type: 'included' | 'rent' | 'buy';
  price?: string;
  audioInfo: string;
}

export interface Movie {
  id: string;
  tmdbId?: number;
  title: string;
  tagline: string;
  originalTitle?: string;
  director: string;
  releaseYear: number;
  durationMinutes: number;
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
    imdb: number;
    rottenTomatoes: number;
    metacritic?: number;
    audienceScore?: number;
  };
  radarScores: {
    tension: number; // 0-100
    complexity: number;
    visualAesthetic: number;
    pacing: number;
    emotionalDepth: number;
  };
  emotionalArc: {
    act: string;
    title: string;
    intensity: number;
    description: string;
  }[];
  streamings: StreamingOption[];
  cast: CastMember[];
  similarMovieIds: string[];
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
  activeStreamings: string[];
  preferredDuration: 'any' | 'short' | 'standard' | 'epic';
  tensionWeight: number;
  complexityWeight: number;
  visualWeight: number;
  pacingWeight: number;
  emotionalWeight: number;
}

export interface WatchlistEntry {
  movieId: string;
  addedAt: string;
  watched: boolean;
  rating?: number;
  userNote?: string;
}
