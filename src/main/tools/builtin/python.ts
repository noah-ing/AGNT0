import type { ToolDefinition, ExecutionContext } from '../../runtime/types';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export const PythonTool: ToolDefinition = {
  id: 'python',
  name: 'Python Runner',
  description: 'Execute Python code with full library access',
  category: 'Code',
  icon: 'Code2',
  schema: {
    input: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Python code to execute' },
        input: { type: 'any', description: 'Input data passed as JSON to stdin' },
        timeout: { type: 'number', default: 60000, description: 'Execution timeout in ms' },
        pythonPath: { type: 'string', description: 'Path to Python executable' },
      },
      required: ['code'],
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        stdout: { type: 'string' },
        stderr: { type: 'string' },
        result: { type: 'any' },
        error: { type: 'string' },
      },
    },
  },
  execute: async (input: unknown, context: ExecutionContext): Promise<unknown> => {
    const {
      code,
      input: inputData,
      timeout = 60000,
      pythonPath = 'python3',
    } = input as {
      code: string;
      input?: unknown;
      timeout?: number;
      pythonPath?: string;
    };

    // Create a wrapper script that handles JSON input/output
    const wrappedCode = `
import sys
import json

# Read input from stdin
input_data = None
try:
    input_str = sys.stdin.read()
    if input_str.strip():
        input_data = json.loads(input_str)
except:
    pass

# Make input available
INPUT = input_data

# User code
${code}

# Try to output result
try:
    if 'result' in dir():
        print("\\n__RESULT_START__")
        print(json.dumps(result))
        print("__RESULT_END__")
except:
    pass
`;

    try {
      // Write code to temp file
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `agnt0_python_${Date.now()}.py`);
      await fs.writeFile(tempFile, wrappedCode);

      return new Promise((resolve) => {
        const process = spawn(pythonPath, [tempFile], {
          timeout,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        // Send input data
        if (inputData !== undefined) {
          process.stdin.write(JSON.stringify(inputData));
        }
        process.stdin.end();

        process.on('close', async (exitCode) => {
          // Clean up temp file
          try {
            await fs.unlink(tempFile);
          } catch {}

          // Extract result if present
          let result: unknown;
          const resultMatch = stdout.match(/__RESULT_START__\n([\s\S]*?)\n__RESULT_END__/);
          if (resultMatch) {
            try {
              result = JSON.parse(resultMatch[1]);
              stdout = stdout.replace(/__RESULT_START__[\s\S]*?__RESULT_END__\n?/, '').trim();
            } catch {}
          }

          if (exitCode === 0) {
            resolve({
              success: true,
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              result,
            });
          } else {
            resolve({
              success: false,
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              error: stderr.trim() || `Process exited with code ${exitCode}`,
            });
          }
        });

        process.on('error', (error) => {
          resolve({
            success: false,
            error: error.message,
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
