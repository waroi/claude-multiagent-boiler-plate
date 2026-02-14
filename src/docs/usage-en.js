'use strict';

const content = `# Claude Code Multi-Agent System - Usage Guide

> This guide explains step by step how to set up and use the multi-agent system that runs Gemini and Codex CLI tools in parallel within Claude Code.

---

## What Does This System Do?

Claude Code can do everything on its own, but it's expensive. This system redirects simple tasks to cheaper AI models, reducing costs while gaining speed through parallel execution.

**Three-layer model:**

| Layer | AI | Emoji | What It Does | Cost |
|-------|----|-------|-------------|------|
| 1 | Claude | ✅ | Complex decisions, file writing, architecture | Most expensive |
| 2 | Codex | 🟠 | Code analysis, bug fixing, test writing, refactoring | Medium |
| 3 | Gemini | 🔵 | Bulk text/data analysis, log reading, summarization | Cheapest |

**Simple rule:** Claude thinks, Codex codes, Gemini reads.

---

## 1. Prerequisites

You need the following tools installed on your machine to use this system:

### Claude Code (already installed)

If you're using Claude Code CLI, it's already installed.

### Gemini CLI

\`\`\`bash
npm install -g @google/gemini-cli
\`\`\`

After installing, run it once and sign in:

\`\`\`bash
gemini
\`\`\`

Follow the on-screen instructions. You'll sign in with your Google account.

**Verification:**
\`\`\`bash
echo "test" | gemini -p "Say hello" -o text 2>/dev/null
\`\`\`

If you see a "hello"-like response, the installation is complete.

### Codex CLI

\`\`\`bash
npm install -g @openai/codex
\`\`\`

Sign in:

\`\`\`bash
codex login
\`\`\`

**Verification:**
\`\`\`bash
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Say hello" -o /tmp/test.txt --skip-git-repo-check && cat /tmp/test.txt
\`\`\`

### Bash (for Windows)

All commands use bash syntax. If you're on Windows, you need one of:

- **Git Bash** (comes with Git - recommended)
- **WSL** (Windows Subsystem for Linux)

---

## 2. Adding the System to Your Project

To add this boilerplate to any project, copy these files:

\`\`\`
your-project/
├── CLAUDE.md                          ← Main configuration (REQUIRED)
└── .claude/
    ├── settings.local.json            ← Permissions (REQUIRED)
    ├── agents/
    │   └── investigator.md            ← Investigation subagent
    └── commands/
        ├── codex_agents.md            ← Codex skill
        └── gemini_agents.md           ← Gemini skill
\`\`\`

**Minimum setup:** Just copy \`CLAUDE.md\` and the \`.claude/\` folder. Documentation files (\`codex-integration.md\`, \`Gemini-Integration.md\`, \`USAGE.md\`) are optional.

---

## 3. Shortcuts (Shorthands)

The heart of this system is shortcuts. Add a shorthand to the end of your command to spawn parallel agents.

### Shorthand Table

| You Type | What Happens | Total Agents |
|----------|-------------|--------------|
| \`x3\` | 1 Claude + 2 Gemini | 3 |
| \`x5\` | 1 Claude + 4 Gemini | 5 |
| \`c\` or \`c3\` | 3 Codex | 3 |
| \`c2\` | 2 Codex | 2 |
| \`c5\` | 5 Codex | 5 |
| \`g\` or \`g3\` | 3 Gemini | 3 |
| \`g2\` | 2 Gemini | 2 |
| \`g5\` | 5 Gemini | 5 |

### How to Use

Add the shorthand to the end of your command. That's it.

\`\`\`
analyze this code c3
\`\`\`

This creates 3 Codex agents that analyze the code in parallel.

\`\`\`
review the project x5
\`\`\`

This creates 1 Claude investigator + 4 Gemini agents = 5 agents.

\`\`\`
scan this folder g3
\`\`\`

This creates 3 Gemini agents that scan the folder in parallel.

### Combining Shortcuts

You can use multiple shortcuts at the same time:

\`\`\`
analyze the project x5 c5
\`\`\`

This creates: 1 Claude + 4 Gemini + 5 Codex = **10 agents**.

\`\`\`
review the code x3 c3
\`\`\`

This creates: 1 Claude + 2 Gemini + 3 Codex = **6 agents**.

---

## 4. Real-World Usage Examples

### Example 1: Code Analysis (with Codex)

**You type:**
\`\`\`
find bugs in the src folder c3
\`\`\`

**What happens:**
1. Claude creates 3 Codex agents
2. Each agent analyzes the code from a different angle (security, test coverage, code quality)
3. Results are collected and presented to you

**What you see:**
\`\`\`
🟠 3 Codex agents activated
- Codex 1: Scanning for security vulnerabilities
- Codex 2: Checking test coverage
- Codex 3: Analyzing code quality

🟠 Codex Analysis Complete
Findings:
- src/auth.js:42 - SQL injection risk
- src/utils.js:15 - Missing null check
- ...
\`\`\`

### Example 2: Data Analysis (with Gemini)

**You type:**
\`\`\`
analyze the log files g3
\`\`\`

**What happens:**
1. Claude creates 3 Gemini agents
2. Log files are split into 3 parts and analyzed in parallel
3. Error patterns and recurring issues are reported

### Example 3: Comprehensive Analysis (all together)

**You type:**
\`\`\`
analyze this project from scratch x3 c3
\`\`\`

**What happens:**
1. ✅ 1 Claude investigator - conducts deep research
2. 🔵 2 Gemini agents - analyze documentation and data
3. 🟠 3 Codex agents - analyze the code
4. Total of 6 agents work in parallel
5. Results are synthesized into a single report

### Example 4: Code Fixing (with Codex)

**You type:**
\`\`\`
fix the bugs found c3
\`\`\`

**What happens:**
1. Codex agents run in \`workspace-write\` mode
2. Bugs are automatically fixed
3. Changes are written to the files

---

## 5. Fallback System (Automatic Backup)

Each agent uses a model chain. If the first model fails, it automatically switches to the next one.

### Gemini Chain

\`\`\`
gemini-pro  →  gemini-2.5-pro  →  gemini-flash
  (best)         (medium)          (cheapest)
\`\`\`

### Codex Chain

\`\`\`
gpt-5.3-codex (xhigh)  →  o4-mini  →  gpt-4.1-mini
      (best)                (medium)     (cheapest)
\`\`\`

This is fully automatic. You don't need to do anything.

---

## 6. Graceful Degradation (Automatic Takeover)

Sometimes all models run out of credits or hit rate limits. When this happens:

\`\`\`
Agent model 1 (best)
  ↓ failed
Agent model 2 (medium)
  ↓ failed
Agent model 3 (cheapest)
  ↓ failed
⚡ Claude Code takes over (analyzes using its own tools)
\`\`\`

**Example scenario:**

1. You type \`analyze the project x5 c5\`
2. 4 Gemini agents are running but credit limit reached → all fail
3. 5 Codex agents are running but rate limited → all fail
4. Claude detects this and shows:

\`\`\`
⚡ Claude takeover — Gemini agents failed, Claude taking over
⚡ Claude takeover — Codex agents failed, Claude taking over
\`\`\`

5. Claude performs the analysis itself using Read/Grep/Glob tools
6. The result report is presented in the same format

**You don't need to do anything.** The system takes over automatically.

---

## 7. Emoji Indicators

While agents are running, you can tell which type is active by the emojis:

| Emoji | Meaning |
|-------|---------|
| ✅ | Claude subagent is working |
| 🔵 | Gemini agent is working |
| 🟠 | Codex agent is working |
| ⚡ | Claude takeover (agent failed) |

---

## 8. Which Shortcut for Which Situation?

| Task | Recommended Shortcut | Why |
|------|---------------------|-----|
| Code analysis / bug detection | \`c3\` | Codex understands code |
| Code fixing / refactoring | \`c3\` | Codex can write files |
| Writing tests | \`c3\` | Codex can generate tests |
| Log / data analysis | \`g3\` | Gemini is cheap and fast |
| Documentation reading | \`g3\` | Gemini reads bulk text |
| General project analysis | \`x3\` | Claude + Gemini = depth + breadth |
| Comprehensive full analysis | \`x5 c5\` | Maximum parallel power |
| Quick single look | \`c\` or \`g\` | 3 agents is the default |

---

## 9. File Structure Explained

\`\`\`
your-project/
├── CLAUDE.md                    ← Claude Code reads this every time.
│                                   Delegation rules, shortcuts,
│                                   fallback chains are defined here.
│
├── .claude/
│   ├── settings.local.json      ← Defines which bash commands
│   │                               are allowed.
│   │
│   ├── agents/
│   │   └── investigator.md      ← Investigation agent that runs
│   │                               automatically when x3/x5 is used.
│   │                               Uses Gemini + Codex.
│   │
│   └── commands/
│       ├── codex_agents.md      ← Defines how c/c3/c5 shortcuts
│       │                           work.
│       │
│       └── gemini_agents.md     ← Defines how g/g3/g5 shortcuts
│                                   work.
│
├── codex-integration.md         ← (Optional) Detailed Codex
│                                   integration documentation.
│
├── Gemini-Integration.md        ← (Optional) Detailed Gemini
│                                   integration documentation.
│
└── USAGE.md                     ← (Optional) This file.
\`\`\`

---

## 10. Frequently Asked Questions

### "Agent failed" message appearing?

This is normal. Models may have hit their credit or rate limits. The system automatically switches to the next model. If all models fail, Claude takes over.

### Does it work on Windows?

Yes, but you need bash. Use Git Bash or WSL. All commands use bash syntax.

### Can I add my own models?

Yes. Change the fallback chains in the \`CLAUDE.md\` file. For example:

\`\`\`
**Codex fallback:** gpt-5.3-codex (xhigh) → o4-mini → gpt-4.1-mini → ⚡ Claude takeover
\`\`\`

You can change the model names in this line to your preferences.

### How do I move this to another project?

1. Copy the \`CLAUDE.md\` file to the root of your project
2. Copy the \`.claude/\` folder to the root of your project
3. Done. Claude Code will automatically recognize the system when you open that project.

### Can I use only Gemini or only Codex?

Yes.
- Gemini only: use \`g3\` or \`g5\` shortcut
- Codex only: use \`c3\` or \`c5\` shortcut
- Both together: combine like \`x3 c3\`

### How many agents can I use?

| Shortcut | Agent Count |
|----------|------------|
| \`c2\` / \`g2\` | 2 |
| \`c\` / \`c3\` / \`g\` / \`g3\` / \`x3\` | 3 |
| \`c5\` / \`g5\` / \`x5\` | 5 |
| \`x5 c5\` | 10 (1 Claude + 4 Gemini + 5 Codex) |

### How is cost calculated?

- Gemini: Google has a free tier; paid after exceeding it
- Codex: Uses OpenAI credits
- Claude: Uses Anthropic plan/credits

This system reduces costs because it only uses expensive Claude tokens for complex tasks, redirecting simple work to cheaper models.

---

## 11. Quick Start (Ready in 5 Minutes)

\`\`\`bash
# 1. Install Gemini and sign in
npm install -g @google/gemini-cli
gemini  # follow the instructions

# 2. Install Codex and sign in
npm install -g @openai/codex
codex login

# 3. Copy this boilerplate to your project
cp CLAUDE.md /path/to/your/project/
cp -r .claude/ /path/to/your/project/

# 4. Open your project with Claude Code and try it
cd /path/to/your/project
claude  # open Claude Code

# 5. Type your first command
# "analyze this project c3"
\`\`\`

That's it. Your multi-agent system is ready.
`;

module.exports = content;
