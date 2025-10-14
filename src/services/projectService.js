import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
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
        console.log('📊 Proyectos cargados:', projects.length);
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
