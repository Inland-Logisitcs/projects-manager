import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLUMNS_COLLECTION = 'columns';

// Columnas por defecto
const DEFAULT_COLUMNS = [
  {
    id: 'pending',
    title: 'Pendiente',
    color: '#ffd166',
    order: 0
  },
  {
    id: 'in-progress',
    title: 'En Progreso',
    color: '#118ab2',
    order: 1
  },
  {
    id: 'qa',
    title: 'QA',
    color: '#9d4edd',
    order: 2
  },
  {
    id: 'completed',
    title: 'Completado',
    color: '#06d6a0',
    order: 3
  }
];

// Inicializar columnas por defecto si no existen
export const initializeDefaultColumns = async () => {
  try {
    const columnsSnapshot = await getDocs(collection(db, COLUMNS_COLLECTION));

    // Si no hay columnas, crear las por defecto
    if (columnsSnapshot.empty) {
      const batch = writeBatch(db);

      for (const column of DEFAULT_COLUMNS) {
        const docRef = doc(collection(db, COLUMNS_COLLECTION), column.id);
        batch.set(docRef, {
          ...column,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error('Error al inicializar columnas:', error);
    return { success: false, error: error.message };
  }
};

// Crear una nueva columna
export const createColumn = async (columnData) => {
  try {
    // Si no se especifica ID, generar uno automático basado en el título
    const columnId = columnData.id || columnData.title.toLowerCase().replace(/\s+/g, '-');

    const docRef = doc(collection(db, COLUMNS_COLLECTION), columnId);
    await updateDoc(docRef, {
      id: columnId,
      title: columnData.title,
      color: columnData.color || '#94A3B8',
      order: columnData.order ?? 999,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, id: columnId };
  } catch (error) {
    // Si el documento no existe, crearlo con addDoc y luego obtener el ID
    try {
      const docRef = await addDoc(collection(db, COLUMNS_COLLECTION), {
        title: columnData.title,
        color: columnData.color || '#94A3B8',
        order: columnData.order ?? 999,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (err) {
      console.error('Error al crear columna:', err);
      return { success: false, error: err.message };
    }
  }
};

// Actualizar una columna
export const updateColumn = async (columnId, updates) => {
  try {
    const columnRef = doc(db, COLUMNS_COLLECTION, columnId);
    await updateDoc(columnRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar columna:', error);
    return { success: false, error: error.message };
  }
};

// Eliminar una columna
export const deleteColumn = async (columnId) => {
  try {
    const columnRef = doc(db, COLUMNS_COLLECTION, columnId);
    await deleteDoc(columnRef);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar columna:', error);
    return { success: false, error: error.message };
  }
};

// Reordenar columnas
export const reorderColumns = async (columns) => {
  try {
    const batch = writeBatch(db);

    columns.forEach((column, index) => {
      const columnRef = doc(db, COLUMNS_COLLECTION, column.id);
      batch.update(columnRef, {
        order: index,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error al reordenar columnas:', error);
    return { success: false, error: error.message };
  }
};

// Escuchar cambios en tiempo real
export const subscribeToColumns = (callback) => {
  try {
    const q = query(
      collection(db, COLUMNS_COLLECTION),
      orderBy('order', 'asc')
    );

    return onSnapshot(q,
      (snapshot) => {
        const columns = [];
        snapshot.forEach((doc) => {
          columns.push({
            id: doc.id,
            ...doc.data()
          });
        });

        callback(columns);
      },
      (error) => {
        console.error('❌ Error al escuchar columnas:', {
          code: error.code,
          message: error.message,
          name: error.name
        });

        // Mensajes de error más claros
        if (error.code === 'permission-denied') {
          console.error('🔒 PERMISOS DENEGADOS: Verifica las reglas de Firestore');
          console.error('Reglas necesarias:', `
            match /columns/{columnId} {
              allow read, write: if request.auth != null;
            }
          `);
        } else if (error.code === 'failed-precondition') {
          console.error('⚠️ BASE DE DATOS NO CREADA: Crea Firestore en Firebase Console');
        } else if (error.code === 'unavailable') {
          console.error('🌐 SIN CONEXIÓN: Verifica tu conexión a internet');
        }

        // En caso de error, devolver columnas por defecto
        callback(DEFAULT_COLUMNS);
      }
    );
  } catch (error) {
    console.error('❌ Error al inicializar subscripción:', error);
    callback(DEFAULT_COLUMNS);
    return () => {}; // Retornar función vacía de cleanup
  }
};
