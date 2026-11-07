import React from 'react';
import { ASSETS } from '../data/assets';

export type ScreenType = 'home' | 'chat' | 'neural' | 'matches' | 'detail' | 'watchlist';

interface NavbarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  connectedStreamingsCount: number;
  onOpenStreamings: () => void;
  watchlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  connectedStreamingsCount,
  onOpenStreamings,
  watchlistCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: ScreenType; label: string; icon: string }[] = [
    { id: 'home', label: 'Início', icon: 'home' },
    { id: 'chat', label: 'Descoberta IA', icon: 'chat' },
    { id: 'neural', label: 'Processamento Neural', icon: 'neurology' },
    { id: 'matches', label: 'Recomendações', icon: 'auto_awesome' },
    { id: 'watchlist', label: `Minha Lista ${watchlistCount > 0 ? `(${watchlistCount})` : ''}`, icon: 'bookmark' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#12131d]/85 backdrop-blur-xl border-b border-white/5">
      <div className="h-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 shrink-0 text-left cursor-pointer group"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-secondary opacity-40 blur-sm group-hover:opacity-75 transition-opacity"></div>
            <img
              alt="CineMatch AI Logo"
              className="relative h-9 w-auto object-contain drop-shadow"
              src={ASSETS.logo}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
              CineMatch <span className="text-xs px-1.5 py-0.5 rounded bg-primary-container/30 text-primary border border-primary/20 font-mono">AI</span>
            </span>
            <span className="text-[11px] text-primary/80 font-medium tracking-wide">
              Algoritmo Cinematográfico
            </span>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#1e1f29]/70 backdrop-blur-md p-1.5 rounded-full border border-white/5 shadow-inner">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#a078ff] text-white shadow-[0_0_18px_rgba(160,120,255,0.45)]'
                    : 'text-[#cbc3d7] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Streamings Connected Badge */}
          <button
            onClick={onOpenStreamings}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#282934]/70 hover:bg-[#282934] border border-white/5 text-xs text-[#cbc3d7] hover:text-white transition-all cursor-pointer group"
            title="Gerenciar provedores de streaming conectados"
          >
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
            <span>{connectedStreamingsCount} streamings ativos</span>
            <span className="material-symbols-outlined text-xs text-[#958ea0] group-hover:text-white">tune</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 p-1 rounded-full bg-[#1a1b25] border border-white/5">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-[#d0bcff] to-[#5de6ff] opacity-70 blur-[1px]"></div>
              <img
                alt="Profile"
                className="relative w-8 h-8 rounded-full object-cover"
                src={ASSETS.userAvatar}
              />
            </div>
            <span className="hidden md:inline text-xs font-medium text-[#e2e1f0] pr-2">Cristiano</span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-[#1e1f29] text-[#e2e1f0] hover:text-white border border-white/5 cursor-pointer"
            aria-label="Abrir menu"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#12131d] border-b border-white/10 px-4 pt-2 pb-5 space-y-2">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-[#a078ff] text-white shadow-md'
                    : 'text-[#cbc3d7] hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs text-[#cbc3d7] px-2">
            <span>{connectedStreamingsCount} streamings conectados</span>
            <button
              onClick={() => {
                onOpenStreamings();
                setMobileMenuOpen(false);
              }}
              className="text-primary hover:underline"
            >
              Gerenciar
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
