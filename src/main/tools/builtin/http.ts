import type { ToolDefinition, ExecutionContext } from '../../runtime/types';

export const HttpTool: ToolDefinition = {
  id: 'http',
  name: 'HTTP Request',
  description: 'Make HTTP requests to APIs and web services',
  category: 'Web',
  icon: 'Send',
  schema: {
    input: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Request URL' },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
          default: 'GET',
        },
        headers: { type: 'object', description: 'Request headers' },
        body: { type: 'any', description: 'Request body (auto-stringified for JSON)' },
        timeout: { type: 'number', description: 'Timeout in milliseconds', default: 30000 },
        responseType: {
          type: 'string',
          enum: ['json', 'text', 'blob', 'arrayBuffer'],
          default: 'json',
        },
      },
      required: ['url'],
    },
    output: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        status: { type: 'number' },
        statusText: { type: 'string' },
        headers: { type: 'object' },
        data: { type: 'any' },
        error: { type: 'string' },
      },
    },
  },
  execute: async (input: unknown, context: ExecutionContext): Promise<unknown> => {
    const {
      url,
      method = 'GET',
      headers = {},
      body,
      timeout = 30000,
      responseType = 'json',
    } = input as {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: unknown;
      timeout?: number;
      responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestHeaders: Record<string, string> = {
        'User-Agent': 'AGNT0/1.0',
        ...headers,
      };

      // Auto-set Content-Type for JSON bodies
      if (body && typeof body === 'object' && !requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json';
      }

      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };

      if (body && method !== 'GET' && method !== 'HEAD') {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      let data: unknown;
      const contentType = response.headers.get('content-type') || '';

      if (responseType === 'json' || contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }
      } else if (responseType === 'text') {
        data = await response.text();
      } else if (responseType === 'blob') {
        const blob = await response.blob();
        data = { size: blob.size, type: blob.type };
      } else if (responseType === 'arrayBuffer') {
        const buffer = await response.arrayBuffer();
        data = { byteLength: buffer.byteLength };
      }

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTimeout = errorMessage.includes('aborted');

      return {
        success: false,
        error: isTimeout ? 'Request timed out' : errorMessage,
      };
    }
  },
};
