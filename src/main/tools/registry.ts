import type { ToolDefinition, ExecutionContext } from '../runtime/types';
import { BrowserTool } from './builtin/browser';
import { ScraperTool } from './builtin/scraper';
import { HttpTool } from './builtin/http';
import { FileTool } from './builtin/file';
import { PythonTool } from './builtin/python';
import { CodeRunnerTool } from './builtin/code-runner';
import { GitHubTool } from './builtin/github';
import { ShellTool } from './builtin/shell';
import { JsonTool } from './builtin/json';
import { TextTool } from './builtin/text';

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  async loadBuiltinTools(): Promise<void> {
    const builtinTools: ToolDefinition[] = [
      BrowserTool,
      ScraperTool,
      HttpTool,
      FileTool,
      PythonTool,
      CodeRunnerTool,
      GitHubTool,
      ShellTool,
      JsonTool,
      TextTool,
    ];

    for (const tool of builtinTools) {
      this.registerTool(tool);
    }
  }

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  unregisterTool(toolId: string): void {
    this.tools.delete(toolId);
  }

  getTool(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  getToolSchema(toolId: string): ToolDefinition['schema'] | undefined {
    return this.tools.get(toolId)?.schema;
  }

  listTools(): Array<Omit<ToolDefinition, 'execute'>> {
    return Array.from(this.tools.values()).map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      icon: tool.icon,
      schema: tool.schema,
    }));
  }

  listToolsByCategory(): Record<string, Array<Omit<ToolDefinition, 'execute'>>> {
    const categories: Record<string, Array<Omit<ToolDefinition, 'execute'>>> = {};

    for (const tool of this.tools.values()) {
      const category = tool.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        icon: tool.icon,
        schema: tool.schema,
      });
    }

    return categories;
  }

  async executeTool(
    toolId: string,
    input: unknown,
    context: ExecutionContext
  ): Promise<unknown> {
    const tool = this.getTool(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    return tool.execute(input, context);
  }
}
