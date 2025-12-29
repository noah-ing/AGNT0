import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from './sidebar/Sidebar';
import Toolbar from './toolbar/Toolbar';
import Editor from './editor/Editor';
import PropertiesPanel from './panels/PropertiesPanel';
import LogsPanel from './panels/LogsPanel';
import PromptBar from './common/PromptBar';
import SettingsModal from './common/SettingsModal';
import type { RootState } from '../store';

const Layout: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const selectedNode = useSelector((state: RootState) => state.editor.selectedNodes[0]);
  const isExecuting = useSelector((state: RootState) => state.execution.isRunning);

  return (
    <div className="h-screen w-screen flex flex-col bg-cyber-bg-primary overflow-hidden">
      {/* Top toolbar */}
      <Toolbar
        onOpenSettings={() => setShowSettings(true)}
        onToggleLogs={() => setShowLogs(!showLogs)}
        showLogs={showLogs}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - node library */}
        <Sidebar />

        {/* Center - DAG editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Editor />

          {/* Natural language prompt bar */}
          <PromptBar />
        </div>

        {/* Right panel - properties or logs */}
        <div className="w-80 flex flex-col border-l border-cyber-border-default bg-cyber-bg-secondary">
          {selectedNode && !showLogs ? (
            <PropertiesPanel nodeId={selectedNode} />
          ) : showLogs ? (
            <LogsPanel />
          ) : (
            <div className="flex-1 flex items-center justify-center text-cyber-text-muted">
              <p>Select a node to view properties</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Execution indicator */}
      {isExecuting && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-cyber-bg-card border border-cyber-accent-green shadow-lg">
            <div className="w-3 h-3 rounded-full bg-cyber-accent-green animate-pulse" />
            <span className="text-cyber-accent-green font-medium">Executing workflow...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
