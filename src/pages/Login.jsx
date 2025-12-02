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
    <div className="login-container">
      <div className="card login-card">
        <div className="text-center mb-lg">
          <img src={logo} alt="Sync Projects" className="login-logo" />
          <h1 className="heading-2 mb-xs">Sync Projects</h1>
          <p className="text-base text-secondary">Gestor de Proyectos Kanban</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {error && (
            <div className="login-error text-center">
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
            className="btn btn-primary btn-lg mt-sm"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer mt-md pt-md text-center">
          <p className="text-xs text-secondary">Los usuarios deben ser creados desde el panel de administración</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
