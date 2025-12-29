import type { ToolDefinition, ExecutionContext } from '../../runtime/types';
import * as vm from 'vm';

export const CodeRunnerTool: ToolDefinition = {
  id: 'code-runner',
  name: 'JavaScript Runner',
  description: 'Execute JavaScript/TypeScript code in a sandboxed environment',
  category: 'Code',
  icon: 'Terminal',
  schema: {
    input: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript code to execute' },
        input: { type: 'any', description: 'Input data available as `input` variable' },
        timeout: { type: 'number', default: 10000, description: 'Execution timeout in ms' },
        async: { type: 'boolean', default: false, description: 'Execute as async function' },
      },
      required: ['code'],
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        result: { type: 'any' },
        logs: { type: 'array', items: { type: 'string' } },
        error: { type: 'string' },
      },
    },
  },
  execute: async (input: unknown, context: ExecutionContext): Promise<unknown> => {
    const {
      code,
      input: inputData,
      timeout = 10000,
      async: isAsync = false,
    } = input as {
      code: string;
      input?: unknown;
      timeout?: number;
      async?: boolean;
    };

    const logs: string[] = [];

    // Create sandbox with safe globals
    const sandbox = {
      input: inputData,
      result: undefined as unknown,
      console: {
        log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
        error: (...args: unknown[]) => logs.push(`[ERROR] ${args.map(String).join(' ')}`),
        warn: (...args: unknown[]) => logs.push(`[WARN] ${args.map(String).join(' ')}`),
        info: (...args: unknown[]) => logs.push(`[INFO] ${args.map(String).join(' ')}`),
      },
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Map,
      Set,
      Promise,
      setTimeout: undefined, // Disabled for security
      setInterval: undefined,
      fetch: undefined,
    };

    try {
      const vmContext = vm.createContext(sandbox);

      if (isAsync) {
        // Wrap in async IIFE
        const asyncCode = `
          (async () => {
            ${code}
            return result;
          })()
        `;
        const script = new vm.Script(asyncCode);
        const promise = script.runInContext(vmContext, { timeout });
        sandbox.result = await promise;
      } else {
        const script = new vm.Script(code);
        script.runInContext(vmContext, { timeout });
      }

      return {
        success: true,
        result: sandbox.result,
        logs,
      };
    } catch (error) {
      return {
        success: false,
        logs,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
