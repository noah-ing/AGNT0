import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface NodeState {
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
}

interface ExecutionLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  nodeId?: string;
  message: string;
  data?: unknown;
}

interface ExecutionState {
  currentExecutionId: string | null;
  isRunning: boolean;
  nodeStates: Record<string, NodeState>;
  logs: ExecutionLog[];
  output: unknown | null;
  error: string | null;
}

const initialState: ExecutionState = {
  currentExecutionId: null,
  isRunning: false,
  nodeStates: {},
  logs: [],
  output: null,
  error: null,
};

export const startExecution = createAsyncThunk(
  'execution/start',
  async ({ workflowId, input }: { workflowId: string; input?: unknown }, { dispatch, getState }) => {
    if (window.agnt0) {
      const result = await window.agnt0.execution.run(workflowId, input);
      return result as { id: string };
    }

    // Mock execution for dev mode - simulate workflow running
    const execId = `exec-${Date.now()}`;
    const state = getState() as { editor: { nodes: { id: string; type: string }[] } };
    const nodes = state.editor.nodes;

    // Simulate node execution with delays
    setTimeout(async () => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Mark node as running
        dispatch(setNodeState({
          nodeId: node.id,
          state: { status: 'running', startedAt: new Date().toISOString() }
        }));
        dispatch(addLog({
          timestamp: new Date().toISOString(),
          level: 'info',
          nodeId: node.id,
          message: `Executing ${node.type} node...`
        }));

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

        // Mark node as completed
        dispatch(setNodeState({
          nodeId: node.id,
          state: {
            status: 'completed',
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            output: { result: `Output from ${node.type}` }
          }
        }));
        dispatch(addLog({
          timestamp: new Date().toISOString(),
          level: 'info',
          nodeId: node.id,
          message: `${node.type} node completed successfully`
        }));
      }

      // Complete execution
      dispatch(addLog({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Workflow execution completed!'
      }));
      dispatch(executionSlice.actions.completeExecution());
    }, 100);

    return { id: execId };
  }
);

export const stopExecution = createAsyncThunk('execution/stop', async (_, { getState }) => {
  const state = getState() as { execution: ExecutionState };
  const { currentExecutionId } = state.execution;

  if (currentExecutionId && window.agnt0) {
    await window.agnt0.execution.stop(currentExecutionId);
  }

  return currentExecutionId;
});

const executionSlice = createSlice({
  name: 'execution',
  initialState,
  reducers: {
    setNodeState: (
      state,
      action: PayloadAction<{ nodeId: string; state: NodeState }>
    ) => {
      state.nodeStates[action.payload.nodeId] = action.payload.state;
    },
    updateNodeState: (
      state,
      action: PayloadAction<{ nodeId: string; updates: Partial<NodeState> }>
    ) => {
      const { nodeId, updates } = action.payload;
      if (state.nodeStates[nodeId]) {
        state.nodeStates[nodeId] = { ...state.nodeStates[nodeId], ...updates };
      } else {
        state.nodeStates[nodeId] = { status: 'pending', ...updates };
      }
    },
    addLog: (state, action: PayloadAction<ExecutionLog>) => {
      state.logs.push(action.payload);
      // Keep only last 1000 logs
      if (state.logs.length > 1000) {
        state.logs = state.logs.slice(-1000);
      }
    },
    clearLogs: (state) => {
      state.logs = [];
    },
    setOutput: (state, action: PayloadAction<unknown>) => {
      state.output = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetExecution: (state) => {
      state.currentExecutionId = null;
      state.isRunning = false;
      state.nodeStates = {};
      state.output = null;
      state.error = null;
    },
    clearNodeStates: (state) => {
      state.nodeStates = {};
    },
    completeExecution: (state) => {
      state.isRunning = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startExecution.pending, (state) => {
        state.isRunning = true;
        state.nodeStates = {};
        state.output = null;
        state.error = null;
        state.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Starting workflow execution...',
        });
      })
      .addCase(startExecution.fulfilled, (state, action) => {
        state.currentExecutionId = action.payload.id;
        state.logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Execution started: ${action.payload.id}`,
        });
      })
      .addCase(startExecution.rejected, (state, action) => {
        state.isRunning = false;
        state.error = action.error.message || 'Failed to start execution';
        state.logs.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `Execution failed: ${action.error.message}`,
        });
      })
      .addCase(stopExecution.fulfilled, (state) => {
        state.isRunning = false;
        state.logs.push({
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: 'Execution stopped by user',
        });
      });
  },
});

export const {
  setNodeState,
  updateNodeState,
  addLog,
  clearLogs,
  setOutput,
  setError,
  resetExecution,
  clearNodeStates,
} = executionSlice.actions;

export default executionSlice.reducer;
