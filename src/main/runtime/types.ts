export type NodeType =
  | 'input'
  | 'output'
  | 'agent'
  | 'tool'
  | 'condition'
  | 'loop'
  | 'parallel'
  | 'merge'
  | 'transform'
  | 'prompt'
  | 'code'
  | 'http'
  | 'sensor';

export interface DAGNode {
  id: string;
  type: NodeType;
  label: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface NodeData {
  // Common fields
  description?: string;

  // Agent node
  provider?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;

  // Tool node
  toolId?: string;
  toolConfig?: Record<string, unknown>;

  // Code node
  language?: 'javascript' | 'python' | 'typescript';
  code?: string;

  // Condition node
  condition?: string;

  // Loop node
  loopType?: 'for' | 'while' | 'forEach';
  loopConfig?: {
    count?: number;
    condition?: string;
    items?: string;
  };

  // Transform node
  transform?: string;

  // HTTP node
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;

  // Prompt node
  promptTemplate?: string;
  variables?: string[];

  // Input/Output node
  schema?: Record<string, unknown>;

  // Sensor node
  sensorType?: 'webcam' | 'microphone' | 'keyboard' | 'mouse' | 'file-watch';
  sensorConfig?: Record<string, unknown>;
}

export interface DAGEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: DAGNode[];
  edges: DAGEdge[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
  variables?: Record<string, unknown>;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'error' | 'stopped';

export type NodeState = 'pending' | 'running' | 'completed' | 'error' | 'skipped';

export interface NodeExecutionState {
  status: NodeState;
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
  retries?: number;
}

export interface ExecutionLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  nodeId?: string;
  message: string;
  data?: unknown;
}

export interface Execution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  logs: ExecutionLog[];
  nodeStates: Record<string, NodeExecutionState>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>;
  preview?: string;
  tags?: string[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  schema: {
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  };
  execute: (input: unknown, context: ExecutionContext) => Promise<unknown>;
}

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  nodeId: string;
  variables: Record<string, unknown>;
  config: Record<string, unknown>;
  emit: (event: string, data: unknown) => void;
}

export interface AIProvider {
  id: string;
  name: string;
  models: string[];
  apiKeyEnvVar?: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
    apiKeyEnvVar: 'OPENAI_API_KEY',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-opus-4-5-20251101', 'claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
  },
  {
    id: 'groq',
    name: 'Groq',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    apiKeyEnvVar: 'GROQ_API_KEY',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    models: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3', 'qwen2.5'],
  },
];
