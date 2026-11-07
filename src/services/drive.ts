import { Movie } from '../types';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

/**
 * List files in user's Google Drive related to CineMatch or created with this app
 */
export async function listCineMatchDriveFiles(accessToken: string): Promise<DriveFileItem[]> {
  const query = encodeURIComponent("trashed = false and (name contains 'CineMatch' or mimeType = 'application/json' or mimeType = 'text/plain')");
  const fields = encodeURIComponent('files(id, name, mimeType, modifiedTime, size, webViewLink)');
  const url = `${DRIVE_API_BASE}/files?q=${query}&orderBy=modifiedTime desc&pageSize=30&fields=${fields}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao listar arquivos do Google Drive: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Export Watchlist and curated movies as a JSON and formatted document in Google Drive
 */
export async function exportWatchlistToDrive(
  accessToken: string,
  movies: Movie[],
  watchlistIds: string[],
  watchedIds: string[]
): Promise<DriveFileItem> {
  const watchlistedMovies = movies.filter((m) => watchlistIds.includes(m.id));

  const exportData = {
    appName: 'CineMatch AI Platform',
    exportedAt: new Date().toISOString(),
    totalWatchlist: watchlistedMovies.length,
    movies: watchlistedMovies.map((m) => ({
      id: m.id,
      title: m.title,
      tagline: m.tagline,
      director: m.director,
      releaseYear: m.releaseYear,
      durationMinutes: m.durationMinutes,
      ageRating: m.ageRating,
      matchScore: m.matchScore,
      genres: m.genres,
      streamings: m.streamings.map((s) => `${s.provider} (${s.quality})`),
      synopsis: m.synopsis,
      aiMatchReason: m.aiMatchReason,
      isWatched: watchedIds.includes(m.id),
      metrics: m.metrics,
    })),
  };

  const fileName = `CineMatch_Minha_Lista_${new Date().toISOString().slice(0, 10)}.json`;
  const fileContent = JSON.stringify(exportData, null, 2);

  // Multipart upload
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'Minha lista de filmes e recomendações gerada pelo CineMatch AI.',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch(`${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao salvar lista no Google Drive: ${res.status} ${errorText}`);
  }

  return await res.json();
}

/**
 * Export full movie review & analysis dossier to Google Drive as Markdown/Text
 */
export async function exportMovieDossierToDrive(
  accessToken: string,
  movie: Movie
): Promise<DriveFileItem> {
  const fileName = `CineMatch_Dossie_${movie.title.replace(/\s+/g, '_')}.txt`;

  const textContent = `=====================================================
CINEMATCH AI — DOSSIÊ DE ANÁLISE CINEMATOGRÁFICA
=====================================================
Título: ${movie.title} (${movie.releaseYear})
Tagline: "${movie.tagline}"
Direção: ${movie.director}
Duração: ${movie.durationMinutes} minutos | Classificação: ${movie.ageRating}
Qualidade de Reprodução: ${movie.qualityBadge}
Afinidade Algorítmica: ${movie.matchScore}% Match

GÊNEROS:
${movie.genres.join(' • ')}

ONDE ASSISTIR:
${movie.streamings.map((s) => `- ${s.provider} [${s.quality}]: ${s.audioInfo}`).join('\n')}

SINOPSE CURADA (SEM SPOILERS):
${movie.synopsis}

ANÁLISE NEURAL DE AFINIDADE:
${movie.aiMatchReason}

DESTAQUES DO ALGORITMO:
${movie.matchHighlights.map((h) => `* ${h}`).join('\n')}

CURVA DE INTENSIDADE DRAMÁTICA:
${movie.emotionalArc.map((a) => `[${a.act}] ${a.title} (${a.intensity}%): ${a.description}`).join('\n')}

MÉTRICAS DA CRÍTICA:
- IMDb: ${movie.metrics.imdb} / 10
- Rotten Tomatoes: ${movie.metrics.rottenTomatoes}%
- Metacritic: ${movie.metrics.metacritic || 'N/A'}
- Avaliação do Público: ${movie.metrics.audienceScore || 'N/A'}%

ELENCO & PERSONAGENS:
${movie.cast.map((c) => `- ${c.name} como ${c.role}`).join('\n')}

Gerado por CineMatch AI Platform em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}.
=====================================================`;

  const metadata = {
    name: fileName,
    mimeType: 'text/plain',
    description: `Dossiê completo de análise cinematográfica do filme ${movie.title} gerado por CineMatch AI.`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    textContent +
    closeDelimiter;

  const res = await fetch(`${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Erro ao exportar dossiê para o Google Drive: ${res.status} ${errorText}`);
  }

  return await res.json();
}

/**
 * Delete a file in Google Drive
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errorText = await res.text();
    throw new Error(`Erro ao excluir arquivo do Google Drive: ${res.status} ${errorText}`);
  }
}
