import type { ToolDefinition, ExecutionContext } from '../../runtime/types';
import * as fs from 'fs/promises';
import * as path from 'path';

export const FileTool: ToolDefinition = {
  id: 'file',
  name: 'File System',
  description: 'Read, write, and manage files on the local system',
  category: 'System',
  icon: 'File',
  schema: {
    input: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['read', 'write', 'append', 'delete', 'exists', 'list', 'mkdir', 'copy', 'move', 'stat'],
          description: 'File operation to perform',
        },
        path: { type: 'string', description: 'File or directory path' },
        content: { type: 'string', description: 'Content to write' },
        destination: { type: 'string', description: 'Destination path for copy/move' },
        encoding: { type: 'string', default: 'utf-8', description: 'File encoding' },
        recursive: { type: 'boolean', default: false, description: 'Recursive operation for directories' },
      },
      required: ['action', 'path'],
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        result: { type: 'any' },
        error: { type: 'string' },
      },
    },
  },
  execute: async (input: unknown, context: ExecutionContext): Promise<unknown> => {
    const {
      action,
      path: filePath,
      content,
      destination,
      encoding = 'utf-8',
      recursive = false,
    } = input as {
      action: string;
      path: string;
      content?: string;
      destination?: string;
      encoding?: BufferEncoding;
      recursive?: boolean;
    };

    try {
      let result: unknown;

      switch (action) {
        case 'read':
          result = await fs.readFile(filePath, { encoding });
          break;

        case 'write':
          if (content === undefined) throw new Error('Content required for write action');
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, content, { encoding });
          result = { written: filePath, bytes: Buffer.byteLength(content, encoding) };
          break;

        case 'append':
          if (content === undefined) throw new Error('Content required for append action');
          await fs.appendFile(filePath, content, { encoding });
          result = { appended: filePath };
          break;

        case 'delete':
          await fs.rm(filePath, { recursive, force: true });
          result = { deleted: filePath };
          break;

        case 'exists':
          try {
            await fs.access(filePath);
            result = { exists: true };
          } catch {
            result = { exists: false };
          }
          break;

        case 'list':
          const entries = await fs.readdir(filePath, { withFileTypes: true });
          result = entries.map((entry) => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
          }));
          break;

        case 'mkdir':
          await fs.mkdir(filePath, { recursive: true });
          result = { created: filePath };
          break;

        case 'copy':
          if (!destination) throw new Error('Destination required for copy action');
          await fs.mkdir(path.dirname(destination), { recursive: true });
          if (recursive) {
            await copyRecursive(filePath, destination);
          } else {
            await fs.copyFile(filePath, destination);
          }
          result = { copied: filePath, to: destination };
          break;

        case 'move':
          if (!destination) throw new Error('Destination required for move action');
          await fs.mkdir(path.dirname(destination), { recursive: true });
          await fs.rename(filePath, destination);
          result = { moved: filePath, to: destination };
          break;

        case 'stat':
          const stats = await fs.stat(filePath);
          result = {
            size: stats.size,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime,
          };
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

async function copyRecursive(src: string, dest: string): Promise<void> {
  const stats = await fs.stat(src);

  if (stats.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src);
    for (const entry of entries) {
      await copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    await fs.copyFile(src, dest);
  }
}
