import React, { useState } from 'react';
import { Movie } from '../types';

interface DetailScreenProps {
  movie: Movie;
  allMovies: Movie[];
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  onOpenCoupleMatch: () => void;
  onToggleWatchlist: (movieId: string) => void;
  isWatchlisted: (movieId: string) => boolean;
  onToggleWatched: (movieId: string) => void;
  isWatched: (movieId: string) => boolean;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({
  movie,
  allMovies,
  onBack,
  onSelectMovie,
  onOpenTrailer,
  onOpenCoupleMatch,
  onToggleWatchlist,
  isWatchlisted,
  onToggleWatched,
  isWatched,
}) => {
  const [activeTab, setActiveTab] = useState<'analise' | 'sinopse' | 'elenco' | 'streamings'>('analise');
  const [copiedLink, setCopiedLink] = useState(false);

  const saved = isWatchlisted(movie.id);
  const watched = isWatched(movie.id);

  const similarMovies = allMovies.filter((m) => movie.similarMovieIds.includes(m.id));

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full relative z-10 pb-24">
      {/* Cinematic Full Backdrop Header */}
      <div className="relative w-full h-[32rem] sm:h-[38rem] overflow-hidden bg-black">
        {/* Backdrop Image */}
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center scale-105 filter brightness-75 contrast-110"
        />

        {/* Ambient Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#12131d] via-[#12131d]/60 to-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#12131d] via-transparent to-[#12131d]/70"></div>

        {/* Top Floating Navigation */}
        <div className="absolute top-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between z-20">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2 border border-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white text-xs border border-white/10 transition-colors cursor-pointer"
              title="Compartilhar título"
            >
              <span className="material-symbols-outlined text-sm">
                {copiedLink ? 'check' : 'share'}
              </span>
            </button>
          </div>
        </div>

        {/* Backdrop Floating Badges */}
        <div className="absolute bottom-10 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-[#4edea3]/20 text-[#4edea3] text-xs font-bold border border-[#4edea3]/30 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
              {movie.matchScore}% de Compatibilidade IA
            </span>
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
              IMDb {movie.metrics.imdb} • Rotten Tomatoes {movie.metrics.rottenTomatoes}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Official Poster & Action Bar */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
            <div className="w-64 sm:w-80 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-[#a078ff]/40 relative bg-black/40 group">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>

              {/* Play Trailer Overlay Button */}
              <button
                onClick={() => onOpenTrailer(movie)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-[#a078ff] text-white flex items-center justify-center shadow-[0_0_24px_rgba(160,120,255,0.7)] transform scale-90 group-hover:scale-100 transition-transform">
                  <span className="material-symbols-outlined text-3xl">play_arrow</span>
                </div>
              </button>

              <div className="absolute bottom-3 left-3 right-3 text-center">
                <span className="text-[11px] font-semibold text-white/90 drop-shadow">
                  {movie.qualityBadge}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons Under Poster */}
            <div className="w-full max-w-sm mt-5 space-y-2.5">
              <button
                onClick={() => onOpenTrailer(movie)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(160,120,255,0.4)] hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">play_circle</span>
                <span>Trailer Oficial (2m 14s)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onToggleWatchlist(movie.id)}
                  className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    saved
                      ? 'bg-[#a078ff]/20 text-primary border-primary'
                      : 'bg-[#1e1f29] text-[#cbc3d7] hover:text-white border-white/10'
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm ${saved ? 'fill-1' : ''}`}>
                    {saved ? 'bookmark' : 'bookmark_border'}
                  </span>
                  <span>{saved ? 'Na Minha Lista' : 'Salvar na Lista'}</span>
                </button>

                <button
                  onClick={() => onToggleWatched(movie.id)}
                  className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    watched
                      ? 'bg-[#4edea3]/20 text-[#4edea3] border-[#4edea3]/40'
                      : 'bg-[#1e1f29] text-[#cbc3d7] hover:text-white border-white/10'
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm ${watched ? 'fill-1' : ''}`}>
                    {watched ? 'check_circle' : 'visibility'}
                  </span>
                  <span>{watched ? 'Já Assistido' : 'Marcar como Visto'}</span>
                </button>
              </div>

              <button
                onClick={onOpenCoupleMatch}
                className="w-full py-2.5 rounded-xl bg-[#282934] hover:bg-[#33343f] text-[#5de6ff] text-xs font-semibold border border-[#5de6ff]/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">group</span>
                <span>Calcular Match de Casal / Amigos</span>
              </button>
            </div>
          </div>

          {/* Right Column: Title, Metadata, AI Analysis, Cast */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              {/* Genre Pills */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {movie.genres.map((g, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-[#1e1f29] border border-white/5 text-xs font-semibold text-primary"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Title & Tagline */}
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-2">
                {movie.title}
              </h1>
              <p className="text-base sm:text-lg text-[#5de6ff] italic font-medium mb-4">
                "{movie.tagline}"
              </p>

              {/* Meta bar */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#958ea0] pb-4 border-b border-white/5">
                <span>Direção: <strong className="text-white">{movie.director}</strong></span>
                <span>•</span>
                <span>Ano: <strong className="text-white">{movie.releaseYear}</strong></span>
                <span>•</span>
                <span>Duração: <strong className="text-white">{movie.durationMinutes} minutos</strong></span>
                <span>•</span>
                <span>Classificação: <strong className="text-white">{movie.ageRating}</strong></span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              {[
                { id: 'analise' as const, label: 'Análise do Algoritmo IA', icon: 'psychology' },
                { id: 'sinopse' as const, label: 'Sinopse Sem Spoilers', icon: 'menu_book' },
                { id: 'streamings' as const, label: 'Onde Assistir', icon: 'tv' },
                { id: 'elenco' as const, label: 'Elenco & Direção', icon: 'group' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#a078ff] text-white shadow-md'
                        : 'text-[#cbc3d7] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: AI Match Analysis */}
            {activeTab === 'analise' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="p-6 rounded-2xl bg-[#1e1f29] border border-[#a078ff]/30 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                      Por que este título é a sua melhor escolha hoje:
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-[#4edea3]/20 text-[#4edea3] text-xs font-bold font-mono">
                      {movie.matchScore}% Match
                    </span>
                  </div>

                  <p className="text-sm text-[#e2e1f0] leading-relaxed">
                    {movie.aiMatchReason}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5">
                    {movie.matchHighlights.map((hl, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#cbc3d7]">
                        <span className="text-[#4edea3] font-bold mt-0.5">✓</span>
                        <span className="leading-relaxed">{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emotional & Tension Arc Timeline */}
                <div className="p-6 rounded-2xl bg-[#1e1f29] border border-white/10 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#5de6ff] text-xl">show_chart</span>
                    Curva de Intensidade Dramática (Sem Spoilers)
                  </h3>
                  <p className="text-xs text-[#958ea0]">
                    Evolução do ritmo e tensão psicológica ao longo da narrativa:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                    {movie.emotionalArc.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#12131d] border border-white/5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-primary font-bold uppercase mb-1">
                            <span>{item.act}</span>
                            <span className="font-mono text-[#5de6ff]">{item.intensity}%</span>
                          </div>
                          <h4 className="text-xs font-bold text-white mb-1.5">{item.title}</h4>
                          <p className="text-[11px] text-[#958ea0] leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <div className="w-full bg-[#282934] h-1.5 rounded-full mt-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                            style={{ width: `${item.intensity}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radar Breakdown */}
                <div className="p-6 rounded-2xl bg-[#1e1f29] border border-white/10">
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#4edea3] text-xl">equalizer</span>
                    Espectro de Atributos Cinematográficos
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-[#cbc3d7] mb-1">
                        <span>Tensão & Suspense</span>
                        <strong className="text-white font-mono">{movie.radarScores.tension}%</strong>
                      </div>
                      <div className="w-full bg-[#282934] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#ffb4ab] h-full" style={{ width: `${movie.radarScores.tension}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-[#cbc3d7] mb-1">
                        <span>Complexidade Narrativa</span>
                        <strong className="text-white font-mono">{movie.radarScores.complexity}%</strong>
                      </div>
                      <div className="w-full bg-[#282934] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#5de6ff] h-full" style={{ width: `${movie.radarScores.complexity}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-[#cbc3d7] mb-1">
                        <span>Estética Visual & Neon</span>
                        <strong className="text-white font-mono">{movie.radarScores.visualAesthetic}%</strong>
                      </div>
                      <div className="w-full bg-[#282934] h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${movie.radarScores.visualAesthetic}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-[#cbc3d7] mb-1">
                        <span>Ritmo & Agilidade</span>
                        <strong className="text-white font-mono">{movie.radarScores.pacing}%</strong>
                      </div>
                      <div className="w-full bg-[#282934] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#4edea3] h-full" style={{ width: `${movie.radarScores.pacing}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Synopsis */}
            {activeTab === 'sinopse' && (
              <div className="p-6 rounded-2xl bg-[#1e1f29] border border-white/10 space-y-4 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-white">Sinopse Curada</h3>
                <p className="text-sm text-[#cbc3d7] leading-relaxed whitespace-pre-line">
                  {movie.synopsis}
                </p>
                <div className="pt-4 border-t border-white/5 text-xs text-[#958ea0]">
                  Garantia CineMatch: Este texto foi auditado para remover qualquer detalhe ou reviravolta sobre o segundo e terceiro atos.
                </div>
              </div>
            )}

            {/* Tab 3: Streamings Availability */}
            {activeTab === 'streamings' && (
              <div className="p-6 rounded-2xl bg-[#1e1f29] border border-white/10 space-y-4 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-white">Opções de Transmissão & Qualidade</h3>
                <div className="space-y-3">
                  {movie.streamings.map((st, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#12131d] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{st.provider}</span>
                          <span className="px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] text-[10px] font-bold">
                            {st.type === 'included' ? 'No seu plano' : `Aluguel ${st.price}`}
                          </span>
                        </div>
                        <p className="text-xs text-[#958ea0] mt-1">{st.audioInfo}</p>
                      </div>

                      <button
                        onClick={() => alert(`Iniciando reprodução de "${movie.title}" no aplicativo ${st.provider}...`)}
                        className="px-5 py-2.5 rounded-xl bg-[#a078ff] hover:bg-[#6d3bd7] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                        <span>Dar o Play ({st.quality})</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Cast & Crew */}
            {activeTab === 'elenco' && (
              <div className="p-6 rounded-2xl bg-[#1e1f29] border border-white/10 space-y-4 animate-in fade-in duration-300">
                <h3 className="text-lg font-bold text-white">Elenco & Equipe Criativa</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {movie.cast.map((c, i) => (
                    <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl bg-[#12131d] border border-white/5">
                      <img
                        src={c.avatarUrl}
                        alt={c.name}
                        className="w-20 h-20 rounded-full object-cover mb-2.5 border-2 border-[#a078ff]/30 shadow"
                      />
                      <h4 className="text-xs font-bold text-white">{c.name}</h4>
                      <p className="text-[11px] text-[#958ea0] mt-0.5">{c.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Recommendations Section */}
        {similarMovies.length > 0 && (
          <div className="mt-16 pt-10 border-t border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Quem amou este título também assistiu</h3>
                <p className="text-xs text-[#958ea0]">Recomendações com perfil de ressonância equivalente</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {similarMovies.map((similar) => (
                <div
                  key={similar.id}
                  onClick={() => onSelectMovie(similar)}
                  className="bg-[#1e1f29] rounded-2xl border border-white/5 hover:border-white/20 transition-all p-4 flex gap-3.5 items-center cursor-pointer group shadow-md"
                >
                  <img
                    src={similar.posterUrl}
                    alt={similar.title}
                    className="w-16 h-24 object-cover rounded-xl shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-primary uppercase">
                      {similar.genres[0]}
                    </span>
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                      {similar.title}
                    </h4>
                    <p className="text-xs text-[#958ea0] line-clamp-2 mt-1">
                      {similar.synopsis}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-[#4edea3] font-bold font-mono">
                        {similar.matchScore}% Match
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
