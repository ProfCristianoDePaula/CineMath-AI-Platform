# CineMatch AI Platform

Aplicação React/TypeScript com API Express para descobrir filmes e séries usando catálogo e disponibilidade do TMDB e IA do Cloudflare Workers AI ou Gemini.

## Requisitos

- Node.js 22.12 ou mais recente
- Credenciais do [TMDB](https://www.themoviedb.org/settings/api) e de um dos provedores de IA abaixo.

## Configuração e execução local

1. Instale as dependências:

   ```sh
   npm install --legacy-peer-deps
   ```

2. Copie `.env.example` para `.env` e preencha `TMDB_ACCESS_TOKEN` (ou `TMDB_API_KEY`). Configure também a IA conforme a seção abaixo. As credenciais são usadas somente pelo servidor; não as coloque em arquivos ou variáveis `VITE_*`. O token de leitura do TMDB é enviado no cabeçalho `Authorization`, nunca na URL.
3. Inicie o servidor e o frontend:

   ```sh
   npm run dev
   ```

   Abra `http://localhost:3000`.

O servidor também aceita `PORT`, `GEMINI_MODEL` e `CINEMATCH_DATA_DIR`. Sem as chaves, as integrações correspondentes retornam erros explícitos; não há catálogo de demonstração como fallback.

## IA com Cloudflare Workers AI

1. Crie ou acesse uma [conta Cloudflare](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. No painel, abra [Workers AI](https://dash.cloudflare.com/?to=/:account/ai/workers-ai) e selecione **Use REST API**.
3. Em **Get API token**, selecione **Create a Workers AI API Token**, revise e crie o token; copie-o para um local seguro. Se criar um token personalizado, conceda à conta as permissões **Workers AI - Read** e **Workers AI - Edit**.
4. Copie o **Account ID** mostrado na mesma página, em **Get Account ID**.
5. No `.env` local, mantenha sua configuração do TMDB e adicione:

   ```dotenv
   AI_PROVIDER=cloudflare
   CLOUDFLARE_ACCOUNT_ID=cole_o_account_id
   CLOUDFLARE_API_TOKEN=cole_o_token
   # Opcional; este é o modelo padrão:
   CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct
   ```

6. Reinicie o servidor (`npm run dev`) e teste a conversa em `http://localhost:3000`. O endpoint `/api/health` informa o provedor selecionado e se as variáveis estão preenchidas, mas isso não valida o token; só uma conversa confirma a integração.

O Workers Free inclui atualmente **10.000 neurônios por dia**, compartilhados pelo uso do Workers AI; isso não corresponde a um número fixo de mensagens. No plano gratuito, ultrapassar o limite exige aguardar ou optar pelo plano pago. Se você ativar o plano pago, o uso excedente pode gerar cobranças. Consulte [preços e limites atuais](https://developers.cloudflare.com/workers-ai/platform/pricing/) e acompanhe seu consumo no painel. O modelo configurado deve suportar [JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/).

Para voltar ao Gemini, configure `AI_PROVIDER=gemini` e `GEMINI_API_KEY`. Sem `AI_PROVIDER`, a aplicação mantém o comportamento anterior e usa Gemini. Nunca envie tokens em conversas nem os inclua no controle de versão.

## Comandos

```sh
npm run lint
npm test
npm run build
npm start
```

`npm start` serve a aplicação compilada. Execute `npm run build` antes.

## API principal

- `GET /api/health` — status do servidor e configuração das integrações
- `GET /api/movies/featured`, `/api/movies/search`, `/api/tv/search` — catálogo TMDB
- `GET /api/movies/:id` e `GET /api/tv/:id` — detalhes; `?track=false` desativa o registro da visualização
- `POST /api/ai/conversation` e `POST /api/ai/recommendations` — conversa e recomendações
- `GET/POST /api/watchlist`, `GET /api/history`, `GET/POST /api/preferences` — dados locais do perfil anônimo

As opções de provedores e links de acesso são as informações fornecidas pelo TMDB para a região brasileira; podem mudar e não constituem garantia de disponibilidade. O produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.

## Persistência e privacidade

Por padrão, watchlist, histórico, preferências e conversas são gravados em `data/cinematch_db.json`. Configure `CINEMATCH_DATA_DIR` para escolher outro diretório. A identificação do perfil é anônima e mantida no navegador; isso não é autenticação. O armazenamento em arquivo local é adequado para desenvolvimento e instância única, não para múltiplas instâncias ou uso de produção. Para esse cenário, use um banco gerenciado e autenticação/autorização apropriadas.
