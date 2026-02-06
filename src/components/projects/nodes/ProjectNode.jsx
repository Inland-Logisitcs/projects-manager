import { Handle, Position, useConnection } from '@xyflow/react';
import Icon from '../../common/Icon';

const STATUS_COLORS = {
  planning: 'var(--color-warning)',
  'in-progress': 'var(--color-accent)',
  completed: 'var(--color-success)',
  'on-hold': 'var(--text-tertiary)',
};

const ProjectNode = ({ id, data }) => {
  const { project, taskCount, isUnassigned } = data;
  const statusColor = STATUS_COLORS[project.status] || 'var(--text-tertiary)';

  // Detect if a connection is being dragged from a connector
  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode.id.startsWith('connector-');

  return (
    <div className={`flow-node flow-node-project ${isUnassigned ? 'unassigned' : ''} ${isTarget ? 'is-target' : ''}`}>
      {/* Hidden handle that covers the entire node for easy dropping */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className={isTarget ? 'full-node-handle' : ''}
        isConnectableStart={false}
      />

      <div className="flow-node-header">
        <div
          className="flow-node-status-dot"
          style={{ backgroundColor: statusColor }}
        />
        <Icon name="folder" size={18} />
        <span className="flow-node-title">{project.name}</span>
      </div>

      {taskCount > 0 && (
        <div className="flow-node-meta">
          <Icon name="check-square" size={14} />
          <span>{taskCount} tareas</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="source"
      />
    </div>
  );
};

export default ProjectNode;
