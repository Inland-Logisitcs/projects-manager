import { useState, useEffect } from 'react';
import { getUserProfile } from '../../services/userService';

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

const UserAvatar = ({ userId, size = 24, showName = false, className = '' }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      const result = await getUserProfile(userId);
      if (result.success) {
        setUser(result.user);
      }
      setLoading(false);
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return <div className={`avatar ${className}`} style={{ width: size, height: size }} />;
  }

  if (!user) {
    return null;
  }

  const displayName = user.displayName || user.email;
  const initials = displayName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generar color único basado en el email (más consistente que displayName)
  const backgroundColor = stringToColor(user.email);

  if (!showName) {
    return (
      <div
        className={`avatar ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: `${size * 0.4}px`,
          backgroundColor: backgroundColor
        }}
        title={displayName}
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
          width: size,
          height: size,
          fontSize: `${size * 0.4}px`,
          backgroundColor: backgroundColor
        }}
        title={displayName}
      >
        {initials}
      </div>
      <span className="user-name">{displayName}</span>
    </div>
  );
};

export default UserAvatar;
