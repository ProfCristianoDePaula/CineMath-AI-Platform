import assert from 'node:assert/strict';
import test from 'node:test';
import { CloudflareAIService } from './cloudflare-ai.service';
import { GeminiService } from './gemini.service';
import { StandardizedMovie } from './tmdb.service';

const account = '0123456789abcdef0123456789abcdef';
const model = '@cf/meta/llama-3.1-8b-instruct';

test('Workers AI envia o token no cabeçalho, usa JSON schema e interpreta o envelope', async () => {
  const mockFetch: typeof fetch = async (input, init) => {
    assert.equal(String(input), `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`);
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer token-de-teste');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.response_format.type, 'json_schema');
    assert.equal(body.messages[0].content, 'Teste');
    return Response.json({ success: true, result: { response: { replyText: 'Olá' } } });
  };
  const service = new CloudflareAIService(account, 'token-de-teste', model, mockFetch);
  assert.deepEqual(await service.generateJson('Teste', { type: 'object' }), { replyText: 'Olá' });
});

test('Workers AI aceita resposta JSON serializada', async () => {
  const mockFetch: typeof fetch = async () => Response.json({
    success: true, result: { response: '{"replyText":"Olá"}' },
  });
  const service = new CloudflareAIService(account, 'token', model, mockFetch);
  assert.deepEqual(await service.generateJson('Teste', {}), { replyText: 'Olá' });
});

test('Workers AI informa credenciais ausentes, permissão e limite de uso', async () => {
  const missing = new CloudflareAIService('', '', model);
  await assert.rejects(missing.generateJson('Teste', {}), { status: 503 });
  for (const [httpStatus, expectedStatus] of [[403, 502], [429, 429]]) {
    const mockFetch: typeof fetch = async () => new Response('', { status: httpStatus });
    const service = new CloudflareAIService(account, 'token', model, mockFetch);
    await assert.rejects(service.generateJson('Teste', {}), { status: expectedStatus });
  }
});

test('Workers AI rejeita respostas malformadas', async () => {
  const mockFetch: typeof fetch = async () => Response.json({ success: true, result: { response: '{' } });
  const service = new CloudflareAIService(account, 'token', model, mockFetch);
  await assert.rejects(service.generateJson('Teste', {}), { status: 502 });
});

test('a conversa e as justificativas usam o Workers AI selecionado', async () => {
  const oldProvider = process.env.AI_PROVIDER;
  const oldAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
  const oldToken = process.env.CLOUDFLARE_API_TOKEN;
  const originalFetch = globalThis.fetch;
  let calls = 0;
  process.env.AI_PROVIDER = 'cloudflare';
  process.env.CLOUDFLARE_ACCOUNT_ID = account;
  process.env.CLOUDFLARE_API_TOKEN = 'token';
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({
      success: true,
      result: { response: calls === 1
        ? { replyText: 'O que gostaria de assistir?', isReadyForRecommendations: false, suggestedChips: [], extractedFilters: {} }
        : { justifications: [{ tmdbId: 1, justification: 'Combina com sua preferência.' }] } },
    });
  };
  try {
    const service = new GeminiService();
    assert.equal(service.isAvailable(), true);
    const conversation = await service.interpretConversation({
      messageHistory: [], latestMessage: 'Quero um filme', activeStreamings: [],
    });
    assert.equal(conversation.replyText, 'O que gostaria de assistir?');
    const title: StandardizedMovie = {
      id: 'tmdb-1', tmdbId: 1, mediaType: 'movie', voteCount: 0,
      title: 'Filme', tagline: '', director: '', releaseYear: 2020, durationMinutes: 90,
      ageRating: '', qualityBadge: '', matchScore: 0, genres: [], posterUrl: '',
      backdropUrl: '', synopsis: '', aiMatchReason: '', matchHighlights: [],
      metrics: { tmdb: 8, voteCount: 0 }, streamings: [], cast: [], similarMovieIds: [],
    };
    const justifications = await service.generateJustifications({ movies: [title], userPrompt: 'Quero um filme' });
    assert.equal(justifications[1], 'Combina com sua preferência.');
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldProvider === undefined) delete process.env.AI_PROVIDER; else process.env.AI_PROVIDER = oldProvider;
    if (oldAccount === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID; else process.env.CLOUDFLARE_ACCOUNT_ID = oldAccount;
    if (oldToken === undefined) delete process.env.CLOUDFLARE_API_TOKEN; else process.env.CLOUDFLARE_API_TOKEN = oldToken;
  }
});
