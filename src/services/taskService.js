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
  serverTimestamp
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
      updatedAt: serverTimestamp()
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
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return { success: false, error: error.message };
  }
};

// Eliminar una tarea
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
        console.log('📋 Tareas cargadas:', tasks.length);
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

/**
 * Mover tarea a un sprint
 * @param {string} taskId - ID de la tarea
 * @param {string|null} sprintId - ID del sprint (null para backlog)
 * @returns {Object} - Resultado de la operación
 */
export const moveTaskToSprint = async (taskId, sprintId) => {
  return updateTask(taskId, { sprintId });
};
