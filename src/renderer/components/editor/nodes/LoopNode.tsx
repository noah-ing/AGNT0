import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Repeat } from 'lucide-react';

const LoopNode: React.FC<NodeProps> = ({ data, selected }) => {
  const color = '#ff6b35';

  return (
    <div
      className={`agnt0-node ${selected ? 'selected' : ''}`}
      style={{
        borderColor: selected ? color : undefined,
        boxShadow: selected ? `0 0 20px ${color}50` : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-cyber-bg-tertiary"
        style={{ borderColor: color }}
      />

      <div className="flex items-center gap-2 px-3 py-2 border-b border-cyber-border-default">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Repeat size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-cyber-text-primary truncate">
            {data.label || 'Loop'}
          </div>
          <div className="text-xs text-cyber-text-muted">
            {data.loopType || 'for'} loop
          </div>
        </div>
      </div>

      <div className="px-3 py-2 text-xs text-cyber-text-secondary">
        {data.loopConfig?.count && (
          <span>Iterations: {data.loopConfig.count}</span>
        )}
        {data.loopConfig?.condition && (
          <code className="text-cyber-accent-orange">{data.loopConfig.condition}</code>
        )}
      </div>

      {/* Loop body handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="body"
        className="!bg-cyber-bg-tertiary !top-1/3"
        style={{ borderColor: color }}
      />

      {/* Loop complete handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="complete"
        className="!bg-cyber-bg-tertiary !top-2/3"
        style={{ borderColor: '#00ff88' }}
      />
    </div>
  );
};

export default LoopNode;
