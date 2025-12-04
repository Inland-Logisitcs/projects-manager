import { useState, useEffect } from 'react';
import { subscribeToProjects } from '../../services/projectService';
import Icon from './Icon';
import '../../styles/ProjectSelect.css';

const ProjectSelect = ({
  value,
  onChange,
  placeholder = 'Sin proyecto',
  className = '',
  mode = 'select' // 'select' o 'list'
}) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((fetchedProjects) => {
      setProjects(fetchedProjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Modo lista - muestra listado directo de proyectos
  if (mode === 'list') {
    if (loading) {
      return <div className="project-list-loading">Cargando proyectos...</div>;
    }

    if (projects.length === 0) {
      return (
        <div className="project-list">
          <div className="project-list-item" style={{ cursor: 'default', opacity: 0.6 }}>
            <Icon name="info" size={16} className="text-tertiary" />
            <span className="project-list-name">No hay proyectos disponibles</span>
          </div>
        </div>
      );
    }

    return (
      <div className="project-list">
        {value && (
          <div
            className="project-list-item"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            <Icon name="x" size={16} className="text-tertiary" />
            <span className="project-list-name">Sin proyecto</span>
          </div>
        )}
        {projects.map(project => (
          <div
            key={project.id}
            className={`project-list-item ${value === project.id ? 'selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(project.id);
            }}
          >
            <Icon name="folder" size={16} className="text-secondary" />
            <span className="project-list-name">{project.name}</span>
          </div>
        ))}
      </div>
    );
  }

  // Modo select - select HTML estándar
  return (
    <select
      className={`select ${className}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={loading}
    >
      <option value="">{loading ? 'Cargando...' : placeholder}</option>
      {projects.map(project => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
};

export default ProjectSelect;
