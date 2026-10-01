export type ToolSource = 'ZYR0 Native' | 'GitHub' | 'Hugging Face' | 'Web';

export type ToolItemType = 'tool' | 'skill' | 'tool_skill';

export type ToolCategory = 'All' | 'ZYR0 Native' | 'AI & Agents' | 'Developer Tools' | 'Research & Docs' | 'Productivity';

export interface ToolItem {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  item_type?: ToolItemType;
  category: Exclude<ToolCategory, 'All' | 'ZYR0 Native'>;
  tags: string[];
  source: ToolSource;
  sourceUrl: string;
  documentationUrl?: string;
  imageUrl?: string;
  badge?: string; // 'Official', 'Trending', 'Popular', 'Beta'
  featured?: boolean;
  capabilities: string[];
  installCommand?: string;
  installInstructions?: string;
  version?: string;
  author?: {
    name: string;
    url?: string;
  };
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  'All',
  'ZYR0 Native',
  'AI & Agents',
  'Developer Tools',
  'Research & Docs',
  'Productivity',
];

export const TOOLS_DATA: ToolItem[] = [
  {
    id: 'zyra',
    slug: 'zyra',
    name: 'ZYRA',
    tagline: 'Autonomous AI workflow orchestrator and code intelligence agent.',
    description: 'ZYRA coordinates multi-agent system execution, automates repetitive coding workflows, and performs deep repository reasoning with verified output artifacts.',
    item_type: 'tool_skill',
    category: 'AI & Agents',
    tags: ['Agentic AI', 'Orchestration', 'Automation', 'Developer'],
    source: 'ZYR0 Native',
    sourceUrl: '/research',
    documentationUrl: '/research',
    badge: 'Official',
    featured: true,
    capabilities: [
      'Multi-step autonomous task planning and execution',
      'Context-aware syntax validation & code editing',
      'Verifiable artifact generation and run traces',
      'Native ZYR0 ecosystem integration'
    ],
    version: 'v1.4',
    author: {
      name: 'ZYR0 Core Team',
      url: 'https://zyroo.org'
    }
  },
  {
    id: 'docsmith',
    slug: 'docsmith',
    name: 'Docsmith',
    tagline: 'Intelligent technical documentation and specification engine.',
    description: 'Turns complex codebases and product requirements into elegant, high-retention markdown specs, API references, and interactive architecture briefs.',
    category: 'Research & Docs',
    tags: ['Documentation', 'Markdown', 'Technical Writing', 'Specs'],
    source: 'ZYR0 Native',
    sourceUrl: '/studio',
    documentationUrl: '/studio',
    badge: 'Official',
    featured: true,
    capabilities: [
      'Automated API endpoint doc generation with schemas',
      'Markdown and OpenAPI 3.1 bidirectional export',
      'Architectural diagram generation (Mermaid.js)',
      'Git repository documentation syncing'
    ],
    version: 'v1.1',
    author: {
      name: 'ZYR0 Engineering',
      url: 'https://zyroo.org'
    }
  },
  {
    id: 'ollama',
    slug: 'ollama',
    name: 'Ollama',
    tagline: 'Get up and running with large language models locally.',
    description: 'Run Llama 3, Mistral, Gemma, and other open-source LLMs locally on macOS, Linux, and Windows with a clean REST API and CLI.',
    category: 'AI & Agents',
    tags: ['Local LLMs', 'Open Source', 'Inference', 'CLI'],
    source: 'GitHub',
    sourceUrl: 'https://github.com/ollama/ollama',
    documentationUrl: 'https://ollama.com',
    badge: 'Popular',
    featured: false,
    capabilities: [
      'Run state-of-the-art open models with 1 command',
      'OpenAI-compatible local API endpoint',
      'GPU acceleration for Apple Silicon and Nvidia',
      'Custom Modelfile support for fine-tuning prompts'
    ],
    installCommand: 'curl -fsSL https://ollama.com/install.sh | sh',
    installInstructions: 'Run the shell installer or download the desktop installer from ollama.com.',
    version: 'v0.5',
    author: {
      name: 'Ollama Team',
      url: 'https://github.com/ollama'
    }
  },
  {
    id: 'transformers',
    slug: 'transformers',
    name: 'Transformers',
    tagline: 'State-of-the-art Machine Learning for PyTorch, TensorFlow, and JAX.',
    description: 'Provides thousands of pretrained models to perform tasks on texts such as classification, information extraction, question answering, summarization, and translation.',
    category: 'AI & Agents',
    tags: ['Machine Learning', 'NLP', 'PyTorch', 'Hugging Face'],
    source: 'Hugging Face',
    sourceUrl: 'https://github.com/huggingface/transformers',
    documentationUrl: 'https://huggingface.co/docs/transformers',
    badge: 'Essential',
    featured: false,
    capabilities: [
      'Access to thousands of pretrained state-of-the-art models',
      'Unified APIs across PyTorch, TensorFlow, and Flax',
      'Seamless Hugging Face Hub model downloading and sharing',
      'Optimized pipelines for inference and fine-tuning'
    ],
    installCommand: 'pip install transformers torch',
    installInstructions: 'Install using pip or conda in your Python 3.9+ virtual environment.',
    version: 'v4.49',
    author: {
      name: 'Hugging Face',
      url: 'https://huggingface.co'
    }
  },
  {
    id: 'vllm',
    slug: 'vllm',
    name: 'vLLM',
    tagline: 'High-throughput and memory-efficient LLM inference engine.',
    description: 'A fast and easy-to-use library for LLM inference and serving with PagedAttention, state-of-the-art serving throughput, and seamless distributed execution.',
    category: 'AI & Agents',
    tags: ['Inference', 'PagedAttention', 'High Throughput', 'Nvidia'],
    source: 'GitHub',
    sourceUrl: 'https://github.com/vllm-project/vllm',
    documentationUrl: 'https://docs.vllm.ai',
    badge: 'High Perf',
    featured: false,
    capabilities: [
      'PagedAttention for zero memory waste in KV cache',
      'Continuous batching of incoming requests',
      'Fast model execution with CUDA and Triton kernels',
      'Drop-in OpenAI-compatible API server'
    ],
    installCommand: 'pip install vllm',
    installInstructions: 'Requires Linux with CUDA 12.1+ and Python 3.9-3.12.',
    version: 'v0.7',
    author: {
      name: 'vLLM Project',
      url: 'https://github.com/vllm-project'
    }
  },
  {
    id: 'shadcn-ui',
    slug: 'shadcn-ui',
    name: 'shadcn/ui',
    tagline: 'Beautifully designed components that you can copy into your apps.',
    description: 'Accessible and customizable components that you can copy and paste into your apps. Free. Open Source. Built on Radix UI and Tailwind CSS.',
    category: 'Developer Tools',
    tags: ['UI', 'React', 'Tailwind CSS', 'Design System'],
    source: 'GitHub',
    sourceUrl: 'https://github.com/shadcn-ui/ui',
    documentationUrl: 'https://ui.shadcn.com',
    badge: 'Trending',
    featured: false,
    capabilities: [
      'Accessible Radix UI primitive foundations',
      'Direct code ownership (no node_modules black box)',
      'Native Tailwind CSS styling with customizable tokens',
      'CLI tool for rapid component scaffolding'
    ],
    installCommand: 'npx shadcn@latest init',
    installInstructions: 'Run the init command inside your React/Vite or Next.js project.',
    version: 'v2.1',
    author: {
      name: 'shadcn',
      url: 'https://github.com/shadcn'
    }
  },
  {
    id: 'ripgrep',
    slug: 'ripgrep',
    name: 'ripgrep (rg)',
    tagline: 'Blazingly fast line-oriented search tool.',
    description: 'ripgrep combines the usability of The Silver Searcher with the raw speed of GNU grep. It recursively searches directories for a regex pattern while respecting gitignore rules.',
    category: 'Developer Tools',
    tags: ['CLI', 'Rust', 'Search', 'Performance'],
    source: 'GitHub',
    sourceUrl: 'https://github.com/BurntSushi/ripgrep',
    documentationUrl: 'https://github.com/BurntSushi/ripgrep#readme',
    badge: 'Essential',
    featured: false,
    capabilities: [
      'Recursively searches current directory in milliseconds',
      'Respects .gitignore and skips hidden files by default',
      'Full Unicode support and regex syntax',
      'Searches compressed files (.zip, .gz, .xz) directly'
    ],
    installCommand: 'cargo install ripgrep',
    installInstructions: 'Available via cargo, brew install ripgrep, or apt-get install ripgrep.',
    version: 'v14.1',
    author: {
      name: 'Andrew Gallant (BurntSushi)',
      url: 'https://github.com/BurntSushi'
    }
  },
  {
    id: 'gradio',
    slug: 'gradio',
    name: 'Gradio',
    tagline: 'Build & share delightful machine learning web apps in Python.',
    description: 'Gradio lets you demo your machine learning model or Python function with a friendly web interface so that anyone can test it anywhere.',
    category: 'Research & Docs',
    tags: ['Python', 'UI', 'ML Demos', 'Hugging Face'],
    source: 'Hugging Face',
    sourceUrl: 'https://github.com/gradio-app/gradio',
    documentationUrl: 'https://www.gradio.app/docs',
    badge: 'Popular',
    featured: false,
    capabilities: [
      'Build web UIs entirely in Python with zero JS',
      'Instant public links for remote model demos',
      'Embedded audio, video, image, and tabular components',
      '1-click deployment to Hugging Face Spaces'
    ],
    installCommand: 'pip install gradio',
    installInstructions: 'Install into your Python virtual environment and run python app.py.',
    version: 'v5.16',
    author: {
      name: 'Gradio Team',
      url: 'https://github.com/gradio-app'
    }
  },
  {
    id: 'uv',
    slug: 'uv',
    name: 'uv',
    tagline: 'An extremely fast Python package and project manager written in Rust.',
    description: 'A single tool to replace pip, pip-tools, virtualenv, and poetry. 10-100x faster than pip with deterministic cross-platform lockfiles.',
    category: 'Developer Tools',
    tags: ['Python', 'Rust', 'Package Manager', 'Fast'],
    source: 'GitHub',
    sourceUrl: 'https://github.com/astral-sh/uv',
    documentationUrl: 'https://docs.astral.sh/uv',
    badge: 'Trending',
    featured: false,
    capabilities: [
      '10-100x faster package installation than pip',
      'Drop-in replacement for common pip, virtualenv, and pip-tools flags',
      'Self-contained executable with zero Python dependency needed',
      'Workspace-aware lockfile management'
    ],
    installCommand: 'curl -LsSf https://astral.sh/uv/install.sh | sh',
    installInstructions: 'Install via curl or brew install uv, then run uv pip install <pkg>.',
    version: 'v0.6',
    author: {
      name: 'Astral',
      url: 'https://astral.sh'
    }
  },
  {
    id: 'diffusers',
    slug: 'diffusers',
    name: 'Diffusers',
    tagline: 'State-of-the-art pretrained diffusion models for generating images and audio.',
    description: 'A modular toolbox for inference and training of latent diffusion models, Stable Diffusion, Flux, and ControlNet across PyTorch platforms.',
    category: 'AI & Agents',
    tags: ['Diffusion', 'Generative AI', 'PyTorch', 'Hugging Face'],
    source: 'Hugging Face',
    sourceUrl: 'https://github.com/huggingface/diffusers',
    documentationUrl: 'https://huggingface.co/docs/diffusers',
    badge: 'Creative',
    featured: false,
    capabilities: [
      'State-of-the-art diffusion pipelines in just a few lines of code',
      'Support for SDXL, Flux, ControlNet, and AnimateDiff',
      'Accelerated inference with LoRA adapters and xFormers',
      'Community pipelines and custom schedulers'
    ],
    installCommand: 'pip install diffusers transformers accelerate',
    installInstructions: 'Requires PyTorch and Python 3.9+ with CUDA support recommended.',
    version: 'v0.32',
    author: {
      name: 'Hugging Face',
      url: 'https://huggingface.co'
    }
  }
];
