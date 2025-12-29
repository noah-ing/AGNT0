import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  BackgroundVariant,
} from 'reactflow';
import { useDispatch, useSelector } from 'react-redux';
import {
  setNodes,
  setEdges,
  setSelectedNodes,
  setSelectedEdges,
} from '../../store/editorSlice';
import { updateWorkflow } from '../../store/workflowSlice';
import type { RootState, AppDispatch } from '../../store';

// Custom nodes
import InputNode from './nodes/InputNode';
import OutputNode from './nodes/OutputNode';
import AgentNode from './nodes/AgentNode';
import ToolNode from './nodes/ToolNode';
import ConditionNode from './nodes/ConditionNode';
import LoopNode from './nodes/LoopNode';
import CodeNode from './nodes/CodeNode';
import PromptNode from './nodes/PromptNode';
import HttpNode from './nodes/HttpNode';
import TransformNode from './nodes/TransformNode';

const nodeTypes = {
  input: InputNode,
  output: OutputNode,
  agent: AgentNode,
  tool: ToolNode,
  condition: ConditionNode,
  loop: LoopNode,
  code: CodeNode,
  prompt: PromptNode,
  http: HttpNode,
  transform: TransformNode,
  parallel: LoopNode, // Reuse loop node visually
  merge: TransformNode, // Reuse transform node visually
  sensor: InputNode, // Reuse input node visually
};

const Editor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const nodes = useSelector((state: RootState) => state.editor.nodes);
  const edges = useSelector((state: RootState) => state.editor.edges);
  const nodeStates = useSelector((state: RootState) => state.execution.nodeStates);
  const currentWorkflow = useSelector((state: RootState) => state.workflow.currentWorkflow);

  // Apply execution states to nodes
  const styledNodes = useMemo(() => {
    return nodes.map((node) => {
      const state = nodeStates[node.id];
      let className = 'agnt0-node';

      if (state) {
        switch (state.status) {
          case 'running':
            className += ' running';
            break;
          case 'completed':
            className += ' completed';
            break;
          case 'error':
            className += ' error';
            break;
        }
      }

      return {
        ...node,
        className,
      };
    });
  }, [nodes, nodeStates]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const newNodes = applyNodeChanges(changes, nodes);
      dispatch(setNodes(newNodes as Node[]));

      // Persist to workflow
      if (currentWorkflow) {
        dispatch(
          updateWorkflow({
            id: currentWorkflow.id,
            updates: { nodes: newNodes },
          })
        );
      }
    },
    [nodes, dispatch, currentWorkflow]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const newEdges = applyEdgeChanges(changes, edges);
      dispatch(setEdges(newEdges as Edge[]));

      // Persist to workflow
      if (currentWorkflow) {
        dispatch(
          updateWorkflow({
            id: currentWorkflow.id,
            updates: { edges: newEdges },
          })
        );
      }
    },
    [edges, dispatch, currentWorkflow]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        type: 'smoothstep',
        animated: false,
      } as Edge;

      const newEdges = addEdge(newEdge, edges);
      dispatch(setEdges(newEdges));

      // Persist to workflow
      if (currentWorkflow) {
        dispatch(
          updateWorkflow({
            id: currentWorkflow.id,
            updates: { edges: newEdges },
          })
        );
      }
    },
    [edges, dispatch, currentWorkflow]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
      dispatch(setSelectedNodes(selectedNodes.map((n) => n.id)));
      dispatch(setSelectedEdges(selectedEdges.map((e) => e.id)));
    },
    [dispatch]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/agnt0-node-type');
      if (!type) return;

      const reactFlowBounds = (event.target as HTMLElement)
        .closest('.react-flow')
        ?.getBoundingClientRect();

      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1),
        },
      };

      const newNodes = [...nodes, newNode];
      dispatch(setNodes(newNodes));

      if (currentWorkflow) {
        dispatch(
          updateWorkflow({
            id: currentWorkflow.id,
            updates: { nodes: newNodes },
          })
        );
      }
    },
    [nodes, dispatch, currentWorkflow]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#3a3a4a', strokeWidth: 2 },
        }}
        connectionLineStyle={{ stroke: '#00d4ff', strokeWidth: 2 }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#2a2a3a"
        />
        <Controls className="!bg-cyber-bg-secondary !border-cyber-border-default" />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'input':
                return '#00d4ff';
              case 'output':
                return '#00ff88';
              case 'agent':
                return '#a855f7';
              case 'tool':
                return '#ec4899';
              case 'condition':
                return '#ffd700';
              case 'code':
                return '#ff6b35';
              default:
                return '#3a3a4a';
            }
          }}
          maskColor="rgba(10, 10, 15, 0.8)"
        />
      </ReactFlow>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-6xl mb-4">🔮</div>
            <h2 className="text-2xl font-bold gradient-text mb-2">
              Start Building Your Workflow
            </h2>
            <p className="text-cyber-text-secondary max-w-md">
              Drag nodes from the sidebar or describe your workflow in natural language below
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
