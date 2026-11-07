import React, { useState, useRef, useEffect } from 'react';
import { Movie, ChatMessage } from '../types';
import { ASSETS } from '../data/assets';

interface ChatScreenProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onGoToNeural: () => void;
  onGoToMatches: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  movies,
  onSelectMovie,
  onGoToNeural,
  onGoToMatches,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Olá, Cristiano! Para encontrar o filme ideal para a sua sessão de hoje: o que você está a fim de sentir agora? Ou me conte um título recente que você amou!',
      timestamp: 'Agora',
      chips: [
        'Suspense que prende do início ao fim',
        'Ficção científica cerebral',
        'Filme leve e reconfortante',
        'Algo com reviravolta chocante',
      ],
      showFilters: true,
    },
    {
      id: 'msg-2',
      sender: 'user',
      text: 'Quero um suspense psicológico bem tenso, estilo Garota Exemplar ou Ilha do Medo, com fotografia impecável e disponível na Netflix ou Max.',
      timestamp: '1 min atrás',
    },
    {
      id: 'msg-3',
      sender: 'ai',
      text: 'Entendido! Analisando parâmetros: thriller psicológico com alta tensão contínua, cinematografia neo-noir premiada, reviravolta no terceiro ato e duração objetiva de menos de 1h30 na Netflix e Max.\n\nEncontrei uma correspondência de 98% no catálogo:',
      timestamp: 'Agora',
      previewMovieId: 'sussurros-no-labirinto',
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<'short' | 'standard' | 'epic' | 'any'>('short');
  const [selectedStreamings, setSelectedStreamings] = useState<string[]>(['Netflix', 'Max']);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const durationOptions = [
    { id: 'short' as const, label: 'Até 90 min', desc: 'Objetivo e veloz' },
    { id: 'standard' as const, label: '90 a 120 min', desc: 'Duração padrão' },
    { id: 'epic' as const, label: 'Mais de 2h', desc: 'Épico e imersivo' },
    { id: 'any' as const, label: 'Não importa', desc: 'Qualquer duração' },
  ];

  const streamingOptions = [
    { id: 'Netflix', label: 'Netflix', color: '#E50914' },
    { id: 'Max', label: 'Max', color: '#002BE7' },
    { id: 'Prime Video', label: 'Prime Video', color: '#00A8E1' },
    { id: 'Apple TV', label: 'Apple TV', color: '#888888' },
    { id: 'Disney+', label: 'Disney+', color: '#113CCF' },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleStreaming = (provider: string) => {
    setSelectedStreamings((prev) =>
      prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider]
    );
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Agora',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // AI logic response simulation
    setTimeout(() => {
      let replyText = '';
      let matchedMovieId = 'sussurros-no-labirinto';

      const lower = text.toLowerCase();
      if (lower.includes('ficção') || lower.includes('sci-fi') || lower.includes('espaço') || lower.includes('futuro') || lower.includes('horizonte')) {
        matchedMovieId = 'o-horizonte-oculto';
        replyText =
          'Excelente escolha! Para uma experiência de ficção científica instigante com alta complexidade e visual cyberpunk deslumbrante, recomendo fortemente "O Horizonte Oculto". O filme tem 95% de afinidade com o seu perfil.';
      } else if (lower.includes('rádio') || lower.includes('tempo real') || lower.includes('frequência') || lower.includes('frequencia')) {
        matchedMovieId = 'a-ultima-frequencia';
        replyText =
          'Uma ótima pedida! "A Última Frequência" traz um suspense claustrofóbico em tempo real dentro de uma rádio da serra, perfeito para quem busca tensão crescente ininterrupta.';
      } else if (lower.includes('leve') || lower.includes('comédia') || lower.includes('romance') || lower.includes('dois')) {
        replyText =
          'Entendido! Ajustei os filtros para equilibrar leveza narrativa e engajamento para assistir a dois. Cruzando catálogos agora...';
      } else {
        replyText = `Compreendido! Cruzei o contexto "${text}" com os catálogos selecionados (${selectedStreamings.join(', ')}). A IA ponderou seus vetores de tensão e estética cinematográfica para esta recomendação:`;
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: replyText,
        timestamp: 'Agora',
        previewMovieId: matchedMovieId,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const findMovie = (id: string) => movies.find((m) => m.id === id) || movies[0];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Top Header Card */}
      <div className="bg-[#1e1f29] rounded-2xl p-4 sm:p-5 border border-white/5 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#a078ff]/20 text-primary flex items-center justify-center border border-[#a078ff]/30">
            <span className="material-symbols-outlined text-xl">psychology</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">CineMatch AI Assistente</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                Online
              </span>
            </div>
            <p className="text-xs text-[#958ea0]">Motor Neural v4.2 • Processamento em linguagem natural</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGoToNeural}
            className="px-3.5 py-1.5 rounded-lg bg-[#282934] hover:bg-[#33343f] text-xs font-semibold text-[#5de6ff] border border-[#5de6ff]/20 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">neurology</span>
            <span>Ver Vetores Neurais</span>
          </button>
          <button
            onClick={() => {
              setMessages([
                {
                  id: 'msg-new',
                  sender: 'ai',
                  text: 'Sessão reiniciada! Qual o clima da sua sessão hoje?',
                  timestamp: 'Agora',
                  chips: ['Suspense psicológico', 'Ficção científica cerebral', 'Filme curto (-90 min)'],
                },
              ]);
            }}
            className="p-2 rounded-lg bg-[#282934] text-[#958ea0] hover:text-white transition-colors cursor-pointer"
            title="Reiniciar conversa"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 space-y-6 pb-6">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          const previewMovie = msg.previewMovieId ? findMovie(msg.previewMovieId) : null;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} animate-in fade-in duration-300`}
            >
              <div className="flex items-start gap-3 max-w-2xl">
                {isAi && (
                  <div className="w-8 h-8 rounded-full bg-[#a078ff]/30 text-primary flex items-center justify-center shrink-0 border border-[#a078ff]/40 mt-1">
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                  </div>
                )}

                <div className="flex flex-col">
                  {/* Bubble */}
                  <div
                    className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                      isAi
                        ? 'bg-[#1e1f29] text-[#e2e1f0] border border-white/5 rounded-tl-sm shadow-md'
                        : 'bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] text-white rounded-tr-sm shadow-[0_0_16px_rgba(160,120,255,0.3)]'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* In-chat Preference Selectors (Shown on first AI message) */}
                    {msg.showFilters && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                        {/* Duration Selector */}
                        <div>
                          <label className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-2">
                            Duração Preferida:
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {durationOptions.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => setSelectedDuration(opt.id)}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  selectedDuration === opt.id
                                    ? 'bg-[#a078ff]/20 border-[#a078ff] text-white shadow-sm'
                                    : 'bg-[#12131d] border-white/5 text-[#cbc3d7] hover:border-white/20'
                                }`}
                              >
                                <span className="block text-xs font-bold">{opt.label}</span>
                                <span className="block text-[10px] text-[#958ea0]">{opt.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Streamings Connected Toggles */}
                        <div>
                          <label className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-2">
                            Filtrar por Meus Streamings:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {streamingOptions.map((opt) => {
                              const active = selectedStreamings.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => toggleStreaming(opt.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                                    active
                                      ? 'bg-white/10 text-white border-primary shadow-sm'
                                      : 'bg-[#12131d] text-[#958ea0] border-white/5 opacity-60'
                                  }`}
                                >
                                  <span className={`material-symbols-outlined text-xs ${active ? 'text-[#4edea3]' : 'text-transparent'}`}>
                                    check
                                  </span>
                                  <span>{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Movie Recommendation Preview Card inside bubble */}
                    {previewMovie && (
                      <div className="mt-4 p-3.5 rounded-xl bg-[#12131d] border border-[#a078ff]/40 shadow-lg flex flex-col sm:flex-row gap-3.5 items-center">
                        <img
                          src={previewMovie.posterUrl}
                          alt={previewMovie.title}
                          className="w-20 h-28 object-cover rounded-lg shrink-0 shadow-md"
                        />
                        <div className="flex-1 flex flex-col justify-between w-full">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                                {previewMovie.genres[0]}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/20 text-[#4edea3] text-[10px] font-bold border border-[#4edea3]/30">
                                {previewMovie.matchScore}% Match
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-white mt-0.5">{previewMovie.title}</h4>
                            <p className="text-xs text-[#cbc3d7] line-clamp-2 mt-1">
                              {previewMovie.aiMatchReason}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
                            <button
                              onClick={() => onSelectMovie(previewMovie)}
                              className="px-3 py-1.5 rounded-lg bg-[#a078ff] hover:bg-[#6d3bd7] text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              Ver Detalhes do Filme
                            </button>
                            <button
                              onClick={onGoToMatches}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#cbc3d7] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Ver Todas as Recomendações
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  {msg.chips && msg.chips.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {msg.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(chip)}
                          className="px-3 py-1.5 rounded-full bg-[#1e1f29] hover:bg-[#282934] border border-white/10 hover:border-primary/50 text-xs text-[#cbc3d7] hover:text-white transition-all cursor-pointer shadow-sm"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-[#958ea0] mt-1 px-1">{msg.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#a078ff]/30 text-primary flex items-center justify-center shrink-0 border border-[#a078ff]/40">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-[#1e1f29] border border-white/5 text-xs text-[#cbc3d7] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200"></span>
              <span className="text-xs text-[#958ea0] ml-1">Processando compatibilidade neural...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Floating Transition Bar */}
      <div className="sticky bottom-0 pt-2 pb-4 bg-gradient-to-t from-[#12131d] via-[#12131d] to-transparent">
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <div className="flex items-center gap-2 text-xs text-[#958ea0]">
            <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
            <span>3 filmes candidatos identificados</span>
          </div>
          <button
            onClick={onGoToNeural}
            className="text-xs font-bold text-[#5de6ff] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver pipeline neural em tempo real</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center gap-2 bg-[#1e1f29] rounded-2xl p-2 border border-white/10 focus-within:border-primary shadow-xl"
        >
          <button
            type="button"
            onClick={() => handleSend('Me recomende algo surpreendente baseado no meu histórico!')}
            className="p-2.5 rounded-xl bg-[#282934] text-[#5de6ff] hover:bg-[#33343f] transition-colors cursor-pointer shrink-0"
            title="Sorteio Inteligente"
          >
            <span className="material-symbols-outlined text-lg">casino</span>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Descreva o que quer sentir, duração, atores ou filmes de referência..."
            className="w-full bg-transparent text-sm text-white placeholder-[#958ea0] px-2 py-1 outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#a078ff] to-[#6d3bd7] text-white font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_16px_rgba(160,120,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition-all cursor-pointer shrink-0"
          >
            <span>Enviar</span>
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
