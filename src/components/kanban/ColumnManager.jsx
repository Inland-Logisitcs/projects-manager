import { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Icon from '../common/Icon';
import ConfirmDialog from '../common/ConfirmDialog';
import Toast from '../common/Toast';
import '../../styles/ColumnManager.css';

const ColumnManager = ({ columns, onClose, onSave, onDelete, onReorder }) => {
  const [localColumns, setLocalColumns] = useState([...columns]);
  const [editingColumn, setEditingColumn] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, columnId: null });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'error' });

  // Sincronizar localColumns cuando columns cambie desde fuera
  useEffect(() => {
    setLocalColumns([...columns]);
  }, [columns]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLocalColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Actualizar orden en Firebase
        onReorder(newOrder);

        return newOrder;
      });
    }
  };

  const handleAddColumn = (columnData) => {
    onSave(columnData);
    setShowAddForm(false);
  };

  const handleEditColumn = (column) => {
    setEditingColumn(column);
  };

  const handleSaveEdit = (updatedColumn) => {
    onSave(updatedColumn);
    setEditingColumn(null);
  };

  const handleDeleteColumn = (columnId) => {
    console.log('🔔 ColumnManager: Solicitando confirmación para eliminar columna:', columnId);
    setConfirmDialog({ isOpen: true, columnId });
  };

  const confirmDelete = () => {
    console.log('✔️ ColumnManager: Usuario confirmó eliminación de columna:', confirmDialog.columnId);
    onDelete(confirmDialog.columnId);
    setConfirmDialog({ isOpen: false, columnId: null });
  };

  return (
    <>
      {toast.isOpen && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ isOpen: false, message: '', type: 'error' })}
        />
      )}

      <div className="modal-overlay" onClick={onClose}>
        <div className="column-manager-modal" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-lg border-b-light">
            <h2 className="heading-2 text-primary">Gestionar Columnas</h2>
            <button onClick={onClose} className="modal-close-btn">
              <Icon name="x" size={24} />
            </button>
          </div>

          <div className="column-manager-body">
            <p className="manager-description">
              Arrastra para reordenar. Las columnas aparecerán en este orden en el tablero.
            </p>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localColumns.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-sm mb-lg">
                  {localColumns.map((column) => (
                    <SortableColumnItem
                      key={column.id}
                      column={column}
                      onEdit={handleEditColumn}
                      onDelete={handleDeleteColumn}
                      isEditing={editingColumn?.id === column.id}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={() => setEditingColumn(null)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {showAddForm ? (
              <ColumnForm
                onSave={handleAddColumn}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <button className="btn-add-column" onClick={() => setShowAddForm(true)}>
                <Icon name="plus" size={20} />
                <span>Agregar Columna</span>
              </button>
            )}
          </div>

          <div className="flex justify-end p-base border-t-light">
            <button onClick={onClose} className="btn btn-primary">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Eliminar columna"
        message="¿Eliminar esta columna? Las tareas en esta columna NO se eliminarán, pero quedarán sin columna asignada."
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, columnId: null })}
      />
    </>
  );
};

const SortableColumnItem = ({ column, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="column-item">
        <ColumnForm
          column={column}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="column-item flex items-center gap-base p-base">
      <div className="column-drag-handle" {...attributes} {...listeners}>
        <Icon name="grip-vertical" size={20} />
      </div>

      <div className="column-color-preview" style={{ backgroundColor: column.color }} />

      <div className="flex-1 flex flex-col gap-xs">
        <span className="column-title">{column.title}</span>
        <span className="column-id">{column.id}</span>
      </div>

      <div className="flex gap-xs">
        <button
          onClick={() => onEdit(column)}
          className="btn-icon"
          title="Editar columna"
        >
          <Icon name="edit" size={16} />
        </button>
        <button
          onClick={() => onDelete(column.id)}
          className="btn-icon btn-danger"
          title="Eliminar columna"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  );
};

const ColumnForm = ({ column, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: column?.id || '',
    title: column?.title || '',
    color: column?.color || '#94A3B8'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      // Si es una nueva columna y no tiene ID, generarlo desde el título
      const columnData = {
        ...formData,
        id: formData.id || formData.title.toLowerCase().replace(/\s+/g, '-')
      };
      onSave(columnData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="column-form">
      <div className="form-group">
        <label>Nombre de la columna</label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ej: En Revisión"
          required
          autoFocus
        />
      </div>

      {!column && (
        <div className="form-group">
          <label>ID (opcional)</label>
          <input
            type="text"
            value={formData.id}
            onChange={e => setFormData({ ...formData, id: e.target.value })}
            placeholder="Ej: en-revision (se genera automáticamente)"
          />
        </div>
      )}

      <div className="form-group">
        <label>Color</label>
        <div className="color-picker">
          <input
            type="color"
            value={formData.color}
            onChange={e => setFormData({ ...formData, color: e.target.value })}
          />
          <span className="color-value">{formData.color}</span>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          {column ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
};

export default ColumnManager;
