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
  where,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';

const SPRINTS_COLLECTION = 'sprints';

/**
 * Suscribirse a cambios en los sprints
 * @param {Function} callback - Funci�n que recibe los sprints actualizados
 * @returns {Function} - Funci�n para cancelar la suscripci�n
 */
export const subscribeToSprints = (callback) => {
  try {
    const q = query(collection(db, SPRINTS_COLLECTION), orderBy('createdAt', 'desc'));

    return onSnapshot(q,
      (snapshot) => {
        const sprints = [];
        snapshot.forEach((doc) => {
          sprints.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(sprints);
      },
      (error) => {
        console.error('L Error al escuchar sprints:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('L Error al inicializar subscripci�n de sprints:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Crear un nuevo sprint
 * @param {Object} sprintData - Datos del sprint
 * @returns {Object} - Resultado de la operaci�n
 */
export const createSprint = async (sprintData) => {
  try {
    const docRef = await addDoc(collection(db, SPRINTS_COLLECTION), {
      name: sprintData.name,
      goal: sprintData.goal || '',
      startDate: sprintData.startDate || null,
      endDate: sprintData.endDate || null,
      status: sprintData.status || 'planned', // planned, active, completed
      projectId: sprintData.projectId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear sprint:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actualizar un sprint
 * @param {string} sprintId - ID del sprint
 * @param {Object} updates - Datos a actualizar
 * @returns {Object} - Resultado de la operaci�n
 */
export const updateSprint = async (sprintId, updates) => {
  try {
    const sprintRef = doc(db, SPRINTS_COLLECTION, sprintId);
    await updateDoc(sprintRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar sprint:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar un sprint
 * @param {string} sprintId - ID del sprint
 * @returns {Object} - Resultado de la operaci�n
 */
export const deleteSprint = async (sprintId) => {
  try {
    const sprintRef = doc(db, SPRINTS_COLLECTION, sprintId);
    await deleteDoc(sprintRef);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar sprint:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Iniciar un sprint (cambiar estado a activo)
 * @param {string} sprintId - ID del sprint
 * @param {string} startDate - Fecha de inicio
 * @param {string} endDate - Fecha de fin
 * @returns {Object} - Resultado de la operaci�n
 */
export const startSprint = async (sprintId, startDate, endDate) => {
  try {
    // Primero actualizar el estado del sprint
    const sprintResult = await updateSprint(sprintId, {
      status: 'active',
      startDate,
      endDate
    });

    if (!sprintResult.success) {
      return sprintResult;
    }

    // Luego actualizar todas las tareas del sprint a 'pending'
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('sprintId', '==', sprintId),
      where('archived', '==', false)
    );

    const tasksSnapshot = await getDocs(tasksQuery);

    // Actualizar cada tarea a 'pending' si no tiene estado
    const updatePromises = tasksSnapshot.docs.map(async (taskDoc) => {
      const taskData = taskDoc.data();

      // Solo actualizar si la tarea no tiene estado (null)
      if (!taskData.status) {
        const taskRef = doc(db, 'tasks', taskDoc.id);
        await updateDoc(taskRef, {
          status: 'pending',
          previousStatus: null,
          lastStatusChange: serverTimestamp(),
          updatedAt: serverTimestamp(),
          movementHistory: arrayUnion({
            type: 'status_change',
            from: null,
            to: 'pending',
            timestamp: new Date()
          })
        });
      }
    });

    await Promise.all(updatePromises);

    return { success: true };
  } catch (error) {
    console.error('Error al iniciar sprint:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Completar un sprint
 * @param {string} sprintId - ID del sprint
 * @returns {Object} - Resultado de la operaci�n
 */
export const completeSprint = async (sprintId) => {
  return updateSprint(sprintId, {
    status: 'completed',
    completedAt: serverTimestamp()
  });
};
