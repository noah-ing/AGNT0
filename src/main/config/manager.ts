import * as fs from 'fs';
import * as path from 'path';

export interface AppConfig {
  apiKeys: {
    openai?: string;
    anthropic?: string;
    groq?: string;
    github?: string;
  };
  defaultProvider: string;
  defaultModel: string;
  ollamaHost: string;
  theme: 'dark' | 'light';
  autoSave: boolean;
  maxConcurrentExecutions: number;
  maxRetries: number;
  retryDelay: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const DEFAULT_CONFIG: AppConfig = {
  apiKeys: {},
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o',
  ollamaHost: 'http://localhost:11434',
  theme: 'dark',
  autoSave: true,
  maxConcurrentExecutions: 5,
  maxRetries: 3,
  retryDelay: 1000,
  logLevel: 'info',
};

export class ConfigManager {
  private configPath: string;
  private config: AppConfig;

  constructor(userDataPath: string) {
    this.configPath = path.join(userDataPath, 'config.json');
    this.config = { ...DEFAULT_CONFIG };
  }

  async load(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const loadedConfig = JSON.parse(data);
        this.config = { ...DEFAULT_CONFIG, ...loadedConfig };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.config = { ...DEFAULT_CONFIG };
    }

    // Load API keys from environment variables as fallback
    if (!this.config.apiKeys.openai && process.env.OPENAI_API_KEY) {
      this.config.apiKeys.openai = process.env.OPENAI_API_KEY;
    }
    if (!this.config.apiKeys.anthropic && process.env.ANTHROPIC_API_KEY) {
      this.config.apiKeys.anthropic = process.env.ANTHROPIC_API_KEY;
    }
    if (!this.config.apiKeys.groq && process.env.GROQ_API_KEY) {
      this.config.apiKeys.groq = process.env.GROQ_API_KEY;
    }
    if (!this.config.apiKeys.github && process.env.GITHUB_TOKEN) {
      this.config.apiKeys.github = process.env.GITHUB_TOKEN;
    }
  }

  async save(): Promise<void> {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  async set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): Promise<void> {
    this.config[key] = value;
    await this.save();
  }

  async setApiKey(provider: keyof AppConfig['apiKeys'], key: string): Promise<void> {
    this.config.apiKeys[provider] = key;
    await this.save();
  }

  hasApiKey(provider: keyof AppConfig['apiKeys']): boolean {
    return !!this.config.apiKeys[provider];
  }
}
