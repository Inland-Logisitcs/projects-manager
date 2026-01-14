import { useState, useEffect } from 'react';
import { getUserProfile } from '../../services/userService';

// Caché global de perfiles de usuario para evitar recargas innecesarias
const userProfileCache = new Map();

// Paleta de colores predefinida para avatares
const AVATAR_COLORS = [
  '#015E7C', // Primary - Azul oscuro
  '#0099CC', // Accent - Azul claro
  '#2E7D32', // Verde
  '#7B1FA2', // Púrpura
  '#C62828', // Rojo
  '#F57C00', // Naranja
  '#0288D1', // Azul
  '#00796B', // Verde azulado
  '#5D4037', // Marrón
  '#455A64', // Gris azulado
  '#E64A19', // Naranja rojizo
  '#6A1B9A', // Púrpura oscuro
  '#1976D2', // Azul medio
  '#388E3C', // Verde medio
  '#D32F2F', // Rojo medio
  '#F57F17', // Amarillo oscuro
];

// Función para generar un color único basado en una cadena (email o nombre)
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Seleccionar color de la paleta basándose en el hash
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const UserAvatar = ({ userId, userName, size = 24, showName = false, className = '', isOverbooked = false }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Verificar si el perfil ya está en caché
    if (userProfileCache.has(userId)) {
      setUser(userProfileCache.get(userId));
      return;
    }

    // Cargar perfil en segundo plano (sin bloquear el render)
    const fetchUser = async () => {
      const result = await getUserProfile(userId);
      if (result.success) {
        // Guardar en caché
        userProfileCache.set(userId, result.user);
        setUser(result.user);
      }
    };

    fetchUser();
  }, [userId]);

  // Si no hay userId, mostrar avatar "NA" (Not Assigned)
  if (!userId) {
    return (
      <div
        className={`avatar ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          fontSize: `${size * 0.4}px`,
          backgroundColor: 'transparent',
          border: '2px dashed var(--border-color)',
          color: 'var(--text-secondary)'
        }}
        title="Sin asignar"
      >
        NA
      </div>
    );
  }

  // Usar el perfil cargado si está disponible, sino usar el userName como fallback
  const displayName = user?.displayName || user?.email || userName || 'Usuario';
  const initials = displayName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generar color único basado en el email o userId
  const backgroundColor = stringToColor(user?.email || userId);

  // Estilos adicionales cuando está overbooked
  const overbookedStyles = isOverbooked ? {
    border: '2px solid #EF4444',
    boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)'
  } : {};

  const tooltipText = isOverbooked
    ? `${displayName} (¡Sobrecargado!)`
    : displayName;

  if (!showName) {
    return (
      <div
        className={`avatar ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          fontSize: `${size * 0.4}px`,
          backgroundColor: backgroundColor,
          ...overbookedStyles
        }}
        title={tooltipText}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`user-avatar-container ${className}`}>
      <div
        className="avatar"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          fontSize: `${size * 0.4}px`,
          backgroundColor: backgroundColor,
          ...overbookedStyles
        }}
        title={tooltipText}
      >
        {initials}
      </div>
      <span className="user-name">{displayName}</span>
    </div>
  );
};

export default UserAvatar;
