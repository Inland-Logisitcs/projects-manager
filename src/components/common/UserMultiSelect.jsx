import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { subscribeToUsers } from '../../services/userService';
import UserAvatar from './UserAvatar';
import Icon from './Icon';
import '../../styles/UserMultiSelect.css';

// Estado global para mantener qué dropdown está abierto
const openDropdowns = new Set();

const UserMultiSelect = ({
  value = [], // Array de IDs de usuarios seleccionados
  onChange,
  maxDisplay = 3, // Máximo número de avatares a mostrar antes de "+N"
  instanceKey // ID único estable para identificar este dropdown
}) => {
  const [isOpen, setIsOpen] = useState(() => openDropdowns.has(instanceKey));
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((fetchedUsers) => {
      setUsers(fetchedUsers.filter(user => !user.disabled));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sincronizar estado local con el Set global
  useEffect(() => {
    if (isOpen) {
      openDropdowns.add(instanceKey);
    } else {
      openDropdowns.delete(instanceKey);
    }
  }, [isOpen, instanceKey]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      openDropdowns.delete(instanceKey);
    };
  }, [instanceKey]);

  // Recalcular posición cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, [isOpen]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Verificar si el clic fue en el dropdown o sus elementos internos
      if (dropdownRef.current?.contains(event.target)) {
        return;
      }

      // Verificar si el clic fue en el trigger o sus elementos internos
      if (containerRef.current?.contains(event.target)) {
        return;
      }

      setIsOpen(false);
    };

    // Usar un pequeño delay para asegurar que el dropdown esté renderizado
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);

  const handleToggleUser = (userId) => {
    const newValue = value.includes(userId)
      ? value.filter(id => id !== userId)
      : [...value, userId];
    onChange(newValue);
  };

  const handleToggleDropdown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }

    setIsOpen(!isOpen);
  };

  return (
    <div className="user-multiselect-container" ref={containerRef}>
      {/* Trigger - Avatares clickeables */}
      <div
        ref={triggerRef}
        className="user-multiselect-trigger"
        onClick={handleToggleDropdown}
      >
        {value.length > 0 ? (
          <div className="user-multiselect-avatars">
            {value.slice(0, maxDisplay).map((userId, idx) => (
              <div
                key={userId}
                className="user-multiselect-avatar"
                style={{
                  marginLeft: idx > 0 ? '-8px' : '0',
                  zIndex: value.length - idx
                }}
              >
                <UserAvatar userId={userId} size={28} />
              </div>
            ))}
            {value.length > maxDisplay && (
              <div className="user-multiselect-count">
                +{value.length - maxDisplay}
              </div>
            )}
          </div>
        ) : (
          <div className="user-multiselect-avatars">
            <div className="user-multiselect-avatar-na">
              NA
            </div>
          </div>
        )}
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          className="user-multiselect-chevron"
        />
      </div>

      {/* Dropdown de selección usando Portal */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="user-multiselect-dropdown"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {loading ? (
            <div className="user-multiselect-loading">
              <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
              <span>Cargando...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="user-multiselect-empty">
              No hay usuarios disponibles
            </div>
          ) : (
            <div className="user-multiselect-list">
              {users.map(user => {
                const isSelected = value.includes(user.id);

                return (
                  <div
                    key={user.id}
                    className={`user-multiselect-option ${isSelected ? 'selected' : ''}`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleUser(user.id);
                    }}
                  >
                    <UserAvatar userId={user.id} size={28} />
                    <div className="user-multiselect-option-text">
                      <span className="user-multiselect-option-name">
                        {user.displayName || user.email}
                      </span>
                      {user.displayName && (
                        <span className="user-multiselect-option-email">
                          {user.email}
                        </span>
                      )}
                    </div>
                    <div className="user-multiselect-option-checkbox">
                      {isSelected && <Icon name="check" size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserMultiSelect;
