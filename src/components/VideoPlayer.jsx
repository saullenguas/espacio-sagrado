import { memo } from 'react'
import { useState, useRef, useEffect } from 'react';
// ✅ RUTA CORREGIDA: apunta a services
import { getVideoEmbedUrl } from '../services/videoEmbed';

const VideoPlayer = ({ url, title = "Video de la lección" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // Detectar cuando el contenedor es visible (Intersection Observer)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const embedUrl = url ? getVideoEmbedUrl(url) : null;

  if (!embedUrl) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md bg-slate-100"
    >
      {/* Placeholder mientras no se ha cargado el iframe */}
      {!isVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
          <div className="text-center">
            <span className="text-5xl">🎬</span>
            <p className="text-slate-500 text-sm mt-2">Video disponible</p>
          </div>
        </div>
      )}

      {/* Iframe (solo se carga cuando es visible) */}
      {isVisible && (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      )}

      {/* Indicador de carga */}
      {isVisible && isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Mensaje de error */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="text-center p-4">
            <span className="text-4xl">⚠️</span>
            <p className="text-slate-600 mt-2">No se pudo cargar el video.</p>
            <p className="text-slate-400 text-sm mt-1">Verifica la URL o intenta más tarde.</p>
          </div>
        </div>
      )}
    </div>
  );
};


export default memo(VideoPlayer)
// y agregar al import: import { memo } from 'react'