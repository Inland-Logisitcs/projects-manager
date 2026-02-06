import { Handle, Position } from '@xyflow/react';

const ConnectorNode = ({ data }) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        backgroundColor: '#015E7C',
        border: '3px solid white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
      }}
    >
      {/* Target handle - hidden, not connectable as start */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        style={{
          left: '-5px',
          opacity: 0,
          pointerEvents: 'none',
        }}
        isConnectableStart={false}
      />

      {/* Source handle - covers entire node, invisible */}
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          opacity: 0,
          background: 'transparent',
          border: 'none',
        }}
        isConnectableStart={true}
        isConnectableEnd={false}
      />
    </div>
  );
};

export default ConnectorNode;
