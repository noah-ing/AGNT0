# AGNT0

**Local-first AI automation platform for building, running, and scaling modular AI workflows via DAGs.**

## Features

- **Visual DAG Editor** - Drag-and-drop workflow builder with cyberpunk-themed UI
- **Natural Language to DAG** - Describe your workflow in plain English and let AI generate it
- **Multi-Provider AI** - OpenAI, Anthropic, Groq, and local Ollama support
- **10+ Built-in Tools** - Browser automation, web scraping, HTTP, GitHub, Python, and more
- **Local-First** - All data stored locally, zero lock-in, unlimited tasks
- **Cross-Platform** - Windows, macOS, and Linux desktop apps
- **Docker Ready** - Self-host on your own infrastructure
- **CLI Included** - Run workflows from the command line

## Quick Start

### Desktop App

```bash
# Clone the repository
git clone https://github.com/noah-ing/AGNT0.git
cd AGNT0

# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run package
```

### CLI

```bash
# Initialize AGNT0 in current directory
npx agnt0 init

# Configure API keys
npx agnt0 config --api-key openai=sk-...

# Generate a workflow from natural language
npx agnt0 generate "Build a web scraper for product prices" -o workflow.json

# Run a workflow
npx agnt0 run workflow.json --input '{"url": "https://example.com"}'
```

### Docker

```bash
cd docker

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Start with docker-compose
docker-compose up -d

# With Ollama for local LLMs
docker-compose --profile ollama up -d
```

## Architecture

```
AGNT0/
├── src/
│   ├── main/              # Electron main process
│   │   ├── runtime/       # DAG execution engine
│   │   ├── ai/            # AI orchestration (multi-provider)
│   │   ├── tools/         # Built-in tools
│   │   ├── database/      # SQLite storage
│   │   └── config/        # Configuration management
│   └── renderer/          # React frontend
│       ├── components/    # UI components
│       ├── store/         # Redux state management
│       └── hooks/         # React hooks
├── cli/                   # Command-line interface
├── templates/             # Workflow templates
├── docker/                # Docker configuration
└── tests/                 # Test suites
```

## Node Types

| Type | Description |
|------|-------------|
| **Input** | Workflow entry point, receives external data |
| **Output** | Workflow exit point, returns results |
| **Agent** | AI model execution (GPT-4, Claude, Llama, etc.) |
| **Tool** | Built-in tool execution (browser, scraper, etc.) |
| **Condition** | Branching logic based on expressions |
| **Loop** | Iterate over items or repeat N times |
| **Code** | Execute JavaScript/Python code |
| **HTTP** | Make HTTP requests to APIs |
| **Transform** | Data transformation using expressions |
| **Prompt** | Template-based prompt generation |

## Built-in Tools

| Tool | Description |
|------|-------------|
| `browser` | Browser automation with Puppeteer |
| `scraper` | Web scraping with Cheerio |
| `http` | HTTP requests |
| `file` | File system operations |
| `python` | Python code execution |
| `code-runner` | JavaScript execution (sandboxed) |
| `github` | GitHub API integration |
| `shell` | Shell command execution |
| `json` | JSON parsing/querying/transformation |
| `text` | Text manipulation utilities |

## Configuration

### API Keys

Set API keys via environment variables or the settings UI:

```bash
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export GROQ_API_KEY=gsk_...
export GITHUB_TOKEN=ghp_...
```

### Local Models (Ollama)

1. Install [Ollama](https://ollama.ai)
2. Pull a model: `ollama pull llama3.2`
3. Select "Ollama (Local)" as provider in AGNT0

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build
npm run package
```

## Examples

### Web Scraper

```json
{
  "nodes": [
    { "id": "input", "type": "input", "data": { "label": "URL" } },
    { "id": "scrape", "type": "tool", "data": { "toolId": "scraper" } },
    { "id": "extract", "type": "agent", "data": { "model": "gpt-4o-mini" } },
    { "id": "output", "type": "output", "data": { "label": "Data" } }
  ],
  "edges": [
    { "source": "input", "target": "scrape" },
    { "source": "scrape", "target": "extract" },
    { "source": "extract", "target": "output" }
  ]
}
```

### Research Agent

```
"Research the latest developments in quantum computing and write a summary"
```

Automatically generates a multi-step DAG with search, scraping, and synthesis.

## Roadmap

- Plugin marketplace
- Team collaboration
- Scheduled workflows
- Webhook triggers
- Additional AI providers (Google, Cohere, etc.)
- Visual debugging tools
- Performance analytics

## Contributing

Contributions are welcome. Please read the [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.
