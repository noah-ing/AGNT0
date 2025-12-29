import type { ToolDefinition, ExecutionContext } from '../../runtime/types';

export const TextTool: ToolDefinition = {
  id: 'text',
  name: 'Text Tools',
  description: 'Text manipulation, search, and transformation utilities',
  category: 'Data',
  icon: 'Type',
  schema: {
    input: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'split',
            'join',
            'replace',
            'match',
            'extract',
            'template',
            'truncate',
            'wordCount',
            'lines',
            'dedent',
            'escape',
            'unescape',
          ],
          description: 'Text operation to perform',
        },
        text: { type: 'string', description: 'Input text' },
        pattern: { type: 'string', description: 'Regex pattern or search string' },
        replacement: { type: 'string', description: 'Replacement string' },
        delimiter: { type: 'string', description: 'Delimiter for split/join' },
        template: { type: 'string', description: 'Template string with {{placeholders}}' },
        variables: { type: 'object', description: 'Variables for template substitution' },
        maxLength: { type: 'number', description: 'Max length for truncate' },
        global: { type: 'boolean', default: true, description: 'Global regex matching' },
        caseInsensitive: { type: 'boolean', default: false, description: 'Case insensitive matching' },
      },
      required: ['action'],
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
      text = '',
      pattern,
      replacement = '',
      delimiter = '',
      template,
      variables = {},
      maxLength,
      global: globalFlag = true,
      caseInsensitive = false,
    } = input as {
      action: string;
      text?: string;
      pattern?: string;
      replacement?: string;
      delimiter?: string;
      template?: string;
      variables?: Record<string, unknown>;
      maxLength?: number;
      global?: boolean;
      caseInsensitive?: boolean;
    };

    try {
      let result: unknown;

      switch (action) {
        case 'split':
          if (pattern) {
            const flags = (globalFlag ? 'g' : '') + (caseInsensitive ? 'i' : '');
            result = text.split(new RegExp(pattern, flags));
          } else {
            result = text.split(delimiter);
          }
          break;

        case 'join':
          if (!Array.isArray(text)) throw new Error('Input must be an array for join');
          result = (text as unknown as string[]).join(delimiter);
          break;

        case 'replace':
          if (!pattern) throw new Error('Pattern required for replace');
          const flags = (globalFlag ? 'g' : '') + (caseInsensitive ? 'i' : '');
          result = text.replace(new RegExp(pattern, flags), replacement);
          break;

        case 'match':
          if (!pattern) throw new Error('Pattern required for match');
          const matchFlags = (globalFlag ? 'g' : '') + (caseInsensitive ? 'i' : '');
          const matches = text.match(new RegExp(pattern, matchFlags));
          result = matches || [];
          break;

        case 'extract':
          if (!pattern) throw new Error('Pattern required for extract');
          const extractFlags = (globalFlag ? 'g' : '') + (caseInsensitive ? 'i' : '');
          const regex = new RegExp(pattern, extractFlags);
          const extracted: string[][] = [];
          let match;
          while ((match = regex.exec(text)) !== null) {
            extracted.push(match.slice(1));
            if (!globalFlag) break;
          }
          result = extracted;
          break;

        case 'template':
          if (!template) throw new Error('Template required');
          result = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            return String(variables[key] ?? '');
          });
          break;

        case 'truncate':
          if (!maxLength) throw new Error('maxLength required for truncate');
          result = text.length > maxLength ? text.slice(0, maxLength - 3) + '...' : text;
          break;

        case 'wordCount':
          const words = text.trim().split(/\s+/).filter(Boolean);
          result = {
            words: words.length,
            characters: text.length,
            charactersNoSpaces: text.replace(/\s/g, '').length,
            lines: text.split('\n').length,
            sentences: text.split(/[.!?]+/).filter(Boolean).length,
          };
          break;

        case 'lines':
          result = text.split('\n');
          break;

        case 'dedent':
          const lines = text.split('\n');
          const minIndent = lines
            .filter((line) => line.trim())
            .reduce((min, line) => {
              const indent = line.match(/^(\s*)/)?.[1].length || 0;
              return Math.min(min, indent);
            }, Infinity);
          result = lines.map((line) => line.slice(minIndent)).join('\n');
          break;

        case 'escape':
          result = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
          break;

        case 'unescape':
          result = text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
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
