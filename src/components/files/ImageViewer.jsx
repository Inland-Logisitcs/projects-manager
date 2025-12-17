import { useState, useEffect } from 'react';
import Icon from '../common/Icon';
import '../../styles/ImageViewer.css';

const ImageViewer = ({ url, fileName, onClose, allImages = [], currentIndex = 0, onNavigate }) => {
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);

  const hasMultipleImages = allImages.length > 1;
  const hasPrevious = hasMultipleImages && currentIndex > 0;
  const hasNext = hasMultipleImages && currentIndex < allImages.length - 1;

  // Resetear zoom y rotación al cambiar de imagen
  useEffect(() => {
    setScale(1.0);
    setRotation(0);
    setLoading(true);
  }, [url]);

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const rotateLeft = () => {
    setRotation(prev => (prev - 90) % 360);
  };

  const rotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetRotation = () => {
    setRotation(0);
  };

  const handleDownload = () => {
    window.open(url, '_blank');
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
  };

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  };

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && hasPrevious) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPrevious, hasNext, currentIndex]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="image-viewer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="image-viewer-header flex items-center justify-between p-base px-md">
          <div className="flex items-center gap-sm">
            <Icon name="image" size={20} />
            <span className="text-base font-medium">{fileName}</span>
          </div>
          <div className="flex items-center gap-xs">
            <button className="btn btn-icon btn-sm" onClick={zoomOut} title="Alejar" disabled={scale <= 0.5}>
              <Icon name="minus" size={18} />
            </button>
            <span className="image-viewer-zoom text-sm font-medium">
              {Math.round(scale * 100)}%
            </span>
            <button className="btn btn-icon btn-sm" onClick={zoomIn} title="Acercar" disabled={scale >= 3.0}>
              <Icon name="plus" size={18} />
            </button>
            <button className="btn btn-icon btn-sm" onClick={resetZoom} title="Restablecer zoom">
              <Icon name="maximize" size={18} />
            </button>
            <div className="divider-vertical" style={{ height: '24px' }}></div>
            <button className="btn btn-icon btn-sm" onClick={rotateLeft} title="Rotar izquierda">
              <Icon name="rotate-ccw" size={18} />
            </button>
            <button className="btn btn-icon btn-sm" onClick={rotateRight} title="Rotar derecha">
              <Icon name="rotate-cw" size={18} />
            </button>
            <button className="btn btn-icon btn-sm" onClick={resetRotation} title="Restablecer rotación" disabled={rotation === 0}>
              <Icon name="refresh-cw" size={18} />
            </button>
            <div className="divider-vertical" style={{ height: '24px' }}></div>
            <button className="btn btn-icon btn-sm" onClick={handleDownload} title="Descargar">
              <Icon name="download" size={18} />
            </button>
            <button className="btn btn-icon btn-sm" onClick={onClose} title="Cerrar">
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="image-viewer-content">
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p className="text-base text-secondary">Cargando imagen...</p>
            </div>
          )}

          <img
            src={url}
            alt={fileName}
            className="image-viewer-img"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              display: loading ? 'none' : 'block'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Navegación entre imágenes */}
          {hasMultipleImages && (
            <>
              {hasPrevious && (
                <button
                  className="image-nav-btn image-nav-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  title="Imagen anterior (←)"
                >
                  <Icon name="chevron-left" size={32} />
                </button>
              )}
              {hasNext && (
                <button
                  className="image-nav-btn image-nav-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  title="Imagen siguiente (→)"
                >
                  <Icon name="chevron-right" size={32} />
                </button>
              )}
              <div className="image-counter">
                {currentIndex + 1} / {allImages.length}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
