import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Play,
  Square,
  Save,
  FolderOpen,
  Settings,
  Plus,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Terminal,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { useReactFlow } from 'reactflow';
import { createWorkflow, saveCurrentWorkflow } from '../../store/workflowSlice';
import { startExecution, stopExecution } from '../../store/executionSlice';
import { clearNodes } from '../../store/editorSlice';
import type { RootState, AppDispatch } from '../../store';

interface ToolbarProps {
  onOpenSettings: () => void;
  onToggleLogs: () => void;
  showLogs: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ onOpenSettings, onToggleLogs, showLogs }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const currentWorkflow = useSelector((state: RootState) => state.workflow.currentWorkflow);
  const isRunning = useSelector((state: RootState) => state.execution.isRunning);
  const nodes = useSelector((state: RootState) => state.editor.nodes);

  const handleNew = () => {
    dispatch(createWorkflow({ name: 'New Workflow' }));
  };

  const handleSave = () => {
    if (currentWorkflow) {
      dispatch(saveCurrentWorkflow());
    }
  };

  const handleRun = () => {
    if (currentWorkflow && !isRunning) {
      dispatch(startExecution({ workflowId: currentWorkflow.id }));
    }
  };

  const handleStop = () => {
    dispatch(stopExecution());
  };

  const handleClear = () => {
    if (confirm('Clear all nodes? This cannot be undone.')) {
      dispatch(clearNodes());
    }
  };

  const handleExport = () => {
    if (currentWorkflow) {
      const data = JSON.stringify(currentWorkflow, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentWorkflow.name || 'workflow'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-cyber-border-default bg-cyber-bg-secondary">
      {/* Left section - Logo and file actions */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-accent-blue to-cyber-accent-purple flex items-center justify-center">
            <span className="text-white font-bold text-sm">A0</span>
          </div>
          <span className="font-bold text-lg gradient-text">AGNT0</span>
        </div>

        <div className="w-px h-6 bg-cyber-border-default" />

        {/* File actions */}
        <div className="flex items-center gap-1">
          <ToolbarButton icon={Plus} label="New" onClick={handleNew} />
          <ToolbarButton icon={FolderOpen} label="Open" onClick={() => {}} />
          <ToolbarButton icon={Save} label="Save" onClick={handleSave} />
          <ToolbarButton icon={Download} label="Export" onClick={handleExport} />
        </div>

        <div className="w-px h-6 bg-cyber-border-default" />

        {/* Edit actions */}
        <div className="flex items-center gap-1">
          <ToolbarButton icon={Undo} label="Undo" onClick={() => {}} disabled />
          <ToolbarButton icon={Redo} label="Redo" onClick={() => {}} disabled />
          <ToolbarButton icon={Trash2} label="Clear" onClick={handleClear} />
        </div>
      </div>

      {/* Center section - Workflow name */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={currentWorkflow?.name || 'Untitled Workflow'}
          onChange={() => {}}
          className="bg-transparent text-center text-cyber-text-primary font-medium focus:outline-none focus:text-cyber-accent-blue"
        />
        {nodes.length > 0 && (
          <span className="text-xs text-cyber-text-muted">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Right section - Run and settings */}
      <div className="flex items-center gap-4">
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <ToolbarButton icon={ZoomOut} label="Zoom Out" onClick={() => zoomOut()} />
          <ToolbarButton icon={ZoomIn} label="Zoom In" onClick={() => zoomIn()} />
          <ToolbarButton icon={Maximize2} label="Fit View" onClick={() => fitView()} />
        </div>

        <div className="w-px h-6 bg-cyber-border-default" />

        {/* Logs toggle */}
        <ToolbarButton
          icon={Terminal}
          label="Logs"
          onClick={onToggleLogs}
          active={showLogs}
        />

        {/* Settings */}
        <ToolbarButton icon={Settings} label="Settings" onClick={onOpenSettings} />

        <div className="w-px h-6 bg-cyber-border-default" />

        {/* Run/Stop button */}
        {isRunning ? (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <Square size={16} />
            <span className="font-medium">Stop</span>
          </button>
        ) : (
          <button
            onClick={handleRun}
            disabled={!currentWorkflow || nodes.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyber-accent-blue to-cyber-accent-purple text-white font-medium hover:shadow-cyber-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            <Play size={16} />
            <span>Run</span>
          </button>
        )}
      </div>
    </div>
  );
};

interface ToolbarButtonProps {
  icon: React.FC<{ size?: number }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`p-2 rounded-lg transition-all ${
        active
          ? 'bg-cyber-accent-blue/20 text-cyber-accent-blue'
          : 'text-cyber-text-secondary hover:text-cyber-text-primary hover:bg-cyber-bg-tertiary'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon size={18} />
    </button>
  );
};

export default Toolbar;
