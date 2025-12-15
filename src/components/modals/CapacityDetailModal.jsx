import { useMemo } from 'react';
import Icon from '../common/Icon';
import UserAvatar from '../common/UserAvatar';
import { calculateWorkingDays } from '../../services/capacityService';

const CapacityDetailModal = ({ isOpen, onClose, sprint, users, tasks }) => {
  const capacityDetails = useMemo(() => {
    if (!sprint || !users || users.length === 0) return [];

    // Determinar si usar tiempo restante (para sprints activos)
    const useRemainingTime = sprint.status === 'active';
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    return users
      .filter(user => !user.disabled)
      .map(user => {
        const dailyCapacity = user.dailyCapacity || 1;
        const workingDays = user.workingDays || [1, 2, 3, 4, 5];

        // Calcular capacidad total (desde inicio del sprint)
        const totalWorkingDays = calculateWorkingDays(
          sprint.startDate,
          sprint.endDate,
          workingDays
        );
        const totalCapacity = totalWorkingDays * dailyCapacity;

        // Calcular capacidad restante (desde hoy si el sprint está activo)
        let remainingWorkingDays = totalWorkingDays;
        let remainingCapacity = totalCapacity;

        if (useRemainingTime) {
          const sprintEndDate = new Date(sprint.endDate);
          if (today <= sprintEndDate) {
            remainingWorkingDays = calculateWorkingDays(
              todayString,
              sprint.endDate,
              workingDays
            );
            remainingCapacity = remainingWorkingDays * dailyCapacity;
          } else {
            remainingWorkingDays = 0;
            remainingCapacity = 0;
          }
        }

        const assignedTasks = tasks.filter(task =>
          task.assignedTo === user.id && !task.archived
        );

        const assignedPoints = assignedTasks.reduce((sum, task) =>
          sum + (task.storyPoints || 0), 0
        );

        // Puntos pendientes (sin completar)
        const pendingPoints = assignedTasks
          .filter(task => task.status !== 'completed')
          .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

        const completedPoints = assignedTasks
          .filter(task => task.status === 'completed')
          .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

        // Usar capacidad restante para calcular porcentaje si el sprint está activo
        const capacityForPercentage = useRemainingTime ? remainingCapacity : totalCapacity;
        const pointsForPercentage = useRemainingTime ? pendingPoints : assignedPoints;

        const remaining = Math.max(0, capacityForPercentage - pointsForPercentage);
        const percentage = capacityForPercentage > 0
          ? Math.round((pointsForPercentage / capacityForPercentage) * 100)
          : 0;

        return {
          user,
          dailyCapacity,
          workingDays: useRemainingTime ? remainingWorkingDays : totalWorkingDays,
          totalCapacity: useRemainingTime ? remainingCapacity : totalCapacity,
          assignedPoints: useRemainingTime ? pendingPoints : assignedPoints,
          completedPoints,
          remaining,
          percentage,
          assignedTasks: assignedTasks.length,
          useRemainingTime
        };
      })
      .sort((a, b) => b.totalCapacity - a.totalCapacity);
  }, [sprint, users, tasks]);

  const totals = useMemo(() => {
    return capacityDetails.reduce((acc, detail) => ({
      capacity: acc.capacity + detail.totalCapacity,
      assigned: acc.assigned + detail.assignedPoints,
      completed: acc.completed + detail.completedPoints,
      remaining: acc.remaining + detail.remaining,
      tasks: acc.tasks + detail.assignedTasks
    }), { capacity: 0, assigned: 0, completed: 0, remaining: 0, tasks: 0 });
  }, [capacityDetails]);

  const getCapacityStatus = (percentage) => {
    if (percentage >= 100) return 'over-capacity';
    if (percentage >= 80) return 'near-limit';
    return 'normal';
  };

  const getCapacityColor = (percentage) => {
    if (percentage >= 100) return '#EF4444';
    if (percentage >= 80) return '#F59E0B';
    return '#10B981';
  };

  const formatSprintDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex flex-col gap-xs">
            <h2 className="modal-title">Capacidad del Equipo</h2>
            <p className="text-sm text-secondary">
              {sprint?.name} {sprint?.startDate && sprint?.endDate && (
                <span>({formatSprintDate(sprint.startDate)} - {formatSprintDate(sprint.endDate)})</span>
              )}
            </p>
            {sprint?.status === 'active' && (
              <p className="text-xs text-primary font-medium">
                <Icon name="clock" size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Mostrando capacidad restante desde hoy
              </p>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="modal-body">
          {capacityDetails.length === 0 ? (
            <div className="empty-state text-center p-3xl text-secondary">
              <Icon name="users" size={48} />
              <p className="my-base text-base">No hay usuarios habilitados en el equipo</p>
            </div>
          ) : (
            <>
              <div className="mb-base p-base bg-secondary border-b-light">
                <div className="grid grid-cols-4 gap-base">
                  <div className="flex flex-col gap-xs">
                    <span className="text-xs text-tertiary">
                      {sprint?.status === 'active' ? 'Capacidad Restante' : 'Capacidad Total'}
                    </span>
                    <span className="text-lg font-bold text-primary">{totals.capacity} pts</span>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <span className="text-xs text-tertiary">
                      {sprint?.status === 'active' ? 'Puntos Pendientes' : 'Puntos Asignados'}
                    </span>
                    <span className="text-lg font-bold text-primary">{totals.assigned} pts</span>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <span className="text-xs text-tertiary">Puntos Completados</span>
                    <span className="text-lg font-bold text-primary" style={{ color: '#10B981' }}>
                      {totals.completed} pts
                    </span>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <span className="text-xs text-tertiary">Capacidad Restante</span>
                    <span className="text-lg font-bold text-primary">
                      {totals.remaining} pts
                    </span>
                  </div>
                </div>
              </div>

              <div className="capacity-details-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Usuario</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Pts/día</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>
                        {sprint?.status === 'active' ? 'Días Rest.' : 'Días'}
                      </th>
                      <th style={{ width: '12%', textAlign: 'center' }}>
                        {sprint?.status === 'active' ? 'Cap. Rest.' : 'Capacidad'}
                      </th>
                      <th style={{ width: '12%', textAlign: 'center' }}>
                        {sprint?.status === 'active' ? 'Pendiente' : 'Asignado'}
                      </th>
                      <th style={{ width: '12%', textAlign: 'center' }}>Completado</th>
                      <th style={{ width: '14%', textAlign: 'center' }}>Utilización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capacityDetails.map(detail => {
                      const status = getCapacityStatus(detail.percentage);
                      const color = getCapacityColor(detail.percentage);

                      return (
                        <tr key={detail.user.id}>
                          <td>
                            <div className="flex items-center gap-sm">
                              <UserAvatar userId={detail.user.id} size={32} showName={false} />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-primary">
                                  {detail.user.displayName || detail.user.email}
                                </span>
                                {detail.assignedTasks > 0 && (
                                  <span className="text-xs text-tertiary">
                                    {detail.assignedTasks} tarea{detail.assignedTasks !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="text-sm text-primary font-medium">
                              {detail.dailyCapacity}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="text-sm text-primary font-medium">
                              {detail.workingDays}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="text-sm font-semibold text-primary">
                              {detail.totalCapacity} pts
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="text-sm text-primary">
                              {detail.assignedPoints} pts
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="text-sm" style={{ color: '#10B981', fontWeight: 500 }}>
                              {detail.completedPoints} pts
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-sm">
                              <div
                                className="capacity-bar"
                                style={{
                                  width: '60px',
                                  height: '8px',
                                  backgroundColor: '#E5E7EB',
                                  borderRadius: '4px',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  className="capacity-fill"
                                  style={{
                                    width: `${Math.min(detail.percentage, 100)}%`,
                                    height: '100%',
                                    backgroundColor: color,
                                    transition: 'width 0.3s ease'
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs font-medium"
                                style={{ color, minWidth: '40px', textAlign: 'right' }}
                              >
                                {detail.percentage}%
                              </span>
                              {status === 'over-capacity' && (
                                <Icon
                                  name="alert-circle"
                                  size={16}
                                  style={{ color: '#EF4444' }}
                                  title="Sobre capacidad"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-base p-base bg-secondary" style={{ borderRadius: 'var(--radius-base)' }}>
                <h4 className="text-sm font-semibold text-primary mb-sm">Información</h4>
                <ul className="text-xs text-secondary" style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                  {sprint?.status === 'active' ? (
                    <>
                      <li><strong>Capacidad Restante:</strong> Puntos que el usuario puede completar desde hoy hasta el fin del sprint (Días restantes × Puntos por día)</li>
                      <li><strong>Pendiente:</strong> Puntos de tareas asignadas que aún no están completadas</li>
                      <li><strong>Completado:</strong> Puntos de tareas ya completadas en el sprint</li>
                      <li><strong>Utilización:</strong> Porcentaje de capacidad restante utilizada. Verde (&lt;80%), Naranja (80-99%), Rojo (≥100%)</li>
                    </>
                  ) : (
                    <>
                      <li><strong>Capacidad:</strong> Puntos totales que el usuario puede completar (Días laborales × Puntos por día)</li>
                      <li><strong>Asignado:</strong> Puntos totales de tareas asignadas al usuario en este sprint</li>
                      <li><strong>Completado:</strong> Puntos de tareas asignadas que ya están completadas</li>
                      <li><strong>Utilización:</strong> Porcentaje de capacidad asignada. Verde (&lt;80%), Naranja (80-99%), Rojo (≥100%)</li>
                    </>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CapacityDetailModal;
