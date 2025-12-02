import { useState, useEffect } from 'react';
import { subscribeToUsers } from '../../services/userService';
import UserAvatar from './UserAvatar';
import '../../styles/UserSelect.css';

const UserSelect = ({
  value,
  onChange,
  placeholder = 'Sin asignar',
  className = '',
  mode = 'select' // 'select' o 'list'
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers.filter(user => !user.disabled));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Modo lista - muestra listado directo de usuarios
  if (mode === 'list') {
    if (loading) {
      return <div className="user-list-loading">Cargando usuarios...</div>;
    }

    return (
      <div className="user-list">
        {value && (
          <div
            className="user-list-item"
            onClick={() => onChange(null)}
          >
            <span className="user-list-name">Sin asignar</span>
          </div>
        )}
        {users.map(user => (
          <div
            key={user.id}
            className={`user-list-item ${value === user.id ? 'selected' : ''}`}
            onClick={() => onChange(user.id)}
          >
            <UserAvatar userId={user.id} size={24} />
            <span className="user-list-name">{user.displayName || user.email}</span>
          </div>
        ))}
      </div>
    );
  }

  // Modo select - select HTML estándar
  return (
    <select
      className={`select ${className}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={loading}
    >
      <option value="">{loading ? 'Cargando...' : placeholder}</option>
      {users.map(user => (
        <option key={user.id} value={user.id}>
          {user.displayName || user.email}
        </option>
      ))}
    </select>
  );
};

export default UserSelect;
