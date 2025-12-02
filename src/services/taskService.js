import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

const TASKS_COLLECTION = 'tasks';

// Crear una nueva tarea
export const createTask = async (taskData) => {
  try {
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
      ...taskData,
      sprintId: taskData.sprintId || null, // null = backlog
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      projectId: taskData.projectId || null,
      assignee: taskData.assignee || null,
      storyPoints: taskData.storyPoints || null,
      order: taskData.order || 0,
      archived: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastStatusChange: serverTimestamp(), // Registrar timestamp inicial
      previousStatus: null,
      movementHistory: [], // Inicializar historial de movimientos vacío
      attachments: [] // Inicializar array de adjuntos vacío
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear tarea:', error);
    return { success: false, error: error.message };
  }
};

// Actualizar una tarea
export const updateTask = async (taskId, updates) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);

    // Si se está actualizando el status, registrar el timestamp del cambio
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    if (updates.status) {
      updateData.lastStatusChange = serverTimestamp();
      updateData.previousStatus = updates.previousStatus || null;

      // Solo agregar al historial si el status cambió realmente
      if (updates.previousStatus && updates.previousStatus !== updates.status) {
        updateData.movementHistory = arrayUnion({
          from: updates.previousStatus,
          to: updates.status,
          timestamp: new Date() // arrayUnion no acepta serverTimestamp(), usar Date del cliente
        });
      }
    }

    await updateDoc(taskRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return { success: false, error: error.message };
  }
};

// Eliminar una tarea (permanente)
export const deleteTask = async (taskId) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(taskRef);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    return { success: false, error: error.message };
  }
};

// Archivar una tarea (soft delete)
export const archiveTask = async (taskId) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      archived: true,
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al archivar tarea:', error);
    return { success: false, error: error.message };
  }
};

// Desarchivar una tarea
export const unarchiveTask = async (taskId) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      archived: false,
      archivedAt: null,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al desarchivar tarea:', error);
    return { success: false, error: error.message };
  }
};

// Escuchar cambios en tiempo real (excluye tareas archivadas)
export const subscribeToTasks = (callback) => {
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('archived', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q,
      (snapshot) => {
        const tasks = [];
        snapshot.forEach((doc) => {
          tasks.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(tasks);
      },
      (error) => {
        console.error('❌ Error al escuchar tareas:', {
          code: error.code,
          message: error.message,
          name: error.name
        });

        // Mensajes de error más claros
        if (error.code === 'permission-denied') {
          console.error('🔒 PERMISOS DENEGADOS: Verifica las reglas de Firestore');
          console.error('Reglas necesarias:', `
            match /tasks/{taskId} {
              allow read, write: if request.auth != null;
            }
          `);
        } else if (error.code === 'failed-precondition') {
          console.error('⚠️ BASE DE DATOS NO CREADA: Crea Firestore en Firebase Console');
        } else if (error.code === 'unavailable') {
          console.error('🌐 SIN CONEXIÓN: Verifica tu conexión a internet');
        }

        callback([]);
      }
    );
  } catch (error) {
    console.error('❌ Error al inicializar subscripción:', error);
    callback([]);
    return () => {}; // Retornar función vacía de cleanup
  }
};

// Escuchar cambios en tareas archivadas
export const subscribeToArchivedTasks = (callback) => {
  try {
    // Primero intentamos con orderBy, si falla usamos solo el filtro
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('archived', '==', true)
      // Nota: orderBy('archivedAt', 'desc') requiere un índice compuesto
      // Lo ordenaremos en el cliente por ahora
    );

    return onSnapshot(q,
      (snapshot) => {
        const tasks = [];
        snapshot.forEach((doc) => {
          tasks.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Ordenar en el cliente por fecha de archivado
        tasks.sort((a, b) => {
          const dateA = a.archivedAt?.toDate?.() || new Date(0);
          const dateB = b.archivedAt?.toDate?.() || new Date(0);
          return dateB - dateA; // Más reciente primero
        });

        callback(tasks);
      },
      (error) => {
        console.error('❌ Error al escuchar tareas archivadas:', {
          code: error.code,
          message: error.message
        });

        if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
          console.error('💡 Solución: Verifica las reglas de Firestore y que exista el campo "archived"');
        }

        callback([]);
      }
    );
  } catch (error) {
    console.error('❌ Error al inicializar subscripción a archivados:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Mover tarea a un sprint
 * @param {string} taskId - ID de la tarea
 * @param {string|null} sprintId - ID del sprint (null para backlog)
 * @returns {Object} - Resultado de la operación
 */
export const moveTaskToSprint = async (taskId, sprintId) => {
  return updateTask(taskId, { sprintId });
};

/**
 * Contar tareas con un estado específico (en toda la base de datos)
 * @param {string} status - Estado de la columna a verificar
 * @returns {Promise<number>} - Número de tareas con ese estado
 */
export const countTasksByStatus = async (status) => {
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('status', '==', status),
      where('archived', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error al contar tareas por estado:', error);
    return 0;
  }
};
