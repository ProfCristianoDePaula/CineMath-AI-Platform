import React, { useState } from 'react';
import { Movie } from '../types';

interface MatchesScreenProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onGoToChat: () => void;
  onOpenCoupleMatch: () => void;
  onToggleWatchlist: (movieId: string) => void;
  isWatchlisted: (movieId: string) => boolean;
}

export const MatchesScreen: React.FC<MatchesScreenProps> = ({
  movies,
  onSelectMovie,
  onGoToChat,
  onOpenCoupleMatch,
  onToggleWatchlist,
  isWatchlisted,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'duration' | 'year'>('match');

  const topMatch = movies[0]; // "Sussurros no Labirinto"

  // Filter & sort secondary movies
  const secondaryMovies = movies
    .filter((m) => {
      if (selectedProvider === 'todos') return true;
      return m.streamings.some((s) => s.provider.toLowerCase() === selectedProvider.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'match') return b.matchScore - a.matchScore;
      if (sortBy === 'rating') return b.metrics.imdb - a.metrics.imdb;
      if (sortBy === 'duration') return a.durationMinutes - b.durationMinutes;
      if (sortBy === 'year') return b.releaseYear - a.releaseYear;
      return 0;
    });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 pb-20">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-20 right-10 w-[45rem] h-[25rem] bg-[#a078ff]/10 rounded-full blur-[120px] -z-10"></div>

      {/* Screen Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4edea3]/20 text-[#4edea3] text-xs font-bold uppercase tracking-wider mb-2 border border-[#4edea3]/30">
          <span className="material-symbols-outlined text-sm">verified</span>
          Recomendações Prontas
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Encontramos algo perfeito para você!
        </h1>
        <p className="text-sm sm:text-base text-[#cbc3d7] mt-1 max-w-2xl">
          Baseado no seu pedido por suspense psicológico tenso com cinematografia impecável e menos de 90 minutos.
        </p>
      </div>

      {/* #1 Top Match Hero Showcase (Featured Card) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1e1f29] via-[#282934] to-[#1a1b25] border border-[#a078ff]/40 shadow-[0_0_40px_rgba(160,120,255,0.25)] mb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 items-center">
          {/* Poster Column */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl group border border-white/10">
              <img
                src={topMatch.posterUrl}
                alt={topMatch.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>

              {/* Badges */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#a078ff] text-white text-xs font-extrabold tracking-wider uppercase shadow-lg flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Match Absoluto • #1
              </div>

              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#4edea3] text-sm font-extrabold font-mono border border-[#4edea3]/30 shadow-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
                {topMatch.matchScore}%
              </div>

              {/* Tagline on bottom of image */}
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs italic text-white/90 drop-shadow">
                  "{topMatch.tagline}"
                </p>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div>
              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-white text-xs font-bold">
                  {topMatch.releaseYear}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-white text-xs font-bold">
                  {topMatch.durationMinutes} min (Menos de 1h30)
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#282934] text-[#ffb4ab] text-xs font-bold border border-[#ffb4ab]/30">
                  {topMatch.ageRating}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#a078ff]/20 text-primary text-xs font-bold">
                  {topMatch.qualityBadge}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                {topMatch.title}
              </h2>
              <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-4">
                Direção: {topMatch.director} • {topMatch.genres.join(' • ')}
              </p>

              {/* Synopsis */}
              <p className="text-sm text-[#cbc3d7] leading-relaxed mb-5">
                {topMatch.synopsis}
              </p>

              {/* AI Why It Matched Box */}
              <div className="p-4 rounded-2xl bg-[#12131d]/80 border border-[#a078ff]/30 space-y-2 mb-6">
                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm">psychology</span>
                  Por que a IA escolheu para você:
                </div>
                <p className="text-xs text-[#e2e1f0] leading-relaxed">
                  {topMatch.aiMatchReason}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px] text-[#cbc3d7]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4edea3]">✓</span>
                    <span>Duração: 88 min (atinge sua meta)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4edea3]">✓</span>
                    <span>IMDb 8.4 • Metacritic 86</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4edea3]">✓</span>
                    <span>Disponível no seu plano Netflix 4K</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4edea3]">✓</span>
                    <span>Reviravolta sem clichês</span>
                  </div>
                </div>
              </div>

              {/* Where to Watch Pills */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#958ea0]">Onde Assistir Agora:</span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {topMatch.streamings.map((st, i) => (
                    <div
                      key={i}
                      className="px-3.5 py-2 rounded-xl bg-[#12131d] border border-white/10 flex items-center gap-2 text-xs font-bold text-white shadow-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
                      <span>{st.provider}</span>
                      <span className="text-[10px] text-[#958ea0] font-normal">({st.quality})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => onSelectMovie(topMatch)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_24px_rgba(160,120,255,0.45)] hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">play_arrow</span>
                <span>Assistir na Netflix</span>
              </button>

              <button
                onClick={() => onSelectMovie(topMatch)}
                className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm border border-white/10 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">info</span>
                <span>Ver Detalhes & Elenco</span>
              </button>

              <button
                onClick={() => onToggleWatchlist(topMatch.id)}
                className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold ${
                  isWatchlisted(topMatch.id)
                    ? 'bg-[#a078ff]/20 border-primary text-primary'
                    : 'bg-white/5 border-white/10 text-[#cbc3d7] hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-base ${isWatchlisted(topMatch.id) ? 'fill-1' : ''}`}>
                  {isWatchlisted(topMatch.id) ? 'bookmark' : 'bookmark_border'}
                </span>
                <span className="hidden sm:inline">
                  {isWatchlisted(topMatch.id) ? 'Salvo' : 'Salvar'}
                </span>
              </button>

              <button
                onClick={onOpenCoupleMatch}
                className="px-4 py-3 rounded-xl bg-[#282934] hover:bg-[#33343f] text-[#5de6ff] text-xs font-semibold border border-[#5de6ff]/20 flex items-center gap-2 transition-colors cursor-pointer ml-auto"
                title="Calcular compatibilidade para ver a dois"
              >
                <span className="material-symbols-outlined text-base">group</span>
                <span>Match de Casal</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sort Toolbar for Secondary Recommendations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
        <div>
          <h3 className="text-xl font-bold text-white">Outras Fortes Correspondências</h3>
          <p className="text-xs text-[#958ea0]">Títulos que também pontuaram alto no seu teste vetorial</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Provider Filter */}
          <div className="flex items-center gap-1 bg-[#1e1f29] p-1 rounded-xl border border-white/5 text-xs">
            {['todos', 'netflix', 'max', 'prime video', 'disney+'].map((prov) => (
              <button
                key={prov}
                onClick={() => setSelectedProvider(prov)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                  selectedProvider === prov
                    ? 'bg-[#a078ff] text-white shadow-sm'
                    : 'text-[#cbc3d7] hover:text-white'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#1e1f29] text-xs text-[#cbc3d7] border border-white/10 rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="match">Maior Afinidade</option>
            <option value="rating">Nota IMDb</option>
            <option value="duration">Menor Duração</option>
            <option value="year">Mais Recente</option>
          </select>
        </div>
      </div>

      {/* Secondary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {secondaryMovies.slice(1).map((movie) => {
          const saved = isWatchlisted(movie.id);

          return (
            <div
              key={movie.id}
              className="bg-[#1e1f29] rounded-2xl border border-white/5 hover:border-white/20 transition-all overflow-hidden flex flex-col justify-between group shadow-md"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
                <img
                  src={movie.backdropUrl || movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f29] via-transparent to-black/30 pointer-events-none"></div>

                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#4edea3] text-xs font-bold border border-[#4edea3]/30">
                  {movie.matchScore}% Match
                </div>

                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 text-white">
                    {movie.durationMinutes} min
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-container/40 text-primary">
                    {movie.genres[0]}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4
                    onClick={() => onSelectMovie(movie)}
                    className="text-lg font-bold text-white group-hover:text-primary transition-colors cursor-pointer mb-1"
                  >
                    {movie.title}
                  </h4>
                  <p className="text-xs text-[#958ea0] line-clamp-2 mb-3">
                    {movie.synopsis}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#cbc3d7]">
                    <span className="text-[#958ea0]">Disponível em:</span>
                    <span className="font-semibold">{movie.streamings[0]?.provider}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
                  <button
                    onClick={() => onSelectMovie(movie)}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    Detalhes
                  </button>
                  <button
                    onClick={() => onToggleWatchlist(movie.id)}
                    className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      saved
                        ? 'bg-[#a078ff]/20 text-primary border border-primary/30'
                        : 'bg-[#282934] text-[#cbc3d7] hover:text-white'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-sm ${saved ? 'fill-1' : ''}`}>
                      {saved ? 'bookmark' : 'bookmark_border'}
                    </span>
                    <span>{saved ? 'Salvo' : 'Salvar'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Refinement Prompt */}
      <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-[#1e1f29] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h4 className="text-base font-bold text-white">Não encontrou exatamente o que procurava?</h4>
          <p className="text-xs text-[#cbc3d7] mt-1">
            Você pode refinar as instruções com a IA ou calcular uma recomendação em dupla.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCoupleMatch}
            className="px-4 py-2.5 rounded-xl bg-[#282934] hover:bg-[#383844] text-xs font-semibold text-[#5de6ff] border border-[#5de6ff]/20 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">favorite</span>
            <span>Match de Casal</span>
          </button>
          <button
            onClick={onGoToChat}
            className="px-5 py-2.5 rounded-xl bg-[#a078ff] hover:bg-[#6d3bd7] text-xs font-semibold text-white flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">chat</span>
            <span>Refinar Busca com a IA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
