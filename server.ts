import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { db } from './src/server/db/database';
import { geminiService } from './src/server/services/gemini.service';
import { recommendationService } from './src/server/services/recommendation.service';
import { tmdbService } from './src/server/services/tmdb.service';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true, limit: '8kb' }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimit = new Map<string, RateLimitEntry>();
app.use('/api', (req, res, next) => {
  const now = Date.now();
  const endpointClass = req.path.startsWith('/ai/') ? 'ai' : 'api';
  const key = `${req.ip || 'unknown'}:${endpointClass}`;
  let entry = rateLimit.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + 60_000 };
    rateLimit.set(key, entry);
  }
  entry.count += 1;
  const limit = endpointClass === 'ai' ? 12 : 120;
  res.setHeader('RateLimit-Limit', String(limit));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
  if (entry.count > limit) {
    res.status(429).json({ success: false, error: 'Limite de solicitações atingido. Aguarde um minuto e tente novamente.' });
    return;
  }
  if (rateLimit.size > 2000) {
    for (const [entryKey, value] of rateLimit) {
      if (value.resetAt <= now) rateLimit.delete(entryKey);
    }
  }
  next();
});

app.use('/api', (req, _res, next) => {
  console.info(`[API] ${req.method} ${req.path}`);
  next();
});

function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

function recordBody(req: Request): Record<string, unknown> {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return fail('O corpo da solicitação deve ser um objeto JSON.');
  }
  return req.body as Record<string, unknown>;
}

function userIdFrom(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 100 ||
      !/^[a-zA-Z0-9_-]+$/.test(value)) {
    return fail('Identificador de sessão inválido.');
  }
  return value;
}

function stringList(value: unknown, field: string, maxItems = 20): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maxItems ||
      value.some((item) => typeof item !== 'string' || item.trim().length > 100)) {
    return fail(`O campo ${field} deve ser uma lista válida de até ${maxItems} itens.`);
  }
  return value.map((item) => (item as string).trim()).filter(Boolean);
}

function parseId(value: string): number {
  const id = Number(value.replace(/^tmdb-/, ''));
  if (!Number.isSafeInteger(id) || id <= 0) return fail('Identificador de título inválido.');
  return id;
}

function mediaType(value: unknown): 'movie' | 'tv' {
  if (value !== 'movie' && value !== 'tv') return fail('Tipo de conteúdo inválido.');
  return value;
}

function validYearRange(value: string): boolean {
  if (!/^(19|20)\d{2}(?:\s*-\s*(?:19|20)\d{2})?$/.test(value)) return false;
  const years = value.match(/\d{4}/g)?.map(Number) || [];
  return years.length === 1 || years[0] <= years[1];
}

function success<T>(res: Response, data: T, extras: Record<string, unknown> = {}) {
  res.json({ success: true, data, ...extras });
}

app.post('/api/ai/conversation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = recordBody(req);
    const latestMessage = typeof body.latestMessage === 'string' ? body.latestMessage.trim() : '';
    if (!latestMessage || latestMessage.length > 1000) fail('A mensagem deve ter entre 1 e 1000 caracteres.');
    if (!Array.isArray(body.messageHistory) || body.messageHistory.length > 16) {
      fail('O histórico da conversa é inválido ou excede o limite permitido.');
    }
    const messageHistory = body.messageHistory.map((item: unknown) => {
      if (!item || typeof item !== 'object') return fail('Uma mensagem do histórico é inválida.');
      const message = item as Record<string, unknown>;
      if ((message.sender !== 'ai' && message.sender !== 'user') ||
          typeof message.text !== 'string' || message.text.length > 2000) {
        return fail('Uma mensagem do histórico possui formato inválido.');
      }
      const sender: 'ai' | 'user' = message.sender === 'ai' ? 'ai' : 'user';
      return { sender, text: message.text };
    });
    const activeStreamings = stringList(body.activeStreamings, 'activeStreamings');
    const sessionId = userIdFrom(body.sessionId);
    const interpretation = await geminiService.interpretConversation({
      messageHistory,
      latestMessage,
      activeStreamings,
    });
    const now = new Date().toISOString();
    db.saveConversation({
      id: `conv_${sessionId}`,
      sessionId,
      messages: [
        ...messageHistory.map((message, index) => ({
          id: `history_${index}`,
          sender: message.sender,
          text: message.text,
          timestamp: now,
        })),
        { id: `msg_${Date.now()}`, sender: 'user', text: latestMessage, timestamp: now },
        {
          id: `msg_${Date.now()}_ai`,
          sender: 'ai',
          text: interpretation.replyText,
          timestamp: now,
          chips: interpretation.suggestedChips,
        },
      ],
      extractedPreferences: interpretation.extractedFilters,
      createdAt: db.getConversation(sessionId)?.createdAt || now,
      updatedAt: now,
    });
    success(res, interpretation);
  } catch (error) {
    next(error);
  }
});

app.post('/api/ai/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = recordBody(req);
    const maxDuration = body.maxDurationMinutes === undefined ? undefined : Number(body.maxDurationMinutes);
    if (maxDuration !== undefined && (!Number.isFinite(maxDuration) || maxDuration < 1 || maxDuration > 600)) {
      fail('A duração deve estar entre 1 e 600 minutos.');
    }
    const contentType = body.contentType === undefined ? 'all' : body.contentType;
    if (contentType !== 'all' && contentType !== 'movie' && contentType !== 'tv') {
      fail('Tipo de conteúdo inválido.');
    }
    if (body.preferredDuration !== undefined &&
        !['any', 'short', 'standard', 'epic'].includes(String(body.preferredDuration))) {
      fail('Duração preferida inválida.');
    }
    const result = await recommendationService.getRecommendations({
      userId: userIdFrom(body.userId),
      userPrompt: typeof body.userPrompt === 'string' ? body.userPrompt.slice(0, 1000) : undefined,
      contentType,
      mood: typeof body.mood === 'string' ? body.mood.slice(0, 160) : undefined,
      preferredGenres: stringList(body.preferredGenres, 'preferredGenres'),
      rejectedGenres: stringList(body.rejectedGenres, 'rejectedGenres'),
      maxDurationMinutes: maxDuration,
      preferredDuration: body.preferredDuration as 'any' | 'short' | 'standard' | 'epic' | undefined,
      activeStreamings: stringList(body.activeStreamings, 'activeStreamings'),
      viewingContext: typeof body.viewingContext === 'string' ? body.viewingContext.slice(0, 80) : undefined,
      preferredYearRange: typeof body.preferredYearRange === 'string' ? body.preferredYearRange.slice(0, 40) : undefined,
      excludedTitles: stringList(body.excludedTitles, 'excludedTitles'),
      contentRestrictions: stringList(body.contentRestrictions, 'contentRestrictions'),
      familyFriendly: body.familyFriendly === true,
    });
    success(res, result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/ai/couple-match', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = recordBody(req);
    const taste = body.user2Taste;
    if (taste !== 'drama' && taste !== 'scifi' && taste !== 'comedy' && taste !== 'thriller') {
      fail('Preferência do segundo perfil inválida.');
    }
    const result = await recommendationService.calculateCoupleMatch({
      user1Tastes: stringList(body.user1Tastes, 'user1Tastes'),
      user2Taste: taste,
    });
    success(res, result);
  } catch (error) {
    next(error);
  }
});

app.get('/api/movies/featured', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const movies = await tmdbService.getFeaturedCatalog();
    success(res, movies, {
      count: movies.length,
      attribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/movies/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query || query.length > 100) fail('Informe um termo de busca com até 100 caracteres.');
    const movies = await tmdbService.searchTitles(query, 'movie');
    success(res, movies, { count: movies.length });
  } catch (error) {
    next(error);
  }
});

app.get('/api/tv/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query || query.length > 100) fail('Informe um termo de busca com até 100 caracteres.');
    const titles = await tmdbService.searchTitles(query, 'tv');
    success(res, titles, { count: titles.length });
  } catch (error) {
    next(error);
  }
});

for (const type of ['movie', 'tv'] as const) {
  app.get(`/api/${type === 'movie' ? 'movies' : 'tv'}/:id`, async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      const title = await tmdbService.getTitleDetails(id, type);
      if (!title) return res.status(404).json({ success: false, error: 'Título não encontrado no TMDB.' });
      const ownerId = typeof req.query.userId === 'string' ? userIdFrom(req.query.userId) : 'anonymous';
      if (req.query.track !== 'false') {
        db.addHistory({
          userId: ownerId,
          tmdbId: title.tmdbId,
          mediaType: type,
          title: title.title,
          interactionType: 'view_details',
        });
      }
      success(res, title);
    } catch (error) {
      next(error);
    }
  });

  app.get(`/api/${type === 'movie' ? 'movies' : 'tv'}/:id/providers`, async (req, res, next) => {
    try {
      const providers = await tmdbService.getWatchProviders(parseId(req.params.id), type);
      success(res, providers, { region: 'BR', count: providers.length });
    } catch (error) {
      next(error);
    }
  });
}

app.get('/api/genres', async (req, res, next) => {
  try {
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const genres = await tmdbService.getGenres(type);
    success(res, genres);
  } catch (error) {
    next(error);
  }
});

app.get('/api/providers', async (req, res, next) => {
  try {
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const providers = await tmdbService.getProviderCatalog(type);
    success(res, providers, { region: 'BR' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/watchlist', (req: Request, res: Response) => {
  const ownerId = typeof req.query.userId === 'string' ? userIdFrom(req.query.userId) : 'anonymous';
  const items = db.getWatchlist(ownerId);
  success(res, items, { count: items.length });
});

app.post('/api/watchlist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = recordBody(req);
    const id = Number(body.tmdbId);
    if (!Number.isSafeInteger(id) || id <= 0) fail('Informe um identificador TMDB válido.');
    const ownerId = userIdFrom(body.userId);
    const type = mediaType(body.mediaType);
    const title = await tmdbService.getTitleDetails(id, type);
    if (!title) return res.status(404).json({ success: false, error: 'Título não encontrado no TMDB.' });
    const item = db.addToWatchlist({
      userId: ownerId,
      tmdbId: title.tmdbId,
      mediaType: type,
      title: title.title,
      posterPath: title.posterUrl,
      releaseYear: title.releaseYear,
      durationMinutes: title.durationMinutes,
      genres: title.genres,
      watched: false,
    });
    success(res, item);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/watchlist/:id', (req: Request, res: Response) => {
  const ownerId = typeof req.query.userId === 'string' ? userIdFrom(req.query.userId) : 'anonymous';
  success(res, db.removeFromWatchlist(ownerId, req.params.id));
});

app.post('/api/watchlist/:id/toggle-watched', (req: Request, res: Response) => {
  const body = recordBody(req);
  const ownerId = userIdFrom(body.userId);
  const updated = db.toggleWatched(ownerId, req.params.id);
  if (updated?.watched) {
    db.addHistory({
      userId: ownerId,
      tmdbId: updated.tmdbId,
      mediaType: updated.mediaType,
      title: updated.title,
      interactionType: 'watched',
    });
  }
  if (!updated) return res.status(404).json({ success: false, error: 'Título não encontrado na lista.' });
  success(res, updated);
});

app.get('/api/history', (req: Request, res: Response) => {
  const ownerId = typeof req.query.userId === 'string' ? userIdFrom(req.query.userId) : 'anonymous';
  const history = db.getHistory(ownerId);
  success(res, history, { count: history.length });
});

app.post('/api/history', (req: Request, res: Response) => {
  const body = recordBody(req);
  const interactionType = body.interactionType;
  if (interactionType !== 'view_details' && interactionType !== 'watched' &&
      interactionType !== 'click_streaming' && interactionType !== 'dismissed') {
    fail('Tipo de interação inválido.');
  }
  const tmdbId = Number(body.tmdbId);
  if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) fail('Informe um identificador TMDB válido.');
  const entry = db.addHistory({
    userId: userIdFrom(body.userId),
    tmdbId,
    mediaType: mediaType(body.mediaType),
    title: typeof body.title === 'string' ? body.title.slice(0, 200) : '',
    interactionType,
  });
  success(res, entry);
});

app.get('/api/preferences', (req: Request, res: Response) => {
  const ownerId = typeof req.query.userId === 'string' ? userIdFrom(req.query.userId) : 'anonymous';
  success(res, db.getPreferences(ownerId));
});

app.post('/api/preferences', (req: Request, res: Response) => {
  const body = recordBody(req);
  const ownerId = userIdFrom(body.userId);
  const updates: Record<string, unknown> = {};
  for (const field of ['favoriteGenres', 'rejectedGenres', 'streamingProviders', 'contentRestrictions']) {
    if (field in body) updates[field] = stringList(body[field], field);
  }
  if (body.preferredContentType !== undefined) {
    if (body.preferredContentType !== 'all' && body.preferredContentType !== 'movie' &&
        body.preferredContentType !== 'tv') fail('Tipo de conteúdo preferido inválido.');
    updates.preferredContentType = body.preferredContentType;
  }
  if (body.preferredDuration !== undefined) {
    if (!['any', 'short', 'standard', 'epic'].includes(String(body.preferredDuration))) {
      fail('Duração preferida inválida.');
    }
    updates.preferredDuration = body.preferredDuration;
  }
  if (body.preferredLanguage !== undefined) {
    if (body.preferredLanguage !== 'any' && body.preferredLanguage !== 'pt-BR' &&
        body.preferredLanguage !== 'en-US' && body.preferredLanguage !== 'es-ES') {
      fail('Idioma preferido inválido.');
    }
    updates.preferredLanguage = body.preferredLanguage;
  }
  if (body.preferredYearRange !== undefined) {
    if (typeof body.preferredYearRange !== 'string' || body.preferredYearRange.length > 40 ||
        (body.preferredYearRange !== '' && !validYearRange(body.preferredYearRange))) {
      fail('Período preferido inválido.');
    }
    updates.preferredYearRange = body.preferredYearRange;
  }
  if (body.familyFriendly !== undefined) {
    if (typeof body.familyFriendly !== 'boolean') fail('A preferência familiar deve ser booleana.');
    updates.familyFriendly = body.familyFriendly;
  }
  success(res, db.updatePreferences(ownerId, updates));
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    geminiEnabled: geminiService.provider === 'gemini' && geminiService.isAvailable(),
    aiProvider: geminiService.provider,
    aiConfigured: geminiService.isAvailable(),
    tmdbConfigured: tmdbService.hasValidKey(),
    region: 'BR',
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = typeof error === 'object' && error !== null && 'status' in error &&
    typeof error.status === 'number' ? error.status : 500;
  const safeUpstreamErrors = [
    'A Cloudflare recusou o token ou suas permissões para Workers AI.',
    'Não foi possível conectar ao Workers AI da Cloudflare.',
    'O Workers AI não conseguiu processar a solicitação.',
    'O Workers AI retornou uma resposta inválida.',
    'O Workers AI retornou uma resposta incompleta.',
    'O Workers AI retornou JSON inválido.',
    'O Workers AI retornou um resultado inválido.',
  ];
  const message = status >= 500
    ? (error instanceof Error && (status === 503 || (status === 502 && safeUpstreamErrors.includes(error.message)))
      ? error.message : 'Erro interno ao processar a solicitação.')
    : error instanceof Error ? error.message : 'Solicitação inválida.';
  if (status >= 500) console.error('API request failed.', { status, message });
  res.status(status).json({ success: false, error: message });
});

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.resolve(distPath, 'index.html')));
  }

  app.listen(PORT, () => {
    console.info(`CineMatch AI listening on port ${PORT}.`);
    console.info(`TMDB configured: ${tmdbService.hasValidKey()}. AI provider: ${geminiService.provider}. AI configured: ${geminiService.isAvailable()}.`);
  });
}

startServer().catch((error: unknown) => {
  console.error('Unable to start CineMatch AI server.', error);
  process.exitCode = 1;
});
