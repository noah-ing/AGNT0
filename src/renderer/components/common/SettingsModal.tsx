import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Key, Cpu, Palette, Save, Check, AlertCircle } from 'lucide-react';
import { updateConfig, setApiKey } from '../../store/configSlice';
import type { RootState, AppDispatch } from '../../store';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const config = useSelector((state: RootState) => state.config);
  const [activeTab, setActiveTab] = useState<'keys' | 'models' | 'appearance'>('keys');
  const [saved, setSaved] = useState(false);

  // Local state for API keys
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [ollamaHost, setOllamaHost] = useState(config.ollamaHost || 'http://localhost:11434');

  const handleSaveKeys = async () => {
    if (openaiKey) await dispatch(setApiKey({ provider: 'openai', key: openaiKey }));
    if (anthropicKey) await dispatch(setApiKey({ provider: 'anthropic', key: anthropicKey }));
    if (groqKey) await dispatch(setApiKey({ provider: 'groq', key: groqKey }));
    if (githubToken) await dispatch(setApiKey({ provider: 'github', key: githubToken }));
    await dispatch(updateConfig({ ollamaHost }));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl bg-cyber-bg-secondary border border-cyber-border-default shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border-default">
          <h2 className="text-xl font-bold gradient-text">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-cyber-bg-tertiary text-cyber-text-muted hover:text-cyber-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-cyber-border-default">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-cyber-accent-blue border-b-2 border-cyber-accent-blue'
                  : 'text-cyber-text-muted hover:text-cyber-text-secondary'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-cyber-accent-blue/10 border border-cyber-accent-blue/30">
                <AlertCircle size={20} className="text-cyber-accent-blue shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-cyber-accent-blue mb-1">
                    API Keys are stored locally
                  </p>
                  <p className="text-cyber-text-secondary">
                    Your keys are encrypted and stored on your machine. They are never sent to any
                    third-party servers.
                  </p>
                </div>
              </div>

              <SettingsField label="OpenAI API Key" hint="For GPT-4, GPT-4o models">
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={config.hasOpenAI ? '••••••••••••••••' : 'sk-...'}
                  className="cyber-input"
                />
              </SettingsField>

              <SettingsField label="Anthropic API Key" hint="For Claude models">
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder={config.hasAnthropic ? '••••••••••••••••' : 'sk-ant-...'}
                  className="cyber-input"
                />
              </SettingsField>

              <SettingsField label="Groq API Key" hint="For fast Llama, Mixtral models">
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder={config.hasGroq ? '••••••••••••••••' : 'gsk_...'}
                  className="cyber-input"
                />
              </SettingsField>

              <SettingsField label="GitHub Token" hint="For GitHub integrations">
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder={config.hasGitHub ? '••••••••••••••••' : 'ghp_...'}
                  className="cyber-input"
                />
              </SettingsField>

              <SettingsField label="Ollama Host" hint="For local model inference">
                <input
                  type="text"
                  value={ollamaHost}
                  onChange={(e) => setOllamaHost(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="cyber-input"
                />
              </SettingsField>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-6">
              <SettingsField label="Default Provider">
                <select
                  value={config.defaultProvider}
                  onChange={(e) => dispatch(updateConfig({ defaultProvider: e.target.value }))}
                  className="cyber-input"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="groq">Groq</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </SettingsField>

              <SettingsField label="Default Model">
                <input
                  type="text"
                  value={config.defaultModel}
                  onChange={(e) => dispatch(updateConfig({ defaultModel: e.target.value }))}
                  placeholder="gpt-4o"
                  className="cyber-input"
                />
              </SettingsField>

              <SettingsField label="Max Concurrent Executions">
                <input
                  type="number"
                  value={config.maxConcurrentExecutions}
                  onChange={(e) =>
                    dispatch(updateConfig({ maxConcurrentExecutions: parseInt(e.target.value) }))
                  }
                  min={1}
                  max={20}
                  className="cyber-input"
                />
              </SettingsField>

              <SettingsField label="Max Retries">
                <input
                  type="number"
                  value={config.maxRetries}
                  onChange={(e) => dispatch(updateConfig({ maxRetries: parseInt(e.target.value) }))}
                  min={0}
                  max={10}
                  className="cyber-input"
                />
              </SettingsField>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <SettingsField label="Theme">
                <select
                  value={config.theme}
                  onChange={(e) =>
                    dispatch(updateConfig({ theme: e.target.value as 'dark' | 'light' }))
                  }
                  className="cyber-input"
                >
                  <option value="dark">Dark (Cyberpunk)</option>
                  <option value="light" disabled>
                    Light (Coming soon)
                  </option>
                </select>
              </SettingsField>

              <SettingsField label="Auto Save">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.autoSave}
                    onChange={(e) => dispatch(updateConfig({ autoSave: e.target.checked }))}
                    className="w-5 h-5 rounded border-cyber-border-default bg-cyber-bg-tertiary checked:bg-cyber-accent-blue"
                  />
                  <span className="text-sm text-cyber-text-secondary">
                    Automatically save workflows
                  </span>
                </label>
              </SettingsField>

              <SettingsField label="Log Level">
                <select
                  value={config.logLevel}
                  onChange={(e) =>
                    dispatch(
                      updateConfig({
                        logLevel: e.target.value as 'debug' | 'info' | 'warn' | 'error',
                      })
                    )
                  }
                  className="cyber-input"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </SettingsField>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-cyber-border-default">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-cyber-text-secondary hover:text-cyber-text-primary hover:bg-cyber-bg-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveKeys}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyber-accent-blue to-cyber-accent-purple text-white font-medium hover:shadow-cyber-glow transition-all"
          >
            {saved ? (
              <>
                <Check size={16} />
                Saved!
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SettingsFieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const SettingsField: React.FC<SettingsFieldProps> = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-cyber-text-primary mb-1.5">{label}</label>
    {hint && <p className="text-xs text-cyber-text-muted mb-2">{hint}</p>}
    {children}
  </div>
);

export default SettingsModal;
