# CineMatch AI Platform

Aplicação React/TypeScript com API Express para descobrir filmes e séries usando catálogo e disponibilidade do TMDB e recursos de IA do Gemini.

## Requisitos

- Node.js 22.12 ou mais recente
- Chaves de API do [TMDB](https://www.themoviedb.org/settings/api) e do [Gemini](https://aistudio.google.com/apikey)

## Configuração e execução local

1. Instale as dependências:

   ```sh
   npm install --legacy-peer-deps
   ```

2. Copie `.env.example` para `.env` e preencha `TMDB_API_KEY` e `GEMINI_API_KEY`. As chaves são usadas somente pelo servidor; não as coloque em arquivos ou variáveis `VITE_*`.
3. Inicie o servidor e o frontend:

   ```sh
   npm run dev
   ```

   Abra `http://localhost:3000`.

O servidor também aceita `PORT`, `GEMINI_MODEL` e `CINEMATCH_DATA_DIR`. Sem as chaves, as integrações correspondentes retornam erros explícitos; não há catálogo de demonstração como fallback.

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
