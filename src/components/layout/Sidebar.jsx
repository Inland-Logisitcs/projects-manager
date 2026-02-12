import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToPendingRequestCount } from '../../services/requestService';
import Icon from '../common/Icon';
import '../../styles/Sidebar.css';

const Sidebar = ({ collapsed, mobileOpen, onToggle, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, isAdmin, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const unsubscribe = subscribeToPendingRequestCount(
      (count) => setPendingCount(count)
    );
    return () => unsubscribe();
  }, [user, isAdmin]);

  const mainMenuItems = [
    { id: 'dashboard', path: '/dashboard', icon: 'kanban', label: 'Tablero' },
    { id: 'projects', path: '/projects', icon: 'folder', label: 'Proyectos' },
    { id: 'backlog', path: '/backlog', icon: 'list', label: 'Backlog' },
    { id: 'archived', path: '/archived', icon: 'archive', label: 'Archivados' }
  ];

  const adminMenuItems = isAdmin
    ? [
        { id: 'solicitudes', path: '/solicitudes', icon: 'inbox', label: 'Solicitudes', badge: pendingCount },
        { id: 'users', path: '/users', icon: 'users', label: 'Usuarios' }
      ]
    : [];

  const isActive = (path) => location.pathname === path;

  const handleLinkClick = () => {
    if (onMobileClose) onMobileClose();
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) navigate('/login');
  };

  const displayName = userProfile?.displayName || userProfile?.nombre || user?.email?.split('@')[0] || '';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const renderNavItem = (item) => (
    <Link
      key={item.id}
      to={item.path}
      className={`sidebar-item flex items-center gap-sm ${isActive(item.path) ? 'active' : ''}`}
      title={collapsed ? item.label : ''}
      onClick={handleLinkClick}
    >
      <span className="sidebar-icon">
        <Icon name={item.icon} size={20} />
        {collapsed && item.badge > 0 && (
          <span className="sidebar-badge sidebar-badge-collapsed">{item.badge}</span>
        )}
      </span>
      {!collapsed && (
        <>
          <span className="sidebar-label">{item.label}</span>
          {item.badge > 0 && (
            <span className="sidebar-badge">{item.badge > 99 ? '99+' : item.badge}</span>
          )}
        </>
      )}
    </Link>
  );

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Main navigation */}
      <nav className="sidebar-nav flex-1">
        <div className="sidebar-top flex items-center justify-between">
          {!collapsed && <div className="sidebar-section-label">Menu</div>}
          <button
            className="sidebar-toggle"
            onClick={() => {
              if (window.innerWidth <= 768) {
                onMobileClose();
              } else {
                onToggle();
              }
            }}
            aria-label="Toggle sidebar"
          >
            <Icon name={collapsed ? 'menu' : 'chevron-left'} size={16} />
          </button>
        </div>
        {mainMenuItems.map(renderNavItem)}

        {adminMenuItems.length > 0 && (
          <>
            <div className="sidebar-divider" />
            {!collapsed && <div className="sidebar-section-label">Admin</div>}
            {adminMenuItems.map(renderNavItem)}
          </>
        )}

      </nav>

      {/* User menu */}
      <div className="sidebar-user-wrapper">
        {userMenuOpen && (
          <div className="sidebar-user-menu">
            <button className="sidebar-user-menu-item" onClick={handleLogout}>
              <Icon name="log-out" size={16} />
              <span>Cerrar sesion</span>
            </button>
          </div>
        )}
        <button
          className="sidebar-user-btn"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
        >
          <div className="sidebar-user-avatar">{initials}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          )}
        </button>
      </div>
      {userMenuOpen && (
        <div className="sidebar-user-menu-backdrop" onClick={() => setUserMenuOpen(false)} />
      )}
    </aside>
  );
};

export default Sidebar;
