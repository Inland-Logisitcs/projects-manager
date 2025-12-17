import { useRef, useState } from 'react';
import Icon from '../common/Icon';
import PdfViewer from './PdfViewer';
import ImageViewer from './ImageViewer';
import Toast from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';
import { uploadAttachment, formatFileSize, getFileIcon, deleteFile } from '../../services/storageService';
import '../../styles/AttachmentsList.css';

const AttachmentsList = ({
  attachments = [],
  taskId,
  onAttachmentsChange,
  readOnly = false,
  showUploadButton = true,
  fileInputId = null
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [pdfToView, setPdfToView] = useState(null);
  const [imageToView, setImageToView] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments = [...attachments];
    let uploadedCount = 0;
    let errorCount = 0;

    // Subir todos los archivos seleccionados
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadAttachment(file, taskId);

      if (result.success && result.attachment) {
        newAttachments.push(result.attachment);
        uploadedCount++;
      } else {
        errorCount++;
        console.error('Error al subir archivo:', file.name, result.error);
      }
    }

    setIsUploading(false);

    // Notificar cambios al padre
    if (uploadedCount > 0 && onAttachmentsChange) {
      onAttachmentsChange(newAttachments);
    }

    // Mostrar mensaje de resultado
    if (uploadedCount > 0 && errorCount === 0) {
      setToast({
        message: uploadedCount === 1
          ? 'Archivo subido exitosamente'
          : `${uploadedCount} archivos subidos exitosamente`,
        type: 'success'
      });
    } else if (errorCount > 0) {
      setToast({
        message: errorCount === files.length
          ? 'Error al subir los archivos'
          : `${uploadedCount} archivos subidos, ${errorCount} con errores`,
        type: errorCount === files.length ? 'error' : 'warning'
      });
    }

    // Limpiar input
    event.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId) => {
    setConfirmDelete(attachmentId);
  };

  const confirmRemoveAttachment = async () => {
    const attachmentId = confirmDelete;
    setConfirmDelete(null);

    // Encontrar el attachment a eliminar
    const attachment = attachments.find(a => a.id === attachmentId);
    if (!attachment) return;

    // Eliminar el archivo físico de Storage
    if (attachment.storagePath) {
      const result = await deleteFile(attachment.storagePath);
      if (!result.success) {
        console.error('Error al eliminar archivo de Storage:', result.error);
      }
    }

    // Actualizar el array de adjuntos
    const newAttachments = attachments.filter(a => a.id !== attachmentId);
    if (onAttachmentsChange) {
      onAttachmentsChange(newAttachments);
    }
  };

  const handleViewOrDownload = (attachment) => {
    // Si es un PDF, abrir el visor de PDF
    if (attachment.type === 'application/pdf') {
      setPdfToView(attachment);
    }
    // Si es una imagen, abrir el visor de imágenes
    else if (attachment.type.startsWith('image/')) {
      // Encontrar el índice de esta imagen entre todas las imágenes
      const imageAttachments = attachments.filter(a => a.type.startsWith('image/'));
      const imageIndex = imageAttachments.findIndex(img => img.id === attachment.id);
      setImageToView({ attachment, imageIndex, allImages: imageAttachments });
    }
    // Para otros archivos, abrir en nueva pestaña
    else {
      window.open(attachment.url, '_blank');
    }
  };

  const handleImageNavigation = (newIndex) => {
    const imageAttachments = attachments.filter(a => a.type.startsWith('image/'));
    const newAttachment = imageAttachments[newIndex];
    setImageToView({ attachment: newAttachment, imageIndex: newIndex, allImages: imageAttachments });
  };

  return (
    <div className="attachments-list">
      {!readOnly && (
        <div className="mb-xs">
          {showUploadButton && (
            <button
              className="btn btn-secondary btn-sm flex items-center gap-xs"
              onClick={handleFileSelect}
              disabled={isUploading}
            >
              <Icon name="paperclip" size={16} />
              {isUploading ? 'Subiendo...' : 'Adjuntar archivo'}
            </button>
          )}
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      )}

      {attachments.length > 0 ? (
        <div className="flex flex-col gap-xs">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-item">
              <div className="attachment-icon">
                <Icon name={getFileIcon(attachment.type)} size={24} />
              </div>
              <div className="attachment-info">
                <span className="attachment-name" title={attachment.name}>
                  {attachment.name}
                </span>
                <span className="text-xs text-tertiary">
                  {formatFileSize(attachment.size)}
                </span>
              </div>
              <div className="flex gap-xs">
                <button
                  className="attachment-action-btn"
                  onClick={() => handleViewOrDownload(attachment)}
                  title={attachment.type === 'application/pdf' ? 'Ver PDF' : attachment.type.startsWith('image/') ? 'Ver imagen' : 'Abrir'}
                >
                  <Icon name={attachment.type === 'application/pdf' ? 'file-text' : attachment.type.startsWith('image/') ? 'eye' : 'download'} size={16} />
                </button>
                {!readOnly && (
                  <button
                    className="attachment-action-btn attachment-delete-btn"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    title="Eliminar"
                  >
                    <Icon name="x" size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !readOnly && (
          <div className="empty-attachments">
            <Icon name="paperclip" size={32} className="empty-attachments-icon" />
            <p className="text-sm text-secondary m-0">Sin archivos adjuntos</p>
          </div>
        )
      )}

      {/* Visor de PDF */}
      {pdfToView && (
        <PdfViewer
          url={pdfToView.url}
          fileName={pdfToView.name}
          onClose={() => setPdfToView(null)}
        />
      )}

      {/* Visor de imágenes */}
      {imageToView && (
        <ImageViewer
          url={imageToView.attachment.url}
          fileName={imageToView.attachment.name}
          allImages={imageToView.allImages}
          currentIndex={imageToView.imageIndex}
          onNavigate={handleImageNavigation}
          onClose={() => setImageToView(null)}
        />
      )}

      {/* Toast para errores */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Eliminar archivo adjunto"
        message="¿Estás seguro de que deseas eliminar este archivo adjunto?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={confirmRemoveAttachment}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default AttachmentsList;
