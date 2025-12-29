import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';

const ConditionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const color = '#ffd700';

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
          <GitBranch size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-cyber-text-primary truncate">
            {data.label || 'Condition'}
          </div>
          <div className="text-xs text-cyber-text-muted">Branch logic</div>
        </div>
      </div>

      {data.condition && (
        <div className="px-3 py-2 text-xs">
          <code className="text-cyber-accent-yellow">{data.condition}</code>
        </div>
      )}

      {/* True handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="!bg-cyber-bg-tertiary !top-1/3"
        style={{ borderColor: '#00ff88' }}
      />

      {/* False handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="!bg-cyber-bg-tertiary !top-2/3"
        style={{ borderColor: '#ff4444' }}
      />
    </div>
  );
};

export default ConditionNode;
