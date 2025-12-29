import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Node, Edge } from 'reactflow';

interface EditorState {
  nodes: Node[];
  edges: Edge[];
  selectedNodes: string[];
  selectedEdges: string[];
  isGenerating: boolean;
  clipboard: {
    nodes: Node[];
    edges: Edge[];
  };
}

const initialState: EditorState = {
  nodes: [],
  edges: [],
  selectedNodes: [],
  selectedEdges: [],
  isGenerating: false,
  clipboard: {
    nodes: [],
    edges: [],
  },
};

// Async thunk for AI-generated DAG
export const generateDAG = createAsyncThunk(
  'editor/generateDAG',
  async (prompt: string) => {
    if (window.agnt0) {
      const result = await window.agnt0.ai.generateDAG(prompt);
      return result as { nodes: Node[]; edges: Edge[] };
    }

    // Fallback for development without Electron
    const mockNodes: Node[] = [
      {
        id: 'input-1',
        type: 'input',
        position: { x: 100, y: 200 },
        data: { label: 'Start' },
      },
      {
        id: 'agent-1',
        type: 'agent',
        position: { x: 400, y: 200 },
        data: {
          label: 'AI Processor',
          provider: 'openai',
          model: 'gpt-4o',
          systemPrompt: 'Process the input and provide analysis.',
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 700, y: 200 },
        data: { label: 'Result' },
      },
    ];

    const mockEdges: Edge[] = [
      { id: 'e1-2', source: 'input-1', target: 'agent-1', type: 'smoothstep' },
      { id: 'e2-3', source: 'agent-1', target: 'output-1', type: 'smoothstep' },
    ];

    return { nodes: mockNodes, edges: mockEdges };
  }
);

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setNodes: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload;
    },
    setEdges: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload;
    },
    addNode: (state, action: PayloadAction<Node>) => {
      state.nodes.push(action.payload);
    },
    removeNode: (state, action: PayloadAction<string>) => {
      state.nodes = state.nodes.filter((n) => n.id !== action.payload);
      state.edges = state.edges.filter(
        (e) => e.source !== action.payload && e.target !== action.payload
      );
    },
    updateNodeData: (
      state,
      action: PayloadAction<{ nodeId: string; data: Record<string, unknown> }>
    ) => {
      const { nodeId, data } = action.payload;
      const node = state.nodes.find((n) => n.id === nodeId);
      if (node) {
        node.data = { ...node.data, ...data };
      }
    },
    addEdge: (state, action: PayloadAction<Edge>) => {
      state.edges.push(action.payload);
    },
    removeEdge: (state, action: PayloadAction<string>) => {
      state.edges = state.edges.filter((e) => e.id !== action.payload);
    },
    setSelectedNodes: (state, action: PayloadAction<string[]>) => {
      state.selectedNodes = action.payload;
    },
    setSelectedEdges: (state, action: PayloadAction<string[]>) => {
      state.selectedEdges = action.payload;
    },
    clearSelection: (state) => {
      state.selectedNodes = [];
      state.selectedEdges = [];
    },
    clearNodes: (state) => {
      state.nodes = [];
      state.edges = [];
      state.selectedNodes = [];
      state.selectedEdges = [];
    },
    copySelection: (state) => {
      state.clipboard = {
        nodes: state.nodes.filter((n) => state.selectedNodes.includes(n.id)),
        edges: state.edges.filter((e) => state.selectedEdges.includes(e.id)),
      };
    },
    pasteSelection: (state) => {
      const offset = { x: 50, y: 50 };
      const idMap = new Map<string, string>();

      // Create new nodes with offset positions and new IDs
      const newNodes = state.clipboard.nodes.map((node) => {
        const newId = `${node.id}-copy-${Date.now()}`;
        idMap.set(node.id, newId);
        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + offset.x,
            y: node.position.y + offset.y,
          },
        };
      });

      // Create new edges with updated references
      const newEdges = state.clipboard.edges
        .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
        .map((edge) => ({
          ...edge,
          id: `${edge.id}-copy-${Date.now()}`,
          source: idMap.get(edge.source)!,
          target: idMap.get(edge.target)!,
        }));

      state.nodes.push(...newNodes);
      state.edges.push(...newEdges);
      state.selectedNodes = newNodes.map((n) => n.id);
      state.selectedEdges = newEdges.map((e) => e.id);
    },
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
    loadWorkflowData: (
      state,
      action: PayloadAction<{ nodes: Node[]; edges: Edge[] }>
    ) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      state.selectedNodes = [];
      state.selectedEdges = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateDAG.pending, (state) => {
        state.isGenerating = true;
      })
      .addCase(generateDAG.fulfilled, (state, action) => {
        state.isGenerating = false;
        if (action.payload) {
          // Add generated nodes to existing
          state.nodes = [...state.nodes, ...action.payload.nodes];
          state.edges = [...state.edges, ...action.payload.edges];
        }
      })
      .addCase(generateDAG.rejected, (state) => {
        state.isGenerating = false;
      });
  },
});

export const {
  setNodes,
  setEdges,
  addNode,
  removeNode,
  updateNodeData,
  addEdge,
  removeEdge,
  setSelectedNodes,
  setSelectedEdges,
  clearSelection,
  clearNodes,
  copySelection,
  pasteSelection,
  setGenerating,
  loadWorkflowData,
} = editorSlice.actions;

export default editorSlice.reducer;
