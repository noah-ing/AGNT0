import React, { useState } from 'react';
import {
  Play,
  Flag,
  Bot,
  Wrench,
  GitBranch,
  Repeat,
  Code2,
  MessageSquare,
  Globe,
  Shuffle,
  Layers,
  Merge,
  Camera,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';

interface NodeCategory {
  name: string;
  nodes: {
    type: string;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[];
}

const nodeCategories: NodeCategory[] = [
  {
    name: 'Flow',
    nodes: [
      { type: 'input', label: 'Input', icon: <Play size={16} />, color: '#00d4ff' },
      { type: 'output', label: 'Output', icon: <Flag size={16} />, color: '#00ff88' },
      { type: 'condition', label: 'Condition', icon: <GitBranch size={16} />, color: '#ffd700' },
      { type: 'loop', label: 'Loop', icon: <Repeat size={16} />, color: '#ff6b35' },
      { type: 'parallel', label: 'Parallel', icon: <Layers size={16} />, color: '#ec4899' },
      { type: 'merge', label: 'Merge', icon: <Merge size={16} />, color: '#a855f7' },
    ],
  },
  {
    name: 'AI',
    nodes: [
      { type: 'agent', label: 'AI Agent', icon: <Bot size={16} />, color: '#a855f7' },
      { type: 'prompt', label: 'Prompt', icon: <MessageSquare size={16} />, color: '#00d4ff' },
    ],
  },
  {
    name: 'Tools',
    nodes: [
      { type: 'tool', label: 'Tool', icon: <Wrench size={16} />, color: '#ec4899' },
      { type: 'http', label: 'HTTP', icon: <Globe size={16} />, color: '#00d4ff' },
      { type: 'code', label: 'Code', icon: <Code2 size={16} />, color: '#ff6b35' },
      { type: 'transform', label: 'Transform', icon: <Shuffle size={16} />, color: '#a855f7' },
    ],
  },
  {
    name: 'Sensors',
    nodes: [
      { type: 'sensor', label: 'Webcam', icon: <Camera size={16} />, color: '#00ff88' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(nodeCategories.map((c) => c.name))
  );

  const toggleCategory = (name: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedCategories(newExpanded);
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/agnt0-node-type', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredCategories = nodeCategories
    .map((category) => ({
      ...category,
      nodes: category.nodes.filter((node) =>
        node.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.nodes.length > 0);

  return (
    <div className="w-64 flex flex-col border-r border-cyber-border-default bg-cyber-bg-secondary">
      {/* Header */}
      <div className="p-4 border-b border-cyber-border-default">
        <h2 className="text-lg font-bold gradient-text mb-3">Nodes</h2>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-muted"
          />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cyber-input pl-9 text-sm"
          />
        </div>
      </div>

      {/* Node categories */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredCategories.map((category) => (
          <div key={category.name} className="mb-2">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-cyber-text-secondary hover:text-cyber-text-primary rounded transition-colors"
            >
              {expandedCategories.has(category.name) ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              {category.name}
              <span className="ml-auto text-xs text-cyber-text-muted">
                {category.nodes.length}
              </span>
            </button>

            {/* Nodes */}
            {expandedCategories.has(category.name) && (
              <div className="mt-1 space-y-1">
                {category.nodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing bg-cyber-bg-tertiary border border-transparent hover:border-cyber-border-hover transition-all group"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${node.color}20` }}
                    >
                      <span style={{ color: node.color }}>{node.icon}</span>
                    </div>
                    <span className="text-sm text-cyber-text-primary">{node.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-cyber-border-default">
        <p className="text-xs text-cyber-text-muted text-center">
          Drag nodes to the canvas
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
