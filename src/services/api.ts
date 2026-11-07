import { Movie } from '../types';

export interface ConversationResponse {
  replyText: string;
  isReadyForRecommendations: boolean;
  suggestedChips?: string[];
  extractedFilters: {
    mood?: string;
    genres?: string[];
    rejectedGenres?: string[];
    maxDurationMinutes?: number;
    viewingContext?: string;
    streamings?: string[];
    keywords?: string[];
  };
}

export interface RecommendationResponse {
  topMatch: Movie;
  recommendations: Movie[];
  secondaryCandidates: Movie[];
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

export interface CoupleMatchResponse {
  topMatch: Movie;
  jointScore: number;
  explanation: string;
}

export const api = {
  // 1. Get Featured Real TMDB Catalog
  async getFeaturedCatalog(): Promise<Movie[]> {
    try {
      const resp = await fetch('/api/movies/featured');
      if (!resp.ok) throw new Error('Falha ao carregar catálogo');
      const json = await resp.json();
      return json.data || [];
    } catch (err) {
      console.error('Error fetching featured catalog:', err);
      return [];
    }
  },

  // 2. Search Movies in TMDB
  async searchMovies(query: string): Promise<Movie[]> {
    try {
      const resp = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
      if (!resp.ok) throw new Error('Falha na busca');
      const json = await resp.json();
      return json.data || [];
    } catch (err) {
      console.error('Error searching movies:', err);
      return [];
    }
  },

  // 3. Get Movie Details by ID
  async getMovieDetails(id: string): Promise<Movie | null> {
    try {
      const resp = await fetch(`/api/movies/${id}`);
      if (!resp.ok) return null;
      const json = await resp.json();
      return json.data || null;
    } catch (err) {
      console.error('Error fetching movie details:', err);
      return null;
    }
  },

  // 4. Send Chat message to Gemini AI
  async sendConversationMessage(params: {
    messageHistory: Array<{ sender: 'ai' | 'user'; text: string }>;
    latestMessage: string;
    activeStreamings: string[];
    sessionId?: string;
  }): Promise<ConversationResponse | null> {
    try {
      const resp = await fetch('/api/ai/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!resp.ok) throw new Error('Erro na conversa com a IA');
      const json = await resp.json();
      return json.data || null;
    } catch (err) {
      console.error('Error in AI conversation:', err);
      return null;
    }
  },

  // 5. Compute AI Recommendations
  async getRecommendations(params: {
    userId?: string;
    userPrompt?: string;
    preferredGenres?: string[];
    rejectedGenres?: string[];
    maxDurationMinutes?: number;
    activeStreamings?: string[];
    customWeights?: {
      tension?: number;
      complexity?: number;
      visualAesthetic?: number;
      pacing?: number;
      emotionalDepth?: number;
    };
  }): Promise<RecommendationResponse | null> {
    try {
      const resp = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!resp.ok) throw new Error('Erro ao calcular recomendações');
      const json = await resp.json();
      return json.data || null;
    } catch (err) {
      console.error('Error calculating recommendations:', err);
      return null;
    }
  },

  // 6. Compute Couple Match
  async calculateCoupleMatch(params: {
    user1Tastes: string[];
    user2Taste: 'drama' | 'scifi' | 'comedy' | 'thriller';
  }): Promise<CoupleMatchResponse | null> {
    try {
      const resp = await fetch('/api/ai/couple-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!resp.ok) throw new Error('Erro no cálculo conjunto');
      const json = await resp.json();
      return json.data || null;
    } catch (err) {
      console.error('Error in couple match:', err);
      return null;
    }
  },

  // 7. Watchlist Operations
  async getWatchlist(userId = 'user_default'): Promise<any[]> {
    try {
      const resp = await fetch(`/api/watchlist?userId=${userId}`);
      if (!resp.ok) return [];
      const json = await resp.json();
      return json.data || [];
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      return [];
    }
  },

  async addToWatchlist(movie: Movie, userId = 'user_default'): Promise<boolean> {
    try {
      const resp = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          movieId: movie.id,
          tmdbId: (movie as any).tmdbId || 550,
          title: movie.title,
          posterPath: movie.posterUrl,
          releaseYear: movie.releaseYear,
          durationMinutes: movie.durationMinutes,
          genres: movie.genres,
        }),
      });
      return resp.ok;
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      return false;
    }
  },

  async removeFromWatchlist(id: string, userId = 'user_default'): Promise<boolean> {
    try {
      const resp = await fetch(`/api/watchlist/${id}?userId=${userId}`, {
        method: 'DELETE',
      });
      return resp.ok;
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      return false;
    }
  },

  async toggleWatched(id: string, rating?: number, note?: string, userId = 'user_default'): Promise<boolean> {
    try {
      const resp = await fetch(`/api/watchlist/${id}/toggle-watched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rating, note }),
      });
      return resp.ok;
    } catch (err) {
      console.error('Error toggling watched status:', err);
      return false;
    }
  },

  // 8. User Preferences
  async getPreferences(userId = 'user_default'): Promise<any> {
    try {
      const resp = await fetch(`/api/preferences?userId=${userId}`);
      if (!resp.ok) return null;
      const json = await resp.json();
      return json.data || null;
    } catch (err) {
      console.error('Error fetching preferences:', err);
      return null;
    }
  },

  async updatePreferences(updates: Record<string, any>, userId = 'user_default'): Promise<boolean> {
    try {
      const resp = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });
      return resp.ok;
    } catch (err) {
      console.error('Error updating preferences:', err);
      return false;
    }
  },
};
