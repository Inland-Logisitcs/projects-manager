import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUsers, createNewUser, updateUser, toggleUserStatus } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import Table from '../components/tables/Table';
import TableActions from '../components/tables/TableActions';
import CreateUserModal from '../components/modals/CreateUserModal';
import Icon from '../components/common/Icon';
import '../styles/Users.css';

const Users = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // Verificar que el usuario es admin
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    // Suscribirse a cambios en tiempo real
    const unsubscribe = subscribeToUsers((usersData) => {
      // Añadir campo 'status' para filtrado
      const usersWithStatus = usersData.map(user => ({
        ...user,
        status: user.disabled ? 'disabled' : 'enabled'
      }));
      setUsers(usersWithStatus);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, navigate]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMode('create');
    setSelectedUser(null);
  };

  const handleSaveUser = async (userData, mode) => {
    if (mode === 'create') {
      const result = await createNewUser(userData);
      if (result.success) {
      } else {
        console.error('Error al crear usuario:', result.error);
      }
      return result;
    } else {
      const { id, email, password, ...updates } = userData;
      const result = await updateUser(id, updates);
      if (result.success) {
      } else {
        console.error('Error al actualizar usuario:', result.error);
      }
      return result;
    }
  };

  const handleToggleUserStatus = async (user) => {
    const newStatus = !user.disabled;
    const result = await toggleUserStatus(user.id, newStatus);
    if (!result.success) {
      console.error('Error al cambiar estado del usuario:', result.error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeClass = (role) => {
    return role === 'admin' ? 'role-badge-admin' : 'role-badge-user';
  };

  // Definir columnas de la tabla
  const columns = [
    {
      key: 'email',
      label: 'Email',
      width: '20%'
    },
    {
      key: 'displayName',
      label: 'Nombre',
      width: '15%'
    },
    {
      key: 'role',
      label: 'Rol',
      width: '12%',
      align: 'center',
      filterOptions: [
        { value: 'admin', label: 'Administrador' },
        { value: 'user', label: 'Usuario' }
      ]
    },
    {
      key: 'status',
      label: 'Estado',
      width: '10%',
      align: 'center',
      filterOptions: [
        { value: 'enabled', label: 'Habilitado' },
        { value: 'disabled', label: 'Deshabilitado' }
      ]
    },
    {
      key: 'createdAt',
      label: 'Creado',
      width: '13%',
      filterable: false
    },
    {
      key: 'updatedAt',
      label: 'Última Actualización',
      width: '13%',
      filterable: false
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '17%',
      align: 'right',
      filterable: false
    }
  ];

  // Renderizar celdas personalizadas
  const renderCell = (user, column) => {
    switch (column.key) {
      case 'email':
        return <span className="user-email">{user.email}</span>;

      case 'displayName':
        return (
          <span className="user-name">
            {user.displayName || <span className="text-tertiary">Sin nombre</span>}
          </span>
        );

      case 'role':
        return (
          <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
            {user.role === 'admin' ? 'Administrador' : 'Usuario'}
          </span>
        );

      case 'status':
        return (
          <span className={`status-badge ${user.disabled ? 'status-disabled' : 'status-enabled'}`}>
            {user.disabled ? 'Deshabilitado' : 'Habilitado'}
          </span>
        );

      case 'createdAt':
        return <span className="user-date">{formatDate(user.createdAt)}</span>;

      case 'updatedAt':
        return <span className="user-date">{formatDate(user.updatedAt)}</span>;

      case 'actions':
        return (
          <TableActions
            rowData={user}
            actions={[
              {
                name: 'edit',
                icon: 'edit',
                label: 'Editar',
                onClick: (userData) => handleOpenEditModal(userData),
                variant: 'ghost',
                title: 'Editar usuario'
              },
              {
                name: 'toggle-status',
                icon: user.disabled ? 'user-check' : 'user-x',
                label: user.disabled ? 'Habilitar' : 'Deshabilitar',
                onClick: (userData) => handleToggleUserStatus(userData),
                variant: 'ghost',
                title: user.disabled ? 'Habilitar usuario' : 'Deshabilitar usuario'
              }
            ]}
            size="small"
          />
        );

      default:
        return undefined;
    }
  };

  return (
    <div className="users-container">
      <div className="users-header mb-md">
        <div className="flex items-start justify-between gap-lg">
          <div>
            <h1 className="heading-1 text-primary mb-xs">Gestión de Usuarios</h1>
            <p className="text-base text-secondary">
              Total de usuarios: <strong className="text-primary">{users.length}</strong>
            </p>
          </div>
          <button
            className="btn btn-primary flex items-center gap-sm"
            onClick={handleOpenCreateModal}
          >
            <Icon name="user-plus" size={18} />
            Crear Usuario
          </button>
        </div>
      </div>

      <Table
        showFilters={true}
        searchPlaceholder="Buscar usuarios..."
        columns={columns}
        data={users}
        renderCell={renderCell}
        loading={loading}
        emptyMessage="No hay usuarios registrados"
        hoverable={true}
      />

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        user={selectedUser}
        mode={modalMode}
      />
    </div>
  );
};

export default Users;
