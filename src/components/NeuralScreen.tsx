import React from 'react';
import { Movie } from '../types';

interface NeuralScreenProps {
  movies: Movie[];
  recommendationNotice: string;
  onSelectMovie: (movie: Movie) => void;
  onGoToMatches: () => void;
}

export const NeuralScreen: React.FC<NeuralScreenProps> = ({ movies, recommendationNotice, onSelectMovie, onGoToMatches }) => {
  const steps = [
    { title: 'Preferências da conversa', description: 'Gêneros, duração e serviços informados por você.' },
    { title: 'Consulta ao catálogo', description: 'Títulos, sinopses e avaliações vêm da API oficial do TMDB.' },
    { title: 'Disponibilidade no Brasil', description: 'A busca considera as opções de acesso fornecidas pelo TMDB.' },
    { title: 'Pontuação de compatibilidade', description: 'Gêneros (25%), humor (15%), provedores (25%), duração (15%), período (10%) e nota TMDB (10%).' },
  ];

  const rankedMovies = [...movies].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a078ff]/20 text-primary text-xs font-bold uppercase tracking-wider mb-2 border border-[#a078ff]/30">
            <span className="material-symbols-outlined text-sm">neurology</span>
            Como funciona a recomendação
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Compatibilidade explicável
          </h1>
          <p className="text-sm text-[#cbc3d7] mt-1">
            A pontuação é calculada no servidor; informações de catálogo e disponibilidade não são estimadas.
          </p>
        </div>
        <button
          onClick={onGoToMatches}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] text-white font-semibold text-xs sm:text-sm flex items-center gap-2"
        >
          Ver recomendações <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>

      {recommendationNotice && (
        <p role="status" className="mb-6 rounded-xl border border-[#5de6ff]/20 bg-[#5de6ff]/5 p-4 text-sm text-[#cbc3d7]">
          {recommendationNotice}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <section className="bg-[#1e1f29] rounded-2xl p-6 border border-white/10">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary">schema</span>
            Etapas da análise
          </h2>
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="w-7 h-7 rounded-lg bg-[#a078ff]/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">{step.title}</h3>
                  <p className="text-xs text-[#958ea0] mt-1">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-[11px] text-[#958ea0] border-t border-white/5 mt-5 pt-4">
            O TMDB não fornece dados estruturados de tensão, estética ou curva dramática; esses atributos não são apresentados como fatos.
          </p>
        </section>

        <section className="bg-[#1e1f29] rounded-2xl p-6 border border-white/10">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#5de6ff]">radar</span>
            Títulos avaliados nesta sessão
          </h2>
          {rankedMovies.length === 0 ? (
            <p className="text-sm text-[#958ea0]">Inicie uma conversa para consultar o catálogo e calcular as sugestões.</p>
          ) : (
            <div className="space-y-3">
              {rankedMovies.map((movie, index) => (
                <button
                  type="button"
                  key={movie.id}
                  onClick={() => onSelectMovie(movie)}
                  className="w-full p-3.5 rounded-xl border border-white/5 hover:border-[#a078ff] bg-[#12131d]/70 text-left flex items-center gap-3.5"
                >
                  {movie.posterUrl
                    ? <img src={movie.posterUrl} alt="" className="w-12 h-16 object-cover rounded-md shrink-0" />
                    : <span className="w-12 h-16 rounded-md bg-white/5 shrink-0" />}
                  <span className="flex-1 min-w-0">
                    <span className="block text-[10px] text-primary font-bold uppercase">{movie.genres[0] || 'Catálogo TMDB'}</span>
                    <span className="block text-sm font-bold text-white truncate">{index + 1}. {movie.title}</span>
                    <span className="block text-[10px] text-[#958ea0] mt-1">
                      {movie.metrics.tmdb > 0 ? `TMDB ${movie.metrics.tmdb.toFixed(1)}/10` : 'Nota não informada'}
                      {movie.streamings[0] ? ` • ${movie.streamings[0].provider}` : ' • Disponibilidade não confirmada'}
                    </span>
                  </span>
                  <strong className="text-[#4edea3] text-sm">{movie.matchScore}%</strong>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
