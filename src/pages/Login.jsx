import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/images/logo.svg';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      setLoading(false);
      return;
    }

    const result = await login(email, password, rememberMe);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Branding panel */}
      <div className="login-brand-panel">
        <div className="login-brand-content">
          <img src={logo} alt="Sync Projects" className="login-brand-logo" />
          <h1 className="login-brand-title">Sync Projects</h1>
          <p className="login-brand-subtitle">Gestor de Proyectos</p>
        </div>
        <div className="login-brand-footer">
          <p>Inland Logistics</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2 className="login-form-title">Iniciar Sesión</h2>
            <p className="login-form-description">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="label">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
                autoComplete="email"
                className="input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
                className="input"
              />
            </div>

            <div className="checkbox">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="rememberMe">Recordarme</label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg login-submit-btn"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="login-form-note">
            Los usuarios deben ser creados desde el panel de administración
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
