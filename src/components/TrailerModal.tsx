import React, { useState, useEffect } from 'react';
import { Movie } from '../types';

interface TrailerModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ movie, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-[#12131d] border border-white/10 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative flex flex-col">
        {/* Video Player Area */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
          {movie.trailerYoutubeKey ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${movie.trailerYoutubeKey}?autoplay=1&rel=0&modestbranding=1`}
              title={`Trailer de ${movie.title}`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              {/* Backdrop or Trailer Frame */}
              <img
                src={movie.trailerStillUrl || movie.backdropUrl}
                alt={movie.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              />

              {/* Cinematic Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none"></div>

              {/* Watermark / Age Rating */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded bg-black/60 backdrop-blur-md text-xs font-mono font-bold text-white border border-white/10">
                TRAILER OFICIAL • 4K HDR
              </div>

              {/* Center Play/Pause button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-[#a078ff]/90 hover:bg-[#a078ff] text-white flex items-center justify-center shadow-[0_0_30px_rgba(160,120,255,0.7)] transition-transform hover:scale-110 cursor-pointer z-10"
              >
                <span className="material-symbols-outlined text-3xl">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>

              {/* Bottom Player Controls Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-2 z-10">
                {/* Timeline Bar */}
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    setProgress(Math.round(pos * 100));
                  }}
                  className="w-full bg-white/20 hover:bg-white/30 h-1.5 rounded-full cursor-pointer relative overflow-hidden transition-all"
                >
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                    </button>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {isMuted ? 'volume_off' : 'volume_up'}
                      </span>
                    </button>

                    <span className="font-mono text-[11px] text-[#cbc3d7]">
                      0:{progress < 10 ? `0${progress}` : progress} / 2:14
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#4edea3] font-bold">Dolby 5.1 Stereo</span>
                    <span className="text-white font-bold">{movie.title}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md text-white transition-colors cursor-pointer border border-white/10 z-20"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Footer Info */}
        <div className="p-5 flex items-center justify-between bg-[#1e1f29] border-t border-white/5">
          <div>
            <h4 className="text-sm font-bold text-white">{movie.title}</h4>
            <p className="text-xs text-[#958ea0]">{movie.director} • {movie.genres.join(', ')}</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar Trailer
          </button>
        </div>
      </div>
    </div>
  );
};
