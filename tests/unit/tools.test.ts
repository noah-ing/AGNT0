import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock tool implementations for testing
const mockTools = {
  json: {
    parse: (data: string) => JSON.parse(data),
    stringify: (data: unknown, pretty = true) =>
      pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data),
    query: (data: unknown, path: string) => {
      const parts = path.replace(/^\$\.?/, '').split(/\.|\[|\]/).filter(Boolean);
      let current: unknown = data;
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        if (Array.isArray(current)) {
          const index = parseInt(part, 10);
          if (!isNaN(index)) current = current[index];
          else current = current.map((item) => (item as Record<string, unknown>)?.[part]);
        } else if (typeof current === 'object') {
          current = (current as Record<string, unknown>)[part];
        }
      }
      return current;
    },
  },
  text: {
    split: (text: string, delimiter: string) => text.split(delimiter),
    join: (arr: string[], delimiter: string) => arr.join(delimiter),
    replace: (text: string, pattern: string, replacement: string) =>
      text.replace(new RegExp(pattern, 'g'), replacement),
    truncate: (text: string, maxLength: number) =>
      text.length > maxLength ? text.slice(0, maxLength - 3) + '...' : text,
    wordCount: (text: string) => {
      const words = text.trim().split(/\s+/).filter(Boolean);
      return {
        words: words.length,
        characters: text.length,
        lines: text.split('\n').length,
      };
    },
  },
};

describe('JSON Tool', () => {
  it('should parse JSON strings', () => {
    const result = mockTools.json.parse('{"name": "test", "value": 42}');
    expect(result).toEqual({ name: 'test', value: 42 });
  });

  it('should stringify objects', () => {
    const result = mockTools.json.stringify({ a: 1, b: 2 }, false);
    expect(result).toBe('{"a":1,"b":2}');
  });

  it('should query nested data', () => {
    const data = {
      users: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
    };

    expect(mockTools.json.query(data, '$.users[0].name')).toBe('Alice');
    expect(mockTools.json.query(data, '$.users[1].age')).toBe(25);
  });

  it('should handle array queries', () => {
    const data = { items: [1, 2, 3, 4, 5] };
    expect(mockTools.json.query(data, '$.items[2]')).toBe(3);
  });
});

describe('Text Tool', () => {
  it('should split text', () => {
    const result = mockTools.text.split('a,b,c,d', ',');
    expect(result).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should join arrays', () => {
    const result = mockTools.text.join(['hello', 'world'], ' ');
    expect(result).toBe('hello world');
  });

  it('should replace patterns', () => {
    const result = mockTools.text.replace('hello world world', 'world', 'universe');
    expect(result).toBe('hello universe universe');
  });

  it('should truncate long text', () => {
    const result = mockTools.text.truncate('This is a very long text', 15);
    expect(result).toBe('This is a ve...');
    expect(result.length).toBe(15);
  });

  it('should not truncate short text', () => {
    const result = mockTools.text.truncate('Short', 10);
    expect(result).toBe('Short');
  });

  it('should count words and characters', () => {
    const result = mockTools.text.wordCount('Hello world!\nNew line.');
    expect(result.words).toBe(4);
    expect(result.lines).toBe(2);
  });
});

describe('Tool Input Validation', () => {
  it('should handle empty input', () => {
    expect(() => mockTools.json.parse('')).toThrow();
  });

  it('should handle invalid JSON', () => {
    expect(() => mockTools.json.parse('not valid json')).toThrow();
  });

  it('should handle null values in queries', () => {
    const result = mockTools.json.query(null, '$.path');
    expect(result).toBeUndefined();
  });
});
