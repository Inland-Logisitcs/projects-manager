import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import '../styles/MainLayout.css';

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/login');
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="main-layout">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <h1 className="header-title">Sync Projects</h1>
          </div>

          <div className="header-right">
            <div className="user-menu">
              <button
                className="user-button"
                onClick={() => setShowMenu(!showMenu)}
              >
                <div className="user-avatar">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="user-email">{user?.email}</span>
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  <div className="menu-header">
                    <p className="menu-email">{user?.email}</p>
                  </div>
                  <button className="menu-item" onClick={handleLogout}>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="main-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
