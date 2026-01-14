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
  arrayRemove,
  getDoc,
  getDocs,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase';

const SESSIONS_COLLECTION = 'planningPokerSessions';

/**
 * Crear una nueva sesión de Planning Poker
 * @param {Object} sessionData - Datos de la sesión
 * @returns {Object} - Resultado de la operación con el ID de la sesión
 */
export const createPlanningPokerSession = async (sessionData) => {
  try {
    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
      tasks: sessionData.tasks || [], // Array de IDs de tareas a estimar
      taskDetails: sessionData.taskDetails || [], // Array con detalles de las tareas
      currentTaskIndex: null, // Índice de la tarea actual siendo estimada
      moderatorId: sessionData.moderatorId, // ID del usuario que controla la sesión
      moderatorName: sessionData.moderatorName,
      pokerValues: sessionData.pokerValues || [0.5, 1, 1.5, 2, 3, 4, 5, '?', '☕'], // Valores del mazo
      status: 'waiting', // 'waiting', 'voting', 'revealed', 'completed'
      participants: [], // Array de { userId, userName, joinedAt, isReady }
      votes: [], // Array de { userId, userName, vote, votedAt } para la tarea actual
      taskEstimates: {}, // Objeto { taskId: storyPoints } con estimaciones finales
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: null
    });

    return { success: true, sessionId: docRef.id };
  } catch (error) {
    console.error('Error al crear sesión de Planning Poker:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unirse a una sesión de Planning Poker
 * @param {string} sessionId - ID de la sesión
 * @param {Object} userData - Datos del usuario { userId, userName }
 * @returns {Object} - Resultado de la operación
 */
export const joinSession = async (sessionId, userData) => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

    await runTransaction(db, async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Sesión no encontrada');
      }

      const sessionData = sessionDoc.data();
      const participants = sessionData.participants || [];

      // Verificar si el usuario ya está en la sesión
      const alreadyJoined = participants.some(p => p.userId === userData.userId);
      if (alreadyJoined) {
        return;
      }

      // Agregar participante usando transacción
      transaction.update(sessionRef, {
        participants: [...participants, {
          userId: userData.userId,
          userName: userData.userName,
          joinedAt: new Date(),
          isReady: false
        }]
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Error al unirse a la sesión:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Abandonar una sesión de Planning Poker
 * @param {string} sessionId - ID de la sesión
 * @param {string} userId - ID del usuario
 * @returns {Object} - Resultado de la operación
 */
export const leaveSession = async (sessionId, userId) => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

    await runTransaction(db, async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Sesión no encontrada');
      }

      const sessionData = sessionDoc.data();
      const participants = sessionData.participants || [];

      // Filtrar al usuario de la lista
      const newParticipants = participants.filter(p => p.userId !== userId);

      // Solo actualizar si realmente había un participante
      if (newParticipants.length < participants.length) {
        transaction.update(sessionRef, {
          participants: newParticipants
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error al abandonar la sesión:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Marcar participante como listo
 * @param {string} sessionId - ID de la sesión
 * @param {string} userId - ID del usuario
 * @returns {Object} - Resultado de la operación
 */
export const toggleReady = async (sessionId, userId) => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const sessionData = sessionDoc.data();
    const participants = sessionData.participants || [];
    const updatedParticipants = participants.map(p =>
      p.userId === userId ? { ...p, isReady: !p.isReady } : p
    );

    await updateDoc(sessionRef, {
      participants: updatedParticipants,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al cambiar estado de listo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Presentar una tarea (solo moderador)
 * @param {string} sessionId - ID de la sesión
 * @param {number} taskIndex - Índice de la tarea a presentar
 * @returns {Object} - Resultado de la operación
 */
export const presentTask = async (sessionId, taskIndex) => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

    await updateDoc(sessionRef, {
      currentTaskIndex: taskIndex,
      status: 'voting',
      votes: [], // Limpiar votos de la tarea anterior
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al presentar tarea:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Agregar un voto a la tarea actual
 * @param {string} sessionId - ID de la sesión
 * @param {Object} voteData - Datos del voto { userId, userName, vote }
 * @returns {Object} - Resultado de la operación
 */
export const addVote = async (sessionId, voteData) => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const sessionData = sessionDoc.data();

    // Verificar que la sesión esté en estado 'voting'
    if (sessionData.status !== 'voting') {
      return { success: false, error: 'La sesión no está aceptando votos' };
    }

    // Verificar si el usuario ya votó
    const existingVotes = sessionData.votes || [];
    const existingVoteIndex = existingVotes.findIndex(v => v.userId === voteData.userId);

    let updatedVotes;
    if (existingVoteIndex !== -1) {
      // Actualizar voto existente
      updatedVotes = [...existingVotes];
      updatedVotes[existingVoteIndex] = {
        ...voteData,
        votedAt: new Date()
      };
    } else {
      // Agregar nuevo voto
      updatedVotes = [
        ...existingVotes,
        {
          ...voteData,
          votedAt: new Date()
        }
      ];
    }

    await updateDoc(sessionRef, {
      votes: updatedVotes,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al agregar voto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Revelar todos los votos de la tarea actual
 * @param {string} sessionId - ID de la sesión
 * @returns {Object} - Resultado de la operación
 */
export const revealVotes = async (sessionId) => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

    await updateDoc(sessionRef, {
      status: 'revealed',
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al revelar votos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reiniciar la votación de la tarea actual (volver a estado voting)
 * @param {string} sessionId - ID de la sesión
 * @returns {Object} - Resultado de la operación
 */
export const restartVoting = async (sessionId) => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

    await updateDoc(sessionRef, {
      status: 'voting',
      votes: [], // Limpiar los votos
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al reiniciar votación:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Guardar la estimación final para la tarea actual
 * @param {string} sessionId - ID de la sesión
 * @param {number} estimate - Estimación en story points
 * @returns {Object} - Resultado de la operación
 */
export const saveTaskEstimate = async (sessionId, estimate) => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    const sessionData = sessionDoc.data();
    const currentTaskId = sessionData.tasks[sessionData.currentTaskIndex];

    // Actualizar la tarea con los story points
    const { updateTask } = await import('./taskService');
    await updateTask(currentTaskId, { storyPoints: estimate });

    // Guardar la estimación en la sesión
    const taskEstimates = sessionData.taskEstimates || {};
    taskEstimates[currentTaskId] = estimate;

    await updateDoc(sessionRef, {
      taskEstimates: taskEstimates,
      status: 'waiting', // Volver a espera para la siguiente tarea
      votes: [], // Limpiar votos
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al guardar estimación:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Completar la sesión (elimina la sesión después de completar)
 * @param {string} sessionId - ID de la sesión
 * @returns {Object} - Resultado de la operación
 */
export const completeSession = async (sessionId) => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

    // Eliminar la sesión completamente
    await deleteDoc(sessionRef);

    return { success: true };
  } catch (error) {
    console.error('Error al completar sesión:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cancelar una sesión de Planning Poker
 * @param {string} sessionId - ID de la sesión
 * @returns {Object} - Resultado de la operación
 */
export const cancelSession = async (sessionId) => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await deleteDoc(sessionRef);
    return { success: true };
  } catch (error) {
    console.error('Error al cancelar sesión:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Escuchar cambios en una sesión específica
 * @param {string} sessionId - ID de la sesión
 * @param {Function} callback - Función a ejecutar cuando haya cambios
 * @returns {Function} - Función para cancelar la suscripción
 */
export const subscribeToSession = (sessionId, callback) => {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

    return onSnapshot(sessionRef,
      (doc) => {
        if (doc.exists()) {
          callback({
            id: doc.id,
            ...doc.data()
          });
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error al escuchar sesión:', error);
        callback(null);
      }
    );
  } catch (error) {
    console.error('Error al inicializar suscripción a sesión:', error);
    callback(null);
    return () => {};
  }
};

/**
 * Obtener la última sesión activa del usuario (como moderador o participante)
 * @param {string} userId - ID del usuario
 * @returns {Object} - Resultado de la operación con la sesión si existe
 */
export const getLastActiveSession = async (userId) => {
  try {
    // Buscar sesiones donde el usuario es moderador
    const moderatorQuery = query(
      collection(db, SESSIONS_COLLECTION),
      where('moderatorId', '==', userId),
      where('status', 'in', ['waiting', 'voting', 'revealed']),
      orderBy('createdAt', 'desc')
    );

    const moderatorSnapshot = await getDocs(moderatorQuery);

    if (!moderatorSnapshot.empty) {
      const doc = moderatorSnapshot.docs[0];
      return {
        success: true,
        session: {
          id: doc.id,
          ...doc.data()
        }
      };
    }

    // Si no es moderador, buscar sesiones donde es participante
    const allActiveQuery = query(
      collection(db, SESSIONS_COLLECTION),
      where('status', 'in', ['waiting', 'voting', 'revealed']),
      orderBy('createdAt', 'desc')
    );

    const allActiveSnapshot = await getDocs(allActiveQuery);

    for (const doc of allActiveSnapshot.docs) {
      const sessionData = doc.data();
      const isParticipant = sessionData.participants?.some(p => p.userId === userId);

      if (isParticipant) {
        return {
          success: true,
          session: {
            id: doc.id,
            ...sessionData
          }
        };
      }
    }

    return { success: false, session: null };
  } catch (error) {
    console.error('Error al obtener última sesión activa:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener la primera sesión activa disponible (sin importar el usuario)
 * @returns {Object} - Resultado de la operación con la sesión si existe
 */
export const getAnyActiveSession = async () => {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('status', 'in', ['waiting', 'voting', 'revealed']),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        success: true,
        session: {
          id: doc.id,
          ...doc.data()
        }
      };
    }

    return { success: false, session: null };
  } catch (error) {
    console.error('Error al obtener sesión activa:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Escuchar sesiones activas (no completadas)
 * @param {Function} callback - Función a ejecutar cuando haya cambios
 * @returns {Function} - Función para cancelar la suscripción
 */
export const subscribeToActiveSessions = (callback) => {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('status', 'in', ['waiting', 'voting', 'revealed']),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q,
      (snapshot) => {
        const sessions = [];
        snapshot.forEach((doc) => {
          sessions.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(sessions);
      },
      (error) => {
        console.error('Error al escuchar sesiones activas:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error al inicializar suscripción a sesiones:', error);
    callback([]);
    return () => {};
  }
};
