import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';

const PROJECTS_COLLECTION = 'projects';

// Crear un nuevo proyecto
export const createProject = async (projectData) => {
  try {
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    return { success: false, error: error.message };
  }
};

// Actualizar un proyecto
export const updateProject = async (projectId, updates) => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await updateDoc(projectRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    return { success: false, error: error.message };
  }
};

// Eliminar un proyecto
export const deleteProject = async (projectId) => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    await deleteDoc(projectRef);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    return { success: false, error: error.message };
  }
};

// Escuchar cambios en tiempo real
export const subscribeToProjects = (callback) => {
  try {
    const q = query(collection(db, PROJECTS_COLLECTION), orderBy('createdAt', 'desc'));

    return onSnapshot(q,
      (snapshot) => {
        const projects = [];
        snapshot.forEach((doc) => {
          projects.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(projects);
      },
      (error) => {
        console.error('❌ Error al escuchar proyectos:', {
          code: error.code,
          message: error.message
        });

        if (error.code === 'permission-denied') {
          console.error('🔒 PERMISOS DENEGADOS: Verifica las reglas de Firestore para la colección projects');
        }

        callback([]);
      }
    );
  } catch (error) {
    console.error('❌ Error al inicializar subscripción de proyectos:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Agregar una dependencia a un proyecto
 * @param {string} projectId - ID del proyecto
 * @param {string} dependsOnProjectId - ID del proyecto del que depende
 * @returns {Object} - Resultado de la operación
 */
export const addProjectDependency = async (projectId, dependsOnProjectId) => {
  try {
    if (projectId === dependsOnProjectId) {
      return { success: false, error: 'Un proyecto no puede depender de sí mismo' };
    }

    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return { success: false, error: 'Proyecto no encontrado' };
    }

    const dependencies = projectDoc.data().dependencies || [];

    // Verificar que no exista ya esta dependencia
    if (dependencies.includes(dependsOnProjectId)) {
      return { success: false, error: 'Esta dependencia ya existe' };
    }

    await updateDoc(projectRef, {
      dependencies: arrayUnion(dependsOnProjectId),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al agregar dependencia al proyecto:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar una dependencia de un proyecto
 * @param {string} projectId - ID del proyecto
 * @param {string} dependsOnProjectId - ID del proyecto del que ya no depende
 * @returns {Object} - Resultado de la operación
 */
export const removeProjectDependency = async (projectId, dependsOnProjectId) => {
  try {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return { success: false, error: 'Proyecto no encontrado' };
    }

    const dependencies = projectDoc.data().dependencies || [];
    const updatedDependencies = dependencies.filter(id => id !== dependsOnProjectId);

    await updateDoc(projectRef, {
      dependencies: updatedDependencies,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar dependencia del proyecto:', error);
    return { success: false, error: error.message };
  }
};
