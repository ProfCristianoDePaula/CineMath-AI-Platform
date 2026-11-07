import React, { useState } from 'react';
import { Movie } from '../types';

interface WatchlistScreenProps {
  movies: Movie[];
  watchlistIds: string[];
  watchedIds: string[];
  onSelectMovie: (movie: Movie) => void;
  onToggleWatchlist: (movieId: string) => void;
  onToggleWatched: (movieId: string) => void;
  onGoToHome: () => void;
}

export const WatchlistScreen: React.FC<WatchlistScreenProps> = ({
  movies,
  watchlistIds,
  watchedIds,
  onSelectMovie,
  onToggleWatchlist,
  onToggleWatched,
  onGoToHome,
}) => {
  const [filter, setFilter] = useState<'all' | 'unwatched' | 'watched'>('all');

  const watchlistedMovies = movies.filter((m) => watchlistIds.includes(m.id));

  const filteredMovies = watchlistedMovies.filter((m) => {
    const isWatched = watchedIds.includes(m.id);
    if (filter === 'watched') return isWatched;
    if (filter === 'unwatched') return !isWatched;
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 pb-20">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a078ff]/20 text-primary text-xs font-bold uppercase tracking-wider mb-2 border border-[#a078ff]/30">
            <span className="material-symbols-outlined text-sm">bookmark</span>
            Sua Curadoria Pessoal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Minha Lista & Sessões
          </h1>
          <p className="text-sm text-[#cbc3d7] mt-1">
            Filmes salvos para assistir e títulos já conferidos com notas de afinidade.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#1e1f29] p-1 rounded-xl border border-white/5 text-xs">
          {[
            { id: 'all' as const, label: `Todos (${watchlistedMovies.length})` },
            { id: 'unwatched' as const, label: 'Para Assistir' },
            { id: 'watched' as const, label: 'Já Assistidos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#a078ff] text-white shadow-sm'
                  : 'text-[#cbc3d7] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredMovies.length === 0 ? (
        <div className="text-center py-20 bg-[#1e1f29]/40 rounded-3xl border border-white/5 p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-white/5 text-[#958ea0] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">bookmark_border</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nenhum título nesta seleção</h3>
          <p className="text-xs text-[#cbc3d7] mb-6">
            Explore a curadoria em tempo real ou use a IA para salvar títulos na sua lista.
          </p>
          <button
            onClick={onGoToHome}
            className="px-6 py-2.5 rounded-xl bg-[#a078ff] text-white text-xs font-bold hover:bg-[#6d3bd7] transition-colors cursor-pointer"
          >
            Explorar Catálogo Recomendado
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMovies.map((movie) => {
            const isWatched = watchedIds.includes(movie.id);

            return (
              <div
                key={movie.id}
                className="bg-[#1e1f29] rounded-2xl border border-white/5 hover:border-white/20 transition-all p-5 flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex gap-4 items-start mb-4">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-20 h-28 object-cover rounded-xl shrink-0 shadow-md group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-primary uppercase truncate">
                          {movie.genres[0]}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4edea3]/20 text-[#4edea3]">
                          {movie.matchScore}% Match
                        </span>
                      </div>
                      <h4
                        onClick={() => onSelectMovie(movie)}
                        className="text-base font-bold text-white hover:text-primary transition-colors cursor-pointer truncate"
                      >
                        {movie.title}
                      </h4>
                      <p className="text-xs text-[#958ea0] mt-0.5">
                        {movie.releaseYear} • {movie.durationMinutes} min
                      </p>
                      <div className="mt-2 text-[11px] text-[#cbc3d7]">
                        {movie.streamings[0]?.provider} ({movie.streamings[0]?.quality})
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#cbc3d7] line-clamp-2 leading-relaxed mb-4">
                    {movie.synopsis}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onToggleWatched(movie.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      isWatched
                        ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30'
                        : 'bg-[#282934] text-[#cbc3d7] hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isWatched ? 'check_circle' : 'visibility'}
                    </span>
                    <span>{isWatched ? 'Visto' : 'Marcar Visto'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectMovie(movie)}
                      className="px-3 py-1.5 rounded-lg bg-[#a078ff] text-white text-xs font-bold hover:bg-[#6d3bd7] transition-colors cursor-pointer"
                    >
                      Detalhes
                    </button>
                    <button
                      onClick={() => onToggleWatchlist(movie.id)}
                      className="p-1.5 rounded-lg text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors cursor-pointer"
                      title="Remover da lista"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
