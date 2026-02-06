import { Handle, Position, useConnection } from '@xyflow/react';
import Icon from '../../common/Icon';
import UserAvatar from '../../common/UserAvatar';

const STATUS_ICONS = {
  pending: 'circle',
  'in-progress': 'clock',
  qa: 'search',
  completed: 'check-circle',
};

const STATUS_COLORS = {
  pending: 'var(--text-tertiary)',
  'in-progress': 'var(--color-accent)',
  qa: 'var(--color-warning)',
  completed: 'var(--color-success)',
};

const TaskNode = ({ id, data }) => {
  const { task, isCriticalPath } = data;
  const statusIcon = STATUS_ICONS[task.status] || 'circle';
  const statusColor = STATUS_COLORS[task.status] || 'var(--text-tertiary)';
  const isCompleted = task.status === 'completed' || task.status === 'qa';
  const isInProgress = task.status === 'in-progress';

  // Detect if a connection is being dragged
  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode.id !== id;

  return (
    <div
      className={`flow-node flow-node-task ${isTarget ? 'is-target' : ''} ${isCriticalPath ? 'critical-path' : ''}`}
      style={isCriticalPath ? {
        boxShadow: '0 0 0 3px rgba(251, 146, 60, 0.3)',
        borderColor: '#FB923C',
        borderWidth: '2px'
      } : {}}
    >
      {/* Hidden handle that covers the entire node for easy dropping */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className={isTarget ? 'full-node-handle' : ''}
        isConnectableStart={false}
      />

      {/* Status indicator badge - show in order of priority: completed > in-progress > critical path */}
      {isCompleted && (
        <div style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#10B981',
          zIndex: 10,
        }}>
          <Icon
            name="check"
            size={12}
            style={{ color: 'white' }}
          />
        </div>
      )}

      {!isCompleted && isInProgress && (
        <div style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#118ab2',
          zIndex: 10,
        }}>
          <Icon
            name="clock"
            size={12}
            style={{ color: 'white' }}
          />
        </div>
      )}

      {!isCompleted && !isInProgress && isCriticalPath && (
        <div style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#FB923C',
          zIndex: 10,
        }}>
          <Icon
            name="zap"
            size={12}
            style={{ color: 'white' }}
          />
        </div>
      )}

      <div className="flow-node-header">
        <Icon
          name={statusIcon}
          size={16}
          style={{ color: statusColor }}
        />
        <span className="flow-node-title">{task.title}</span>
      </div>

      <div className="flow-node-details">
        {task.assignedTo && (
          <UserAvatar
            userId={task.assignedTo}
            size={24}
          />
        )}
        {task.dependencies?.length > 0 && (
          <span className="flow-node-deps">
            <Icon name="link" size={12} />
            {task.dependencies.length}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="source"
        isConnectableStart={true}
        isConnectableEnd={false}
      />
    </div>
  );
};

export default TaskNode;
