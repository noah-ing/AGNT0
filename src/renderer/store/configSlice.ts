import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface ConfigState {
  defaultProvider: string;
  defaultModel: string;
  ollamaHost: string;
  theme: 'dark' | 'light';
  autoSave: boolean;
  maxConcurrentExecutions: number;
  maxRetries: number;
  retryDelay: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  hasOpenAI: boolean;
  hasAnthropic: boolean;
  hasGroq: boolean;
  hasGitHub: boolean;
  isLoading: boolean;
}

const initialState: ConfigState = {
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o',
  ollamaHost: 'http://localhost:11434',
  theme: 'dark',
  autoSave: true,
  maxConcurrentExecutions: 5,
  maxRetries: 3,
  retryDelay: 1000,
  logLevel: 'info',
  hasOpenAI: false,
  hasAnthropic: false,
  hasGroq: false,
  hasGitHub: false,
  isLoading: false,
};

export const loadConfig = createAsyncThunk('config/load', async () => {
  if (window.agnt0) {
    const config = await window.agnt0.config.get();
    return config as Partial<ConfigState> & {
      apiKeys?: {
        openai?: string;
        anthropic?: string;
        groq?: string;
        github?: string;
      };
    };
  }
  return {};
});

export const updateConfig = createAsyncThunk(
  'config/update',
  async (updates: Partial<ConfigState>) => {
    if (window.agnt0) {
      for (const [key, value] of Object.entries(updates)) {
        await window.agnt0.config.set(key, value);
      }
    }
    return updates;
  }
);

export const setApiKey = createAsyncThunk(
  'config/setApiKey',
  async ({ provider, key }: { provider: 'openai' | 'anthropic' | 'groq' | 'github'; key: string }) => {
    if (window.agnt0) {
      await window.agnt0.config.setApiKey(provider, key);
    }
    return { provider, hasKey: !!key };
  }
);

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadConfig.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        const config = action.payload;

        if (config.defaultProvider) state.defaultProvider = config.defaultProvider;
        if (config.defaultModel) state.defaultModel = config.defaultModel;
        if (config.ollamaHost) state.ollamaHost = config.ollamaHost;
        if (config.theme) state.theme = config.theme;
        if (config.autoSave !== undefined) state.autoSave = config.autoSave;
        if (config.maxConcurrentExecutions) state.maxConcurrentExecutions = config.maxConcurrentExecutions;
        if (config.maxRetries !== undefined) state.maxRetries = config.maxRetries;
        if (config.retryDelay) state.retryDelay = config.retryDelay;
        if (config.logLevel) state.logLevel = config.logLevel;

        // Check which API keys are configured
        if (config.apiKeys) {
          state.hasOpenAI = !!config.apiKeys.openai;
          state.hasAnthropic = !!config.apiKeys.anthropic;
          state.hasGroq = !!config.apiKeys.groq;
          state.hasGitHub = !!config.apiKeys.github;
        }
      })
      .addCase(loadConfig.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(updateConfig.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
      })
      .addCase(setApiKey.fulfilled, (state, action) => {
        const { provider, hasKey } = action.payload;
        switch (provider) {
          case 'openai':
            state.hasOpenAI = hasKey;
            break;
          case 'anthropic':
            state.hasAnthropic = hasKey;
            break;
          case 'groq':
            state.hasGroq = hasKey;
            break;
          case 'github':
            state.hasGitHub = hasKey;
            break;
        }
      });
  },
});

export default configSlice.reducer;
