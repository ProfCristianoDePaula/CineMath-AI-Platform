import { GoogleGenAI } from '@google/genai';
import { StandardizedMovie } from './tmdb.service';

export interface ConversationInterpretation {
  replyText: string;
  isReadyForRecommendations: boolean;
  suggestedChips?: string[];
  extractedFilters: {
    mood?: string;
    genres?: string[];
    rejectedGenres?: string[];
    maxDurationMinutes?: number;
    preferredYearRange?: string;
    viewingContext?: string;
    streamings?: string[];
    keywords?: string[];
  };
}

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-3.8-flash';

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      try {
        this.ai = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  isAvailable(): boolean {
    return !!this.ai;
  }

  // Interpret user message in conversation
  async interpretConversation(params: {
    messageHistory: Array<{ sender: 'ai' | 'user'; text: string }>;
    latestMessage: string;
    activeStreamings: string[];
    currentPreferences?: Record<string, any>;
  }): Promise<ConversationInterpretation> {
    if (!this.ai) {
      return this.fallbackInterpretation(params.latestMessage, params.activeStreamings);
    }

    const systemPrompt = `Você é o CineMatch AI, um assistente especialista em curadoria cinematográfica e streaming no Brasil.
Fale SEMPRE em português brasileiro, com tom cordial, sofisticado, cinéfilo e acolhedor.
Seu objetivo é:
1. Compreender o humor e intenções do usuário (o que ele quer sentir, ritmo, época, com quem vai assistir).
2. Não fazer perguntas repetitivas ou burocráticas. Se o usuário já deu informação suficiente (ex: "quero suspense tenso na netflix"), conclua que JÁ HÁ dados suficientes para recomendar!
3. Responder em formato JSON estrito com esta estrutura:
{
  "replyText": "sua resposta em texto fluido",
  "isReadyForRecommendations": boolean,
  "suggestedChips": ["chip1", "chip2"],
  "extractedFilters": {
    "mood": "string",
    "genres": ["gêneros preferidos em português"],
    "rejectedGenres": ["gêneros a evitar"],
    "maxDurationMinutes": number ou null,
    "viewingContext": "solo" ou "couple" ou "friends" ou "family",
    "streamings": ["plataformas mencionadas"],
    "keywords": ["palavras-chave do tema"]
  }
}`;

    const context = `
Histórico da conversa:
${params.messageHistory.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}
MENSAGEM ATUAL DO USUÁRIO: "${params.latestMessage}"
Streamings ativos no perfil: ${params.activeStreamings.join(', ')}
`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: `${systemPrompt}\n\n${context}`,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: {
            // Default level
          },
        },
      });

      const text = response.text?.trim() || '';
      const parsed = JSON.parse(text) as ConversationInterpretation;
      return parsed;
    } catch (err) {
      console.error('Gemini interpretConversation error:', err);
      return this.fallbackInterpretation(params.latestMessage, params.activeStreamings);
    }
  }

  // Generate personalized justifications for the top 3 recommended movies
  async generateJustifications(params: {
    movies: StandardizedMovie[];
    userPrompt: string;
    extractedMood?: string;
  }): Promise<Record<number, string>> {
    if (!this.ai || params.movies.length === 0) {
      const fallbacks: Record<number, string> = {};
      for (const m of params.movies) {
        fallbacks[m.tmdbId] = m.aiMatchReason;
      }
      return fallbacks;
    }

    const prompt = `Como CineMatch AI, crie uma justificativa personalizada e sem spoilers (máximo 2 a 3 frases) em português para cada um destes 3 filmes, explicando por que eles combinam com o pedido: "${params.userPrompt}".

Filmes:
${params.movies
  .map(
    (m, i) => `${i + 1}. ID: ${m.tmdbId} | Título: ${m.title} | Gêneros: ${m.genres.join(', ')} | Direção: ${m.director} | Sinopse: ${m.synopsis}`
  )
  .join('\n')}

Retorne apenas um JSON no formato:
{
  "justifications": [
    { "tmdbId": 12345, "justification": "texto personalizado..." }
  ]
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);
      const result: Record<number, string> = {};
      if (Array.isArray(parsed.justifications)) {
        for (const item of parsed.justifications) {
          result[item.tmdbId] = item.justification;
        }
      }
      return result;
    } catch (err) {
      console.warn('Failed to generate justifications with Gemini:', err);
      const fallbacks: Record<number, string> = {};
      for (const m of params.movies) {
        fallbacks[m.tmdbId] = m.aiMatchReason;
      }
      return fallbacks;
    }
  }

  // Fallback heuristic interpretation when GEMINI_API_KEY is not configured
  private fallbackInterpretation(
    text: string,
    activeStreamings: string[]
  ): ConversationInterpretation {
    const lower = text.toLowerCase().trim();

    // Check for greeting or generic initial message
    const isGreeting =
      lower === 'oi' ||
      lower === 'olá' ||
      lower === 'ola' ||
      lower === 'boa noite' ||
      lower === 'boa tarde' ||
      lower === 'bom dia' ||
      lower.startsWith('começar');

    if (isGreeting) {
      return {
        replyText:
          'Olá! Estou pronto para encontrar seu próximo título ideal. O que você gostaria de sentir hoje? Ou se preferir, me diga algum filme recente que você amou para eu usar como referência!',
        isReadyForRecommendations: false,
        suggestedChips: [
          'Suspense que prende do início ao fim',
          'Ficção científica cerebral',
          'Filme leve e reconfortante',
          'Produção curta (menos de 90 min)',
        ],
        extractedFilters: {
          mood: 'descoberta inicial',
          genres: [],
          streamings: activeStreamings,
        },
      };
    }

    // Genre extraction
    const genres: string[] = [];
    if (lower.includes('suspense') || lower.includes('thriller') || lower.includes('psicológico') || lower.includes('tensão') || lower.includes('investigação')) {
      genres.push('Suspense', 'Mistério');
    }
    if (lower.includes('ficção') || lower.includes('sci-fi') || lower.includes('espaço') || lower.includes('futuro') || lower.includes('distopia') || lower.includes('cyberpunk')) {
      genres.push('Ficção Científica');
    }
    if (lower.includes('comédia') || lower.includes('rir') || lower.includes('engraçado') || lower.includes('divertido')) {
      genres.push('Comédia');
    }
    if (lower.includes('ação') || lower.includes('tiro') || lower.includes('adrenalina') || lower.includes('luta')) {
      genres.push('Ação');
    }
    if (lower.includes('terror') || lower.includes('medo') || lower.includes('assustador') || lower.includes('horror')) {
      genres.push('Terror');
    }
    if (lower.includes('drama') || lower.includes('emocionante') || lower.includes('chorar') || lower.includes('profundo')) {
      genres.push('Drama');
    }
    if (lower.includes('romance') || lower.includes('romântico') || lower.includes('amor')) {
      genres.push('Romance');
    }
    if (lower.includes('animação') || lower.includes('desenho') || lower.includes('anime')) {
      genres.push('Animação');
    }

    if (genres.length === 0) {
      genres.push('Suspense', 'Mistério');
    }

    // Duration extraction
    let maxDurationMinutes: number | undefined = undefined;
    if (lower.includes('90') || lower.includes('curto') || lower.includes('rápido') || lower.includes('menos de 1h30') || lower.includes('menos de 90')) {
      maxDurationMinutes = 95;
    } else if (lower.includes('120') || lower.includes('2 horas') || lower.includes('2h') || lower.includes('padrão')) {
      maxDurationMinutes = 125;
    }

    // Context
    let viewingContext = 'solo';
    if (lower.includes('casal') || lower.includes('dois') || lower.includes('namorada') || lower.includes('namorado') || lower.includes('esposa') || lower.includes('marido')) {
      viewingContext = 'couple';
    } else if (lower.includes('amigos') || lower.includes('galera') || lower.includes('turma')) {
      viewingContext = 'friends';
    } else if (lower.includes('família') || lower.includes('familia') || lower.includes('filhos') || lower.includes('crianças')) {
      viewingContext = 'family';
    }

    // Streaming mentioned in prompt
    const mentionedStreamings: string[] = [];
    if (lower.includes('netflix')) mentionedStreamings.push('Netflix');
    if (lower.includes('max') || lower.includes('hbo')) mentionedStreamings.push('Max');
    if (lower.includes('prime') || lower.includes('amazon')) mentionedStreamings.push('Prime Video');
    if (lower.includes('apple')) mentionedStreamings.push('Apple TV');
    if (lower.includes('disney')) mentionedStreamings.push('Disney+');

    const effectiveStreamings = mentionedStreamings.length > 0 ? mentionedStreamings : activeStreamings;

    const durationText = maxDurationMinutes ? `com até ${maxDurationMinutes} minutos ` : '';
    const contextText = viewingContext === 'couple' ? 'para uma sessão a dois ' : viewingContext === 'family' ? 'para assistir em família ' : '';

    return {
      replyText: `Entendido perfeitamente! Identifiquei seu interesse por ${genres.join(' e ')} ${durationText}${contextText}nos catálogos ativos (${effectiveStreamings.join(', ')}). Cruzando os metadados do motor neural...`,
      isReadyForRecommendations: true,
      suggestedChips: [
        'Suspense com reviravolta chocante',
        'Ficção científica cerebral',
        'Produção curta (-90 min)',
        'Mais avaliados pela crítica',
      ],
      extractedFilters: {
        mood: genres.includes('Suspense') ? 'tenso e investigativo' : 'envolvente e dinâmico',
        genres,
        maxDurationMinutes,
        viewingContext,
        streamings: effectiveStreamings,
        keywords: [lower.slice(0, 40)],
      },
    };
  }
}

export const geminiService = new GeminiService();
