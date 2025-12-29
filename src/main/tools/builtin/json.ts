import type { ToolDefinition, ExecutionContext } from '../../runtime/types';

export const JsonTool: ToolDefinition = {
  id: 'json',
  name: 'JSON Tools',
  description: 'Parse, transform, query, and manipulate JSON data',
  category: 'Data',
  icon: 'Braces',
  schema: {
    input: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['parse', 'stringify', 'query', 'merge', 'diff', 'validate', 'transform'],
          description: 'JSON operation to perform',
        },
        data: { type: 'any', description: 'Input data' },
        path: { type: 'string', description: 'JSONPath query (e.g., "$.users[0].name")' },
        schema: { type: 'object', description: 'JSON schema for validation' },
        transform: { type: 'string', description: 'Transform expression' },
        other: { type: 'any', description: 'Second data for merge/diff operations' },
        pretty: { type: 'boolean', default: true, description: 'Pretty print output' },
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
      data,
      path: jsonPath,
      schema,
      transform,
      other,
      pretty = true,
    } = input as {
      action: string;
      data?: unknown;
      path?: string;
      schema?: Record<string, unknown>;
      transform?: string;
      other?: unknown;
      pretty?: boolean;
    };

    try {
      let result: unknown;

      switch (action) {
        case 'parse':
          if (typeof data !== 'string') throw new Error('Data must be a string for parse');
          result = JSON.parse(data);
          break;

        case 'stringify':
          result = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
          break;

        case 'query':
          if (!jsonPath) throw new Error('Path required for query');
          result = queryJsonPath(data, jsonPath);
          break;

        case 'merge':
          if (other === undefined) throw new Error('Other data required for merge');
          result = deepMerge(data as Record<string, unknown>, other as Record<string, unknown>);
          break;

        case 'diff':
          if (other === undefined) throw new Error('Other data required for diff');
          result = jsonDiff(data, other);
          break;

        case 'validate':
          if (!schema) throw new Error('Schema required for validate');
          result = validateJsonSchema(data, schema);
          break;

        case 'transform':
          if (!transform) throw new Error('Transform expression required');
          // eslint-disable-next-line no-new-func
          const transformFn = new Function('data', `return ${transform}`);
          result = transformFn(data);
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

function queryJsonPath(data: unknown, path: string): unknown {
  // Simple JSONPath implementation
  const parts = path.replace(/^\$\.?/, '').split(/\.|\[|\]/).filter(Boolean);
  let current: unknown = data;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = parseInt(part, 10);
      if (!isNaN(index)) {
        current = current[index];
      } else if (part === '*') {
        return current;
      } else {
        current = current.map((item) => (item as Record<string, unknown>)?.[part]);
      }
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (
      targetValue &&
      sourceValue &&
      typeof targetValue === 'object' &&
      typeof sourceValue === 'object' &&
      !Array.isArray(targetValue) &&
      !Array.isArray(sourceValue)
    ) {
      result[key] = deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>);
    } else {
      result[key] = sourceValue;
    }
  }

  return result;
}

function jsonDiff(a: unknown, b: unknown): unknown {
  if (a === b) return { equal: true };
  if (typeof a !== typeof b) return { changed: { from: a, to: b } };

  if (Array.isArray(a) && Array.isArray(b)) {
    const diff: Record<string, unknown> = {};
    const maxLen = Math.max(a.length, b.length);

    for (let i = 0; i < maxLen; i++) {
      if (i >= a.length) {
        diff[`+[${i}]`] = b[i];
      } else if (i >= b.length) {
        diff[`-[${i}]`] = a[i];
      } else {
        const itemDiff = jsonDiff(a[i], b[i]);
        if (!(itemDiff as Record<string, unknown>).equal) {
          diff[`[${i}]`] = itemDiff;
        }
      }
    }

    return Object.keys(diff).length === 0 ? { equal: true } : diff;
  }

  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    const diff: Record<string, unknown> = {};
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);

    for (const key of allKeys) {
      if (!(key in aObj)) {
        diff[`+${key}`] = bObj[key];
      } else if (!(key in bObj)) {
        diff[`-${key}`] = aObj[key];
      } else {
        const valueDiff = jsonDiff(aObj[key], bObj[key]);
        if (!(valueDiff as Record<string, unknown>).equal) {
          diff[key] = valueDiff;
        }
      }
    }

    return Object.keys(diff).length === 0 ? { equal: true } : diff;
  }

  return { changed: { from: a, to: b } };
}

function validateJsonSchema(data: unknown, schema: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  function validate(value: unknown, schemaNode: Record<string, unknown>, path: string): void {
    const type = schemaNode.type as string;

    if (type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (type !== actualType && !(type === 'integer' && typeof value === 'number' && Number.isInteger(value))) {
        errors.push(`${path}: expected ${type}, got ${actualType}`);
        return;
      }
    }

    if (schemaNode.required && Array.isArray(schemaNode.required) && typeof value === 'object' && value !== null) {
      for (const req of schemaNode.required as string[]) {
        if (!(req in (value as Record<string, unknown>))) {
          errors.push(`${path}: missing required property "${req}"`);
        }
      }
    }

    if (schemaNode.properties && typeof value === 'object' && value !== null) {
      const props = schemaNode.properties as Record<string, Record<string, unknown>>;
      const obj = value as Record<string, unknown>;

      for (const [key, propSchema] of Object.entries(props)) {
        if (key in obj) {
          validate(obj[key], propSchema, `${path}.${key}`);
        }
      }
    }

    if (schemaNode.items && Array.isArray(value)) {
      const itemSchema = schemaNode.items as Record<string, unknown>;
      value.forEach((item, i) => validate(item, itemSchema, `${path}[${i}]`));
    }
  }

  validate(data, schema, '$');
  return { valid: errors.length === 0, errors };
}
