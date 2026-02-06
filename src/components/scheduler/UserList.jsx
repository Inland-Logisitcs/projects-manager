import Icon from '../common/Icon';

/**
 * Componente para mostrar la lista de usuarios y sus capacidades
 */
const UserList = ({ usuarios }) => {
  const getCapacidadLabel = (capacidad) => {
    if (capacidad >= 1.0) return 'Full-time';
    if (capacidad >= 0.5) return 'Part-time';
    return 'Custom';
  };

  const getCapacidadColor = (capacidad) => {
    if (capacidad >= 1.0) return 'badge-success';
    if (capacidad >= 0.5) return 'badge-warning';
    return 'badge-secondary';
  };

  if (!usuarios || usuarios.length === 0) {
    return (
      <div className="empty-state">
        <Icon name="users" size={48} />
        <p>No hay usuarios disponibles para asignar</p>
        <p className="text-sm text-secondary">
          Los usuarios se gestionan en la página de administración
        </p>
      </div>
    );
  }

  return (
    <div className="user-list-compact">
      <div className="flex justify-between items-center mb-sm">
        <h3 className="heading-3 text-primary">Usuarios</h3>
        <span className="badge badge-secondary">{usuarios.length}</span>
      </div>

      <div className="user-chips">
        {usuarios.map(usuario => {
          const capacidad = usuario.dailyCapacity || usuario.capacidadDiaria || 1.0;

          return (
            <div key={usuario.id} className="user-chip">
              <div className="user-chip-content">
                <div className="avatar avatar-sm">
                  {(usuario.displayName || usuario.nombre || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="user-chip-info">
                  <span className="user-chip-name">{usuario.displayName || usuario.nombre}</span>
                  <span className={`badge badge-xs ${getCapacidadColor(capacidad)}`}>
                    {capacidad} SP/día
                  </span>
                </div>
                {usuario.role === 'admin' && (
                  <Icon name="shield" size={14} className="text-primary" />
                )}
              </div>

              {/* Hover card */}
              <div className="user-hover-card">
                <div className="flex items-start gap-sm mb-sm">
                  <div className="avatar">
                    {(usuario.displayName || usuario.nombre || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-primary mb-xs">
                      {usuario.displayName || usuario.nombre}
                    </h4>
                    <p className="text-xs text-tertiary">{usuario.email}</p>
                  </div>
                </div>

                <div className="divider mb-sm"></div>

                <div className="flex items-center justify-between mb-xs">
                  <span className="text-xs text-tertiary">Capacidad Diaria</span>
                  <span className={`badge ${getCapacidadColor(capacidad)}`}>
                    {getCapacidadLabel(capacidad)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-tertiary">Story Points/día</span>
                  <span className="text-sm font-bold text-primary">{capacidad}</span>
                </div>

                {usuario.role === 'admin' && (
                  <>
                    <div className="divider mt-sm mb-sm"></div>
                    <div className="flex items-center gap-xs">
                      <Icon name="shield" size={14} className="text-primary" />
                      <span className="text-xs text-primary font-bold">Administrador</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserList;
