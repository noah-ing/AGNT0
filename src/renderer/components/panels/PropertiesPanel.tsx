import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Settings, X } from 'lucide-react';
import { updateNodeData } from '../../store/editorSlice';
import type { RootState, AppDispatch } from '../../store';
import type { Node } from 'reactflow';

interface PropertiesPanelProps {
  nodeId: string;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ nodeId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const node = useSelector((state: RootState) =>
    state.editor.nodes.find((n) => n.id === nodeId)
  );

  if (!node) {
    return (
      <div className="flex-1 flex items-center justify-center text-cyber-text-muted">
        Node not found
      </div>
    );
  }

  const updateData = (key: string, value: unknown) => {
    dispatch(updateNodeData({ nodeId, data: { [key]: value } }));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border-default">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-cyber-accent-blue" />
          <span className="font-medium">Properties</span>
        </div>
        <span className="text-xs text-cyber-text-muted">{node.type}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <PropertyField label="Label">
          <input
            type="text"
            value={node.data.label || ''}
            onChange={(e) => updateData('label', e.target.value)}
            className="cyber-input text-sm"
          />
        </PropertyField>

        {/* Description */}
        <PropertyField label="Description">
          <textarea
            value={node.data.description || ''}
            onChange={(e) => updateData('description', e.target.value)}
            rows={2}
            className="cyber-input text-sm resize-none"
          />
        </PropertyField>

        {/* Type-specific fields */}
        {node.type === 'agent' && <AgentProperties node={node} updateData={updateData} />}
        {node.type === 'tool' && <ToolProperties node={node} updateData={updateData} />}
        {node.type === 'code' && <CodeProperties node={node} updateData={updateData} />}
        {node.type === 'prompt' && <PromptProperties node={node} updateData={updateData} />}
        {node.type === 'http' && <HttpProperties node={node} updateData={updateData} />}
        {node.type === 'condition' && <ConditionProperties node={node} updateData={updateData} />}
        {node.type === 'loop' && <LoopProperties node={node} updateData={updateData} />}
        {node.type === 'transform' && <TransformProperties node={node} updateData={updateData} />}
      </div>
    </div>
  );
};

interface PropertyFieldProps {
  label: string;
  children: React.ReactNode;
}

const PropertyField: React.FC<PropertyFieldProps> = ({ label, children }) => (
  <div>
    <label className="block text-xs text-cyber-text-muted mb-1.5">{label}</label>
    {children}
  </div>
);

interface NodePropertiesProps {
  node: Node;
  updateData: (key: string, value: unknown) => void;
}

const AgentProperties: React.FC<NodePropertiesProps> = ({ node, updateData }) => (
  <>
    <PropertyField label="Provider">
      <select
        value={node.data.provider || 'openai'}
        onChange={(e) => updateData('provider', e.target.value)}
        className="cyber-input text-sm"
      >
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="groq">Groq</option>
        <option value="ollama">Ollama (Local)</option>
      </select>
    </PropertyField>

    <PropertyField label="Model">
      <input
        type="text"
        value={node.data.model || 'gpt-4o'}
        onChange={(e) => updateData('model', e.target.value)}
        className="cyber-input text-sm"
        placeholder="gpt-4o"
      />
    </PropertyField>

    <PropertyField label="System Prompt">
      <textarea
        value={node.data.systemPrompt || ''}
        onChange={(e) => updateData('systemPrompt', e.target.value)}
        rows={4}
        className="cyber-input text-sm resize-none font-mono"
        placeholder="You are a helpful assistant..."
      />
    </PropertyField>

    <PropertyField label="Temperature">
      <input
        type="number"
        value={node.data.temperature ?? 0.7}
        onChange={(e) => updateData('temperature', parseFloat(e.target.value))}
        min={0}
        max={2}
        step={0.1}
        className="cyber-input text-sm"
      />
    </PropertyField>

    <PropertyField label="Max Tokens">
      <input
        type="number"
        value={node.data.maxTokens ?? 2048}
        onChange={(e) => updateData('maxTokens', parseInt(e.target.value))}
        min={1}
        className="cyber-input text-sm"
      />
    </PropertyField>
  </>
);

const ToolProperties: React.FC<NodePropertiesProps> = ({ node, updateData }) => (
  <>
    <PropertyField label="Tool">
      <select
        value={node.data.toolId || ''}
        onChange={(e) => updateData('toolId', e.target.value)}
        className="cyber-input text-sm"
      >
        <option value="">Select a tool...</option>
        <option value="browser">Browser</option>
        <option value="scraper">Web Scraper</option>
        <option value="http">HTTP Request</option>
        <option value="file">File System</option>
        <option value="python">Python Runner</option>
        <option value="code-runner">JS Runner</option>
        <option value="github">GitHub</option>
        <option value="shell">Shell Command</option>
        <option value="json">JSON Tools</option>
        <option value="text">Text Tools</option>
      </select>
    </PropertyField>

    <PropertyField label="Tool Config (JSON)">
      <textarea
        value={JSON.stringify(node.data.toolConfig || {}, null, 2)}
        onChange={(e) => {
          try {
            updateData('toolConfig', JSON.parse(e.target.value));
          } catch {}
        }}
        rows={6}
        className="cyber-input text-sm resize-none font-mono"
      />
    </PropertyField>
  </>
);

const CodeProperties: React.FC<NodePropertiesProps> = ({ node, updateData }) => (
  <>
    <PropertyField label="Language">
      <select
        value={node.data.language || 'javascript'}
        onChange={(e) => updateData('language', e.target.value)}
        className="cyber-input text-sm"
      >
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="python">Python</option>
      </select>
    </PropertyField>

    <PropertyField label="Code">
      <textarea
        value={node.data.code || ''}
        onChange={(e) => updateData('code', e.target.value)}
        rows={10}
        className="cyber-input text-sm resize-none font-mono"
        placeholder="// Your code here\nreturn input;"
      />
    </PropertyField>
  </>
);

const PromptProperties: React.FC<NodePropertiesProps> = ({ node, updateData }) => (
  <>
    <PropertyField label="Prompt Template">
      <textarea
        value={node.data.promptTemplate || ''}
        onChange={(e) => updateData('promptTemplate', e.target.value)}
        rows={6}
        className="cyber-input text-sm resize-none font-mono"
        placeholder="Use {{variable}} for placeholders"
      />
    </PropertyField>

    <PropertyField label="Variables (comma-separated)">
      <input
        type="text"
        value={(node.data.variables || []).join(', ')}
        onChange={(e) =>
          updateData(
            'variables',
            e.target.value.split(',').map((v) => v.trim()).filter(Boolean)
          )
        }
        className="cyber-input text-sm"
        placeholder="name, topic, context"
      />
    </PropertyField>
  </>
);

const HttpProperties: React.FC<NodePropertiesProps> = ({ node, updateData }) => (
  <>
    <PropertyField label="Method">
      <select
        value={node.data.method || 'GET'}
        onChange={(e) => updateData('method', e.target.value)}
        className="cyber-input text-sm"
      >
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="PATCH">PATCH</option>
      </select>
    </PropertyField>

    <PropertyField label="URL">
      <input
        type="text"
        value={node.data.url || ''}
        onChange={(e) => updateData('url', e.target.value)}
        className="cyber-input text-sm"
        placeholder="https://api.example.com/endpoint"
      />
    </PropertyField>

    <PropertyField label="Headers (JSON)">
      <textarea
        value={JSON.stringify(node.data.headers || {}, null, 2)}
        onChange={(e) => {
          try {
            updateData('headers', JSON.parse(e.target.value));
          } catch {}
        }}
        rows={3}
        className="cyber-input text-sm resize-none font-mono"
      />
    </PropertyField>

    <PropertyField label="Body">
      <textarea
        value={node.data.body || ''}
        onChange={(e) => updateData('body', e.target.value)}
        rows={4}
        className="cyber-input text-sm resize-none font-mono"
      />
    </PropertyField>
  </>
);

const ConditionProperties: React.FC<NodePropertiesProps> = ({ node, updateData }) => (
  <PropertyField label="Condition (JavaScript expression)">
    <textarea
      value={node.data.condition || ''}
      onChange={(e) => updateData('condition', e.target.value)}
      rows={3}
      className="cyber-input text-sm resize-none font-mono"
      placeholder="input.value > 0"
    />
  </PropertyField>
);

const LoopProperties: React.FC<NodePropertiesProps> = ({ node, updateData }) => (
  <>
    <PropertyField label="Loop Type">
      <select
        value={node.data.loopType || 'for'}
        onChange={(e) => updateData('loopType', e.target.value)}
        className="cyber-input text-sm"
      >
        <option value="for">For (count)</option>
        <option value="forEach">ForEach (array)</option>
        <option value="while">While (condition)</option>
      </select>
    </PropertyField>

    {node.data.loopType === 'for' && (
      <PropertyField label="Iterations">
        <input
          type="number"
          value={node.data.loopConfig?.count ?? 1}
          onChange={(e) =>
            updateData('loopConfig', {
              ...node.data.loopConfig,
              count: parseInt(e.target.value),
            })
          }
          min={1}
          className="cyber-input text-sm"
        />
      </PropertyField>
    )}

    {node.data.loopType === 'while' && (
      <PropertyField label="Condition">
        <input
          type="text"
          value={node.data.loopConfig?.condition || ''}
          onChange={(e) =>
            updateData('loopConfig', {
              ...node.data.loopConfig,
              condition: e.target.value,
            })
          }
          className="cyber-input text-sm font-mono"
          placeholder="input.hasMore === true"
        />
      </PropertyField>
    )}
  </>
);

const TransformProperties: React.FC<NodePropertiesProps> = ({ node, updateData }) => (
  <PropertyField label="Transform Expression">
    <textarea
      value={node.data.transform || ''}
      onChange={(e) => updateData('transform', e.target.value)}
      rows={4}
      className="cyber-input text-sm resize-none font-mono"
      placeholder="input.map(x => x.value)"
    />
  </PropertyField>
);

export default PropertiesPanel;
