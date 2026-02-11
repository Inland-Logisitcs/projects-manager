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
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

const REQUESTS_COLLECTION = 'requests';
const TASKS_COLLECTION = 'tasks';

/**
 * Crear una solicitud de cambio de Story Points
 */
export const createRequest = async (data) => {
  try {
    const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), {
      taskId: data.taskId,
      taskTitle: data.taskTitle,
      type: 'story_points_change',
      requestedBy: data.requestedBy,
      requestedByName: data.requestedByName,
      currentStoryPoints: data.currentStoryPoints,
      requestedStoryPoints: data.requestedStoryPoints,
      reason: data.reason,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear solicitud:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Aprobar una solicitud: actualiza los SP de la tarea, registra en historial, y elimina la solicitud
 */
export const approveRequest = async (request) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, request.taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      return { success: false, error: 'Tarea no encontrada' };
    }

    // Actualizar Story Points y registrar en historial
    await updateDoc(taskRef, {
      storyPoints: request.requestedStoryPoints,
      updatedAt: serverTimestamp(),
      movementHistory: arrayUnion({
        type: 'sp_change_approved',
        from: request.currentStoryPoints,
        to: request.requestedStoryPoints,
        reason: request.reason,
        requestedBy: request.requestedBy,
        requestedByName: request.requestedByName,
        timestamp: new Date()
      })
    });

    // Eliminar la solicitud
    const requestRef = doc(db, REQUESTS_COLLECTION, request.id);
    await deleteDoc(requestRef);

    return { success: true };
  } catch (error) {
    console.error('Error al aprobar solicitud:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Rechazar una solicitud: registra en historial de la tarea y elimina la solicitud
 */
export const rejectRequest = async (request) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, request.taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      return { success: false, error: 'Tarea no encontrada' };
    }

    // Registrar rechazo en historial
    await updateDoc(taskRef, {
      updatedAt: serverTimestamp(),
      movementHistory: arrayUnion({
        type: 'sp_change_rejected',
        requestedFrom: request.currentStoryPoints,
        requestedTo: request.requestedStoryPoints,
        reason: request.reason,
        requestedBy: request.requestedBy,
        requestedByName: request.requestedByName,
        timestamp: new Date()
      })
    });

    // Eliminar la solicitud
    const requestRef = doc(db, REQUESTS_COLLECTION, request.id);
    await deleteDoc(requestRef);

    return { success: true };
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Suscribirse a todas las solicitudes pendientes (para admins)
 */
export const subscribeToAllRequests = (callback) => {
  try {
    const q = query(
      collection(db, REQUESTS_COLLECTION),
      where('status', '==', 'pending')
    );

    return onSnapshot(q,
      (snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });
        // Ordenar en el cliente (evitar índice compuesto)
        requests.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
        callback(requests);
      },
      (error) => {
        console.error('Error al escuchar solicitudes:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error al inicializar suscripcion a solicitudes:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Suscribirse a las solicitudes de un usuario específico
 */
export const subscribeToUserRequests = (userId, callback) => {
  try {
    const q = query(
      collection(db, REQUESTS_COLLECTION),
      where('status', '==', 'pending'),
      where('requestedBy', '==', userId)
    );

    return onSnapshot(q,
      (snapshot) => {
        const requests = [];
        snapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });
        // Ordenar en el cliente (evitar índice compuesto)
        requests.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
        callback(requests);
      },
      (error) => {
        console.error('Error al escuchar solicitudes del usuario:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error al inicializar suscripcion a solicitudes del usuario:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Suscribirse al conteo de solicitudes pendientes (para badge del sidebar)
 * Si se pasa userId, cuenta solo las del usuario; si no, cuenta todas (admin)
 */
export const subscribeToPendingRequestCount = (callback, userId = null) => {
  try {
    let q;
    if (userId) {
      q = query(
        collection(db, REQUESTS_COLLECTION),
        where('status', '==', 'pending'),
        where('requestedBy', '==', userId)
      );
    } else {
      q = query(
        collection(db, REQUESTS_COLLECTION),
        where('status', '==', 'pending')
      );
    }

    return onSnapshot(q,
      (snapshot) => {
        callback(snapshot.size);
      },
      (error) => {
        console.error('Error al contar solicitudes pendientes:', error);
        callback(0);
      }
    );
  } catch (error) {
    console.error('Error al inicializar conteo de solicitudes:', error);
    callback(0);
    return () => {};
  }
};
