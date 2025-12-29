import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Code2 } from 'lucide-react';

const CodeNode: React.FC<NodeProps> = ({ data, selected }) => {
  const color = '#ff6b35';

  const languageColors: Record<string, string> = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    python: '#3776ab',
  };

  const langColor = languageColors[data.language || 'javascript'] || color;

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
          style={{ backgroundColor: `${langColor}20` }}
        >
          <Code2 size={18} style={{ color: langColor }} />
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-cyber-text-primary">
            {data.label || 'Code'}
          </div>
          <div className="text-xs text-cyber-text-muted">
            {data.language || 'javascript'}
          </div>
        </div>
      </div>

      {data.code && (
        <div className="px-3 py-2">
          <pre className="text-xs text-cyber-text-secondary bg-cyber-bg-primary rounded p-2 overflow-hidden max-h-20">
            <code>{data.code.slice(0, 100)}...</code>
          </pre>
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

export default CodeNode;
