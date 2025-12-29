import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Node, Edge } from 'reactflow';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const loadWorkflows = createAsyncThunk('workflow/loadAll', async () => {
  if (window.agnt0) {
    return await window.agnt0.workflow.list();
  }
  return [];
});

export const createWorkflow = createAsyncThunk(
  'workflow/create',
  async (data: { name: string; description?: string }) => {
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: data.name,
      description: data.description,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (window.agnt0) {
      await window.agnt0.workflow.create(workflow);
    }

    return workflow;
  }
);

export const updateWorkflow = createAsyncThunk(
  'workflow/update',
  async ({ id, updates }: { id: string; updates: Partial<Workflow> }) => {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (window.agnt0) {
      await window.agnt0.workflow.update(id, updatedData);
    }

    return { id, updates: updatedData };
  }
);

export const deleteWorkflow = createAsyncThunk('workflow/delete', async (id: string) => {
  if (window.agnt0) {
    await window.agnt0.workflow.delete(id);
  }
  return id;
});

export const saveCurrentWorkflow = createAsyncThunk(
  'workflow/saveCurrent',
  async (_, { getState }) => {
    const state = getState() as { workflow: WorkflowState; editor: { nodes: Node[]; edges: Edge[] } };
    const { currentWorkflow } = state.workflow;
    const { nodes, edges } = state.editor;

    if (!currentWorkflow) {
      throw new Error('No workflow to save');
    }

    const updates = {
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
    };

    if (window.agnt0) {
      await window.agnt0.workflow.update(currentWorkflow.id, updates);
    }

    return { id: currentWorkflow.id, updates };
  }
);

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setCurrentWorkflow: (state, action: PayloadAction<Workflow | null>) => {
      state.currentWorkflow = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load workflows
      .addCase(loadWorkflows.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadWorkflows.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workflows = action.payload;
        if (action.payload.length > 0 && !state.currentWorkflow) {
          state.currentWorkflow = action.payload[0];
        }
      })
      .addCase(loadWorkflows.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load workflows';
      })

      // Create workflow
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.workflows.unshift(action.payload);
        state.currentWorkflow = action.payload;
      })

      // Update workflow
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        const { id, updates } = action.payload;
        const index = state.workflows.findIndex((w) => w.id === id);
        if (index !== -1) {
          state.workflows[index] = { ...state.workflows[index], ...updates };
        }
        if (state.currentWorkflow?.id === id) {
          state.currentWorkflow = { ...state.currentWorkflow, ...updates };
        }
      })

      // Delete workflow
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.workflows = state.workflows.filter((w) => w.id !== action.payload);
        if (state.currentWorkflow?.id === action.payload) {
          state.currentWorkflow = state.workflows[0] || null;
        }
      })

      // Save current
      .addCase(saveCurrentWorkflow.fulfilled, (state, action) => {
        const { id, updates } = action.payload;
        const index = state.workflows.findIndex((w) => w.id === id);
        if (index !== -1) {
          state.workflows[index] = { ...state.workflows[index], ...updates };
        }
        if (state.currentWorkflow?.id === id) {
          state.currentWorkflow = { ...state.currentWorkflow, ...updates };
        }
      });
  },
});

export const { setCurrentWorkflow, clearError } = workflowSlice.actions;
export default workflowSlice.reducer;

// Type declaration for window.agnt0
declare global {
  interface Window {
    agnt0?: {
      workflow: {
        create: (workflow: unknown) => Promise<unknown>;
        update: (id: string, workflow: unknown) => Promise<unknown>;
        delete: (id: string) => Promise<unknown>;
        list: () => Promise<Workflow[]>;
        get: (id: string) => Promise<Workflow>;
      };
      execution: {
        run: (workflowId: string, input?: unknown) => Promise<unknown>;
        stop: (executionId: string) => Promise<unknown>;
        list: (workflowId: string) => Promise<unknown[]>;
        get: (id: string) => Promise<unknown>;
      };
      ai: {
        generateDAG: (prompt: string, provider?: string) => Promise<unknown>;
        iterateDAG: (dagId: string, feedback: string) => Promise<unknown>;
      };
      tools: {
        list: () => Promise<unknown[]>;
        getSchema: (toolId: string) => Promise<unknown>;
      };
      config: {
        get: () => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<unknown>;
        setApiKey: (provider: string, key: string) => Promise<unknown>;
      };
      runtime: {
        onNodeStart: (callback: (data: unknown) => void) => () => void;
        onNodeComplete: (callback: (data: unknown) => void) => () => void;
        onNodeError: (callback: (data: unknown) => void) => () => void;
        onExecutionComplete: (callback: (data: unknown) => void) => () => void;
        onExecutionError: (callback: (data: unknown) => void) => () => void;
        onLog: (callback: (data: unknown) => void) => () => void;
      };
    };
  }
}
