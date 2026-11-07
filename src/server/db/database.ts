import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  favoriteGenres: string[];
  rejectedGenres: string[];
  streamingProviders: string[];
  preferredContentType: 'all' | 'movie' | 'tv';
  preferredDuration: 'any' | 'short' | 'standard' | 'epic';
  preferredLanguage: string;
  updatedAt: string;
}

export interface WatchlistItem {
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

export interface ViewingHistoryItem {
  id: string;
  userId: string;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  interactionType: 'view_details' | 'watched' | 'click_streaming' | 'dismissed';
  createdAt: string;
}

export interface ConversationSession {
  id: string;
  sessionId: string;
  messages: Array<{
    id: string;
    sender: 'ai' | 'user';
    text: string;
    timestamp: string;
    chips?: string[];
    previewMovieId?: string;
  }>;
  extractedPreferences?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: User[];
  preferences: Record<string, UserPreferences>;
  watchlist: WatchlistItem[];
  history: ViewingHistoryItem[];
  conversations: Record<string, ConversationSession>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'cinematch_db.json');

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error loading database, initializing fresh:', err);
      }
    }

    const initial: DatabaseSchema = {
      users: [
        {
          id: 'user_default',
          name: 'Cristiano',
          email: 'prof.cristianodepaula@gmail.com',
          createdAt: new Date().toISOString(),
        },
      ],
      preferences: {
        user_default: {
          userId: 'user_default',
          favoriteGenres: ['Suspense', 'Thriller Psicológico', 'Ficção Científica', 'Mistério'],
          rejectedGenres: ['Terror Gore', 'Comédia Pastelão'],
          streamingProviders: ['Netflix', 'Max', 'Prime Video', 'Apple TV'],
          preferredContentType: 'all',
          preferredDuration: 'short',
          preferredLanguage: 'pt-BR',
          updatedAt: new Date().toISOString(),
        },
      },
      watchlist: [
        {
          id: 'wl_1',
          userId: 'user_default',
          tmdbId: 550,
          mediaType: 'movie',
          title: 'Clube da Luta',
          posterPath: 'https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg',
          releaseYear: 1999,
          durationMinutes: 139,
          genres: ['Drama', 'Thriller'],
          addedAt: new Date().toISOString(),
          watched: false,
        },
        {
          id: 'wl_2',
          userId: 'user_default',
          tmdbId: 157336,
          mediaType: 'movie',
          title: 'Interestelar',
          posterPath: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
          releaseYear: 2014,
          durationMinutes: 169,
          genres: ['Ficção Científica', 'Drama'],
          addedAt: new Date().toISOString(),
          watched: true,
          userRating: 5,
          userNote: 'Obra-prima da ficção científica moderna.',
        },
      ],
      history: [
        {
          id: 'hist_1',
          userId: 'user_default',
          tmdbId: 157336,
          mediaType: 'movie',
          title: 'Interestelar',
          interactionType: 'watched',
          createdAt: new Date().toISOString(),
        },
      ],
      conversations: {},
    };

    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    this.ensureDirectory();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Users
  getUser(userId: string): User | undefined {
    return this.data.users.find((u) => u.id === userId);
  }

  // Preferences
  getPreferences(userId: string): UserPreferences {
    if (!this.data.preferences[userId]) {
      this.data.preferences[userId] = {
        userId,
        favoriteGenres: ['Suspense', 'Mistério'],
        rejectedGenres: [],
        streamingProviders: ['Netflix', 'Max', 'Prime Video', 'Apple TV'],
        preferredContentType: 'all',
        preferredDuration: 'short',
        preferredLanguage: 'pt-BR',
        updatedAt: new Date().toISOString(),
      };
      this.saveData();
    }
    return this.data.preferences[userId];
  }

  updatePreferences(userId: string, partial: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences(userId);
    const updated = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.data.preferences[userId] = updated;
    this.saveData();
    return updated;
  }

  // Watchlist
  getWatchlist(userId: string): WatchlistItem[] {
    return this.data.watchlist.filter((item) => item.userId === userId);
  }

  addToWatchlist(item: Omit<WatchlistItem, 'id' | 'addedAt'> & { movieId?: string }): WatchlistItem {
    const existing = this.data.watchlist.find(
      (w) => w.userId === item.userId && (
        (item.movieId && (w as any).movieId === item.movieId) ||
        (item.tmdbId && w.tmdbId === item.tmdbId)
      )
    );
    if (existing) return existing;

    const newItem: WatchlistItem & { movieId?: string } = {
      ...item,
      id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      addedAt: new Date().toISOString(),
    };

    this.data.watchlist.unshift(newItem as WatchlistItem);
    this.saveData();
    return newItem as WatchlistItem;
  }

  removeFromWatchlist(userId: string, identifier: string | number): boolean {
    const initLen = this.data.watchlist.length;
    const numId = typeof identifier === 'number' ? identifier : parseInt(String(identifier).replace('tmdb-', ''), 10);
    this.data.watchlist = this.data.watchlist.filter((w) => {
      if (w.userId !== userId) return true;
      if (w.id === identifier) return false;
      if ((w as any).movieId && (w as any).movieId === identifier) return false;
      if (!isNaN(numId) && w.tmdbId === numId) return false;
      return true;
    });
    const changed = this.data.watchlist.length !== initLen;
    if (changed) this.saveData();
    return changed;
  }

  toggleWatched(userId: string, identifier: string | number, rating?: number, note?: string): WatchlistItem | null {
    const numId = typeof identifier === 'number' ? identifier : parseInt(String(identifier).replace('tmdb-', ''), 10);
    const item = this.data.watchlist.find((w) => {
      if (w.userId !== userId) return false;
      if (w.id === identifier) return true;
      if ((w as any).movieId && (w as any).movieId === identifier) return true;
      if (!isNaN(numId) && w.tmdbId === numId) return true;
      return false;
    });
    if (!item) return null;

    item.watched = !item.watched;
    if (rating !== undefined) item.userRating = rating;
    if (note !== undefined) item.userNote = note;
    this.saveData();
    return item;
  }

  // Viewing History
  addHistory(entry: Omit<ViewingHistoryItem, 'id' | 'createdAt'>): ViewingHistoryItem {
    const newEntry: ViewingHistoryItem = {
      ...entry,
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.history.unshift(newEntry);
    this.saveData();
    return newEntry;
  }

  getHistory(userId: string): ViewingHistoryItem[] {
    return this.data.history.filter((h) => h.userId === userId);
  }

  // Conversations
  getConversation(sessionId: string): ConversationSession | null {
    return this.data.conversations[sessionId] || null;
  }

  saveConversation(session: ConversationSession) {
    this.data.conversations[session.sessionId] = session;
    this.saveData();
  }
}

export const db = new Database();
