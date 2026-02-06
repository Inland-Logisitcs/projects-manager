/**
 * Hook para gestionar el estado de optimización de tareas
 */

import { useState } from 'react';
import { optimizerApi } from '../services/optimizerApi';

/**
 * Hook para optimización de tareas
 * @returns {Object} Estado y funciones de optimización
 */
export const useOptimizer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [progress, setProgress] = useState(0);

  /**
   * Optimizar asignación de tareas
   * @param {Object} params - Parámetros de optimización
   * @returns {Promise<Object|null>} Resultado o null si hay error
   */
  const optimizar = async (params) => {
    setLoading(true);
    setError(null);
    setResultado(null);
    setProgress(0);

    try {
      // Simular progreso (ya que OR-Tools no da feedback en tiempo real)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);

      // Llamar al optimizador
      const response = await optimizerApi.optimize(params);

      clearInterval(progressInterval);
      setProgress(100);

      if (response.success) {
        setResultado(response.data);
        return response.data;
      } else {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError(err.message || 'Error desconocido al optimizar');
      return null;
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  /**
   * Limpiar resultado y errores
   */
  const limpiar = () => {
    setResultado(null);
    setError(null);
    setProgress(0);
  };

  /**
   * Verificar disponibilidad del servicio
   * @returns {Promise<boolean>}
   */
  const verificarDisponibilidad = async () => {
    try {
      return await optimizerApi.checkHealth();
    } catch {
      return false;
    }
  };

  return {
    // Estado
    loading,
    error,
    resultado,
    progress,

    // Funciones
    optimizar,
    limpiar,
    verificarDisponibilidad,

    // Datos derivados
    hasResultado: resultado !== null,
    hasError: error !== null
  };
};
