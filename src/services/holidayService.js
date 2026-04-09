import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

const HOLIDAYS_COLLECTION = 'holidays';

/**
 * Suscribirse a cambios en los dias feriados
 * @param {Function} callback - Funcion que recibe los feriados actualizados
 * @returns {Function} - Funcion para cancelar la suscripcion
 */
export const subscribeToHolidays = (callback) => {
  try {
    const q = query(collection(db, HOLIDAYS_COLLECTION));

    return onSnapshot(q,
      (snapshot) => {
        const holidays = [];
        snapshot.forEach((doc) => {
          holidays.push({
            id: doc.id,
            ...doc.data()
          });
        });
        // Ordenar en el cliente por fecha
        holidays.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        callback(holidays);
      },
      (error) => {
        console.error('Error al escuchar feriados:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error al inicializar suscripcion a feriados:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Obtener todos los feriados (no reactivo)
 * @returns {Promise<Array>} - Lista de feriados
 */
export const getAllHolidays = async () => {
  try {
    const q = query(collection(db, HOLIDAYS_COLLECTION));
    const snapshot = await getDocs(q);
    const holidays = [];
    snapshot.forEach((doc) => {
      holidays.push({ id: doc.id, ...doc.data() });
    });
    holidays.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return holidays;
  } catch (error) {
    console.error('Error al obtener feriados:', error);
    return [];
  }
};

/**
 * Crear un dia feriado
 * @param {Object} holidayData - { date: 'YYYY-MM-DD', name: string }
 * @returns {Object} - Resultado de la operacion
 */
export const createHoliday = async (holidayData) => {
  try {
    if (!holidayData.date || !holidayData.name) {
      return { success: false, error: 'Fecha y nombre son requeridos' };
    }

    const docRef = await addDoc(collection(db, HOLIDAYS_COLLECTION), {
      date: holidayData.date,
      name: holidayData.name.trim(),
      createdAt: serverTimestamp()
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear feriado:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar un dia feriado
 * @param {string} holidayId - ID del feriado
 * @returns {Object} - Resultado de la operacion
 */
export const deleteHoliday = async (holidayId) => {
  try {
    await deleteDoc(doc(db, HOLIDAYS_COLLECTION, holidayId));
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar feriado:', error);
    return { success: false, error: error.message };
  }
};
