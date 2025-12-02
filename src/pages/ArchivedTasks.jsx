import { useState, useEffect } from 'react';
import { subscribeToArchivedTasks, unarchiveTask, deleteTask } from '../services/taskService';
import Icon from '../components/common/Icon';
import Table from '../components/tables/Table';
import TableActions from '../components/tables/TableActions';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Toast from '../components/common/Toast';
import '../styles/ArchivedTasks.css';

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

const statusLabels = {
  pending: 'Pendiente',
  'in-progress': 'En Progreso',
  qa: 'QA',
  completed: 'Completado'
};

const ArchivedTasks = () => {
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, taskId: null });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' });

  useEffect(() => {
    let isSubscribed = true;

    const unsubscribe = subscribeToArchivedTasks((tasks) => {
      if (isSubscribed) {
        setArchivedTasks(tasks);
        setLoading(false);
        setError(null);
      }
    });

    // Si después de 3 segundos no se han cargado tareas, mostrar ayuda
    const timeout = setTimeout(() => {
      if (isSubscribed) {
        setLoading(prevLoading => {
          // Solo mostrar error si todavía está cargando
          if (prevLoading) {
            setError('timeout');
            return false;
          }
          return prevLoading;
        });
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleUnarchive = (taskId) => {
    setConfirmDialog({
      isOpen: true,
      type: 'restore',
      taskId
    });
  };

  const handlePermanentDelete = (taskId) => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      taskId
    });
  };

  const confirmAction = async () => {
    const { type, taskId } = confirmDialog;
    setConfirmDialog({ isOpen: false, type: null, taskId: null });

    if (type === 'restore') {
      const result = await unarchiveTask(taskId);
      if (!result.success) {
        setToast({
          isOpen: true,
          message: `Error al restaurar la tarea: ${result.error}`,
          type: 'error'
        });
      }
    } else if (type === 'delete') {
      const result = await deleteTask(taskId);
      if (!result.success) {
        setToast({
          isOpen: true,
          message: `Error al eliminar la tarea: ${result.error}`,
          type: 'error'
        });
      }
    }
  };


  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDescriptionExcerpt = (htmlDescription, maxLength = 40) => {
    if (!htmlDescription) return '';

    // Crear un elemento temporal para extraer el texto del HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlDescription;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    // Truncar el texto si es más largo que maxLength
    if (textContent.length > maxLength) {
      return textContent.substring(0, maxLength).trim() + '...';
    }

    return textContent.trim();
  };

  if (loading) {
    return (
      <div className="archived-tasks-page">
        <div className="empty-state">
          <div className="spinner"></div>
          <p>Cargando tareas archivadas...</p>
        </div>
      </div>
    );
  }

  if (error === 'timeout') {
    return (
      <div className="archived-tasks-page">
        <div className="archived-error-state">
          <h2 className="heading-2 text-error mb-base">Problema al cargar tareas archivadas</h2>
          <p className="text-base text-secondary mb-lg">Verifica la consola del navegador para más detalles.</p>
          <button onClick={() => window.location.reload()} className="btn btn-secondary">
            Recargar página
          </button>
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === 'restore' ? 'Restaurar tarea' : 'Eliminar permanentemente'}
        message={
          confirmDialog.type === 'restore'
            ? '¿Restaurar esta tarea al tablero?'
            : '⚠️ ¿ELIMINAR PERMANENTEMENTE esta tarea? Esta acción NO se puede deshacer.'
        }
        confirmText={confirmDialog.type === 'restore' ? 'Restaurar' : 'Eliminar'}
        cancelText="Cancelar"
        confirmVariant={confirmDialog.type === 'restore' ? 'primary' : 'danger'}
        onConfirm={confirmAction}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null, taskId: null })}
      />

      <div className="archived-tasks-page">
        <div className="mb-2xl">
          <h1 className="heading-1 text-primary flex items-center gap-sm mb-xs">
            <Icon name="archive" size={32} />
            Tareas Archivadas
          </h1>
          <p className="text-base text-secondary">
            Total: <strong className="text-primary">{archivedTasks.length}</strong> tareas archivadas
          </p>
        </div>

      <Table
          showFilters={true}
          searchPlaceholder="Buscar tareas archivadas..."
          columns={[
            {
              key: 'title',
              label: 'Título',
              width: '25%'
            },
            {
              key: 'description',
              label: 'Descripción',
              width: '25%'
            },
            {
              key: 'priority',
              label: 'Prioridad',
              width: '12%',
              align: 'center',
              filterOptions: [
                { value: 'low', label: 'Baja' },
                { value: 'medium', label: 'Media' },
                { value: 'high', label: 'Alta' }
              ]
            },
            {
              key: 'status',
              label: 'Estado',
              width: '12%',
              align: 'center',
              filterOptions: [
                { value: 'pending', label: 'Pendiente' },
                { value: 'in-progress', label: 'En Progreso' },
                { value: 'qa', label: 'QA' },
                { value: 'completed', label: 'Completado' }
              ]
            },
            {
              key: 'archivedAt',
              label: 'Archivado',
              width: '16%'
            },
            {
              key: 'actions',
              label: 'Acciones',
              width: '10%',
              align: 'right',
              filterable: false
            }
          ]}
          data={archivedTasks}
          renderCell={(task, column) => {
            switch (column.key) {
              case 'title':
                return <span className="task-title">{task.title}</span>;

              case 'description':
                const excerpt = getDescriptionExcerpt(task.description);
                return (
                  <span className="task-description" title={excerpt || 'Sin descripción'}>
                    {excerpt || <em>Sin descripción</em>}
                  </span>
                );

              case 'priority':
                return (
                  <span className={`priority-badge priority-${task.priority}`}>
                    {priorityLabels[task.priority]}
                  </span>
                );

              case 'status':
                return (
                  <span className={`status-badge status-${task.status}`}>
                    {statusLabels[task.status]}
                  </span>
                );

              case 'archivedAt':
                return <span className="task-date">{formatDate(task.archivedAt)}</span>;

              case 'actions':
                return (
                  <TableActions
                    rowData={task}
                    actions={[
                      {
                        name: 'restore',
                        icon: 'restore',
                        label: 'Restaurar',
                        onClick: (taskData) => handleUnarchive(taskData.id),
                        variant: 'ghost',
                        title: 'Restaurar esta tarea'
                      },
                      {
                        name: 'delete',
                        icon: 'trash',
                        label: 'Eliminar',
                        onClick: (taskData) => handlePermanentDelete(taskData.id),
                        variant: 'ghost',
                        title: 'Eliminar permanentemente'
                      }
                    ]}
                    size="small"
                    layout="horizontal"
                  />
                );

              default:
                return undefined;
            }
          }}
          emptyMessage="No hay tareas archivadas"
          hoverable={true}
        />
      </div>
    </>
  );
};

export default ArchivedTasks;
