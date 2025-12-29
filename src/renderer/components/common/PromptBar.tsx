import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, Send, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import { generateDAG, setGenerating } from '../../store/editorSlice';
import type { RootState, AppDispatch } from '../../store';

const PromptBar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [prompt, setPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isGenerating = useSelector((state: RootState) => state.editor.isGenerating);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setHistory((prev) => [prompt, ...prev.slice(0, 9)]);
    setHistoryIndex(-1);

    dispatch(setGenerating(true));
    try {
      await dispatch(generateDAG(prompt)).unwrap();
      setPrompt('');
    } catch (error) {
      console.error('Failed to generate DAG:', error);
    } finally {
      dispatch(setGenerating(false));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      setPrompt(history[newIndex]);
    } else if (e.key === 'ArrowDown' && historyIndex > -1) {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPrompt(newIndex === -1 ? '' : history[newIndex]);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  const examples = [
    'Build a web scraper that extracts product prices and saves to JSON',
    'Create a workflow that monitors a GitHub repo and summarizes new issues',
    'Make an AI agent that researches a topic and writes a blog post',
    'Build a data pipeline that fetches API data, transforms it, and sends alerts',
  ];

  return (
    <div className="border-t border-cyber-border-default bg-cyber-bg-secondary">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-1 text-xs text-cyber-text-muted hover:text-cyber-text-secondary transition-colors"
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        <span>Natural Language Builder</span>
        {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Example prompts */}
          <div className="mb-3 flex flex-wrap gap-2">
            {examples.map((example, i) => (
              <button
                key={i}
                onClick={() => setPrompt(example)}
                className="text-xs px-2 py-1 rounded-full bg-cyber-bg-tertiary text-cyber-text-muted hover:text-cyber-text-secondary hover:border-cyber-border-hover border border-transparent transition-colors"
              >
                {example.slice(0, 40)}...
              </button>
            ))}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-cyber-bg-primary border border-cyber-border-default focus-within:border-cyber-accent-blue focus-within:shadow-cyber-glow transition-all">
              <Sparkles
                size={20}
                className={`mt-1 shrink-0 ${
                  isGenerating
                    ? 'text-cyber-accent-purple animate-pulse'
                    : 'text-cyber-accent-blue'
                }`}
              />

              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your workflow in natural language... (e.g., 'Create a web scraper that monitors competitor prices')"
                className="flex-1 bg-transparent text-cyber-text-primary placeholder-cyber-text-muted resize-none focus:outline-none min-h-[24px] max-h-[120px]"
                rows={1}
                disabled={isGenerating}
              />

              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r from-cyber-accent-blue to-cyber-accent-purple flex items-center justify-center text-white hover:shadow-cyber-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {isGenerating ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>

            {/* Generating indicator */}
            {isGenerating && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-bg-card border border-cyber-accent-purple shadow-lg">
                  <Sparkles size={14} className="text-cyber-accent-purple animate-pulse" />
                  <span className="text-xs text-cyber-accent-purple">
                    Generating workflow...
                  </span>
                </div>
              </div>
            )}
          </form>

          {/* Tips */}
          <div className="mt-2 flex items-center justify-between text-xs text-cyber-text-muted">
            <span>Press Enter to generate • Shift+Enter for new line</span>
            <span>↑↓ for history</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptBar;
