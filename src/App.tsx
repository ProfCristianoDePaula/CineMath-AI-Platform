import React, { useState, useEffect } from 'react';
import { Movie, UserPreferences } from './types';
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
import { PreferencesScreen } from './components/PreferencesScreen';
import { User } from 'firebase/auth';
import { initAuth } from './services/auth';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [recommendationNotice, setRecommendationNotice] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [watchedIds, setWatchedIds] = useState<string[]>([]);
  const [connectedStreamings, setConnectedStreamings] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [appError, setAppError] = useState('');
  const [chatInitialPrompt, setChatInitialPrompt] = useState('');

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
      const [catalogResult, preferencesResult, watchlistResult] = await Promise.allSettled([
        api.getFeaturedCatalog(),
        api.getPreferences(),
        api.getWatchlist(),
      ]);
      if (!isMounted) return;
      if (catalogResult.status === 'fulfilled') {
        setMovies(catalogResult.value);
        setCatalogError('');
      } else {
        setCatalogError(catalogResult.reason instanceof Error
          ? catalogResult.reason.message
          : 'Não foi possível carregar o catálogo TMDB.');
      }
      if (preferencesResult.status === 'fulfilled') {
        setPreferences(preferencesResult.value);
        setConnectedStreamings(preferencesResult.value.streamingProviders);
      } else {
        setAppError('Não foi possível carregar suas preferências.');
      }
      if (watchlistResult.status === 'fulfilled') {
        const savedWatchlist = watchlistResult.value;
        const savedIds = savedWatchlist.map((item) => `tmdb-${item.tmdbId}`);
        const watched = savedWatchlist.filter((item) => item.watched).map((item) => `tmdb-${item.tmdbId}`);
        setWatchlistIds(savedIds);
        setWatchedIds(watched);
        const savedMovies = await Promise.allSettled(savedWatchlist.map((item) =>
          api.getMovieDetails(`tmdb-${item.tmdbId}`, item.mediaType, false),
        ));
        if (isMounted) {
          setMovies((current) => {
            const byId = new Map(current.map((movie) => [movie.id, movie]));
            for (const result of savedMovies) {
              if (result.status === 'fulfilled') byId.set(result.value.id, result.value);
            }
            return Array.from(byId.values());
          });
        }
      } else {
        setAppError('Não foi possível carregar sua lista salva.');
      }
      if (isMounted) setIsCatalogLoading(false);
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

  const handleRecommendations = (items: Movie[], notice = '') => {
    setRecommendations(items);
    setRecommendationNotice(notice);
    setMovies((current) => {
      const byId = new Map(current.map((movie) => [movie.id, movie]));
      for (const movie of items) byId.set(movie.id, movie);
      return Array.from(byId.values());
    });
  };

  const handleStartAiChat = (initialPrompt = '') => {
    setChatInitialPrompt(initialPrompt);
    setCurrentScreen('chat');
  };

  const handleToggleWatchlist = async (movieId: string) => {
    const isSaved = watchlistIds.includes(movieId);
    try {
      if (isSaved) {
        const removed = await api.removeFromWatchlist(movieId);
        if (!removed) throw new Error('O título não foi encontrado na sua lista.');
        setWatchlistIds((prev) => prev.filter((id) => id !== movieId));
      } else {
        const movieToSave = movies.find((m) => m.id === movieId);
        if (!movieToSave) throw new Error('Não foi possível localizar este título no catálogo.');
        await api.addToWatchlist(movieToSave);
        setWatchlistIds((prev) => [...prev, movieId]);
      }
    } catch (err) {
      setAppError(err instanceof Error ? err.message : 'Falha ao atualizar sua lista.');
    }
  };

  const handleToggleWatched = async (movieId: string) => {
    try {
      await api.toggleWatched(movieId);
      setWatchedIds((prev) => prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]);
    } catch (err) {
      setAppError(err instanceof Error ? err.message : 'Falha ao atualizar o status assistido.');
    }
  };

  const handleToggleStreaming = async (name: string) => {
    const updated = connectedStreamings.includes(name)
      ? connectedStreamings.filter((s) => s !== name)
      : [...connectedStreamings, name];

    try {
      const saved = await api.updatePreferences({ streamingProviders: updated });
      setPreferences(saved);
      setConnectedStreamings(updated);
    } catch (err) {
      setAppError(err instanceof Error ? err.message : 'Falha ao salvar suas plataformas.');
    }
  };

  const handleSavePreferences = async (updates: Partial<UserPreferences>) => {
    const saved = await api.updatePreferences(updates);
    setPreferences(saved);
    setConnectedStreamings(saved.streamingProviders);
  };

  const handleSurpriseMe = () => {
    if (movies.length === 0) {
      setAppError(catalogError || 'O catálogo ainda não está disponível.');
      return;
    }
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
        {appError && (
          <div role="alert" className="mx-auto mt-4 max-w-5xl px-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 px-4 py-3 text-sm text-[#ffb4ab]">
              <span>{appError}</span>
              <button onClick={() => setAppError('')} aria-label="Fechar aviso" className="hover:text-white">×</button>
            </div>
          </div>
        )}
        {currentScreen === 'home' && (
          <HomeScreen
            movies={movies}
            isLoading={isCatalogLoading}
            catalogError={catalogError}
            onSelectMovie={handleSelectMovie}
            onStartAiChat={handleStartAiChat}
            onSurpriseMe={handleSurpriseMe}
            onOpenNeural={() => setCurrentScreen('neural')}
            onToggleWatchlist={handleToggleWatchlist}
            isWatchlisted={(id) => watchlistIds.includes(id)}
          />
        )}

        {currentScreen === 'chat' && (
          <ChatScreen
            movies={movies}
            connectedStreamings={connectedStreamings}
            preferences={preferences}
            initialPrompt={chatInitialPrompt}
            onRecommendations={handleRecommendations}
            onSelectMovie={handleSelectMovie}
            onGoToNeural={() => setCurrentScreen('neural')}
            onGoToMatches={() => setCurrentScreen('matches')}
          />
        )}

        {currentScreen === 'neural' && (
          <NeuralScreen
            movies={recommendations}
            recommendationNotice={recommendationNotice}
            onSelectMovie={handleSelectMovie}
            onGoToMatches={() => setCurrentScreen('matches')}
          />
        )}

        {currentScreen === 'matches' && (
          <MatchesScreen
            movies={recommendations}
            recommendationNotice={recommendationNotice}
            onSelectMovie={handleSelectMovie}
            onGoToChat={() => setCurrentScreen('chat')}
            onOpenCoupleMatch={() => setIsCoupleMatchModalOpen(true)}
            onToggleWatchlist={handleToggleWatchlist}
            isWatchlisted={(id) => watchlistIds.includes(id)}
          />
        )}

        {currentScreen === 'detail' && selectedMovie && (
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

        {currentScreen === 'preferences' && (
          <PreferencesScreen preferences={preferences} onSave={handleSavePreferences} />
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
                Recomendações personalizadas a partir do catálogo do TMDB e das suas preferências.
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
            <button onClick={() => setCurrentScreen('preferences')} className="hover:text-white transition-colors cursor-pointer">
              Preferências
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
