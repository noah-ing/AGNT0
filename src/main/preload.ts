import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

type Callback = (...args: unknown[]) => void;

const api = {
  // Workflow management
  workflow: {
    create: (workflow: unknown) => ipcRenderer.invoke('workflow:create', workflow),
    update: (id: string, workflow: unknown) => ipcRenderer.invoke('workflow:update', id, workflow),
    delete: (id: string) => ipcRenderer.invoke('workflow:delete', id),
    list: () => ipcRenderer.invoke('workflow:list'),
    get: (id: string) => ipcRenderer.invoke('workflow:get', id),
  },

  // Execution
  execution: {
    run: (workflowId: string, input?: unknown) => ipcRenderer.invoke('execution:run', workflowId, input),
    stop: (executionId: string) => ipcRenderer.invoke('execution:stop', executionId),
    list: (workflowId: string) => ipcRenderer.invoke('execution:list', workflowId),
    get: (id: string) => ipcRenderer.invoke('execution:get', id),
  },

  // AI operations
  ai: {
    generateDAG: (prompt: string, provider?: string) => ipcRenderer.invoke('ai:generate-dag', prompt, provider),
    iterateDAG: (dagId: string, feedback: string) => ipcRenderer.invoke('ai:iterate-dag', dagId, feedback),
  },

  // Tools
  tools: {
    list: () => ipcRenderer.invoke('tools:list'),
    getSchema: (toolId: string) => ipcRenderer.invoke('tools:get-schema', toolId),
  },

  // Config
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    set: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
    setApiKey: (provider: string, key: string) => ipcRenderer.invoke('config:set-api-key', provider, key),
  },

  // Templates
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    import: (template: unknown) => ipcRenderer.invoke('templates:import', template),
  },

  // Dialogs
  dialog: {
    openFile: (options?: unknown) => ipcRenderer.invoke('dialog:open-file', options),
    saveFile: (options?: unknown) => ipcRenderer.invoke('dialog:save-file', options),
  },

  // Shell
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  },

  // Runtime events
  runtime: {
    onNodeStart: (callback: Callback) => {
      const handler = (_: IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on('runtime:node-start', handler);
      return () => ipcRenderer.removeListener('runtime:node-start', handler);
    },
    onNodeComplete: (callback: Callback) => {
      const handler = (_: IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on('runtime:node-complete', handler);
      return () => ipcRenderer.removeListener('runtime:node-complete', handler);
    },
    onNodeError: (callback: Callback) => {
      const handler = (_: IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on('runtime:node-error', handler);
      return () => ipcRenderer.removeListener('runtime:node-error', handler);
    },
    onExecutionComplete: (callback: Callback) => {
      const handler = (_: IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on('runtime:execution-complete', handler);
      return () => ipcRenderer.removeListener('runtime:execution-complete', handler);
    },
    onExecutionError: (callback: Callback) => {
      const handler = (_: IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on('runtime:execution-error', handler);
      return () => ipcRenderer.removeListener('runtime:execution-error', handler);
    },
    onLog: (callback: Callback) => {
      const handler = (_: IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on('runtime:log', handler);
      return () => ipcRenderer.removeListener('runtime:log', handler);
    },
  },
};

contextBridge.exposeInMainWorld('agnt0', api);

export type AGNT0API = typeof api;
