# claude-agents-delegation

[![npm version](https://img.shields.io/npm/v/claude-agents-delegation.svg)](https://www.npmjs.com/package/claude-agents-delegation)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Multi-agent delegation boilerplate for **Claude Code** — run Gemini, Codex, and Claude agents in parallel with simple shorthands.

## Quick Start

```bash
npx claude-agents-delegation init
```

Or with defaults (no prompts):

```bash
npx claude-agents-delegation init -y
```

## What It Does

Claude Code is powerful but expensive. This boilerplate redirects simple tasks to cheaper AI models:

| Layer | AI | Role | Cost |
|-------|----|------|------|
| **Decision** | Claude ✅ | Complex decisions, file writing, architecture | Highest |
| **Code** | Codex 🟠 | Code analysis, bug fixing, test writing | Medium |
| **Analysis** | Gemini 🔵 | Bulk text/data analysis, log reading | Cheapest |

**Simple rule:** Claude thinks, Codex codes, Gemini reads.

## Generated Files

Running `init` creates the following in your project:

```
your-project/
├── CLAUDE.md                          # Delegation rules & shorthands
└── .claude/
    ├── settings.local.json            # CLI permissions
    ├── agents/
    │   └── investigator.md            # Auto-spawned investigation agent
    └── commands/
        ├── codex_agents.md            # /codex_agents skill
        └── gemini_agents.md           # /gemini_agents skill
```

Optional docs (USAGE.md, integration guides) are generated when you choose "Full" documentation.

## Shorthands

Add a shorthand to the end of any Claude Code command:

| Shorthand | Agents | Total |
|-----------|--------|-------|
| `x3` | 1 Claude + 2 Gemini | 3 |
| `x5` | 1 Claude + 4 Gemini | 5 |
| `c` / `c3` | 3 Codex | 3 |
| `c5` | 5 Codex | 5 |
| `g` / `g3` | 3 Gemini | 3 |
| `g5` | 5 Gemini | 5 |

**Combine freely:**

```
analyze this project x5 c5
```

= 1 Claude + 4 Gemini + 5 Codex = **10 parallel agents**

## Prerequisites

### Gemini CLI

```bash
npm install -g @google/gemini-cli
gemini  # sign in with Google account
```

### Codex CLI

```bash
npm install -g @openai/codex
codex login
```

### Bash (Windows)

All commands use bash syntax. On Windows, use **Git Bash** or **WSL**.

## Features

- **Three-tier delegation** — Claude for decisions, Codex for code, Gemini for bulk analysis
- **Parallel agents** — Run up to 10 agents simultaneously with simple shorthands
- **Automatic fallback** — Each agent tries multiple models before failing
- **Graceful degradation** — If all external agents fail, Claude takes over automatically
- **Zero dependencies** — Only uses Node.js built-ins
- **Interactive setup** — Choose tools, docs, and language during init
- **CI/CD friendly** — Auto-detects non-interactive environments, falls back to defaults
- **Skip-existing** — Won't overwrite files that already exist in your project

## Usage Examples

```
# Code analysis with 3 Codex agents
find bugs in src/ c3

# Data analysis with 3 Gemini agents
analyze the log files g3

# Full project review with everything
review this project x5 c5

# Quick investigation
what does this codebase do x3
```

## Options

```
npx claude-agents-delegation init [--yes|-y]

  init         Generate delegation config files in current directory
  --yes, -y    Use defaults (both tools, full docs, English)
```

## License

[GPL-3.0](LICENSE)
