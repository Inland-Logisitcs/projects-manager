import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, deleteUser as deleteAuthUser } from 'firebase/auth';
import { db, secondaryAuth } from '../config/firebase';

const USERS_COLLECTION = 'users';

/**
 * Crear nuevo usuario en Firebase Auth y Firestore
 * @param {object} userData - Datos del usuario { email, password, displayName, role }
 * @returns {Promise<{success: boolean, uid?: string, error?: string}>}
 */
export const createNewUser = async (userData) => {
  try {
    const { email, password, displayName, role } = userData;

    // Crear usuario usando la instancia secundaria de Auth para no cerrar sesión del admin
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;

    // Crear perfil en Firestore
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, {
      email,
      displayName: displayName || '',
      role: role || 'user',
      disabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Cerrar sesión en la instancia secundaria inmediatamente
    await signOut(secondaryAuth);

    return { success: true, uid };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    let errorMessage = error.message;

    // Mensajes de error personalizados
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'El email ya está en uso';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email inválido';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Operación no permitida';
        break;
      default:
        break;
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Crear o actualizar perfil de usuario con rol
 * @param {string} uid - Firebase Auth UID
 * @param {object} userData - Datos del usuario { email, displayName, role }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, {
      email: userData.email,
      displayName: userData.displayName || '',
      role: userData.role || 'user', // 'admin' o 'user'
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error al crear perfil de usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener perfil de usuario por UID
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { success: true, user: { id: userSnap.id, ...userSnap.data() } };
    } else {
      return { success: false, error: 'Usuario no encontrado' };
    }
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener todos los usuarios
 * @returns {Promise<{success: boolean, users?: array, error?: string}>}
 */
export const getAllUsers = async () => {
  try {
    const usersQuery = query(
      collection(db, USERS_COLLECTION),
      orderBy('email', 'asc')
    );
    const snapshot = await getDocs(usersQuery);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, users };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Suscribirse a cambios en la lista de usuarios en tiempo real
 * @param {function} callback - Función que recibe array de usuarios
 * @returns {function} Función para cancelar suscripción
 */
export const subscribeToUsers = (callback) => {
  const usersQuery = query(
    collection(db, USERS_COLLECTION),
    orderBy('email', 'asc')
  );

  return onSnapshot(
    usersQuery,
    (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(users);
    },
    (error) => {
      console.error('Error en suscripción de usuarios:', error);
      callback([]);
    }
  );
};

/**
 * Actualizar usuario (solo admin)
 * @param {string} uid - Firebase Auth UID
 * @param {object} updates - Campos a actualizar { displayName, role }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUser = async (uid, updates) => {
  try {
    const { displayName, role } = updates;

    if (role && !['admin', 'user'].includes(role)) {
      return { success: false, error: 'Rol inválido' };
    }

    const firestoreUpdates = {
      updatedAt: serverTimestamp()
    };

    if (displayName !== undefined) {
      firestoreUpdates.displayName = displayName;
    }

    if (role !== undefined) {
      firestoreUpdates.role = role;
    }

    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, firestoreUpdates);

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);

    let errorMessage = error.message;
    if (error.code === 'permission-denied') {
      errorMessage = 'Permisos insuficientes para actualizar usuario';
    }

    return { success: false, error: errorMessage };
  }
};

/**
 * Actualizar rol de usuario (solo admin)
 * @param {string} uid - Firebase Auth UID
 * @param {string} role - Nuevo rol ('admin' o 'user')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserRole = async (uid, role) => {
  return updateUser(uid, { role });
};

/**
 * Actualizar información de usuario
 * @param {string} uid - Firebase Auth UID
 * @param {object} updates - Campos a actualizar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar perfil de usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar usuario (solo admin)
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteUser = async (uid) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(userRef);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verificar si un usuario es administrador
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<{success: boolean, isAdmin?: boolean, error?: string}>}
 */
export const checkIsAdmin = async (uid) => {
  try {
    const result = await getUserProfile(uid);
    if (result.success) {
      return { success: true, isAdmin: result.user.role === 'admin' };
    }
    return { success: false, isAdmin: false, error: result.error };
  } catch (error) {
    console.error('Error al verificar rol de admin:', error);
    return { success: false, isAdmin: false, error: error.message };
  }
};

/**
 * Habilitar o deshabilitar usuario (solo admin)
 * @param {string} uid - Firebase Auth UID
 * @param {boolean} disabled - true para deshabilitar, false para habilitar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const toggleUserStatus = async (uid, disabled) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      disabled,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);

    let errorMessage = error.message;
    if (error.code === 'permission-denied') {
      errorMessage = 'Permisos insuficientes para cambiar estado del usuario';
    }

    return { success: false, error: errorMessage };
  }
};
