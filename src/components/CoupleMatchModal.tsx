import React, { useState } from 'react';
import { Movie } from '../types';
import { ASSETS } from '../data/assets';

interface CoupleMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

export const CoupleMatchModal: React.FC<CoupleMatchModalProps> = ({
  isOpen,
  onClose,
  movies,
  onSelectMovie,
}) => {
  const [partnerTaste, setPartnerTaste] = useState<'drama' | 'scifi' | 'comedy' | 'thriller'>('drama');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  if (!isOpen) return null;

  const handleCalculate = () => {
    setIsCalculating(true);
    setShowResult(false);
    setTimeout(() => {
      setIsCalculating(false);
      setShowResult(true);
    }, 1000);
  };

  const jointWinner = movies[0]; // Sussurros no Labirinto or O Horizonte Oculto

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1e1f29] border border-white/10 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#a078ff]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#cbc3d7] hover:text-white transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#a078ff] to-[#5de6ff] flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-xl">favorite</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Match de Casal & Amigos</h3>
            <p className="text-xs text-[#958ea0]">Descubra o filme ideal para duas pessoas sem discussão</p>
          </div>
        </div>

        {/* Profiles Comparison */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#12131d] border border-white/5 mb-6">
          {/* User 1 */}
          <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/5">
            <img
              src={ASSETS.userAvatar}
              alt="Cristiano"
              className="w-12 h-12 rounded-full object-cover border-2 border-primary mb-2 shadow"
            />
            <span className="text-xs font-bold text-white">Cristiano (Você)</span>
            <span className="text-[10px] text-primary mt-0.5">Suspense • Fotografia • -90 min</span>
          </div>

          {/* User 2 */}
          <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/5">
            <img
              src={ASSETS.userAvatarPartner}
              alt="Parceiro(a)"
              className="w-12 h-12 rounded-full object-cover border-2 border-[#5de6ff] mb-2 shadow"
            />
            <span className="text-xs font-bold text-white">Parceiro(a) / Amigo</span>
            <span className="text-[10px] text-[#5de6ff] mt-0.5">Gosto a selecionar abaixo</span>
          </div>
        </div>

        {/* Select Partner Taste */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-bold text-[#e2e1f0] block">
            O que a outra pessoa está a fim de assistir hoje?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'drama' as const, label: 'Drama Envolvente', desc: 'Foco em atuações e história' },
              { id: 'scifi' as const, label: 'Ficção ou Mistério', desc: 'Raciocínio e reviravoltas' },
              { id: 'comedy' as const, label: 'Mais Leve & Ágil', desc: 'Sem violência pesada' },
              { id: 'thriller' as const, label: 'Suspense Imersivo', desc: 'Tensão compartilhada' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPartnerTaste(opt.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  partnerTaste === opt.id
                    ? 'bg-[#a078ff]/20 border-primary text-white shadow-sm'
                    : 'bg-[#12131d] border-white/5 text-[#cbc3d7] hover:border-white/20'
                }`}
              >
                <span className="block text-xs font-bold">{opt.label}</span>
                <span className="block text-[10px] text-[#958ea0]">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(160,120,255,0.4)] hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
        >
          {isCalculating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Cruzando perfis e calculando interseção...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">psychology</span>
              <span>Calcular Ponto Ideal para os Dois</span>
            </>
          )}
        </button>

        {/* Calculated Result Card */}
        {showResult && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#282934] to-[#1e1f29] border border-[#4edea3]/40 shadow-xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[#4edea3] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span>
                Consenso Perfeito Encontrado!
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#4edea3]/20 text-[#4edea3] text-xs font-bold font-mono">
                94% Compatibilidade Conjunta
              </span>
            </div>

            <div className="flex gap-3.5 items-center">
              <img
                src={jointWinner.posterUrl}
                alt={jointWinner.title}
                className="w-16 h-24 object-cover rounded-lg shrink-0 shadow-md"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-white truncate">{jointWinner.title}</h4>
                <p className="text-xs text-[#cbc3d7] line-clamp-2 mt-0.5">
                  Combina a densidade de mistério que você procura com a narrativa humana e atuações de primeira linha que a outra pessoa aprecia.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onSelectMovie(jointWinner);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#a078ff] text-white text-xs font-bold hover:bg-[#6d3bd7] transition-colors cursor-pointer"
                  >
                    Ver Detalhes do Filme
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
