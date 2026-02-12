import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Icon from '../common/Icon';
import '../../styles/MainLayout.css';

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    closeMobileMenu();
  }, [navigate]);

  return (
    <div className="main-layout flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onToggle={toggleSidebar}
        onMobileClose={closeMobileMenu}
      />

      {mobileMenuOpen && (
        <div className="mobile-backdrop" onClick={closeMobileMenu} />
      )}

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="mobile-header">
          <button
            className="mobile-menu-button btn btn-icon"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <Icon name="menu" size={22} />
          </button>
        </header>

        <main className="main-container flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
