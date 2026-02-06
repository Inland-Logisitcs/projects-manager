import { Handle, Position } from '@xyflow/react';
import Icon from '../../common/Icon';

const RootNode = ({ data }) => {
  return (
    <div className="flow-node flow-node-root">
      <div className="flow-node-icon">
        <Icon name="play" size={24} />
      </div>
      <span className="flow-node-label">{data.label}</span>
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        style={{ background: 'white' }}
      />
    </div>
  );
};

export default RootNode;
