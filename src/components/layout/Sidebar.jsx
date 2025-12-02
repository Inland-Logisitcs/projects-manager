import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/images/logo.svg';
import Icon from '../common/Icon';
import '../../styles/Sidebar.css';

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const baseMenuItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      icon: 'kanban',
      label: 'Tablero'
    },
    {
      id: 'backlog',
      path: '/backlog',
      icon: 'list',
      label: 'Backlog'
    },
    {
      id: 'projects',
      path: '/projects',
      icon: 'timeline',
      label: 'Cronograma'
    },
    {
      id: 'archived',
      path: '/archived',
      icon: 'archive',
      label: 'Archivados'
    }
  ];

  // Agregar el menú de usuarios solo si es admin
  const menuItems = isAdmin
    ? [
        ...baseMenuItems,
        {
          id: 'users',
          path: '/users',
          icon: 'users',
          label: 'Usuarios',
          adminOnly: true
        }
      ]
    : baseMenuItems;

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header flex items-center justify-between p-base">
        <div className="sidebar-logo flex items-center gap-sm">
          <img src={logo} alt="Sync Projects" className="sidebar-logo-img" />
          {!collapsed && <span className="font-bold text-lg text-primary">Sync Projects</span>}
        </div>
        <button className="sidebar-toggle flex items-center justify-center" onClick={onToggle}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="sidebar-nav flex-1 py-base">
        {menuItems.map(item => (
          <Link
            key={item.id}
            to={item.path}
            className={`sidebar-item flex items-center gap-sm ${isActive(item.path) ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="sidebar-icon">
              <Icon name={item.icon} size={22} />
            </span>
            {!collapsed && <span className="sidebar-label">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
