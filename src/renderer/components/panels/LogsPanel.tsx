import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Terminal, Trash2, Download, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';
import type { RootState } from '../../store';

const LogsPanel: React.FC = () => {
  const logs = useSelector((state: RootState) => state.execution.logs);
  const nodeStates = useSelector((state: RootState) => state.execution.nodeStates);
  const isRunning = useSelector((state: RootState) => state.execution.isRunning);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'info':
        return 'text-cyber-accent-blue';
      case 'debug':
        return 'text-cyber-text-muted';
      default:
        return 'text-cyber-text-secondary';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/10';
      case 'warn':
        return 'bg-yellow-500/10';
      case 'info':
        return 'bg-cyber-accent-blue/10';
      default:
        return '';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const exportLogs = () => {
    const content = logs
      .map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agnt0-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border-default">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-cyber-accent-green" />
          <span className="font-medium">Logs</span>
          {isRunning && (
            <Loader size={14} className="animate-spin text-cyber-accent-green" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={exportLogs}
            className="p-1.5 rounded hover:bg-cyber-bg-tertiary text-cyber-text-muted hover:text-cyber-text-primary transition-colors"
            title="Export logs"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Node states summary */}
      {Object.keys(nodeStates).length > 0 && (
        <div className="px-4 py-2 border-b border-cyber-border-default bg-cyber-bg-tertiary/50">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={12} className="text-green-400" />
              <span className="text-cyber-text-secondary">
                {Object.values(nodeStates).filter((s) => s.status === 'completed').length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-yellow-400" />
              <span className="text-cyber-text-secondary">
                {Object.values(nodeStates).filter((s) => s.status === 'running').length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle size={12} className="text-red-400" />
              <span className="text-cyber-text-secondary">
                {Object.values(nodeStates).filter((s) => s.status === 'error').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Logs list */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-cyber-text-muted">
            <Terminal size={32} className="mb-2 opacity-50" />
            <p>No logs yet</p>
            <p className="text-xs mt-1">Run a workflow to see execution logs</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`flex gap-2 px-2 py-1 rounded ${getLevelBg(log.level)}`}
            >
              <span className="text-cyber-text-muted shrink-0">
                {formatTime(log.timestamp)}
              </span>
              <span className={`shrink-0 uppercase ${getLevelColor(log.level)}`}>
                [{log.level}]
              </span>
              {log.nodeId && (
                <span className="text-cyber-accent-purple shrink-0">
                  [{log.nodeId}]
                </span>
              )}
              <span className="text-cyber-text-secondary break-all">
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

export default LogsPanel;
