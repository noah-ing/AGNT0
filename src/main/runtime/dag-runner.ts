import { EventEmitter } from 'events';
import { ToolRegistry } from '../tools/registry';
import { ConfigManager } from '../config/manager';
import { AIOrchestrator } from '../ai/orchestrator';
import type {
  Workflow,
  Execution,
  DAGNode,
  DAGEdge,
  NodeExecutionState,
  ExecutionContext,
} from './types';

interface NodeResult {
  nodeId: string;
  output: unknown;
  error?: string;
}

export class DAGRunner extends EventEmitter {
  private workflow: Workflow;
  private execution: Execution;
  private toolRegistry: ToolRegistry;
  private configManager: ConfigManager;
  private aiOrchestrator: AIOrchestrator;
  private stopped = false;
  private nodeOutputs: Map<string, unknown> = new Map();
  private adjacencyList: Map<string, string[]> = new Map();
  private reverseAdjacencyList: Map<string, string[]> = new Map();
  private inDegree: Map<string, number> = new Map();

  constructor(
    workflow: Workflow,
    execution: Execution,
    toolRegistry: ToolRegistry,
    configManager: ConfigManager,
    aiOrchestrator: AIOrchestrator
  ) {
    super();
    this.workflow = workflow;
    this.execution = execution;
    this.toolRegistry = toolRegistry;
    this.configManager = configManager;
    this.aiOrchestrator = aiOrchestrator;
    this.buildGraphStructures();
  }

  private buildGraphStructures(): void {
    // Initialize adjacency lists
    for (const node of this.workflow.nodes) {
      this.adjacencyList.set(node.id, []);
      this.reverseAdjacencyList.set(node.id, []);
      this.inDegree.set(node.id, 0);
    }

    // Build adjacency lists from edges
    for (const edge of this.workflow.edges) {
      this.adjacencyList.get(edge.source)?.push(edge.target);
      this.reverseAdjacencyList.get(edge.target)?.push(edge.source);
      this.inDegree.set(edge.target, (this.inDegree.get(edge.target) || 0) + 1);
    }
  }

  async run(): Promise<unknown> {
    // Find starting nodes (nodes with no incoming edges)
    const startNodes = this.workflow.nodes.filter(
      (node) => (this.inDegree.get(node.id) || 0) === 0
    );

    if (startNodes.length === 0) {
      throw new Error('No starting nodes found in workflow');
    }

    // Process input nodes first
    const inputNodes = startNodes.filter((n) => n.type === 'input');
    for (const node of inputNodes) {
      this.nodeOutputs.set(node.id, this.execution.input);
    }

    // Execute using topological order with parallel execution where possible
    await this.executeDAG();

    // Find output nodes and return their results
    const outputNodes = this.workflow.nodes.filter((n) => n.type === 'output');
    if (outputNodes.length === 1) {
      return this.nodeOutputs.get(outputNodes[0].id);
    } else if (outputNodes.length > 1) {
      const result: Record<string, unknown> = {};
      for (const node of outputNodes) {
        result[node.label || node.id] = this.nodeOutputs.get(node.id);
      }
      return result;
    }

    // If no output nodes, return all terminal node outputs
    const terminalNodes = this.workflow.nodes.filter(
      (node) => (this.adjacencyList.get(node.id)?.length || 0) === 0
    );
    if (terminalNodes.length === 1) {
      return this.nodeOutputs.get(terminalNodes[0].id);
    }
    const result: Record<string, unknown> = {};
    for (const node of terminalNodes) {
      result[node.label || node.id] = this.nodeOutputs.get(node.id);
    }
    return result;
  }

  private async executeDAG(): Promise<void> {
    const remainingInDegree = new Map(this.inDegree);
    const completed = new Set<string>();
    const queue: DAGNode[] = [];

    // Start with nodes that have no dependencies
    for (const node of this.workflow.nodes) {
      if ((remainingInDegree.get(node.id) || 0) === 0) {
        queue.push(node);
      }
    }

    while (queue.length > 0 && !this.stopped) {
      // Execute all ready nodes in parallel
      const readyNodes = [...queue];
      queue.length = 0;

      const results = await Promise.allSettled(
        readyNodes.map((node) => this.executeNode(node))
      );

      for (let i = 0; i < readyNodes.length; i++) {
        const node = readyNodes[i];
        const result = results[i];

        if (result.status === 'fulfilled') {
          completed.add(node.id);

          // Reduce in-degree of downstream nodes
          for (const downstreamId of this.adjacencyList.get(node.id) || []) {
            const newDegree = (remainingInDegree.get(downstreamId) || 1) - 1;
            remainingInDegree.set(downstreamId, newDegree);

            if (newDegree === 0) {
              const downstreamNode = this.workflow.nodes.find((n) => n.id === downstreamId);
              if (downstreamNode) {
                queue.push(downstreamNode);
              }
            }
          }
        } else {
          throw new Error(`Node ${node.id} failed: ${result.reason}`);
        }
      }
    }

    if (this.stopped) {
      throw new Error('Execution stopped');
    }
  }

  private async executeNode(node: DAGNode): Promise<NodeResult> {
    if (this.stopped) {
      return { nodeId: node.id, output: null, error: 'Execution stopped' };
    }

    // Skip if already has output (e.g., input nodes)
    if (this.nodeOutputs.has(node.id)) {
      return { nodeId: node.id, output: this.nodeOutputs.get(node.id) };
    }

    this.emit('node:start', { nodeId: node.id, type: node.type });

    try {
      // Gather inputs from upstream nodes
      const inputs = this.gatherInputs(node);

      // Execute based on node type
      let output: unknown;
      const context = this.createContext(node);

      switch (node.type) {
        case 'input':
          output = this.execution.input;
          break;

        case 'output':
          output = inputs;
          break;

        case 'agent':
          output = await this.executeAgentNode(node, inputs, context);
          break;

        case 'tool':
          output = await this.executeToolNode(node, inputs, context);
          break;

        case 'condition':
          output = await this.executeConditionNode(node, inputs);
          break;

        case 'loop':
          output = await this.executeLoopNode(node, inputs, context);
          break;

        case 'parallel':
          output = await this.executeParallelNode(node, inputs, context);
          break;

        case 'merge':
          output = this.executeMergeNode(node, inputs);
          break;

        case 'transform':
          output = await this.executeTransformNode(node, inputs);
          break;

        case 'prompt':
          output = this.executePromptNode(node, inputs);
          break;

        case 'code':
          output = await this.executeCodeNode(node, inputs, context);
          break;

        case 'http':
          output = await this.executeHttpNode(node, inputs);
          break;

        default:
          output = inputs;
      }

      this.nodeOutputs.set(node.id, output);
      this.emit('node:complete', { nodeId: node.id, output });

      return { nodeId: node.id, output };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('node:error', { nodeId: node.id, error: errorMessage });
      throw error;
    }
  }

  private gatherInputs(node: DAGNode): unknown {
    const upstreamNodes = this.reverseAdjacencyList.get(node.id) || [];

    if (upstreamNodes.length === 0) {
      return this.execution.input;
    }

    if (upstreamNodes.length === 1) {
      return this.nodeOutputs.get(upstreamNodes[0]);
    }

    // Multiple inputs - combine into object
    const inputs: Record<string, unknown> = {};
    for (const upstreamId of upstreamNodes) {
      const upstreamNode = this.workflow.nodes.find((n) => n.id === upstreamId);
      const key = upstreamNode?.label || upstreamId;
      inputs[key] = this.nodeOutputs.get(upstreamId);
    }
    return inputs;
  }

  private createContext(node: DAGNode): ExecutionContext {
    return {
      executionId: this.execution.id,
      workflowId: this.workflow.id,
      nodeId: node.id,
      variables: { ...this.workflow.variables, ...this.execution.input },
      config: this.configManager.getConfig(),
      emit: (event: string, data: unknown) => this.emit(event, { nodeId: node.id, data }),
    };
  }

  private async executeAgentNode(
    node: DAGNode,
    input: unknown,
    context: ExecutionContext
  ): Promise<unknown> {
    const provider = node.data.provider || 'openai';
    const model = node.data.model || 'gpt-4o';
    const systemPrompt = node.data.systemPrompt || 'You are a helpful assistant.';
    const temperature = node.data.temperature ?? 0.7;
    const maxTokens = node.data.maxTokens ?? 2048;

    const prompt = typeof input === 'string' ? input : JSON.stringify(input);

    return this.aiOrchestrator.chat({
      provider,
      model,
      systemPrompt,
      userPrompt: prompt,
      temperature,
      maxTokens,
    });
  }

  private async executeToolNode(
    node: DAGNode,
    input: unknown,
    context: ExecutionContext
  ): Promise<unknown> {
    const toolId = node.data.toolId;
    if (!toolId) {
      throw new Error('Tool node missing toolId');
    }

    const tool = this.toolRegistry.getTool(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    const toolInput = { ...node.data.toolConfig, input };
    return tool.execute(toolInput, context);
  }

  private async executeConditionNode(node: DAGNode, input: unknown): Promise<unknown> {
    const condition = node.data.condition || 'true';
    // eslint-disable-next-line no-new-func
    const conditionFn = new Function('input', `return ${condition}`);
    return conditionFn(input);
  }

  private async executeLoopNode(
    node: DAGNode,
    input: unknown,
    context: ExecutionContext
  ): Promise<unknown> {
    const loopType = node.data.loopType || 'for';
    const loopConfig = node.data.loopConfig || {};
    const results: unknown[] = [];

    if (loopType === 'for') {
      const count = loopConfig.count || 1;
      for (let i = 0; i < count && !this.stopped; i++) {
        results.push({ index: i, input });
      }
    } else if (loopType === 'forEach') {
      const items = Array.isArray(input) ? input : [input];
      for (const item of items) {
        if (this.stopped) break;
        results.push(item);
      }
    }

    return results;
  }

  private async executeParallelNode(
    node: DAGNode,
    input: unknown,
    context: ExecutionContext
  ): Promise<unknown[]> {
    const items = Array.isArray(input) ? input : [input];
    return Promise.all(items.map((item) => Promise.resolve(item)));
  }

  private executeMergeNode(node: DAGNode, inputs: unknown): unknown {
    if (Array.isArray(inputs)) {
      return inputs.flat();
    }
    return inputs;
  }

  private async executeTransformNode(node: DAGNode, input: unknown): Promise<unknown> {
    const transform = node.data.transform || 'input';
    // eslint-disable-next-line no-new-func
    const transformFn = new Function('input', `return ${transform}`);
    return transformFn(input);
  }

  private executePromptNode(node: DAGNode, input: unknown): string {
    let template = node.data.promptTemplate || '{{input}}';
    const variables = node.data.variables || [];

    // Replace input placeholder
    template = template.replace(/\{\{input\}\}/g, String(input));

    // Replace variable placeholders
    if (typeof input === 'object' && input !== null) {
      for (const variable of variables) {
        const value = (input as Record<string, unknown>)[variable];
        template = template.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), String(value ?? ''));
      }
    }

    return template;
  }

  private async executeCodeNode(
    node: DAGNode,
    input: unknown,
    context: ExecutionContext
  ): Promise<unknown> {
    const language = node.data.language || 'javascript';
    const code = node.data.code || 'return input;';

    if (language === 'javascript' || language === 'typescript') {
      // eslint-disable-next-line no-new-func
      const fn = new Function('input', 'context', code);
      return fn(input, context);
    } else if (language === 'python') {
      // Use Python tool for execution
      const pythonTool = this.toolRegistry.getTool('python');
      if (!pythonTool) {
        throw new Error('Python tool not available');
      }
      return pythonTool.execute({ code, input }, context);
    }

    throw new Error(`Unsupported language: ${language}`);
  }

  private async executeHttpNode(node: DAGNode, input: unknown): Promise<unknown> {
    const url = node.data.url || '';
    const method = node.data.method || 'GET';
    const headers = node.data.headers || {};
    let body = node.data.body;

    // Replace placeholders in URL and body
    let processedUrl = url;
    let processedBody = body;

    if (typeof input === 'object' && input !== null) {
      for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
        processedUrl = processedUrl.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
        if (processedBody) {
          processedBody = processedBody.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
        }
      }
    }

    const fetchOptions: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };

    if (method !== 'GET' && processedBody) {
      fetchOptions.body = processedBody;
    }

    const response = await fetch(processedUrl, fetchOptions);
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  stop(): void {
    this.stopped = true;
  }
}
