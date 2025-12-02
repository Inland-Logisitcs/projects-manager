import { deleteFile } from '../services/storageService';

/**
 * Extraer URLs de imágenes de un HTML
 * @param {string} html - Contenido HTML
 * @returns {string[]} Array de URLs de imágenes
 */
export const extractImageUrls = (html) => {
  if (!html) return [];

  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const urls = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return urls;
};

/**
 * Obtener path de Storage desde URL de Firebase Storage
 * @param {string} url - URL de Firebase Storage
 * @returns {string|null} Path del archivo en Storage
 */
export const getStoragePathFromUrl = (url) => {
  try {
    // Formato 1: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?...
    let match = url.match(/\/o\/(.+?)(\?|$)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }

    // Formato 2: https://storage.googleapis.com/{bucket}/{path}
    match = url.match(/storage\.googleapis\.com\/[^/]+\/(.+?)(\?|$)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }

    return null;
  } catch (error) {
    console.error('Error al extraer path de Storage:', error);
    return null;
  }
};

/**
 * Eliminar imágenes que ya no están en el HTML
 * @param {string} oldHtml - HTML anterior
 * @param {string} newHtml - HTML nuevo
 * @param {string} taskId - ID de la tarea
 * @returns {Promise<{deleted: number, errors: number}>}
 */
export const cleanupUnusedImages = async (oldHtml, newHtml, taskId) => {
  const oldImages = extractImageUrls(oldHtml || '');
  const newImages = extractImageUrls(newHtml || '');

  // Encontrar imágenes que estaban antes pero ya no están
  const removedImages = oldImages.filter(url => !newImages.includes(url));

  // Solo procesar imágenes de nuestro Storage (que contengan el taskId)
  const taskImages = removedImages.filter(url =>
    url.includes('firebasestorage.googleapis.com') &&
    url.includes(`tasks%2F${taskId}`)
  );

  let deleted = 0;
  let errors = 0;

  // Eliminar cada imagen de Storage
  for (const url of taskImages) {
    const storagePath = getStoragePathFromUrl(url);

    if (storagePath) {
      const result = await deleteFile(storagePath);
      if (result.success) {
        deleted++;
      } else {
        errors++;
        console.error('Error al eliminar imagen:', storagePath, result.error);
      }
    } else {
      console.error('No se pudo extraer path de:', url);
    }
  }

  return { deleted, errors };
};
