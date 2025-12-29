import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { MessageSquare } from 'lucide-react';

const PromptNode: React.FC<NodeProps> = ({ data, selected }) => {
  const color = '#00d4ff';

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
          <MessageSquare size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-cyber-text-primary truncate">
            {data.label || 'Prompt Template'}
          </div>
          <div className="text-xs text-cyber-text-muted">
            {data.variables?.length || 0} variables
          </div>
        </div>
      </div>

      {data.promptTemplate && (
        <div className="px-3 py-2 text-xs text-cyber-text-secondary line-clamp-3">
          {data.promptTemplate.slice(0, 100)}...
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

export default PromptNode;
