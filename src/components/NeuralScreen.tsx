import React, { useState } from 'react';
import { Movie } from '../types';

interface NeuralScreenProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onGoToMatches: () => void;
}

export const NeuralScreen: React.FC<NeuralScreenProps> = ({
  movies,
  onSelectMovie,
  onGoToMatches,
}) => {
  // Interactive Weights for the Neural Vector Model
  const [weights, setWeights] = useState({
    tension: 96,
    complexity: 92,
    visualAesthetic: 98,
    pacing: 88,
    emotionalDepth: 85,
  });

  const [activePipelineStep, setActivePipelineStep] = useState(4);

  // Compute dynamic score based on user-adjusted weights
  const scoredMovies = movies.map((movie) => {
    const totalWeight =
      weights.tension +
      weights.complexity +
      weights.visualAesthetic +
      weights.pacing +
      weights.emotionalDepth;

    const weightedScore =
      (movie.radarScores.tension * weights.tension +
        movie.radarScores.complexity * weights.complexity +
        movie.radarScores.visualAesthetic * weights.visualAesthetic +
        movie.radarScores.pacing * weights.pacing +
        movie.radarScores.emotionalDepth * weights.emotionalDepth) /
      totalWeight;

    return {
      ...movie,
      dynamicScore: Math.round(weightedScore),
    };
  }).sort((a, b) => b.dynamicScore - a.dynamicScore);

  const topMatch = scoredMovies[0];

  const pipelineSteps = [
    { id: 1, title: 'Extração Semântica do Prompt', status: 'Concluído', desc: 'Identificação de tom neo-noir e mistério psicológico.' },
    { id: 2, title: 'Cruzamento com Catálogos Ativos', status: 'Concluído', desc: '14.820 títulos filtrados em Netflix, Max e Prime.' },
    { id: 3, title: 'Filtro de Avaliações Críticas', status: 'Concluído', desc: 'Score IMDb > 7.5 e Metacritic > 80 ponderados.' },
    { id: 4, title: 'Ponderação Neural de Afinidade', status: 'Ativo', desc: 'Cálculo vetorial multidimensional em tempo real.' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 pb-20">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] bg-gradient-to-b from-[#a078ff]/15 via-[#5de6ff]/10 to-transparent blur-[120px] -z-10"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a078ff]/20 text-primary text-xs font-bold uppercase tracking-wider mb-2 border border-[#a078ff]/30">
            <span className="material-symbols-outlined text-sm animate-spin">neurology</span>
            Motor Neural • Algoritmo v4.2
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Analisando seu perfil cinematográfico...
          </h1>
          <p className="text-sm text-[#cbc3d7] mt-1">
            Ajuste os eixos semânticos para ver o algoritmo recalcular a compatibilidade em tempo real.
          </p>
        </div>

        <button
          onClick={onGoToMatches}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_24px_rgba(160,120,255,0.4)] hover:scale-[1.02] transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <span>Ver Recomendações Perfeitas</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>

      {/* 2-Column Grid: Left Controls & Radar / Right Live Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Sliders & Pipeline) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Neural Dials Panel */}
          <div className="bg-[#1e1f29] rounded-2xl p-6 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">tune</span>
                Pesos do Espaço Vetorial
              </h2>
              <button
                onClick={() =>
                  setWeights({
                    tension: 96,
                    complexity: 92,
                    visualAesthetic: 98,
                    pacing: 88,
                    emotionalDepth: 85,
                  })
                }
                className="text-xs text-[#958ea0] hover:text-white transition-colors cursor-pointer"
              >
                Resetar padrões
              </button>
            </div>

            <div className="space-y-4">
              {/* Tension */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-[#e2e1f0] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
                    Tensão Psicológica & Suspense
                  </span>
                  <span className="font-mono text-primary font-bold">{weights.tension}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={weights.tension}
                  onChange={(e) => setWeights({ ...weights, tension: Number(e.target.value) })}
                  className="w-full accent-[#a078ff] h-1.5 bg-[#282934] rounded-lg cursor-pointer"
                />
              </div>

              {/* Complexity */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-[#e2e1f0] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#5de6ff]"></span>
                    Complexidade Narrativa & Quebra-cabeça
                  </span>
                  <span className="font-mono text-[#5de6ff] font-bold">{weights.complexity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={weights.complexity}
                  onChange={(e) => setWeights({ ...weights, complexity: Number(e.target.value) })}
                  className="w-full accent-[#5de6ff] h-1.5 bg-[#282934] rounded-lg cursor-pointer"
                />
              </div>

              {/* Visual Aesthetic */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-[#e2e1f0] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#a078ff]"></span>
                    Estética Visual & Cinematografia Neo-Noir
                  </span>
                  <span className="font-mono text-primary font-bold">{weights.visualAesthetic}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={weights.visualAesthetic}
                  onChange={(e) => setWeights({ ...weights, visualAesthetic: Number(e.target.value) })}
                  className="w-full accent-[#a078ff] h-1.5 bg-[#282934] rounded-lg cursor-pointer"
                />
              </div>

              {/* Pacing */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-[#e2e1f0] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
                    Ritmo & Cadência Dinâmica
                  </span>
                  <span className="font-mono text-[#4edea3] font-bold">{weights.pacing}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={weights.pacing}
                  onChange={(e) => setWeights({ ...weights, pacing: Number(e.target.value) })}
                  className="w-full accent-[#4edea3] h-1.5 bg-[#282934] rounded-lg cursor-pointer"
                />
              </div>

              {/* Emotional Depth */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-[#e2e1f0] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#d0bcff]"></span>
                    Ressonância Emocional & Personagens
                  </span>
                  <span className="font-mono text-primary font-bold">{weights.emotionalDepth}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={weights.emotionalDepth}
                  onChange={(e) => setWeights({ ...weights, emotionalDepth: Number(e.target.value) })}
                  className="w-full accent-[#d0bcff] h-1.5 bg-[#282934] rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Pipeline Status Cards */}
          <div className="bg-[#1e1f29] rounded-2xl p-6 border border-white/10 shadow-lg">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#4edea3] text-lg">schema</span>
              Pipeline de Processamento Neural
            </h2>

            <div className="space-y-3">
              {pipelineSteps.map((step) => {
                const isActive = step.id === activePipelineStep;
                return (
                  <div
                    key={step.id}
                    onClick={() => setActivePipelineStep(step.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isActive
                        ? 'bg-[#282934] border-[#a078ff] shadow-md'
                        : 'bg-[#12131d]/60 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        step.status === 'Concluído'
                          ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30'
                          : 'bg-[#a078ff]/20 text-[#d0bcff] border border-[#a078ff]/30 animate-pulse'
                      }`}
                    >
                      {step.status === 'Concluído' ? '✓' : step.id}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{step.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            step.status === 'Concluído'
                              ? 'bg-[#4edea3]/10 text-[#4edea3]'
                              : 'bg-[#a078ff]/10 text-primary'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#cbc3d7] mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Live Candidate Ranking & Vector Matching) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#1e1f29] rounded-2xl p-6 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5de6ff] text-lg">radar</span>
                Candidatos Recalculados
              </h2>
              <span className="text-[11px] text-[#4edea3] font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-ping"></span>
                Em tempo real
              </span>
            </div>

            <div className="space-y-3.5">
              {scoredMovies.map((movie, index) => {
                const isWinner = index === 0;

                return (
                  <div
                    key={movie.id}
                    onClick={() => onSelectMovie(movie)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 group ${
                      isWinner
                        ? 'bg-gradient-to-r from-[#282934] to-[#1e1f29] border-[#a078ff] shadow-[0_0_20px_rgba(160,120,255,0.2)]'
                        : 'bg-[#12131d]/70 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Rank Number */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        isWinner
                          ? 'bg-[#a078ff] text-white shadow-sm'
                          : 'bg-[#282934] text-[#958ea0]'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    {/* Movie Poster Thumbnail */}
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-12 h-16 object-cover rounded-md shrink-0 shadow"
                    />

                    {/* Movie Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-primary font-bold uppercase truncate">
                          {movie.genres[0]}
                        </span>
                        {isWinner && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#a078ff]/30 text-primary border border-primary/20">
                            Top Match
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                        {movie.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-[#958ea0] mt-0.5">
                        <span>{movie.durationMinutes} min</span>
                        <span>•</span>
                        <span>{movie.streamings[0]?.provider}</span>
                      </div>
                    </div>

                    {/* Score Gauge */}
                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-[#4edea3] font-mono leading-none">
                        {movie.dynamicScore}%
                      </div>
                      <span className="text-[9px] text-[#958ea0] font-medium uppercase tracking-wider">
                        Afinidade
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Action */}
            <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
              <button
                onClick={() => onSelectMovie(topMatch)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors cursor-pointer"
              >
                Abrir #{topMatch.title}
              </button>
              <button
                onClick={onGoToMatches}
                className="w-full py-2.5 rounded-xl bg-[#a078ff] hover:bg-[#6d3bd7] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Ver Todas Recomendações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
