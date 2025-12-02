import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Icon from '../common/Icon';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '../../styles/PdfViewer.css';

// Configurar el worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfViewer = ({ url, fileName, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error al cargar PDF:', error);
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleDownload = () => {
    window.open(url, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pdf-viewer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pdf-viewer-header flex items-center justify-between p-base px-md">
          <div className="flex items-center gap-sm">
            <Icon name="file-text" size={20} />
            <span className="text-base font-medium">{fileName}</span>
          </div>
          <div className="flex items-center gap-xs">
            <button className="btn btn-icon btn-sm" onClick={zoomOut} title="Alejar" disabled={scale <= 0.5}>
              <Icon name="minus" size={18} />
            </button>
            <span className="pdf-viewer-zoom text-sm font-medium">
              {Math.round(scale * 100)}%
            </span>
            <button className="btn btn-icon btn-sm" onClick={zoomIn} title="Acercar" disabled={scale >= 3.0}>
              <Icon name="plus" size={18} />
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
        <div className="pdf-viewer-content">
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p className="text-base text-secondary">Cargando PDF...</p>
            </div>
          )}

          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>

        {/* Footer with pagination */}
        {numPages && (
          <div className="pdf-viewer-footer flex items-center justify-center gap-md p-base">
            <button
              className="btn btn-icon btn-sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              title="Página anterior"
            >
              <Icon name="chevron-left" size={18} />
            </button>
            <span className="text-sm font-medium">
              Página {pageNumber} de {numPages}
            </span>
            <button
              className="btn btn-icon btn-sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              title="Página siguiente"
            >
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
