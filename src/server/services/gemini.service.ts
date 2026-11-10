import { GoogleGenAI } from '@google/genai';
import { CloudflareAIService, JsonSchema } from './cloudflare-ai.service';
import { StandardizedMovie } from './tmdb.service';

export interface ExtractedFilters {
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
}

export interface ConversationInterpretation {
  replyText: string;
  isReadyForRecommendations: boolean;
  suggestedChips: string[];
  extractedFilters: ExtractedFilters;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanList(value: unknown, limit = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, 100))
    .filter(Boolean)
    .slice(0, limit);
}

function safeFilters(value: unknown): ExtractedFilters {
  if (!isRecord(value)) return {};
  const maxDuration = Number(value.maxDurationMinutes);
  const contentType = value.contentType;
  return {
    contentType: contentType === 'movie' || contentType === 'tv' || contentType === 'all'
      ? contentType
      : undefined,
    mood: typeof value.mood === 'string' ? value.mood.slice(0, 160) : undefined,
    genres: cleanList(value.genres),
    rejectedGenres: cleanList(value.rejectedGenres),
    maxDurationMinutes: Number.isFinite(maxDuration) && maxDuration > 0 && maxDuration <= 600
      ? maxDuration
      : undefined,
    preferredYearRange: typeof value.preferredYearRange === 'string'
      ? value.preferredYearRange.slice(0, 40)
      : undefined,
    viewingContext: typeof value.viewingContext === 'string' ? value.viewingContext.slice(0, 80) : undefined,
    streamings: cleanList(value.streamings),
    keywords: cleanList(value.keywords),
    excludedTitles: cleanList(value.excludedTitles),
  };
}

export class GeminiService {
  private readonly ai: GoogleGenAI | null;
  private readonly modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  readonly provider = process.env.AI_PROVIDER || 'gemini';
  private readonly cloudflare = new CloudflareAIService(
    process.env.CLOUDFLARE_ACCOUNT_ID || '',
    process.env.CLOUDFLARE_API_TOKEN || '',
    process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
  );

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  isAvailable(): boolean {
    return this.provider === 'cloudflare' ? this.cloudflare.isAvailable() :
      this.provider === 'gemini' && this.ai !== null;
  }

  private async generateJson(prompt: string, schema: JsonSchema): Promise<unknown> {
    if (this.provider === 'cloudflare') return this.cloudflare.generateJson(prompt, schema);
    if (this.provider !== 'gemini') {
      throw Object.assign(new Error('AI_PROVIDER deve ser cloudflare ou gemini.'), { status: 503 });
    }
    if (!this.ai) {
      throw Object.assign(new Error('GEMINI_API_KEY não configurada no servidor.'), { status: 503 });
    }
    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return JSON.parse(response.text || '') as unknown;
  }

  async interpretConversation(params: {
    messageHistory: Array<{ sender: 'ai' | 'user'; text: string }>;
    latestMessage: string;
    activeStreamings: string[];
  }): Promise<ConversationInterpretation> {
    const systemPrompt = `Você é CineMatch AI, assistente de descoberta de filmes e séries no Brasil. Converse em português brasileiro, com tom amigável, direto e natural. Use o histórico para preservar preferências e evitar perguntas repetidas. Faça no máximo uma pergunta por resposta. Quando já houver informação suficiente para uma busca, marque isReadyForRecommendations como true. Nunca invente títulos, avaliações, identificadores, links ou disponibilidade; os dados serão consultados pelo catálogo.
Retorne somente JSON válido com: replyText (string), isReadyForRecommendations (boolean), suggestedChips (array de strings) e extractedFilters com contentType ("movie", "tv" ou "all"), mood, genres, rejectedGenres, maxDurationMinutes, preferredYearRange, viewingContext, streamings, keywords e excludedTitles. Retorne somente filtros que possam ser inferidos das mensagens; use arrays vazios quando não houver itens.`;
    const conversation = params.messageHistory
      .slice(-16)
      .map((message) => `${message.sender === 'user' ? 'USUÁRIO' : 'ASSISTENTE'}: ${message.text.slice(0, 2000)}`)
      .join('\n');
    const prompt = `${systemPrompt}\n\nPlataformas informadas: ${params.activeStreamings.join(', ') || 'sem preferência'}\nHistórico:\n${conversation}\n\nMensagem atual do usuário: ${params.latestMessage}`;

    try {
      const parsed = await this.generateJson(prompt, {
        type: 'object',
        properties: {
          replyText: { type: 'string' },
          isReadyForRecommendations: { type: 'boolean' },
          suggestedChips: { type: 'array', items: { type: 'string' } },
          extractedFilters: {
            type: 'object',
            properties: {
              contentType: { type: 'string', enum: ['movie', 'tv', 'all'] },
              mood: { type: 'string' },
              genres: { type: 'array', items: { type: 'string' } },
              rejectedGenres: { type: 'array', items: { type: 'string' } },
              maxDurationMinutes: { type: 'number' },
              preferredYearRange: { type: 'string' },
              viewingContext: { type: 'string' },
              streamings: { type: 'array', items: { type: 'string' } },
              keywords: { type: 'array', items: { type: 'string' } },
              excludedTitles: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        required: ['replyText', 'isReadyForRecommendations', 'suggestedChips', 'extractedFilters'],
      });
      if (!isRecord(parsed) || typeof parsed.replyText !== 'string' ||
          typeof parsed.isReadyForRecommendations !== 'boolean') {
        throw new Error('Formato de resposta inválido do Gemini.');
      }
      return {
        replyText: parsed.replyText.slice(0, 1200),
        isReadyForRecommendations: parsed.isReadyForRecommendations,
        suggestedChips: cleanList(parsed.suggestedChips, 6),
        extractedFilters: safeFilters(parsed.extractedFilters),
      };
    } catch (error) {
      if (error instanceof Error && 'status' in error &&
          (error.status === 503 || error.status === 429 || (error.status === 502 && this.provider === 'cloudflare'))) throw error;
      console.error('AI conversation request failed.', { provider: this.provider });
      throw Object.assign(new Error('A conversa com a IA falhou. Tente novamente.'), { status: 502, cause: error });
    }
  }

  async generateJustifications(params: {
    movies: StandardizedMovie[];
    userPrompt: string;
    extractedMood?: string;
  }): Promise<Record<number, string>> {
    if (params.movies.length === 0) return {};
    const prompt = `Escreva justificativas personalizadas, em português brasileiro, sem spoilers e com no máximo duas frases para estes títulos. Use somente os fatos fornecidos e não crie dados. Devolva JSON com a propriedade justifications, uma lista de objetos {tmdbId, justification}. Pedido do usuário: ${params.userPrompt.slice(0, 1000)}. Humor: ${(params.extractedMood || '').slice(0, 160)}. Títulos: ${JSON.stringify(params.movies.map((movie) => ({
      tmdbId: movie.tmdbId,
      title: movie.title,
      genres: movie.genres,
      synopsis: movie.synopsis.slice(0, 500),
      rating: movie.metrics.tmdb,
    })))}`;

    try {
      const parsed = await this.generateJson(prompt, {
        type: 'object',
        properties: {
          justifications: {
            type: 'array',
            items: {
              type: 'object',
              properties: { tmdbId: { type: 'integer' }, justification: { type: 'string' } },
              required: ['tmdbId', 'justification'],
            },
          },
        },
        required: ['justifications'],
      });
      if (!isRecord(parsed) || !Array.isArray(parsed.justifications)) {
        throw new Error('Formato de justificativa inválido do Gemini.');
      }
      const allowedIds = new Set(params.movies.map((movie) => movie.tmdbId));
      const output: Record<number, string> = {};
      for (const item of parsed.justifications) {
        if (!isRecord(item) || !Number.isSafeInteger(item.tmdbId) ||
            typeof item.justification !== 'string' || !allowedIds.has(Number(item.tmdbId))) continue;
        const justification = item.justification.trim().slice(0, 500);
        if (justification) output[Number(item.tmdbId)] = justification;
      }
      return output;
    } catch (error) {
      if (error instanceof Error && 'status' in error &&
          (error.status === 503 || error.status === 429 || (error.status === 502 && this.provider === 'cloudflare'))) throw error;
      console.error('AI justification request failed.', { provider: this.provider });
      throw Object.assign(new Error('Não foi possível gerar as justificativas com a IA.'), { status: 502, cause: error });
    }
  }
}

export const geminiService = new GeminiService();
