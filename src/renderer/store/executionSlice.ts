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
  async ({ workflowId, input }: { workflowId: string; input?: unknown }) => {
    if (window.agnt0) {
      const result = await window.agnt0.execution.run(workflowId, input);
      return result as { id: string };
    }
    return { id: `exec-${Date.now()}` };
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
