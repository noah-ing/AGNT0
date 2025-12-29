import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Flag } from 'lucide-react';

const OutputNode: React.FC<NodeProps> = ({ data, selected }) => {
  const color = '#00ff88';

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
          <Flag size={18} style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-cyber-text-primary">
            {data.label || 'Output'}
          </div>
          <div className="text-xs text-cyber-text-muted">End node</div>
        </div>
      </div>

      {data.schema && (
        <div className="px-3 py-2 text-xs text-cyber-text-secondary">
          <div className="text-cyber-text-muted mb-1">Output schema:</div>
          <code className="text-cyber-accent-green">
            {JSON.stringify(data.schema, null, 2).slice(0, 50)}...
          </code>
        </div>
      )}
    </div>
  );
};

export default OutputNode;
