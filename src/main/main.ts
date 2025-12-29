import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import { RuntimeEngine } from './runtime/engine';
import { ToolRegistry } from './tools/registry';
import { Database } from './database/db';
import { ConfigManager } from './config/manager';

let mainWindow: BrowserWindow | null = null;
let runtimeEngine: RuntimeEngine;
let toolRegistry: ToolRegistry;
let database: Database;
let configManager: ConfigManager;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeServices(): Promise<void> {
  const userDataPath = app.getPath('userData');

  // Initialize database
  database = new Database(path.join(userDataPath, 'agnt0.db'));
  await database.initialize();

  // Initialize config manager
  configManager = new ConfigManager(userDataPath);
  await configManager.load();

  // Initialize tool registry
  toolRegistry = new ToolRegistry();
  await toolRegistry.loadBuiltinTools();

  // Initialize runtime engine
  runtimeEngine = new RuntimeEngine(database, toolRegistry, configManager);
}

function setupIpcHandlers(): void {
  // Workflow management
  ipcMain.handle('workflow:create', async (_, workflow) => {
    return database.createWorkflow(workflow);
  });

  ipcMain.handle('workflow:update', async (_, id, workflow) => {
    return database.updateWorkflow(id, workflow);
  });

  ipcMain.handle('workflow:delete', async (_, id) => {
    return database.deleteWorkflow(id);
  });

  ipcMain.handle('workflow:list', async () => {
    return database.listWorkflows();
  });

  ipcMain.handle('workflow:get', async (_, id) => {
    return database.getWorkflow(id);
  });

  // Execution
  ipcMain.handle('execution:run', async (_, workflowId, input) => {
    const execution = await runtimeEngine.executeWorkflow(workflowId, input);
    return execution;
  });

  ipcMain.handle('execution:stop', async (_, executionId) => {
    return runtimeEngine.stopExecution(executionId);
  });

  ipcMain.handle('execution:list', async (_, workflowId) => {
    return database.listExecutions(workflowId);
  });

  ipcMain.handle('execution:get', async (_, id) => {
    return database.getExecution(id);
  });

  // Natural language to DAG
  ipcMain.handle('ai:generate-dag', async (_, prompt, provider) => {
    return runtimeEngine.generateDAGFromPrompt(prompt, provider);
  });

  ipcMain.handle('ai:iterate-dag', async (_, dagId, feedback) => {
    return runtimeEngine.iterateDAG(dagId, feedback);
  });

  // Tools
  ipcMain.handle('tools:list', async () => {
    return toolRegistry.listTools();
  });

  ipcMain.handle('tools:get-schema', async (_, toolId) => {
    return toolRegistry.getToolSchema(toolId);
  });

  // Config
  ipcMain.handle('config:get', async () => {
    return configManager.getConfig();
  });

  ipcMain.handle('config:set', async (_, key, value) => {
    return configManager.set(key, value);
  });

  ipcMain.handle('config:set-api-key', async (_, provider, key) => {
    return configManager.setApiKey(provider, key);
  });

  // Templates
  ipcMain.handle('templates:list', async () => {
    return database.listTemplates();
  });

  ipcMain.handle('templates:import', async (_, template) => {
    return database.importTemplate(template);
  });

  // File dialogs
  ipcMain.handle('dialog:open-file', async (_, options) => {
    return dialog.showOpenDialog(mainWindow!, options);
  });

  ipcMain.handle('dialog:save-file', async (_, options) => {
    return dialog.showSaveDialog(mainWindow!, options);
  });

  // Shell
  ipcMain.handle('shell:open-external', async (_, url) => {
    return shell.openExternal(url);
  });

  // Runtime events forwarding
  runtimeEngine.on('node:start', (data) => {
    mainWindow?.webContents.send('runtime:node-start', data);
  });

  runtimeEngine.on('node:complete', (data) => {
    mainWindow?.webContents.send('runtime:node-complete', data);
  });

  runtimeEngine.on('node:error', (data) => {
    mainWindow?.webContents.send('runtime:node-error', data);
  });

  runtimeEngine.on('execution:complete', (data) => {
    mainWindow?.webContents.send('runtime:execution-complete', data);
  });

  runtimeEngine.on('execution:error', (data) => {
    mainWindow?.webContents.send('runtime:execution-error', data);
  });

  runtimeEngine.on('log', (data) => {
    mainWindow?.webContents.send('runtime:log', data);
  });
}

app.whenReady().then(async () => {
  await initializeServices();
  setupIpcHandlers();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await database?.close();
});
