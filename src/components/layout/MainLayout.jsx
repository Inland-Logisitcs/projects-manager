import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Icon from '../common/Icon';
import '../../styles/MainLayout.css';

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close mobile menu on navigation
  useEffect(() => {
    closeMobileMenu();
  }, [navigate]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  return (
    <div className="main-layout flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onToggle={toggleSidebar}
        onMobileClose={closeMobileMenu}
      />

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={closeMobileMenu}
        />
      )}

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <header className="main-header flex items-center justify-between px-base">
          <div className="flex items-center gap-base">
            {/* Mobile menu button */}
            <button
              className="mobile-menu-button btn btn-icon"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <Icon name="menu" size={24} />
            </button>

            <h1 className="header-title heading-3 m-0">Sync Projects</h1>
          </div>

          <div className="flex items-center gap-base">
            <div className="user-menu">
              <button
                className="user-button flex items-center gap-sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="avatar avatar-sm">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="user-email text-sm font-medium text-primary">{user?.email}</span>
              </button>

              {showUserMenu && (
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
        <main className="main-container flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
