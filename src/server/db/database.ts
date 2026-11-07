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
  preferredYearRange?: string;
  contentRestrictions: string[];
  familyFriendly: boolean;
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

const DATA_DIR = process.env.CINEMATCH_DATA_DIR
  ? path.resolve(process.env.CINEMATCH_DATA_DIR)
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'cinematch_db.json');

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
    const seedIds = new Set(['wl_1', 'wl_2']);
    const seedHistoryIds = new Set(['hist_1']);
    const migratedWatchlist = this.data.watchlist.filter((item) => !seedIds.has(item.id));
    const migratedHistory = this.data.history.filter((item) => !seedHistoryIds.has(item.id));
    if (migratedWatchlist.length !== this.data.watchlist.length ||
        migratedHistory.length !== this.data.history.length) {
      this.data.watchlist = migratedWatchlist;
      this.data.history = migratedHistory;
      this.saveData();
    }
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
        console.error('Failed to parse the local CineMatch database.');
        throw err;
      }
    }

    const initial: DatabaseSchema = {
      users: [],
      preferences: {
        anonymous: {
          userId: 'anonymous',
          favoriteGenres: [],
          rejectedGenres: [],
          streamingProviders: [],
          preferredContentType: 'all',
          preferredDuration: 'any',
          preferredLanguage: 'any',
          contentRestrictions: [],
          familyFriendly: false,
          updatedAt: new Date().toISOString(),
        },
      },
      watchlist: [],
      history: [],
      conversations: {},
    };

    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    this.ensureDirectory();
    const temporaryFile = `${DB_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    fs.renameSync(temporaryFile, DB_FILE);
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
        favoriteGenres: [],
        rejectedGenres: [],
        streamingProviders: [],
        preferredContentType: 'all',
        preferredDuration: 'any',
        preferredLanguage: 'any',
        contentRestrictions: [],
        familyFriendly: false,
        updatedAt: new Date().toISOString(),
      };
      this.saveData();
    }
    const preferences = this.data.preferences[userId];
    if (!Array.isArray(preferences.contentRestrictions) || typeof preferences.familyFriendly !== 'boolean') {
      preferences.contentRestrictions = Array.isArray(preferences.contentRestrictions) ? preferences.contentRestrictions : [];
      preferences.familyFriendly = Boolean(preferences.familyFriendly);
      this.saveData();
    }
    return preferences;
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
        item.tmdbId > 0 && w.tmdbId === item.tmdbId && w.mediaType === item.mediaType
      )
    );
    if (existing) return existing;

    const newItem: WatchlistItem = {
      ...item,
      id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      addedAt: new Date().toISOString(),
    };

    this.data.watchlist.unshift(newItem);
    this.saveData();
    return newItem;
  }

  removeFromWatchlist(userId: string, identifier: string | number): boolean {
    const initLen = this.data.watchlist.length;
    const numId = typeof identifier === 'number' ? identifier : parseInt(String(identifier).replace('tmdb-', ''), 10);
    this.data.watchlist = this.data.watchlist.filter((w) => {
      if (w.userId !== userId) return true;
      if (w.id === identifier) return false;
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
