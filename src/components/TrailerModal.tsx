import React from 'react';
import { Movie } from '../types';

interface TrailerModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ movie, onClose }) => {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-[#12131d] border border-white/10 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative">
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {movie.trailerYoutubeKey
            ? <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(movie.trailerYoutubeKey)}?autoplay=1&rel=0`}
                title={`Trailer de ${movie.title}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            : <p className="px-8 text-center text-sm text-[#cbc3d7]">O TMDB não retornou um trailer para este título.</p>}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/10 z-20"
            aria-label="Fechar trailer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">{movie.title}</h3>
            <p className="text-xs text-[#958ea0] mt-1">Trailer disponibilizado pelo TMDB</p>
          </div>
          {movie.trailerYoutubeKey && <a
            href={`https://www.youtube.com/watch?v=${encodeURIComponent(movie.trailerYoutubeKey)}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Abrir no YouTube
          </a>}
        </div>
      </div>
    </div>
  );
};
