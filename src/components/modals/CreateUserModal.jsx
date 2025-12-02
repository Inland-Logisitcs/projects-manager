import { useState, useEffect } from 'react';
import Icon from '../common/Icon';

const CreateUserModal = ({ isOpen, onClose, onSave, user = null, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'user',
    disabled: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        email: user.email || '',
        password: '',
        displayName: user.displayName || '',
        role: user.role || 'user',
        disabled: user.disabled || false
      });
    } else {
      setFormData({
        email: '',
        password: '',
        displayName: '',
        role: 'user',
        disabled: false
      });
    }
    setErrors({});
  }, [user, mode, isOpen]);

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password }));
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    } else if (mode === 'edit' && formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const dataToSend = mode === 'edit'
      ? { ...formData, id: user.id }
      : formData;

    const result = await onSave(dataToSend, mode);

    if (result.success) {
      setFormData({ email: '', password: '', displayName: '', role: 'user', disabled: false });
      setErrors({});
      onClose();
    } else {
      setErrors({ submit: result.error });
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setFormData({ email: '', password: '', displayName: '', role: 'user', disabled: false });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{mode === 'edit' ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
          <button className="modal-close" onClick={handleClose}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="email" className="label label-required">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="usuario@ejemplo.com"
                disabled={isSubmitting || mode === 'edit'}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className={`label ${mode === 'create' ? 'label-required' : ''}`}>
                Contraseña
                {mode === 'edit' && <span className="text-xs text-tertiary"> (dejar vacío para no cambiar)</span>}
              </label>
              <div className="flex gap-sm">
                <input
                  type="text"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder={mode === 'edit' ? 'Nueva contraseña (opcional)' : 'Mínimo 6 caracteres'}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={generatePassword}
                  disabled={isSubmitting}
                  title="Generar contraseña segura"
                >
                  Generar
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="displayName" className="label label-required">Nombre</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className={`input ${errors.displayName ? 'input-error' : ''}`}
                placeholder="Nombre completo"
                disabled={isSubmitting}
              />
              {errors.displayName && <span className="error-message">{errors.displayName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="role" className="label">Rol</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="select"
                disabled={isSubmitting}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="checkbox">
              <input
                type="checkbox"
                id="disabled"
                name="disabled"
                checked={formData.disabled}
                onChange={(e) => setFormData(prev => ({ ...prev, disabled: e.target.checked }))}
                disabled={isSubmitting}
              />
              <label htmlFor="disabled">Usuario deshabilitado</label>
            </div>

            {errors.submit && (
              <div className="flex items-center gap-sm error-message">
                <Icon name="alert-circle" size={16} />
                {errors.submit}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (mode === 'edit' ? 'Guardando...' : 'Creando...')
                : (mode === 'edit' ? 'Guardar Cambios' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
