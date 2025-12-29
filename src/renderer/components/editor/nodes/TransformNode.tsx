import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Shuffle } from 'lucide-react';

const TransformNode: React.FC<NodeProps> = ({ data, selected }) => {
  const color = '#a855f7';

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
          <Shuffle size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-cyber-text-primary truncate">
            {data.label || 'Transform'}
          </div>
          <div className="text-xs text-cyber-text-muted">Data transformation</div>
        </div>
      </div>

      {data.transform && (
        <div className="px-3 py-2">
          <code className="text-xs text-cyber-accent-purple">{data.transform}</code>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-cyber-bg-tertiary"
        style={{ borderColor: color }}
      />
    </div>
  );
};

export default TransformNode;
