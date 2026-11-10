export type JsonSchema = Record<string, unknown>;

export class CloudflareAIService {
  constructor(
    private readonly accountId: string,
    private readonly apiToken: string,
    private readonly model: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  isAvailable(): boolean {
    return Boolean(this.accountId && this.apiToken);
  }

  async generateJson(prompt: string, schema: JsonSchema): Promise<unknown> {
    if (!this.isAvailable()) {
      throw Object.assign(new Error('Configure CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN no servidor.'), { status: 503 });
    }
    if (!/^[a-f0-9]{32}$/i.test(this.accountId) || !/^@(?:cf|hf)\/[a-zA-Z0-9._/-]+$/.test(this.model)) {
      throw Object.assign(new Error('ID da conta ou modelo da Cloudflare inválido.'), { status: 503 });
    }
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${this.model}`;
    let response: Response;
    try {
      response = await this.fetcher(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
          response_format: { type: 'json_schema', json_schema: schema },
        }),
        signal: AbortSignal.timeout(45_000),
      });
    } catch (error) {
      throw Object.assign(new Error('Não foi possível conectar ao Workers AI da Cloudflare.'), { status: 502, cause: error });
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw Object.assign(new Error('A Cloudflare recusou o token ou suas permissões para Workers AI.'), { status: 502 });
      }
      if (response.status === 429) {
        throw Object.assign(new Error('O limite de uso do Workers AI foi atingido. Tente novamente mais tarde.'), { status: 429 });
      }
      throw Object.assign(new Error('O Workers AI não conseguiu processar a solicitação.'), { status: 502 });
    }
    let envelope: unknown;
    try {
      envelope = await response.json();
    } catch (error) {
      throw Object.assign(new Error('O Workers AI retornou uma resposta inválida.'), { status: 502, cause: error });
    }
    if (!envelope || typeof envelope !== 'object' || !('success' in envelope) || envelope.success !== true ||
        !('result' in envelope) || !envelope.result || typeof envelope.result !== 'object' ||
        !('response' in envelope.result)) {
      throw Object.assign(new Error('O Workers AI retornou uma resposta incompleta.'), { status: 502 });
    }
    const result = envelope.result.response;
    if (typeof result === 'string') {
      try {
        return JSON.parse(result) as unknown;
      } catch (error) {
        throw Object.assign(new Error('O Workers AI retornou JSON inválido.'), { status: 502, cause: error });
      }
    }
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw Object.assign(new Error('O Workers AI retornou um resultado inválido.'), { status: 502 });
    }
    return result;
  }
}
