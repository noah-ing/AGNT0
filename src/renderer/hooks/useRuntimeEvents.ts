import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateNodeState, addLog, setOutput, setError } from '../store/executionSlice';
import type { AppDispatch } from '../store';

interface NodeEventData {
  executionId: string;
  nodeId: string;
  type?: string;
  output?: unknown;
  error?: string;
}

interface LogEventData {
  executionId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  nodeId?: string;
  timestamp: string;
  data?: unknown;
}

interface ExecutionEventData {
  executionId: string;
  output?: unknown;
  error?: string;
}

export function useRuntimeEvents() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!window.agnt0) return;

    // Subscribe to runtime events
    const unsubNodeStart = window.agnt0.runtime.onNodeStart((data) => {
      const event = data as NodeEventData;
      dispatch(
        updateNodeState({
          nodeId: event.nodeId,
          updates: {
            status: 'running',
            startedAt: new Date().toISOString(),
          },
        })
      );
    });

    const unsubNodeComplete = window.agnt0.runtime.onNodeComplete((data) => {
      const event = data as NodeEventData;
      dispatch(
        updateNodeState({
          nodeId: event.nodeId,
          updates: {
            status: 'completed',
            completedAt: new Date().toISOString(),
            output: event.output,
          },
        })
      );
    });

    const unsubNodeError = window.agnt0.runtime.onNodeError((data) => {
      const event = data as NodeEventData;
      dispatch(
        updateNodeState({
          nodeId: event.nodeId,
          updates: {
            status: 'error',
            completedAt: new Date().toISOString(),
            error: event.error,
          },
        })
      );
    });

    const unsubExecutionComplete = window.agnt0.runtime.onExecutionComplete((data) => {
      const event = data as ExecutionEventData;
      dispatch(setOutput(event.output));
      dispatch(
        addLog({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Workflow execution completed successfully',
        })
      );
    });

    const unsubExecutionError = window.agnt0.runtime.onExecutionError((data) => {
      const event = data as ExecutionEventData;
      dispatch(setError(event.error || 'Unknown error'));
      dispatch(
        addLog({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Workflow execution failed: ${event.error}`,
        })
      );
    });

    const unsubLog = window.agnt0.runtime.onLog((data) => {
      const event = data as LogEventData;
      dispatch(
        addLog({
          timestamp: event.timestamp,
          level: event.level,
          message: event.message,
          nodeId: event.nodeId,
          data: event.data,
        })
      );
    });

    // Cleanup subscriptions
    return () => {
      unsubNodeStart();
      unsubNodeComplete();
      unsubNodeError();
      unsubExecutionComplete();
      unsubExecutionError();
      unsubLog();
    };
  }, [dispatch]);
}
