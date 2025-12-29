import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { LucideIcon } from 'lucide-react';

interface BaseNodeProps extends NodeProps {
  icon: LucideIcon;
  color: string;
  glowColor: string;
  children?: React.ReactNode;
}

const BaseNode: React.FC<BaseNodeProps> = ({
  data,
  selected,
  icon: Icon,
  color,
  glowColor,
  children,
}) => {
  return (
    <div
      className={`agnt0-node ${selected ? 'selected' : ''}`}
      style={{
        borderColor: selected ? color : undefined,
        boxShadow: selected ? `0 0 20px ${glowColor}` : undefined,
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-cyber-bg-tertiary"
        style={{ borderColor: color }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-cyber-border-default"
        style={{ borderBottomColor: `${color}30` }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-cyber-text-primary truncate">
            {data.label || 'Node'}
          </div>
          {data.description && (
            <div className="text-xs text-cyber-text-muted truncate">
              {data.description}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {children && (
        <div className="px-3 py-2 text-xs text-cyber-text-secondary">
          {children}
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-cyber-bg-tertiary"
        style={{ borderColor: color }}
      />
    </div>
  );
};

export default BaseNode;
