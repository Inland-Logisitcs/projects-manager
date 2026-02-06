import { useState } from 'react';
import Icon from '../common/Icon';

/**
 * Componente para gestionar factores de riesgo en tareas/proyectos
 */
const RiskMatrix = ({ factoresRiesgo, usuarios, proyectos, tareas, onChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    usuarioId: '',
    tipo: 'tarea', // 'tarea' o 'proyecto'
    tareaId: '',
    proyectoId: '',
    porcentajeExtra: 0.2,
    diasExtra: 0,
    razon: ''
  });

  const handleAdd = () => {
    setEditando(null);
    setFormData({
      usuarioId: usuarios[0]?.id || '',
      tipo: 'tarea',
      tareaId: tareas[0]?.id || '',
      proyectoId: proyectos[0]?.id || '',
      porcentajeExtra: 0.2,
      diasExtra: 0,
      razon: ''
    });
    setShowModal(true);
  };

  const handleEdit = (riesgo) => {
    setEditando(riesgo);
    setFormData({
      usuarioId: riesgo.usuarioId || riesgo.userId,
      tipo: riesgo.tareaId || riesgo.taskId ? 'tarea' : 'proyecto',
      tareaId: riesgo.tareaId || riesgo.taskId || '',
      proyectoId: riesgo.proyectoId || riesgo.projectId || '',
      porcentajeExtra: riesgo.porcentajeExtra || riesgo.extraPercentage || 0,
      diasExtra: riesgo.diasExtra || riesgo.extraDays || 0,
      razon: riesgo.razon || riesgo.reason || ''
    });
    setShowModal(true);
  };

  const handleDelete = (index) => {
    const nuevosRiesgos = factoresRiesgo.filter((_, i) => i !== index);
    onChange(nuevosRiesgos);
  };

  const handleSave = () => {
    const nuevoRiesgo = {
      usuarioId: formData.usuarioId,
      ...(formData.tipo === 'tarea'
        ? { tareaId: formData.tareaId }
        : { proyectoId: formData.proyectoId }),
      porcentajeExtra: parseFloat(formData.porcentajeExtra),
      diasExtra: parseInt(formData.diasExtra) || 0,
      razon: formData.razon
    };

    let nuevosRiesgos;
    if (editando !== null) {
      nuevosRiesgos = factoresRiesgo.map((r, i) =>
        i === editando ? nuevoRiesgo : r
      );
    } else {
      nuevosRiesgos = [...factoresRiesgo, nuevoRiesgo];
    }

    onChange(nuevosRiesgos);
    setShowModal(false);
  };

  const getNombreUsuario = (usuarioId) => {
    const usuario = usuarios.find(u => u.id === usuarioId);
    return usuario?.displayName || usuario?.nombre || usuarioId;
  };

  const getNombreTarea = (tareaId) => {
    const tarea = tareas.find(t => t.id === tareaId);
    return tarea?.title || tarea?.nombre || tareaId;
  };

  const getNombreProyecto = (proyectoId) => {
    const proyecto = proyectos.find(p => p.id === proyectoId);
    return proyecto?.name || proyecto?.nombre || proyectoId;
  };

  const getRiskLevel = (porcentaje) => {
    if (porcentaje >= 1.0) return { label: 'Crítico', color: 'badge-error' };
    if (porcentaje >= 0.5) return { label: 'Alto', color: 'badge-error' };
    if (porcentaje >= 0.2) return { label: 'Medio', color: 'badge-warning' };
    return { label: 'Bajo', color: 'badge-success' };
  };

  return (
    <div className="risk-matrix">
      <div className="flex justify-between items-center mb-base">
        <div>
          <h3 className="heading-3 text-primary">Factores de Riesgo</h3>
          <p className="text-sm text-secondary">
            {factoresRiesgo.length} {factoresRiesgo.length === 1 ? 'riesgo configurado' : 'riesgos configurados'}
          </p>
        </div>
        <button
          className="btn btn-primary flex items-center gap-xs"
          onClick={handleAdd}
        >
          <Icon name="plus" size={18} />
          Agregar Riesgo
        </button>
      </div>

      {factoresRiesgo.length === 0 ? (
        <div className="empty-state">
          <Icon name="alert-triangle" size={48} />
          <p>No hay factores de riesgo configurados</p>
          <p className="text-sm text-secondary">
            Los factores de riesgo aumentan el tiempo estimado de las tareas
          </p>
        </div>
      ) : (
        <div className="risk-table">
          {factoresRiesgo.map((riesgo, index) => {
            const porcentaje = riesgo.porcentajeExtra || riesgo.extraPercentage || 0;
            const diasExtra = riesgo.diasExtra || riesgo.extraDays || 0;
            const riskLevel = getRiskLevel(porcentaje);
            const tareaId = riesgo.tareaId || riesgo.taskId;
            const proyectoId = riesgo.proyectoId || riesgo.projectId;

            return (
              <div key={index} className="card risk-card mb-sm">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-sm mb-xs">
                        <span className={`badge ${riskLevel.color}`}>
                          {riskLevel.label}
                        </span>
                        <h4 className="heading-4 text-primary">
                          {getNombreUsuario(riesgo.usuarioId || riesgo.userId)}
                        </h4>
                      </div>

                      <div className="risk-details text-sm">
                        <p className="mb-xs">
                          <Icon name={tareaId ? 'check-square' : 'folder'} size={14} />
                          <strong>{tareaId ? 'Tarea' : 'Proyecto'}:</strong>{' '}
                          {tareaId ? getNombreTarea(tareaId) : getNombreProyecto(proyectoId)}
                        </p>

                        <p className="mb-xs">
                          <Icon name="clock" size={14} />
                          <strong>Impacto:</strong> +{(porcentaje * 100).toFixed(0)}%
                          {diasExtra > 0 && ` + ${diasExtra} días`}
                        </p>

                        {riesgo.razon && (
                          <p className="text-secondary">
                            <Icon name="info" size={14} />
                            {riesgo.razon || riesgo.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-xs">
                      <button
                        className="btn btn-icon btn-sm btn-ghost"
                        onClick={() => handleEdit(index)}
                        title="Editar"
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        className="btn btn-icon btn-sm btn-ghost"
                        onClick={() => handleDelete(index)}
                        title="Eliminar"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para agregar/editar riesgo */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-header">
              {editando !== null ? 'Editar' : 'Agregar'} Factor de Riesgo
            </h3>

            <div className="form-group">
              <label className="label">Usuario Afectado *</label>
              <select
                className="select"
                value={formData.usuarioId}
                onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
              >
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.displayName || usuario.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Aplicar a *</label>
              <select
                className="select"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              >
                <option value="tarea">Tarea específica</option>
                <option value="proyecto">Proyecto completo</option>
              </select>
            </div>

            {formData.tipo === 'tarea' ? (
              <div className="form-group">
                <label className="label">Tarea *</label>
                <select
                  className="select"
                  value={formData.tareaId}
                  onChange={(e) => setFormData({ ...formData, tareaId: e.target.value })}
                >
                  {tareas.map(tarea => (
                    <option key={tarea.id} value={tarea.id}>
                      {tarea.title || tarea.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="label">Proyecto *</label>
                <select
                  className="select"
                  value={formData.proyectoId}
                  onChange={(e) => setFormData({ ...formData, proyectoId: e.target.value })}
                >
                  {proyectos.map(proyecto => (
                    <option key={proyecto.id} value={proyecto.id}>
                      {proyecto.name || proyecto.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="label">Porcentaje Extra *</label>
              <select
                className="select"
                value={formData.porcentajeExtra}
                onChange={(e) => setFormData({ ...formData, porcentajeExtra: parseFloat(e.target.value) })}
              >
                <option value="0.1">10% - Riesgo bajo</option>
                <option value="0.2">20% - Riesgo medio-bajo</option>
                <option value="0.3">30% - Riesgo medio</option>
                <option value="0.5">50% - Riesgo alto</option>
                <option value="0.75">75% - Riesgo muy alto</option>
                <option value="1.0">100% - Duplica tiempo</option>
              </select>
              <p className="text-xs text-tertiary mt-xs">
                Se añade este porcentaje al tiempo estimado de la tarea
              </p>
            </div>

            <div className="form-group">
              <label className="label">Días Extra (opcional)</label>
              <input
                type="number"
                className="input"
                value={formData.diasExtra}
                onChange={(e) => setFormData({ ...formData, diasExtra: e.target.value })}
                min="0"
                placeholder="0"
              />
              <p className="text-xs text-tertiary mt-xs">
                Días fijos adicionales (además del porcentaje)
              </p>
            </div>

            <div className="form-group">
              <label className="label">Razón *</label>
              <textarea
                className="textarea"
                value={formData.razon}
                onChange={(e) => setFormData({ ...formData, razon: e.target.value })}
                placeholder="Ej: Usuario junior en esta tecnología, complejidad alta, etc."
                rows="3"
              />
            </div>

            <div className="modal-footer flex justify-end gap-sm">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!formData.usuarioId || !formData.razon}
              >
                {editando !== null ? 'Guardar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskMatrix;
