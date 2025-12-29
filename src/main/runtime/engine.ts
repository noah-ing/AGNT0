import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import { Database } from '../database/db';
import { ToolRegistry } from '../tools/registry';
import { ConfigManager } from '../config/manager';
import { DAGRunner } from './dag-runner';
import { AIOrchestrator } from '../ai/orchestrator';
import type { Workflow, Execution, ExecutionStatus, DAGNode } from './types';

export class RuntimeEngine extends EventEmitter {
  private database: Database;
  private toolRegistry: ToolRegistry;
  private configManager: ConfigManager;
  private activeExecutions: Map<string, DAGRunner> = new Map();
  private aiOrchestrator: AIOrchestrator;

  constructor(database: Database, toolRegistry: ToolRegistry, configManager: ConfigManager) {
    super();
    this.database = database;
    this.toolRegistry = toolRegistry;
    this.configManager = configManager;
    this.aiOrchestrator = new AIOrchestrator(configManager);
  }

  async executeWorkflow(workflowId: string, input?: Record<string, unknown>): Promise<Execution> {
    const workflow = await this.database.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = uuid();
    const execution: Execution = {
      id: executionId,
      workflowId,
      status: 'running',
      startedAt: new Date().toISOString(),
      input: input || {},
      logs: [],
      nodeStates: {},
    };

    await this.database.createExecution(execution);

    const runner = new DAGRunner(
      workflow,
      execution,
      this.toolRegistry,
      this.configManager,
      this.aiOrchestrator
    );

    // Forward runner events
    runner.on('node:start', (data) => {
      this.emit('node:start', { executionId, ...data });
      this.emit('log', { executionId, level: 'info', message: `Node ${data.nodeId} started`, timestamp: new Date().toISOString() });
    });

    runner.on('node:complete', async (data) => {
      this.emit('node:complete', { executionId, ...data });
      this.emit('log', { executionId, level: 'info', message: `Node ${data.nodeId} completed`, timestamp: new Date().toISOString() });
      await this.database.updateExecutionNodeState(executionId, data.nodeId, 'completed', data.output);
    });

    runner.on('node:error', async (data) => {
      this.emit('node:error', { executionId, ...data });
      this.emit('log', { executionId, level: 'error', message: `Node ${data.nodeId} failed: ${data.error}`, timestamp: new Date().toISOString() });
      await this.database.updateExecutionNodeState(executionId, data.nodeId, 'error', null, data.error);
    });

    this.activeExecutions.set(executionId, runner);

    // Execute asynchronously
    this.runExecution(executionId, runner, execution);

    return execution;
  }

  private async runExecution(executionId: string, runner: DAGRunner, execution: Execution): Promise<void> {
    try {
      const result = await runner.run();
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      execution.output = result;

      await this.database.updateExecution(executionId, {
        status: 'completed',
        completedAt: execution.completedAt,
        output: result,
      });

      this.emit('execution:complete', { executionId, output: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      execution.status = 'error';
      execution.completedAt = new Date().toISOString();
      execution.error = errorMessage;

      await this.database.updateExecution(executionId, {
        status: 'error',
        completedAt: execution.completedAt,
        error: errorMessage,
      });

      this.emit('execution:error', { executionId, error: errorMessage });
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  async stopExecution(executionId: string): Promise<boolean> {
    const runner = this.activeExecutions.get(executionId);
    if (!runner) {
      return false;
    }

    runner.stop();
    this.activeExecutions.delete(executionId);

    await this.database.updateExecution(executionId, {
      status: 'stopped',
      completedAt: new Date().toISOString(),
    });

    return true;
  }

  async generateDAGFromPrompt(prompt: string, provider?: string): Promise<Workflow> {
    const dag = await this.aiOrchestrator.generateDAG(prompt, provider);

    // Validate the generated DAG
    this.validateDAG(dag.nodes, dag.edges);

    // Create workflow
    const workflow: Workflow = {
      id: uuid(),
      name: dag.name || 'Generated Workflow',
      description: dag.description || prompt,
      nodes: dag.nodes,
      edges: dag.edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        generatedFrom: prompt,
        provider: provider || 'default',
      },
    };

    await this.database.createWorkflow(workflow);
    return workflow;
  }

  async iterateDAG(workflowId: string, feedback: string): Promise<Workflow> {
    const workflow = await this.database.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const updatedDAG = await this.aiOrchestrator.iterateDAG(workflow, feedback);

    // Validate the updated DAG
    this.validateDAG(updatedDAG.nodes, updatedDAG.edges);

    const updatedWorkflow: Partial<Workflow> = {
      nodes: updatedDAG.nodes,
      edges: updatedDAG.edges,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...workflow.metadata,
        lastIteration: feedback,
        iterationCount: ((workflow.metadata?.iterationCount as number) || 0) + 1,
      },
    };

    await this.database.updateWorkflow(workflowId, updatedWorkflow);
    return { ...workflow, ...updatedWorkflow } as Workflow;
  }

  private validateDAG(nodes: DAGNode[], edges: Array<{ source: string; target: string }>): void {
    const nodeIds = new Set(nodes.map((n) => n.id));

    // Check all edge references are valid
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(`Edge references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        throw new Error(`Edge references non-existent target node: ${edge.target}`);
      }
    }

    // Check for cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const adjacencyList = new Map<string, string[]>();
    for (const node of nodes) {
      adjacencyList.set(node.id, []);
    }
    for (const edge of edges) {
      adjacencyList.get(edge.source)?.push(edge.target);
    }

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      for (const neighbor of adjacencyList.get(nodeId) || []) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycle(node.id)) {
          throw new Error('DAG contains a cycle');
        }
      }
    }
  }
}
