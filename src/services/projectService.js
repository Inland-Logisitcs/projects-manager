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
  arrayUnion,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const PROJECTS_COLLECTION = 'projects';

// Crear un nuevo proyecto
export const createProject = async (projectData) => {
  try {
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ...projectData,
      priority: projectData.priority ?? 0, // Prioridad por defecto
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
    // Primero intentar ordenar por priority
    const q = query(collection(db, PROJECTS_COLLECTION));

    return onSnapshot(q,
      async (snapshot) => {
        const projects = [];
        let needsMigration = false;

        snapshot.forEach((doc) => {
          const data = doc.data();
          projects.push({
            id: doc.id,
            ...data,
            priority: data.priority ?? 999999 // Valor alto temporal para proyectos sin priority
          });

          // Detectar si hay proyectos sin priority
          if (data.priority === undefined || data.priority === null) {
            needsMigration = true;
          }
        });

        // Ordenar localmente por priority, luego por createdAt
        projects.sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          // Si ambos tienen el mismo priority (o ninguno), ordenar por createdAt
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime; // Más reciente primero
        });

        // Si hay proyectos sin priority, asignarlos automáticamente
        if (needsMigration) {
          console.log('⚠️ Detectados proyectos sin priority, migrando...');
          const updates = projects.map((project, index) => {
            if (project.priority === 999999) {
              const projectRef = doc(db, PROJECTS_COLLECTION, project.id);
              updateDoc(projectRef, {
                priority: index
              }).catch(err => console.error(`Error al actualizar priority de ${project.name}:`, err));
              return { ...project, priority: index };
            }
            return project;
          });
          callback(updates);
        } else {
          callback(projects);
        }
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

// Actualizar el orden de múltiples proyectos
export const updateProjectsOrder = async (projectsWithNewOrder) => {
  try {
    const updatePromises = projectsWithNewOrder.map(({ id, priority }) => {
      const projectRef = doc(db, PROJECTS_COLLECTION, id);
      return updateDoc(projectRef, {
        priority,
        updatedAt: serverTimestamp()
      });
    });

    await Promise.all(updatePromises);
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar orden de proyectos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Guardar snapshots de fecha de finalización proyectada para proyectos.
 * Reemplaza el snapshot anterior de cada proyecto.
 * @param {Array<{projectId: string, fechaFin: Date, diaFin: number}>} snapshots
 * @returns {Object} { success, stats: { success, errors } }
 */
export const saveProjectSnapshots = async (snapshots) => {
  try {
    let successCount = 0;
    let errorCount = 0;

    const updatePromises = snapshots.map(async ({ projectId, fechaFin, diaFin }) => {
      try {
        const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
        await updateDoc(projectRef, {
          snapshot: {
            fechaFin: Timestamp.fromDate(fechaFin),
            diaFin,
            creadoEn: serverTimestamp()
          },
          updatedAt: serverTimestamp()
        });
        successCount++;
      } catch (err) {
        console.error(`Error al guardar snapshot del proyecto ${projectId}:`, err);
        errorCount++;
      }
    });

    await Promise.all(updatePromises);

    if (errorCount > 0 && successCount > 0) {
      return { success: false, partial: true, stats: { success: successCount, errors: errorCount } };
    }
    if (errorCount > 0) {
      return { success: false, error: 'Error al guardar todos los snapshots', stats: { success: successCount, errors: errorCount } };
    }
    return { success: true, stats: { success: successCount, errors: 0 } };
  } catch (error) {
    console.error('Error al guardar snapshots de proyectos:', error);
    return { success: false, error: error.message };
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
