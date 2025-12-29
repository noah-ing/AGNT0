#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('agnt0')
  .description('AGNT0 CLI - AI Workflow Automation Platform')
  .version('1.0.0');

// Run command
program
  .command('run <workflow>')
  .description('Run a workflow from a JSON file')
  .option('-i, --input <json>', 'Input data as JSON string')
  .option('-f, --input-file <file>', 'Input data from JSON file')
  .option('-o, --output <file>', 'Write output to file')
  .option('-v, --verbose', 'Verbose output')
  .action(async (workflowPath, options) => {
    console.log('🚀 AGNT0 CLI - Running workflow...\n');

    try {
      // Load workflow
      const fullPath = path.resolve(workflowPath);
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ Workflow file not found: ${fullPath}`);
        process.exit(1);
      }

      const workflowData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      console.log(`📋 Loaded workflow: ${workflowData.name || workflowPath}`);

      // Parse input
      let input = {};
      if (options.input) {
        input = JSON.parse(options.input);
      } else if (options.inputFile) {
        input = JSON.parse(fs.readFileSync(options.inputFile, 'utf-8'));
      }

      if (options.verbose) {
        console.log(`📥 Input: ${JSON.stringify(input, null, 2)}`);
      }

      // Import and run
      const { RuntimeEngine } = await import('../src/main/runtime/engine');
      const { ToolRegistry } = await import('../src/main/tools/registry');
      const { Database } = await import('../src/main/database/db');
      const { ConfigManager } = await import('../src/main/config/manager');

      const dbPath = path.join(process.cwd(), '.agnt0', 'cli.db');
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });

      const database = new Database(dbPath);
      await database.initialize();

      const configManager = new ConfigManager(path.join(process.cwd(), '.agnt0'));
      await configManager.load();

      const toolRegistry = new ToolRegistry();
      await toolRegistry.loadBuiltinTools();

      const engine = new RuntimeEngine(database, toolRegistry, configManager);

      // Create temporary workflow
      await database.createWorkflow({
        id: 'cli-workflow',
        name: workflowData.name,
        description: workflowData.description,
        nodes: workflowData.nodes || workflowData.workflow?.nodes || [],
        edges: workflowData.edges || workflowData.workflow?.edges || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('⚡ Executing workflow...\n');

      // Execute
      const execution = await engine.executeWorkflow('cli-workflow', input);

      // Wait for completion
      await new Promise((resolve) => {
        engine.on('execution:complete', (data) => {
          console.log('\n✅ Execution completed!');
          if (options.verbose) {
            console.log(`📤 Output: ${JSON.stringify(data.output, null, 2)}`);
          }

          if (options.output) {
            fs.writeFileSync(options.output, JSON.stringify(data.output, null, 2));
            console.log(`💾 Output saved to: ${options.output}`);
          }

          resolve(data);
        });

        engine.on('execution:error', (data) => {
          console.error(`\n❌ Execution failed: ${data.error}`);
          process.exit(1);
        });

        engine.on('node:start', (data) => {
          if (options.verbose) {
            console.log(`  ▶ Starting node: ${data.nodeId}`);
          }
        });

        engine.on('node:complete', (data) => {
          console.log(`  ✓ Completed: ${data.nodeId}`);
        });

        engine.on('node:error', (data) => {
          console.error(`  ✗ Failed: ${data.nodeId} - ${data.error}`);
        });
      });

      await database.close();
      process.exit(0);
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate <prompt>')
  .description('Generate a workflow from natural language')
  .option('-p, --provider <provider>', 'AI provider (openai, anthropic, groq)', 'openai')
  .option('-o, --output <file>', 'Output file path')
  .action(async (prompt, options) => {
    console.log('🧠 AGNT0 CLI - Generating workflow...\n');
    console.log(`📝 Prompt: "${prompt}"\n`);

    try {
      const { ConfigManager } = await import('../src/main/config/manager');
      const { AIOrchestrator } = await import('../src/main/ai/orchestrator');

      const configManager = new ConfigManager(path.join(process.cwd(), '.agnt0'));
      await configManager.load();

      const orchestrator = new AIOrchestrator(configManager);
      const dag = await orchestrator.generateDAG(prompt, options.provider);

      const workflow = {
        name: dag.name,
        description: dag.description,
        nodes: dag.nodes,
        edges: dag.edges,
        createdAt: new Date().toISOString(),
      };

      const output = JSON.stringify(workflow, null, 2);

      if (options.output) {
        fs.writeFileSync(options.output, output);
        console.log(`✅ Workflow saved to: ${options.output}`);
      } else {
        console.log('📋 Generated workflow:\n');
        console.log(output);
      }
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// List tools command
program
  .command('tools')
  .description('List available tools')
  .action(async () => {
    console.log('🔧 AGNT0 CLI - Available Tools\n');

    try {
      const { ToolRegistry } = await import('../src/main/tools/registry');
      const registry = new ToolRegistry();
      await registry.loadBuiltinTools();

      const tools = registry.listTools();
      const byCategory = registry.listToolsByCategory();

      for (const [category, categoryTools] of Object.entries(byCategory)) {
        console.log(`\n📁 ${category}`);
        for (const tool of categoryTools) {
          console.log(`   • ${tool.name} (${tool.id})`);
          console.log(`     ${tool.description}`);
        }
      }

      console.log(`\n📊 Total: ${tools.length} tools`);
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Manage configuration')
  .option('--set <key=value>', 'Set a configuration value')
  .option('--get <key>', 'Get a configuration value')
  .option('--api-key <provider=key>', 'Set an API key')
  .option('--show', 'Show current configuration')
  .action(async (options) => {
    console.log('⚙️  AGNT0 CLI - Configuration\n');

    try {
      const { ConfigManager } = await import('../src/main/config/manager');
      const configManager = new ConfigManager(path.join(process.cwd(), '.agnt0'));
      await configManager.load();

      if (options.set) {
        const [key, value] = options.set.split('=');
        await configManager.set(key as any, value);
        console.log(`✅ Set ${key} = ${value}`);
      } else if (options.get) {
        const value = configManager.get(options.get as any);
        console.log(`${options.get} = ${JSON.stringify(value)}`);
      } else if (options.apiKey) {
        const [provider, key] = options.apiKey.split('=');
        await configManager.setApiKey(provider as any, key);
        console.log(`✅ API key set for ${provider}`);
      } else if (options.show) {
        const config = configManager.getConfig();
        console.log('Current configuration:');
        console.log(JSON.stringify({ ...config, apiKeys: '***' }, null, 2));
      } else {
        console.log('Use --show to view configuration or --set/--get/--api-key to modify');
      }
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize AGNT0 in the current directory')
  .action(async () => {
    console.log('🎉 AGNT0 CLI - Initializing...\n');

    const configDir = path.join(process.cwd(), '.agnt0');
    const workflowsDir = path.join(process.cwd(), 'workflows');

    fs.mkdirSync(configDir, { recursive: true });
    fs.mkdirSync(workflowsDir, { recursive: true });

    // Create sample config
    const configPath = path.join(configDir, 'config.json');
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(
        configPath,
        JSON.stringify(
          {
            defaultProvider: 'openai',
            defaultModel: 'gpt-4o',
            apiKeys: {},
          },
          null,
          2
        )
      );
    }

    // Create sample workflow
    const samplePath = path.join(workflowsDir, 'hello-world.json');
    if (!fs.existsSync(samplePath)) {
      fs.writeFileSync(
        samplePath,
        JSON.stringify(
          {
            name: 'Hello World',
            description: 'A simple hello world workflow',
            nodes: [
              {
                id: 'input-1',
                type: 'input',
                position: { x: 100, y: 200 },
                data: { label: 'Input' },
              },
              {
                id: 'agent-1',
                type: 'agent',
                position: { x: 400, y: 200 },
                data: {
                  label: 'Greeter',
                  provider: 'openai',
                  model: 'gpt-4o-mini',
                  systemPrompt: 'You are a friendly greeter. Respond with a warm hello.',
                },
              },
              {
                id: 'output-1',
                type: 'output',
                position: { x: 700, y: 200 },
                data: { label: 'Output' },
              },
            ],
            edges: [
              { id: 'e1', source: 'input-1', target: 'agent-1' },
              { id: 'e2', source: 'agent-1', target: 'output-1' },
            ],
          },
          null,
          2
        )
      );
    }

    console.log('✅ Created .agnt0/ directory');
    console.log('✅ Created workflows/ directory');
    console.log('✅ Created sample workflow: workflows/hello-world.json');
    console.log('\n📝 Next steps:');
    console.log('   1. Set your API key: agnt0 config --api-key openai=sk-...');
    console.log('   2. Run the sample: agnt0 run workflows/hello-world.json');
  });

program.parse();
