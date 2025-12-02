import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Subir una imagen y obtener URL
 * @param {File} file - Archivo de imagen
 * @param {string} taskId - ID de la tarea
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadImage = async (file, taskId) => {
  try {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'El archivo debe ser una imagen' };
    }

    // Validar tamaño (máx 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'La imagen no debe superar 5MB' };
    }

    // Crear referencia con nombre único
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const storageRef = ref(storage, `tasks/${taskId}/images/${fileName}`);

    // Subir archivo
    await uploadBytes(storageRef, file);

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(storageRef);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error al subir imagen:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subir un archivo adjunto y obtener metadata
 * @param {File} file - Archivo a subir
 * @param {string} taskId - ID de la tarea
 * @returns {Promise<{success: boolean, attachment?: object, error?: string}>}
 */
export const uploadAttachment = async (file, taskId) => {
  try {
    // Validar tamaño (máx 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'El archivo no debe superar 10MB' };
    }

    // Crear referencia con nombre único
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const storageRef = ref(storage, `tasks/${taskId}/attachments/${fileName}`);

    // Subir archivo
    await uploadBytes(storageRef, file);

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(storageRef);

    // Retornar metadata del adjunto
    const attachment = {
      id: timestamp.toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: downloadURL,
      storagePath: storageRef.fullPath,
      uploadedAt: new Date()
    };

    return { success: true, attachment };
  } catch (error) {
    console.error('Error al subir archivo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar un archivo de Storage
 * @param {string} storagePath - Ruta del archivo en Storage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteFile = async (storagePath) => {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Formatear tamaño de archivo para mostrar
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado (ej: "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Obtener icono según tipo de archivo
 * @param {string} mimeType - Tipo MIME del archivo
 * @returns {string} Nombre del icono
 */
export const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'music';
  if (mimeType.includes('pdf')) return 'file-text';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-text';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'file-text';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'file-text';
  return 'file';
};
