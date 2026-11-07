import React from 'react';

interface StreamingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedStreamings: string[];
  onToggleStreaming: (name: string) => void;
}

export const StreamingsModal: React.FC<StreamingsModalProps> = ({
  isOpen,
  onClose,
  connectedStreamings,
  onToggleStreaming,
}) => {
  if (!isOpen) return null;

  const streamingsList = [
    { name: 'Netflix', color: '#E50914' },
    { name: 'Max', color: '#002BE7' },
    { name: 'Prime Video', color: '#00A8E1' },
    { name: 'Apple TV+', color: '#888888' },
    { name: 'Disney+', color: '#113CCF' },
    { name: 'Paramount+', color: '#0064FF' },
    { name: 'Globoplay', color: '#FB0B15' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1e1f29] border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#cbc3d7] hover:text-white transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#4edea3]/20 text-[#4edea3] flex items-center justify-center border border-[#4edea3]/30">
            <span className="material-symbols-outlined text-xl">tv</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Streamings Conectados</h3>
            <p className="text-xs text-[#958ea0]">
              Ative ou desative provedores para filtrar recomendações
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-1">
          {streamingsList.map((st) => {
            const isConnected = connectedStreamings.includes(st.name);

            return (
              <div
                key={st.name}
                onClick={() => onToggleStreaming(st.name)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isConnected
                    ? 'bg-[#12131d] border-primary/40 shadow-sm'
                    : 'bg-[#12131d]/50 border-white/5 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: st.color }}
                  ></div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{st.name}</h4>
                    <p className="text-[11px] text-[#958ea0]">Use para priorizar títulos disponíveis neste serviço</p>
                  </div>
                </div>

                <p className="text-[11px] text-[#958ea0] mb-4">
                  A seleção representa suas assinaturas; a disponibilidade é consultada para cada título via TMDB e pode mudar.
                </p>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isConnected
                      ? 'bg-[#4edea3] text-black'
                      : 'bg-[#282934] text-white/30'
                  }`}
                >
                  {isConnected ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <span className="text-xs text-[#958ea0]">
            {connectedStreamings.length} de {streamingsList.length} ativos
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#a078ff] hover:bg-[#6d3bd7] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Salvar Preferências
          </button>
        </div>
      </div>
    </div>
  );
};
