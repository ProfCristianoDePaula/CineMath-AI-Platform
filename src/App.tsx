import React, { useState, useEffect } from 'react';
import { Movie } from './types';
import { MOVIES } from './data/movies';
import { ASSETS } from './data/assets';
import { api } from './services/api';
import { Navbar, ScreenType } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { NeuralScreen } from './components/NeuralScreen';
import { MatchesScreen } from './components/MatchesScreen';
import { DetailScreen } from './components/DetailScreen';
import { WatchlistScreen } from './components/WatchlistScreen';
import { GoogleDriveScreen } from './components/GoogleDriveScreen';
import { CoupleMatchModal } from './components/CoupleMatchModal';
import { TrailerModal } from './components/TrailerModal';
import { StreamingsModal } from './components/StreamingsModal';
import { User } from 'firebase/auth';
import { initAuth } from './services/auth';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [movies, setMovies] = useState<Movie[]>(MOVIES);
  const [selectedMovie, setSelectedMovie] = useState<Movie>(MOVIES[0]);
  const [watchlistIds, setWatchlistIds] = useState<string[]>(['sussurros-no-labirinto', 'o-horizonte-oculto']);
  const [watchedIds, setWatchedIds] = useState<string[]>(['o-limiar-do-silencio']);
  const [connectedStreamings, setConnectedStreamings] = useState<string[]>([
    'Netflix',
    'Max',
    'Prime Video',
    'Apple TV',
  ]);

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [isStreamingsModalOpen, setIsStreamingsModalOpen] = useState(false);
  const [isCoupleMatchModalOpen, setIsCoupleMatchModalOpen] = useState(false);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<Movie | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setAuthUser(user);
        setAccessToken(token);
      },
      () => {
        setAuthUser(null);
        setAccessToken(null);
      }
    );
    return () => unsub();
  }, []);

  // Initialize catalog, watchlist, and preferences from real backend services
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        // 1. Load preferences
        const prefs = await api.getPreferences();
        if (isMounted && prefs?.streamingProviders && prefs.streamingProviders.length > 0) {
          setConnectedStreamings(prefs.streamingProviders);
        }

        // 2. Load watchlist from persistent database
        const savedWatchlist = await api.getWatchlist();
        if (isMounted && savedWatchlist && savedWatchlist.length > 0) {
          const wIds: string[] = [];
          const watched: string[] = [];
          for (const item of savedWatchlist) {
            const id = item.movieId || (item.tmdbId ? `tmdb-${item.tmdbId}` : item.id);
            if (id) {
              wIds.push(id);
              if (item.watched) watched.push(id);
            }
          }
          if (wIds.length > 0) setWatchlistIds(wIds);
          if (watched.length > 0) setWatchedIds(watched);
        }

        // 3. Load live/cached TMDB catalog
        const catalog = await api.getFeaturedCatalog();
        if (isMounted && catalog && catalog.length > 0) {
          // Merge stitch movies with real TMDB catalog so stitch screens remain pixel-perfect
          const existingIds = new Set(MOVIES.map((m) => m.id));
          const newTmdbMovies = catalog.filter((m) => !existingIds.has(m.id));
          const merged = [...MOVIES, ...newTmdbMovies];
          setMovies(merged);
        }
      } catch (err) {
        console.error('Initial load failed:', err);
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll to top on screen navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen, selectedMovie]);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setCurrentScreen('detail');
  };

  const handleToggleWatchlist = async (movieId: string) => {
    const isSaved = watchlistIds.includes(movieId);
    // Optimistic UI update
    setWatchlistIds((prev) =>
      isSaved ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );

    try {
      if (isSaved) {
        await api.removeFromWatchlist(movieId);
      } else {
        const movieToSave = movies.find((m) => m.id === movieId);
        if (movieToSave) {
          await api.addToWatchlist(movieToSave);
        }
      }
    } catch (err) {
      console.error('Watchlist sync error:', err);
    }
  };

  const handleToggleWatched = async (movieId: string) => {
    // Optimistic UI update
    setWatchedIds((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );

    try {
      await api.toggleWatched(movieId);
    } catch (err) {
      console.error('Watched toggle error:', err);
    }
  };

  const handleToggleStreaming = async (name: string) => {
    const updated = connectedStreamings.includes(name)
      ? connectedStreamings.filter((s) => s !== name)
      : [...connectedStreamings, name];

    setConnectedStreamings(updated);

    try {
      await api.updatePreferences({ streamingProviders: updated });
    } catch (err) {
      console.error('Failed to sync streaming preferences:', err);
    }
  };

  const handleSurpriseMe = () => {
    const random = movies[Math.floor(Math.random() * movies.length)];
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
        isDriveConnected={!!authUser && !!accessToken}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 pt-20">
        {currentScreen === 'home' && (
          <HomeScreen
            movies={movies}
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
            movies={movies}
            onSelectMovie={handleSelectMovie}
            onGoToNeural={() => setCurrentScreen('neural')}
            onGoToMatches={() => setCurrentScreen('matches')}
          />
        )}

        {currentScreen === 'neural' && (
          <NeuralScreen
            movies={movies}
            onSelectMovie={handleSelectMovie}
            onGoToMatches={() => setCurrentScreen('matches')}
          />
        )}

        {currentScreen === 'matches' && (
          <MatchesScreen
            movies={movies}
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
            allMovies={movies}
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
            movies={movies}
            watchlistIds={watchlistIds}
            watchedIds={watchedIds}
            onSelectMovie={handleSelectMovie}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleWatched={handleToggleWatched}
            onGoToHome={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'drive' && (
          <GoogleDriveScreen
            user={authUser}
            accessToken={accessToken}
            onAuthSuccess={(u, token) => {
              setAuthUser(u);
              setAccessToken(token);
            }}
            onLogout={() => {
              setAuthUser(null);
              setAccessToken(null);
            }}
            movies={movies}
            watchlistIds={watchlistIds}
            watchedIds={watchedIds}
            onSelectMovie={handleSelectMovie}
          />
        )}
      </main>

      {/* Modals */}
      <CoupleMatchModal
        isOpen={isCoupleMatchModalOpen}
        onClose={() => setIsCoupleMatchModalOpen(false)}
        movies={movies}
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

          <div className="text-[11px] text-right space-y-1">
            <div>© 2026 CineMatch AI • Design sincronizado com Google Stitch</div>
            <div className="text-[10px] text-[#716b7e]">
              Este produto utiliza a API do TMDB, mas não é endossado ou certificado pelo TMDB.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
