import React, { useState, useEffect } from 'react';
import { Movie } from '../types';
import { ASSETS } from '../data/assets';
import { api } from '../services/api';

interface HomeScreenProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onStartAiChat: (initialPrompt?: string) => void;
  onSurpriseMe: () => void;
  onOpenNeural: () => void;
  onToggleWatchlist: (movieId: string) => void;
  isWatchlisted: (movieId: string) => boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  movies,
  onSelectMovie,
  onStartAiChat,
  onSurpriseMe,
  onOpenNeural,
  onToggleWatchlist,
  isWatchlisted,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchMovies(searchQuery.trim());
        setSearchResults(res);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  const quickMoods = [
    { label: 'Suspense que prende do início ao fim', icon: 'psychology', prompt: 'Quero um suspense psicológico bem tenso, estilo Garota Exemplar ou Ilha do Medo, com fotografia impecável e disponível na Netflix ou Max.' },
    { label: 'Ficção científica reflexiva e futurista', icon: 'rocket_launch', prompt: 'Busco uma ficção científica cerebral e visualmente deslumbrante, como Blade Runner 2049 ou Interestelar.' },
    { label: 'Duração curta: menos de 90 min', icon: 'timer', prompt: 'Procuro um filme dinâmico com menos de 90 minutos de duração para assistir agora sem cansar.' },
    { label: 'Sessão a dois sem brigas', icon: 'favorite', prompt: 'Preciso de um filme para assistir a dois que agrade tanto quem gosta de mistério quanto quem prefere drama envolvente.' },
    { label: 'Neo-noir chuvoso com neon', icon: 'rainy', prompt: 'Quero um filme policial neo-noir com clima de noite chuvosa, luzes neon e trilha sonora hipnótica.' },
  ];

  const featuredMovies = movies.slice(0, 3);

  return (
    <div className="w-full relative z-10 overflow-hidden pb-20">
      {/* Background Ambient Glow Accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[72rem] h-[36rem] bg-gradient-to-b from-[#a078ff]/20 via-[#5de6ff]/10 to-transparent blur-[120px] -z-10"></div>
      <div className="pointer-events-none absolute top-96 left-12 w-80 h-80 bg-[#a078ff]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="pointer-events-none absolute top-80 right-8 w-96 h-96 bg-[#00cbe6]/15 rounded-full blur-[120px] -z-10"></div>

      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 flex flex-col items-center text-center relative z-10">
        {/* Status Punchline Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#282934]/80 backdrop-blur-md border border-white/10 shadow-lg mb-6">
          <span className="material-symbols-outlined text-primary text-base">auto_awesome</span>
          <span className="text-xs font-semibold text-primary tracking-wider uppercase">
            Stop searching. Start watching.
          </span>
          <span className="w-2 h-2 rounded-full bg-[#4edea3] ml-1 animate-ping"></span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#e2e1f0] tracking-tight leading-[1.08] mb-5 max-w-4xl">
          O que vamos assistir{' '}
          <span className="bg-gradient-to-r from-[#d0bcff] via-[#a078ff] to-[#5de6ff] bg-clip-text text-transparent drop-shadow-sm">
            hoje?
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-[#cbc3d7] max-w-2xl mb-8 leading-relaxed font-normal">
          Deixe a inteligência artificial encontrar seu próximo filme ou série em menos de 2 minutos. Chega de rolar o catálogo sem decidir.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-6">
          <button
            onClick={() => onStartAiChat()}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_28px_rgba(160,120,255,0.45)] hover:shadow-[0_0_36px_rgba(160,120,255,0.7)] hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">movie_filter</span>
            <span>Encontrar meu próximo filme</span>
          </button>

          <button
            onClick={onSurpriseMe}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#282934]/70 hover:bg-[#383844] backdrop-blur-lg text-[#e2e1f0] hover:text-white border border-white/10 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(93,230,255,0.25)] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[#5de6ff] text-xl">casino</span>
            <span>Me surpreenda</span>
          </button>
        </div>

        {/* Instant TMDB Catalog Search Bar */}
        <div className="w-full max-w-xl relative mb-6">
          <div className="relative flex items-center bg-[#1e1f29]/90 border border-white/10 focus-within:border-[#a078ff] rounded-2xl px-4 py-2.5 shadow-lg transition-all">
            <span className="material-symbols-outlined text-[#958ea0] text-lg mr-2.5">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar filmes no catálogo TMDB (ex: Interestelar, Garota Exemplar...)"
              className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-[#958ea0] outline-none"
            />
            {isSearching && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin ml-2"></span>
            )}
            {searchQuery && !isSearching && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-[#958ea0] hover:text-white transition-colors cursor-pointer ml-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Search Results Dropdown Overlay */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e1f29] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto text-left">
              <div className="text-[10px] uppercase font-bold text-[#958ea0] px-3 py-1.5 flex justify-between">
                <span>Resultados TMDB ({searchResults.length})</span>
                <span className="text-[#4edea3]">Catálogo Real</span>
              </div>
              <div className="space-y-1">
                {searchResults.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectMovie(m);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="p-2.5 rounded-xl hover:bg-[#282934] transition-colors cursor-pointer flex items-center gap-3 group"
                  >
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="w-10 h-14 object-cover rounded-lg shrink-0 shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                          {m.title}
                        </h4>
                        <span className="text-[10px] text-[#958ea0] shrink-0">{m.releaseYear}</span>
                      </div>
                      <p className="text-[11px] text-[#958ea0] truncate">
                        {m.genres.join(' • ')} • {m.durationMinutes} min
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#4edea3] font-bold">
                          ★ {m.metrics.imdb || '8.0'}
                        </span>
                        <span className="text-[10px] text-[#cbc3d7]">
                          {m.streamings[0]?.provider || 'Streaming BR'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trust Indicator */}
        <div className="flex items-center gap-2 text-xs text-[#958ea0]">
          <span className="material-symbols-outlined text-[#4edea3] text-sm">verified</span>
          <span>Conectado a mais de 8 plataformas de streaming • Recomendações 100% personalizadas</span>
        </div>
      </section>

      {/* Quick Mood Shortcuts */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#958ea0] uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm text-primary">bolt</span>
          <span>Atalhos de Humor & Contexto</span>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {quickMoods.map((mood, idx) => (
            <button
              key={idx}
              onClick={() => onStartAiChat(mood.prompt)}
              className="shrink-0 px-4 py-2 rounded-full bg-[#1e1f29]/80 hover:bg-[#282934] border border-white/5 hover:border-primary/40 text-xs font-medium text-[#cbc3d7] hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm group"
            >
              <span className="material-symbols-outlined text-primary text-sm group-hover:scale-110 transition-transform">
                {mood.icon}
              </span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Interactive AI Recommendation Showcase (3 Featured Posters) */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-sm">psychology</span>
                Algoritmo de Compatibilidade
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#e2e1f0] tracking-tight">
                Curadoria personalizada em tempo real
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-[#cbc3d7] bg-[#1e1f29] px-3 py-1.5 rounded-full border border-white/5">
                <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
                Taxa de acerto média: <strong>94.6%</strong>
              </div>
              <button
                onClick={onOpenNeural}
                className="hidden sm:flex items-center gap-1.5 text-xs text-primary hover:text-white transition-colors"
              >
                <span>Ver motor neural</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* 3 Posters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {featuredMovies.map((movie, idx) => {
              const isCenter = idx === 1; // "Sussurros no Labirinto" in center
              const saved = isWatchlisted(movie.id);

              return (
                <div
                  key={movie.id}
                  className={`group relative rounded-2xl overflow-hidden bg-[#1e1f29] border transition-all duration-300 flex flex-col justify-between ${
                    isCenter
                      ? 'border-[#a078ff]/50 shadow-[0_0_32px_rgba(160,120,255,0.2)] md:-translate-y-2'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Poster Image Container */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/40">
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f29] via-transparent to-black/30 pointer-events-none"></div>

                    {/* Compatibility Badge Top-Right */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
                      <span className="text-xs font-bold text-white tracking-wide">
                        {movie.matchScore}% Match
                      </span>
                    </div>

                    {/* Highlight Badge Top-Left if top choice */}
                    {isCenter && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#a078ff] text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                        <span className="material-symbols-outlined text-xs">auto_awesome</span>
                        Top Recomendação
                      </div>
                    )}

                    {/* Quick Bookmark Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(movie.id);
                      }}
                      className={`absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                        saved
                          ? 'bg-[#a078ff] text-white border-[#a078ff]'
                          : 'bg-black/60 text-white/80 hover:text-white border-white/10 hover:bg-black/80'
                      }`}
                      title={saved ? 'Remover da Lista' : 'Salvar na Minha Lista'}
                    >
                      <span className={`material-symbols-outlined text-lg ${saved ? 'fill-1' : ''}`}>
                        {saved ? 'bookmark' : 'bookmark_border'}
                      </span>
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      {/* Genres and Year */}
                      <div className="flex items-center gap-2 text-xs text-[#958ea0] mb-1.5">
                        <span>{movie.releaseYear}</span>
                        <span>•</span>
                        <span>{movie.durationMinutes} min</span>
                        <span>•</span>
                        <span className="text-primary font-medium">{movie.genres[0]}</span>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => onSelectMovie(movie)}
                        className="text-xl font-bold text-white group-hover:text-primary transition-colors cursor-pointer mb-2"
                      >
                        {movie.title}
                      </h3>

                      {/* AI Snippet */}
                      <p className="text-xs text-[#cbc3d7] line-clamp-2 mb-4 leading-relaxed">
                        {movie.synopsis}
                      </p>

                      {/* Available Streamings */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[11px] text-[#958ea0]">Onde ver:</span>
                        <div className="flex items-center gap-1.5">
                          {movie.streamings.map((st, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#282934] text-[#e2e1f0] border border-white/5"
                            >
                              {st.provider}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => onSelectMovie(movie)}
                        className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#e2e1f0] hover:text-white border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">info</span>
                        Detalhes
                      </button>
                      <button
                        onClick={() => onSelectMovie(movie)}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#a078ff] hover:bg-[#6d3bd7] text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                        Onde Assistir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* "A Mágica em Três Passos Simples" Feature Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="bg-[#1e1f29]/60 rounded-3xl p-8 sm:p-12 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#a078ff]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Como Funciona</span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#e2e1f0] tracking-tight mt-1 mb-3">
              A mágica em três passos simples
            </h2>
            <p className="text-sm text-[#cbc3d7]">
              Descubra filmes sem perder tempo rolando menus infinitos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-start p-6 rounded-2xl bg-[#12131d]/60 border border-white/5 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#a078ff]/20 text-[#d0bcff] flex items-center justify-center font-bold text-lg mb-5 border border-[#a078ff]/30">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Você conversa naturalmente</h3>
              <p className="text-xs text-[#cbc3d7] leading-relaxed">
                Conte o que você quer sentir hoje, o tempo livre que tem ou filmes que já amou. Nossa IA compreende contexto emocional e nuances.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-start p-6 rounded-2xl bg-[#12131d]/60 border border-white/5 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#5de6ff]/20 text-[#5de6ff] flex items-center justify-center font-bold text-lg mb-5 border border-[#5de6ff]/30">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">A IA cruza seus streamings</h3>
              <p className="text-xs text-[#cbc3d7] leading-relaxed">
                O motor neural analisa milhares de títulos disponíveis exatamente nas suas assinaturas ativas, filtrando por notas e afinidade semântica.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-start p-6 rounded-2xl bg-[#12131d]/60 border border-white/5 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#4edea3]/20 text-[#4edea3] flex items-center justify-center font-bold text-lg mb-5 border border-[#4edea3]/30">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Você dá o play sem perder tempo</h3>
              <p className="text-xs text-[#cbc3d7] leading-relaxed">
                Receba a recomendação exata com link direto, nota de compatibilidade, justificativa sem spoilers e detalhes completos da produção.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Streaming Partners Logos */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center">
        <span className="text-xs font-semibold text-[#958ea0] uppercase tracking-wider block mb-6">
          Compatível com seus catálogos de streaming favoritos
        </span>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-75">
          {['Netflix', 'Prime Video', 'Max', 'Apple TV', 'Disney+', 'Paramount+'].map((service, i) => (
            <div
              key={i}
              className="px-5 py-2.5 rounded-xl bg-[#1e1f29] border border-white/5 text-xs font-bold text-[#cbc3d7] flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm text-primary">play_circle</span>
              {service}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-r from-[#1e1f29] via-[#282934] to-[#1e1f29] border border-[#a078ff]/30 text-center shadow-xl">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#a078ff]/15 rounded-full blur-3xl pointer-events-none"></div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Pronto para a sessão de hoje?
          </h2>
          <p className="text-sm text-[#cbc3d7] max-w-xl mx-auto mb-8 leading-relaxed">
            Junte-se a mais de 120.000 cinéfilos que nunca mais perderam 40 minutos escolhendo o que ver no catálogo.
          </p>

          <button
            onClick={() => onStartAiChat()}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] text-white font-semibold text-sm sm:text-base inline-flex items-center gap-2.5 shadow-[0_0_28px_rgba(160,120,255,0.45)] hover:shadow-[0_0_36px_rgba(160,120,255,0.7)] hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">auto_awesome</span>
            <span>Iniciar Conversa com a IA</span>
          </button>
        </div>
      </section>
    </div>
  );
};
