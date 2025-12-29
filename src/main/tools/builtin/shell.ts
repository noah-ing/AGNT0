import type { ToolDefinition, ExecutionContext } from '../../runtime/types';
import { spawn } from 'child_process';

export const ShellTool: ToolDefinition = {
  id: 'shell',
  name: 'Shell Command',
  description: 'Execute shell commands on the local system',
  category: 'System',
  icon: 'Terminal',
  schema: {
    input: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        args: { type: 'array', items: { type: 'string' }, description: 'Command arguments' },
        cwd: { type: 'string', description: 'Working directory' },
        env: { type: 'object', description: 'Environment variables' },
        timeout: { type: 'number', default: 60000, description: 'Timeout in milliseconds' },
        stdin: { type: 'string', description: 'Input to send to stdin' },
      },
      required: ['command'],
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        exitCode: { type: 'number' },
        stdout: { type: 'string' },
        stderr: { type: 'string' },
        error: { type: 'string' },
      },
    },
  },
  execute: async (input: unknown, context: ExecutionContext): Promise<unknown> => {
    const {
      command,
      args = [],
      cwd,
      env = {},
      timeout = 60000,
      stdin,
    } = input as {
      command: string;
      args?: string[];
      cwd?: string;
      env?: Record<string, string>;
      timeout?: number;
      stdin?: string;
    };

    return new Promise((resolve) => {
      const process = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        timeout,
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      if (stdin) {
        process.stdin.write(stdin);
        process.stdin.end();
      }

      process.on('close', (exitCode) => {
        resolve({
          success: exitCode === 0,
          exitCode,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      });

      process.on('error', (error) => {
        resolve({
          success: false,
          exitCode: -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          error: error.message,
        });
      });
    });
  },
};
