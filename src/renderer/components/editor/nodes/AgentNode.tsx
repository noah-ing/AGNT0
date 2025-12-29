import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Bot } from 'lucide-react';

const AgentNode: React.FC<NodeProps> = ({ data, selected }) => {
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
          <Bot size={18} style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-cyber-text-primary">
            {data.label || 'AI Agent'}
          </div>
          <div className="text-xs text-cyber-text-muted">
            {data.provider || 'openai'} / {data.model || 'gpt-4o'}
          </div>
        </div>
      </div>

      <div className="px-3 py-2 text-xs space-y-1">
        {data.systemPrompt && (
          <div className="text-cyber-text-secondary line-clamp-2">
            <span className="text-cyber-text-muted">System: </span>
            {data.systemPrompt.slice(0, 60)}...
          </div>
        )}
        <div className="flex gap-2 text-cyber-text-muted">
          {data.temperature !== undefined && (
            <span>Temp: {data.temperature}</span>
          )}
          {data.maxTokens && (
            <span>Max: {data.maxTokens}</span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-cyber-bg-tertiary"
        style={{ borderColor: color }}
      />
    </div>
  );
};

export default AgentNode;
