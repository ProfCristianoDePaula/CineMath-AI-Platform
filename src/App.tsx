import React, { useState, useEffect } from 'react';
import { Movie } from './types';
import { MOVIES } from './data/movies';
import { ASSETS } from './data/assets';
import { Navbar, ScreenType } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { NeuralScreen } from './components/NeuralScreen';
import { MatchesScreen } from './components/MatchesScreen';
import { DetailScreen } from './components/DetailScreen';
import { WatchlistScreen } from './components/WatchlistScreen';
import { CoupleMatchModal } from './components/CoupleMatchModal';
import { TrailerModal } from './components/TrailerModal';
import { StreamingsModal } from './components/StreamingsModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie>(MOVIES[0]);
  const [watchlistIds, setWatchlistIds] = useState<string[]>(['sussurros-no-labirinto', 'o-horizonte-oculto']);
  const [watchedIds, setWatchedIds] = useState<string[]>(['o-limiar-do-silencio']);
  const [connectedStreamings, setConnectedStreamings] = useState<string[]>([
    'Netflix',
    'Max',
    'Prime Video',
    'Apple TV',
  ]);

  const [isStreamingsModalOpen, setIsStreamingsModalOpen] = useState(false);
  const [isCoupleMatchModalOpen, setIsCoupleMatchModalOpen] = useState(false);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<Movie | null>(null);

  // Scroll to top on screen navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen, selectedMovie]);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setCurrentScreen('detail');
  };

  const handleToggleWatchlist = (movieId: string) => {
    setWatchlistIds((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
  };

  const handleToggleWatched = (movieId: string) => {
    setWatchedIds((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
  };

  const handleToggleStreaming = (name: string) => {
    setConnectedStreamings((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleSurpriseMe = () => {
    const random = MOVIES[Math.floor(Math.random() * MOVIES.length)];
    handleSelectMovie(random);
  };

  return (
    <div className="min-h-screen bg-[#12131d] text-[#e2e1f0] flex flex-col font-sans selection:bg-[#a078ff] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        connectedStreamingsCount={connectedStreamings.length}
        onOpenStreamings={() => setIsStreamingsModalOpen(true)}
        watchlistCount={watchlistIds.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 pt-20">
        {currentScreen === 'home' && (
          <HomeScreen
            movies={MOVIES}
            onSelectMovie={handleSelectMovie}
            onStartAiChat={() => setCurrentScreen('chat')}
            onSurpriseMe={handleSurpriseMe}
            onOpenNeural={() => setCurrentScreen('neural')}
            onToggleWatchlist={handleToggleWatchlist}
            isWatchlisted={(id) => watchlistIds.includes(id)}
          />
        )}

        {currentScreen === 'chat' && (
          <ChatScreen
            movies={MOVIES}
            onSelectMovie={handleSelectMovie}
            onGoToNeural={() => setCurrentScreen('neural')}
            onGoToMatches={() => setCurrentScreen('matches')}
          />
        )}

        {currentScreen === 'neural' && (
          <NeuralScreen
            movies={MOVIES}
            onSelectMovie={handleSelectMovie}
            onGoToMatches={() => setCurrentScreen('matches')}
          />
        )}

        {currentScreen === 'matches' && (
          <MatchesScreen
            movies={MOVIES}
            onSelectMovie={handleSelectMovie}
            onGoToChat={() => setCurrentScreen('chat')}
            onOpenCoupleMatch={() => setIsCoupleMatchModalOpen(true)}
            onToggleWatchlist={handleToggleWatchlist}
            isWatchlisted={(id) => watchlistIds.includes(id)}
          />
        )}

        {currentScreen === 'detail' && (
          <DetailScreen
            movie={selectedMovie}
            allMovies={MOVIES}
            onBack={() => setCurrentScreen('matches')}
            onSelectMovie={handleSelectMovie}
            onOpenTrailer={setActiveTrailerMovie}
            onOpenCoupleMatch={() => setIsCoupleMatchModalOpen(true)}
            onToggleWatchlist={handleToggleWatchlist}
            isWatchlisted={(id) => watchlistIds.includes(id)}
            onToggleWatched={handleToggleWatched}
            isWatched={(id) => watchedIds.includes(id)}
          />
        )}

        {currentScreen === 'watchlist' && (
          <WatchlistScreen
            movies={MOVIES}
            watchlistIds={watchlistIds}
            watchedIds={watchedIds}
            onSelectMovie={handleSelectMovie}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleToggleWatched}
            onGoToHome={() => setCurrentScreen('home')}
          />
        )}
      </main>

      {/* Modals */}
      <CoupleMatchModal
        isOpen={isCoupleMatchModalOpen}
        onClose={() => setIsCoupleMatchModalOpen(false)}
        movies={MOVIES}
        onSelectMovie={handleSelectMovie}
      />

      <TrailerModal
        movie={activeTrailerMovie}
        onClose={() => setActiveTrailerMovie(null)}
      />

      <StreamingsModal
        isOpen={isStreamingsModalOpen}
        onClose={() => setIsStreamingsModalOpen(false)}
        connectedStreamings={connectedStreamings}
        onToggleStreaming={handleToggleStreaming}
      />

      {/* Global Footer */}
      <footer className="w-full bg-[#0c0d17] border-t border-white/5 py-10 px-4 sm:px-6 lg:px-8 text-xs text-[#958ea0]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src={ASSETS.logo}
              alt="CineMatch AI"
              className="h-7 w-auto object-contain opacity-80"
            />
            <div>
              <span className="font-bold text-white text-sm">CineMatch AI Platform</span>
              <p className="text-[11px] text-[#958ea0]">
                Curadoria personalizada em tempo real por processamento neural de linguagem natural.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button onClick={() => setCurrentScreen('home')} className="hover:text-white transition-colors cursor-pointer">
              Início
            </button>
            <button onClick={() => setCurrentScreen('chat')} className="hover:text-white transition-colors cursor-pointer">
              Descoberta IA
            </button>
            <button onClick={() => setCurrentScreen('neural')} className="hover:text-white transition-colors cursor-pointer">
              Motor Neural
            </button>
            <button onClick={() => setCurrentScreen('matches')} className="hover:text-white transition-colors cursor-pointer">
              Recomendações
            </button>
            <button onClick={() => setIsStreamingsModalOpen(true)} className="hover:text-white transition-colors cursor-pointer">
              Catálogos Ativos
            </button>
          </div>

          <div className="text-[11px] text-right">
            <span>© 2026 CineMatch AI • Design & Imagens sincronizados via Google Stitch</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
