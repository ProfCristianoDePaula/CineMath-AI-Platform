import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { tmdbService } from './src/server/services/tmdb.service';
import { geminiService } from './src/server/services/gemini.service';
import { recommendationService } from './src/server/services/recommendation.service';
import { db } from './src/server/db/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security & API Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Powered-By', 'CineMatch-AI');
  next();
});

// Logging
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    console.log(`[API ${req.method}] ${req.url}`);
  }
  next();
});

// --- API ROUTES ---

// 1. AI Conversational Assistant
app.post('/api/ai/conversation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageHistory = [], latestMessage = '', activeStreamings = [], sessionId = 'default_session' } = req.body;

    const interpretation = await geminiService.interpretConversation({
      messageHistory,
      latestMessage,
      activeStreamings,
    });

    // Save session state to database
    db.saveConversation({
      id: `conv_${sessionId}`,
      sessionId,
      messages: [
        ...messageHistory,
        {
          id: `msg_${Date.now()}`,
          sender: 'user',
          text: latestMessage,
          timestamp: new Date().toISOString(),
        },
        {
          id: `msg_${Date.now() + 1}`,
          sender: 'ai',
          text: interpretation.replyText,
          timestamp: new Date().toISOString(),
          chips: interpretation.suggestedChips,
        },
      ],
      extractedPreferences: interpretation.extractedFilters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: interpretation,
    });
  } catch (err) {
    next(err);
  }
});

// 2. AI Recommendation Engine
app.post('/api/ai/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId = 'user_default',
      userPrompt,
      preferredGenres,
      rejectedGenres,
      maxDurationMinutes,
      activeStreamings,
      customWeights,
    } = req.body;

    const results = await recommendationService.getRecommendations({
      userId,
      userPrompt,
      preferredGenres,
      rejectedGenres,
      maxDurationMinutes,
      activeStreamings,
      customWeights,
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
});

// 3. Couple / Group Joint Match
app.post('/api/ai/couple-match', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user1Tastes = ['Suspense', 'Mistério'], user2Taste = 'drama' } = req.body;

    const result = await recommendationService.calculateCoupleMatch({
      user1Tastes,
      user2Taste,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// 4. TMDB Featured & Trending Catalog
app.get('/api/movies/featured', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movies = await tmdbService.getFeaturedCatalog();
    res.json({
      success: true,
      count: movies.length,
      data: movies,
      attribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    });
  } catch (err) {
    next(err);
  }
});

// 5. TMDB Search (movies and series)
app.get('/api/movies/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = String(req.query.q || '');
    const movies = await tmdbService.searchMovies(query);
    res.json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (err) {
    next(err);
  }
});

// 6. TMDB Movie Details
app.get('/api/movies/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tmdbId = parseInt(req.params.id.replace('tmdb-', ''), 10);
    const movie = await tmdbService.getMovieDetails(tmdbId);
    if (!movie) {
      res.status(404).json({ success: false, error: 'Título não encontrado no catálogo TMDB' });
      return;
    }

    // Log viewing interaction to history
    const userId = String(req.query.userId || 'user_default');
    db.addHistory({
      userId,
      tmdbId: movie.tmdbId,
      mediaType: 'movie',
      title: movie.title,
      interactionType: 'view_details',
    });

    res.json({
      success: true,
      data: movie,
    });
  } catch (err) {
    next(err);
  }
});

// 7. Watch Providers for Brazil
app.get('/api/movies/:id/providers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tmdbId = parseInt(req.params.id.replace('tmdb-', ''), 10);
    const providers = await tmdbService.getWatchProviders(tmdbId);
    res.json({
      success: true,
      region: 'BR',
      count: providers.length,
      data: providers,
    });
  } catch (err) {
    next(err);
  }
});

// 8. Watchlist Endpoints
app.get('/api/watchlist', (req: Request, res: Response) => {
  const userId = String(req.query.userId || 'user_default');
  const items = db.getWatchlist(userId);
  res.json({ success: true, count: items.length, data: items });
});

app.post('/api/watchlist', (req: Request, res: Response) => {
  const { userId = 'user_default', tmdbId, movieId, mediaType = 'movie', title, posterPath, releaseYear, durationMinutes, genres = [] } = req.body;
  const item = db.addToWatchlist({
    userId,
    tmdbId: Number(tmdbId) || 0,
    movieId: movieId || (tmdbId ? `tmdb-${tmdbId}` : undefined),
    mediaType,
    title,
    posterPath,
    releaseYear: Number(releaseYear) || 2024,
    durationMinutes: Number(durationMinutes) || 90,
    genres,
    watched: false,
  });
  res.json({ success: true, data: item });
});

app.delete('/api/watchlist/:id', (req: Request, res: Response) => {
  const userId = String(req.query.userId || 'user_default');
  const deleted = db.removeFromWatchlist(userId, req.params.id);
  res.json({ success: deleted });
});

app.post('/api/watchlist/:id/toggle-watched', (req: Request, res: Response) => {
  const userId = String(req.query.userId || 'user_default');
  const { rating, note } = req.body;
  const updated = db.toggleWatched(userId, req.params.id, rating, note);

  if (updated?.watched) {
    db.addHistory({
      userId,
      tmdbId: updated.tmdbId,
      mediaType: updated.mediaType,
      title: updated.title,
      interactionType: 'watched',
    });
  }

  res.json({ success: !!updated, data: updated });
});

// 9. Viewing History Endpoints
app.get('/api/history', (req: Request, res: Response) => {
  const userId = String(req.query.userId || 'user_default');
  const history = db.getHistory(userId);
  res.json({ success: true, count: history.length, data: history });
});

app.post('/api/history', (req: Request, res: Response) => {
  const { userId = 'user_default', tmdbId, mediaType = 'movie', title, interactionType = 'view_details' } = req.body;
  const entry = db.addHistory({
    userId,
    tmdbId: Number(tmdbId),
    mediaType,
    title,
    interactionType,
  });
  res.json({ success: true, data: entry });
});

// 10. User Preferences Endpoints
app.get('/api/preferences', (req: Request, res: Response) => {
  const userId = String(req.query.userId || 'user_default');
  const prefs = db.getPreferences(userId);
  res.json({ success: true, data: prefs });
});

app.post('/api/preferences', (req: Request, res: Response) => {
  const { userId = 'user_default', ...updates } = req.body;
  const updated = db.updatePreferences(userId, updates);
  res.json({ success: true, data: updated });
});

// 11. System Health & Environment info (Never exposing keys!)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    geminiEnabled: geminiService.isAvailable(),
    tmdbConfigured: tmdbService.hasValidKey(),
    region: 'BR',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erro interno do servidor',
  });
});

// Vite mounting / Static files
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🎬 CineMatch AI Fullstack Server running at http://localhost:${PORT}`);
    console.log(`🤖 Gemini AI: ${geminiService.isAvailable() ? 'Active' : 'Heuristic Active'}`);
    console.log(`🍿 TMDB API: ${tmdbService.hasValidKey() ? 'Connected (Live)' : 'Connected (Authentic Catalog Cache)'}`);
  });
}

startServer();
