import { useState, useEffect } from 'react';
import { subscribeToProjects, createProject, updateProject, deleteProject } from '../services/projectService';
import GanttTimeline from '../components/timeline/GanttTimeline';
import Icon from '../components/common/Icon';
import Toast from '../components/common/Toast';
import '../styles/Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' });

  useEffect(() => {
    const unsubscribe = subscribeToProjects((fetchedProjects) => {
      setProjects(fetchedProjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateProject = async (projectData) => {
    const result = await createProject(projectData);
    if (result.success) {
      setShowModal(false);
    } else {
      setToast({
        isOpen: true,
        message: `Error al crear proyecto: ${result.error}`,
        type: 'error'
      });
    }
  };

  const handleUpdateProject = async (projectId, updates) => {
    const result = await updateProject(projectId, updates);
    if (!result.success) {
      setToast({
        isOpen: true,
        message: `Error al actualizar proyecto: ${result.error}`,
        type: 'error'
      });
    }
  };

  const handleDeleteProject = async (projectId) => {
    const result = await deleteProject(projectId);
    if (!result.success) {
      setToast({
        isOpen: true,
        message: `Error al eliminar proyecto: ${result.error}`,
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="projects-page">
        <div className="empty-state">
          <div className="spinner"></div>
          <p>Cargando cronograma...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast.isOpen && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ isOpen: false, message: '', type: 'error' })}
        />
      )}

      <div className="projects-page">
        <div className="projects-header mb-md">
          <div className="flex justify-between items-center mb-lg">
            <div className="flex items-center gap-base">
              <h1 className="heading-1 text-primary">Cronograma</h1>
              <span className="project-count">
                <Icon name="folder" size={16} />
                {projects.length}
              </span>
            </div>
            <button className="btn btn-primary flex items-center gap-xs" onClick={() => setShowModal(true)}>
              <Icon name="plus" size={20} />
              <span>Nuevo Proyecto</span>
            </button>
          </div>
        </div>

      {projects.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-state-content">
            <div className="empty-illustration">
              <Icon name="chart" size={80} className="empty-icon" />
            </div>
            <h2>Comienza tu primer proyecto</h2>
            <p>Los proyectos te ayudan a organizar y dar seguimiento a tu trabajo de manera efectiva</p>
            <button className="btn-create-first" onClick={() => setShowModal(true)}>
              <Icon name="plus" size={20} />
              <span>Crear mi primer proyecto</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="projects-timeline">
          <GanttTimeline
            projects={projects}
            onUpdate={handleUpdateProject}
            onDelete={handleDeleteProject}
          />
        </div>
      )}

      {showModal && (
        <ProjectModal
          onClose={() => setShowModal(false)}
          onSave={handleCreateProject}
        />
      )}
      </div>
    </>
  );
};

const ProjectModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'ID',
    status: 'planning',
    progress: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Nuevo Proyecto</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Proyecto *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del proyecto"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del proyecto"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Tipo de Proyecto *</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="ID">ID</option>
              <option value="Functionality">Functionality</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha de Inicio</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Fecha de Fin</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Crear Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Projects;
