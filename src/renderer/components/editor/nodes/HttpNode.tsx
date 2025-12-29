import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Globe } from 'lucide-react';

const HttpNode: React.FC<NodeProps> = ({ data, selected }) => {
  const color = '#00d4ff';

  const methodColors: Record<string, string> = {
    GET: '#00ff88',
    POST: '#00d4ff',
    PUT: '#ffd700',
    DELETE: '#ff4444',
    PATCH: '#a855f7',
  };

  const methodColor = methodColors[data.method || 'GET'] || color;

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
          <Globe size={18} style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-cyber-text-primary">
            {data.label || 'HTTP'}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className="px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: `${methodColor}20`, color: methodColor }}
            >
              {data.method || 'GET'}
            </span>
          </div>
        </div>
      </div>

      {data.url && (
        <div className="px-3 py-2 text-xs text-cyber-text-secondary truncate">
          {data.url}
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

export default HttpNode;
