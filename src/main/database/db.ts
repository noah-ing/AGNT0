import Database from 'better-sqlite3';
import * as path from 'path';
import type { Workflow, Execution, Template, NodeExecutionState } from '../runtime/types';

export class Database {
  private db: ReturnType<typeof Database>;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async initialize(): Promise<void> {
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');

    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        nodes TEXT NOT NULL,
        edges TEXT NOT NULL,
        variables TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        status TEXT NOT NULL,
        input TEXT,
        output TEXT,
        error TEXT,
        logs TEXT,
        node_states TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id)
      );

      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        workflow TEXT NOT NULL,
        preview TEXT,
        tags TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        execution_id TEXT NOT NULL,
        node_id TEXT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (execution_id) REFERENCES executions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_executions_workflow ON executions(workflow_id);
      CREATE INDEX IF NOT EXISTS idx_logs_execution ON logs(execution_id);
      CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
    `);
  }

  // Workflow CRUD
  async createWorkflow(workflow: Workflow): Promise<Workflow> {
    const stmt = this.db.prepare(`
      INSERT INTO workflows (id, name, description, nodes, edges, variables, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      workflow.id,
      workflow.name,
      workflow.description || null,
      JSON.stringify(workflow.nodes),
      JSON.stringify(workflow.edges),
      JSON.stringify(workflow.variables || {}),
      JSON.stringify(workflow.metadata || {}),
      workflow.createdAt,
      workflow.updatedAt
    );

    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.nodes !== undefined) {
      fields.push('nodes = ?');
      values.push(JSON.stringify(updates.nodes));
    }
    if (updates.edges !== undefined) {
      fields.push('edges = ?');
      values.push(JSON.stringify(updates.edges));
    }
    if (updates.variables !== undefined) {
      fields.push('variables = ?');
      values.push(JSON.stringify(updates.variables));
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`UPDATE workflows SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  async deleteWorkflow(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM workflows WHERE id = ?');
    stmt.run(id);
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    const stmt = this.db.prepare('SELECT * FROM workflows WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;

    if (!row) return null;

    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      nodes: JSON.parse(row.nodes as string),
      edges: JSON.parse(row.edges as string),
      variables: JSON.parse(row.variables as string || '{}'),
      metadata: JSON.parse(row.metadata as string || '{}'),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  async listWorkflows(): Promise<Workflow[]> {
    const stmt = this.db.prepare('SELECT * FROM workflows ORDER BY updated_at DESC');
    const rows = stmt.all() as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      nodes: JSON.parse(row.nodes as string),
      edges: JSON.parse(row.edges as string),
      variables: JSON.parse(row.variables as string || '{}'),
      metadata: JSON.parse(row.metadata as string || '{}'),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));
  }

  // Execution CRUD
  async createExecution(execution: Execution): Promise<Execution> {
    const stmt = this.db.prepare(`
      INSERT INTO executions (id, workflow_id, status, input, output, error, logs, node_states, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      execution.id,
      execution.workflowId,
      execution.status,
      JSON.stringify(execution.input),
      execution.output ? JSON.stringify(execution.output) : null,
      execution.error || null,
      JSON.stringify(execution.logs),
      JSON.stringify(execution.nodeStates),
      execution.startedAt,
      execution.completedAt || null
    );

    return execution;
  }

  async updateExecution(id: string, updates: Partial<Execution>): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.output !== undefined) {
      fields.push('output = ?');
      values.push(JSON.stringify(updates.output));
    }
    if (updates.error !== undefined) {
      fields.push('error = ?');
      values.push(updates.error);
    }
    if (updates.logs !== undefined) {
      fields.push('logs = ?');
      values.push(JSON.stringify(updates.logs));
    }
    if (updates.nodeStates !== undefined) {
      fields.push('node_states = ?');
      values.push(JSON.stringify(updates.nodeStates));
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt);
    }

    values.push(id);

    const stmt = this.db.prepare(`UPDATE executions SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  async updateExecutionNodeState(
    executionId: string,
    nodeId: string,
    status: string,
    output?: unknown,
    error?: string
  ): Promise<void> {
    const execution = await this.getExecution(executionId);
    if (!execution) return;

    const nodeStates = execution.nodeStates || {};
    nodeStates[nodeId] = {
      status: status as NodeExecutionState['status'],
      completedAt: new Date().toISOString(),
      output,
      error,
    };

    await this.updateExecution(executionId, { nodeStates });
  }

  async getExecution(id: string): Promise<Execution | null> {
    const stmt = this.db.prepare('SELECT * FROM executions WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;

    if (!row) return null;

    return {
      id: row.id as string,
      workflowId: row.workflow_id as string,
      status: row.status as Execution['status'],
      input: JSON.parse(row.input as string || '{}'),
      output: row.output ? JSON.parse(row.output as string) : undefined,
      error: row.error as string | undefined,
      logs: JSON.parse(row.logs as string || '[]'),
      nodeStates: JSON.parse(row.node_states as string || '{}'),
      startedAt: row.started_at as string,
      completedAt: row.completed_at as string | undefined,
    };
  }

  async listExecutions(workflowId?: string): Promise<Execution[]> {
    const stmt = workflowId
      ? this.db.prepare('SELECT * FROM executions WHERE workflow_id = ? ORDER BY started_at DESC')
      : this.db.prepare('SELECT * FROM executions ORDER BY started_at DESC');

    const rows = (workflowId ? stmt.all(workflowId) : stmt.all()) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: row.id as string,
      workflowId: row.workflow_id as string,
      status: row.status as Execution['status'],
      input: JSON.parse(row.input as string || '{}'),
      output: row.output ? JSON.parse(row.output as string) : undefined,
      error: row.error as string | undefined,
      logs: JSON.parse(row.logs as string || '[]'),
      nodeStates: JSON.parse(row.node_states as string || '{}'),
      startedAt: row.started_at as string,
      completedAt: row.completed_at as string | undefined,
    }));
  }

  // Templates
  async importTemplate(template: Template): Promise<Template> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO templates (id, name, description, category, workflow, preview, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      template.id,
      template.name,
      template.description,
      template.category,
      JSON.stringify(template.workflow),
      template.preview || null,
      JSON.stringify(template.tags || []),
      new Date().toISOString()
    );

    return template;
  }

  async listTemplates(): Promise<Template[]> {
    const stmt = this.db.prepare('SELECT * FROM templates ORDER BY name');
    const rows = stmt.all() as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      category: row.category as string,
      workflow: JSON.parse(row.workflow as string),
      preview: row.preview as string | undefined,
      tags: JSON.parse(row.tags as string || '[]'),
    }));
  }

  // Logging
  async appendLog(
    executionId: string,
    nodeId: string | null,
    level: string,
    message: string,
    data?: unknown
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO logs (execution_id, node_id, level, message, data, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      executionId,
      nodeId,
      level,
      message,
      data ? JSON.stringify(data) : null,
      new Date().toISOString()
    );
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

export { Database as DatabaseClass };
