import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/images/logo.svg';
import Icon from './Icon';
import '../styles/Sidebar.css';

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();

  const menuItems = [
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
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={logo} alt="Sync Projects" />
          {!collapsed && <span>Sync Projects</span>}
        </div>
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <Link
            key={item.id}
            to={item.path}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
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
