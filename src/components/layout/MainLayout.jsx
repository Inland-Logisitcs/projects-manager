import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import '../../styles/MainLayout.css';

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
    <div className="main-layout flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <header className="main-header flex items-center justify-between p-base px-lg">
          <div className="flex items-center">
            <h1 className="heading-3 m-0">Sync Projects</h1>
          </div>

          <div className="flex items-center gap-base">
            <div className="user-menu">
              <button
                className="user-button flex items-center gap-sm"
                onClick={() => setShowMenu(!showMenu)}
              >
                <div className="avatar avatar-sm">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="user-email text-sm font-medium text-primary">{user?.email}</span>
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  <div className="menu-header p-base">
                    <p className="text-sm text-secondary m-0">{user?.email}</p>
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
        <main className="main-container flex-1 p-2xl px-lg">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
