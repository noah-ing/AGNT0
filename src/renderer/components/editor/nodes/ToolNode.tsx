import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Wrench } from 'lucide-react';

const ToolNode: React.FC<NodeProps> = ({ data, selected }) => {
  const color = '#ec4899';

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
          <Wrench size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-cyber-text-primary truncate">
            {data.label || 'Tool'}
          </div>
          <div className="text-xs text-cyber-text-muted">
            {data.toolId || 'Select a tool'}
          </div>
        </div>
      </div>

      {data.toolConfig && Object.keys(data.toolConfig).length > 0 && (
        <div className="px-3 py-2 text-xs text-cyber-text-secondary">
          <div className="text-cyber-text-muted mb-1">Config:</div>
          <code className="text-cyber-accent-pink">
            {JSON.stringify(data.toolConfig, null, 2).slice(0, 80)}...
          </code>
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

export default ToolNode;
