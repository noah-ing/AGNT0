import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { Ollama } from 'ollama';
import { ConfigManager } from '../config/manager';
import type { Workflow, DAGNode, DAGEdge } from '../runtime/types';

interface ChatOptions {
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface GeneratedDAG {
  name: string;
  description: string;
  nodes: DAGNode[];
  edges: DAGEdge[];
}

export class AIOrchestrator {
  private configManager: ConfigManager;
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private groqClient?: Groq;
  private ollamaClient?: Ollama;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.initializeClients();
  }

  private initializeClients(): void {
    const config = this.configManager.getConfig();

    if (config.apiKeys?.openai) {
      this.openaiClient = new OpenAI({ apiKey: config.apiKeys.openai });
    }

    if (config.apiKeys?.anthropic) {
      this.anthropicClient = new Anthropic({ apiKey: config.apiKeys.anthropic });
    }

    if (config.apiKeys?.groq) {
      this.groqClient = new Groq({ apiKey: config.apiKeys.groq });
    }

    // Ollama doesn't need an API key
    this.ollamaClient = new Ollama({ host: config.ollamaHost || 'http://localhost:11434' });
  }

  async chat(options: ChatOptions): Promise<string> {
    const { provider, model, systemPrompt, userPrompt, temperature = 0.7, maxTokens = 2048 } = options;

    switch (provider) {
      case 'openai':
        return this.chatOpenAI(model, systemPrompt, userPrompt, temperature, maxTokens);
      case 'anthropic':
        return this.chatAnthropic(model, systemPrompt, userPrompt, temperature, maxTokens);
      case 'groq':
        return this.chatGroq(model, systemPrompt, userPrompt, temperature, maxTokens);
      case 'ollama':
        return this.chatOllama(model, systemPrompt, userPrompt, temperature, maxTokens);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async chatOpenAI(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized. Please set API key.');
    }

    const response = await this.openaiClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  }

  private async chatAnthropic(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized. Please set API key.');
    }

    const response = await this.anthropicClient.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  }

  private async chatGroq(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.groqClient) {
      throw new Error('Groq client not initialized. Please set API key.');
    }

    const response = await this.groqClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  }

  private async chatOllama(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.ollamaClient) {
      throw new Error('Ollama client not initialized.');
    }

    const response = await this.ollamaClient.chat({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: {
        temperature,
        num_predict: maxTokens,
      },
    });

    return response.message.content;
  }

  async generateDAG(prompt: string, provider?: string): Promise<GeneratedDAG> {
    const config = this.configManager.getConfig();
    const selectedProvider = provider || config.defaultProvider || 'openai';
    const model = this.getDefaultModel(selectedProvider);

    const systemPrompt = `You are an AI workflow architect. Generate DAG (Directed Acyclic Graph) workflows from natural language descriptions.

Output format (JSON only, no markdown):
{
  "name": "Workflow name",
  "description": "Brief description",
  "nodes": [
    {
      "id": "unique_id",
      "type": "input|output|agent|tool|condition|loop|parallel|merge|transform|prompt|code|http",
      "label": "Node label",
      "position": { "x": number, "y": number },
      "data": {
        // Type-specific data
        // For agent: provider, model, systemPrompt, temperature
        // For tool: toolId, toolConfig
        // For code: language, code
        // For condition: condition
        // For http: url, method, headers, body
        // For prompt: promptTemplate, variables
        // For transform: transform (JS expression)
      }
    }
  ],
  "edges": [
    {
      "id": "edge_id",
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "optional label"
    }
  ]
}

Node positioning guidelines:
- Start nodes at x: 100
- Increment x by 300 for each layer
- Space nodes vertically by 150
- Input nodes on left, output on right

Available tools: browser, scraper, http, file, python, code-runner, github, discord, sheets

Generate a workflow that accomplishes the user's goal efficiently.`;

    const response = await this.chat({
      provider: selectedProvider,
      model,
      systemPrompt,
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 4096,
    });

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse DAG from AI response');
    }

    const dag = JSON.parse(jsonMatch[0]) as GeneratedDAG;

    // Validate and fix IDs
    dag.nodes = dag.nodes.map((node, i) => ({
      ...node,
      id: node.id || `node_${i}`,
    }));

    dag.edges = dag.edges.map((edge, i) => ({
      ...edge,
      id: edge.id || `edge_${i}`,
    }));

    return dag;
  }

  async iterateDAG(workflow: Workflow, feedback: string): Promise<GeneratedDAG> {
    const config = this.configManager.getConfig();
    const selectedProvider = config.defaultProvider || 'openai';
    const model = this.getDefaultModel(selectedProvider);

    const systemPrompt = `You are an AI workflow architect. Modify the given DAG based on user feedback.
Maintain the same JSON structure. Only make changes requested by the user.
Preserve node IDs where possible. Output JSON only, no markdown.`;

    const userPrompt = `Current workflow:
${JSON.stringify(workflow, null, 2)}

User feedback: ${feedback}

Output the modified workflow JSON:`;

    const response = await this.chat({
      provider: selectedProvider,
      model,
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 4096,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse updated DAG from AI response');
    }

    return JSON.parse(jsonMatch[0]) as GeneratedDAG;
  }

  async planAndBuild(prompt: string): Promise<{
    plan: string;
    dag: GeneratedDAG;
    tests: string[];
  }> {
    const config = this.configManager.getConfig();

    // Step 1: Plan with a capable model
    const planProvider = 'anthropic';
    const planModel = 'claude-sonnet-4-20250514';

    const planResponse = await this.chat({
      provider: config.apiKeys?.anthropic ? planProvider : 'openai',
      model: config.apiKeys?.anthropic ? planModel : 'gpt-4o',
      systemPrompt: `You are a software architect. Create a detailed plan for building the requested application.
Include:
1. Components needed
2. Data flow
3. External APIs/tools required
4. Testing strategy
Output as structured text.`,
      userPrompt: prompt,
      temperature: 0.5,
      maxTokens: 2048,
    });

    // Step 2: Generate DAG
    const dag = await this.generateDAG(
      `Based on this plan, create a workflow DAG:\n\n${planResponse}\n\nOriginal request: ${prompt}`
    );

    // Step 3: Generate test cases
    const testResponse = await this.chat({
      provider: config.apiKeys?.anthropic ? planProvider : 'openai',
      model: config.apiKeys?.anthropic ? planModel : 'gpt-4o',
      systemPrompt: `Generate test cases for the workflow. Output as JSON array of test descriptions.`,
      userPrompt: `Plan: ${planResponse}\n\nGenerate 5-10 test cases.`,
      temperature: 0.3,
      maxTokens: 1024,
    });

    let tests: string[] = [];
    try {
      const testMatch = testResponse.match(/\[[\s\S]*\]/);
      if (testMatch) {
        tests = JSON.parse(testMatch[0]);
      }
    } catch {
      tests = [testResponse];
    }

    return { plan: planResponse, dag, tests };
  }

  private getDefaultModel(provider: string): string {
    const modelMap: Record<string, string> = {
      openai: 'gpt-4o',
      anthropic: 'claude-sonnet-4-20250514',
      groq: 'llama-3.3-70b-versatile',
      ollama: 'llama3.2',
    };
    return modelMap[provider] || 'gpt-4o';
  }

  refreshClients(): void {
    this.initializeClients();
  }
}
