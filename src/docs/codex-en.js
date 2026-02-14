'use strict';

const content = `# Codex CLI Integration Guide

A comprehensive guide for using Codex CLI as a mid-cost delegation layer for code-focused tasks within Claude Code. Codex handles simple code work and code analysis. Claude handles complex evaluation, architectural decisions, and multi-step work.

---

## Table of Contents

1. [Philosophy](#1-philosophy)
2. [Prerequisites](#2-prerequisites)
3. [Setup Overview](#3-setup-overview)
4. [CLAUDE.md Configuration](#4-claudemd-configuration)
5. [Codex Agents Skill](#5-codex-agents-skill)
6. [Fallback Function](#6-fallback-function)
7. [Usage Patterns and Examples](#7-usage-patterns-and-examples)
8. [Integrating Into Your Own Agents](#8-integrating-into-your-own-agents)
9. [Three-Tier Delegation: Gemini + Codex + Claude](#9-three-tier-delegation-gemini--codex--claude)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Philosophy

The core idea is a **three-tier delegation model**:

| Role                       | Claude Code (✅)                                      | Codex CLI (🟠)                                    | Gemini CLI (🔵)                            |
| ------------------------- | ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| **Purpose**                  | Evaluation, decisions, complex work                    | Code analysis, simple code work                     | Large-scale text analysis, pattern finding        |
| **Cost**               | Highest                                             | Medium                                              | Cheapest                                    |
| **Capabilities**            | Full (read + write + execute)                      | Sandbox (read-only or workspace-write)          | Read-only analysis                         |
| **Best suited for** | Multi-step work, final decisions, architecture              | Bug fix, test writing, refactoring, code review      | 50+ file scanning, summarization, data validation |

**Pattern:**

1. Analyze the task: is it code work, data analysis, or complex decision?
2. Code work → Delegate to Codex
3. Data/text analysis → Delegate to Gemini
4. Complex decision → Claude does it itself
5. Combine results and report

**Why this works:**

- Claude tokens are expensive. Having Claude do simple bug fixes is wasteful
- Codex works with OpenAI's coding models — understands code semantics well
- Codex operates safely in sandbox mode (read-only or isolated workspace)
- Each model is used in its area of strength = best cost/performance balance
- Codex can write files — unlike Gemini, it can make simple code changes

---

## 2. Prerequisites

### Install Codex CLI

\`\`\`bash
npm install -g @openai/codex
\`\`\`

### Verify Installation

\`\`\`bash
which codex        # Should return a path
codex --version    # Should show version (e.g., codex-cli 0.98.0)
\`\`\`

### Authentication

Codex CLI requires an OpenAI API key. Run:

\`\`\`bash
codex login
\`\`\`

Complete the browser-based authentication flow. Or set the \`OPENAI_API_KEY\` environment variable:

\`\`\`bash
export OPENAI_API_KEY="sk-..."
\`\`\`

### Verify It Works

\`\`\`bash
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Say hello and confirm you are working" -o /tmp/codex_test.txt --skip-git-repo-check 2>/dev/null && cat /tmp/codex_test.txt
\`\`\`

You should receive a confirmation response.

---

## 3. Setup Overview

You need to create or modify the following files in your project:

\`\`\`
your-project/
  CLAUDE.md                         # Add Codex delegation rules
  .claude/
    agents/
      investigator.md               # Investigation subagent (Gemini + Codex)
    commands/
      gemini_agents.md              # Bulk Gemini analysis skill (existing)
      codex_agents.md               # Codex code analysis skill (new)
  Gemini-Integration.md             # Gemini integration documentation (existing)
  codex-integration.md              # This file (new)
\`\`\`

---

## 4. CLAUDE.md Configuration

Add the following section to your project's \`CLAUDE.md\` file. This tells Claude Code when and how to delegate to Codex.

### Section: Codex Delegation Rules

\`\`\`markdown
## Codex Delegation

**When the user says "use codex"**, offload simple code tasks and analysis to Codex CLI:

\\\`\\\`\\\`bash
codex exec -s read-only "Analyze this code for bugs" -o /tmp/codex_out.txt
\\\`\\\`\\\`

**Appropriate for Codex:** Simple code generation, bug fixing, refactoring, test writing, code review, code analysis

**Keep with Claude:** Complex multi-step work, final decisions, deployments, architecture decisions

**Codex sandbox modes:** \`read-only\` for analysis, \`workspace-write\` for code changes
\`\`\`

### Section: Add Codex to Shorthand Table

Update the existing "x" shorthand table and add Codex shortcuts:

\`\`\`markdown
## Shorthands - Parallel Agents

**\`x3\`/\`x5\` spawns Claude+Gemini, \`c3\`/\`c5\` spawns Codex, \`g3\`/\`g5\` spawns Gemini:**

| Shorthand | Claude | Gemini | Codex | Total |
| --------- | ------ | ------ | ----- | ----- |
| \`x3\`      | 1      | 2      | 0     | 3     |
| \`x5\`      | 1      | 4      | 0     | 5     |
| \`c\` / \`c3\`| 0      | 0      | 3     | 3     |
| \`c5\`      | 0      | 0      | 5     | 5     |
| \`g\` / \`g3\`| 0      | 3      | 0     | 3     |
| \`g5\`      | 0      | 5      | 0     | 5     |

**Combine freely:** \`analyze code x3 c3\` = 1 Claude + 2 Gemini + 3 Codex = 6 agents

**Announce with emojis:** ✅ = Claude subagents, 🔵 = Gemini agents, 🟠 = Codex agents

**Codex fallback:** gpt-5.3-codex (xhigh) → o4-mini → gpt-4.1-mini

**⚠️ Codex defaults to READ-ONLY** - use \`workspace-write\` sandbox only when code changes are needed.
\`\`\`

---

## 5. Codex Agents Skill

Create this file at \`.claude/commands/codex_agents.md\`. This provides users with the \`/codex_agents\` slash command and \`c\`/\`c3\`/\`c5\` shorthand triggers.

The full content of the file is located in the \`.claude/commands/codex_agents.md\` file. The basic structure:

### Step 1: Announcement (with 🟠 emoji)

\`\`\`
🟠 **3 Codex agents activated**

- Codex 1: [task description]
- Codex 2: [task description]
- Codex 3: [task description]
\`\`\`

### Step 2: Choose Sandbox Mode

| Task Type | Sandbox Mode | Flag |
| ---------- | ------------ | ---- |
| Analysis, review, reading | \`read-only\` | \`-s read-only\` |
| Bug fix, refactoring, test writing | \`workspace-write\` | \`-s workspace-write\` |

### Step 3: Run Codex CLI Commands

\`\`\`bash
# 3 parallel Codex agents
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Security review src/auth/" -o /tmp/c1.txt) &
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Find dead code in src/" -o /tmp/c2.txt) &
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Check error handling patterns" -o /tmp/c3.txt) &
wait

cat /tmp/c1.txt /tmp/c2.txt /tmp/c3.txt
\`\`\`

### Step 4: Report Results

\`\`\`
🟠 **Codex Analysis Complete**

**Commands ran:**
- Codex 1: \`codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "..." -o /tmp/c1.txt\`
- Codex 2: \`codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "..." -o /tmp/c2.txt\`
- Codex 3: \`codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "..." -o /tmp/c3.txt\`

**Findings:**
- [Finding 1]
- [Finding 2]

**Summary:** [Summary]
\`\`\`

---

## 6. Fallback Function

This is the reusable core bash function. It tries three OpenAI models in sequence when there's an error or rate limit.

\`\`\`bash
codex_with_fallback() {
    local sandbox="\$1"
    local prompt="\$2"
    local outfile="\$3"

    # Primary: gpt-5.3-codex with xhigh reasoning
    result=\$(codex exec -s "\$sandbox" -m gpt-5.3-codex -c reasoning_effort=xhigh "\$prompt" -o "\$outfile" 2>&1)

    # Fallback 1: o4-mini (if error/rate limit)
    if echo "\$result" | grep -qi "error\\|rate.limit\\|quota"; then
        result=\$(codex exec -s "\$sandbox" -m o4-mini "\$prompt" -o "\$outfile" 2>&1)
    fi

    # Fallback 2: gpt-4.1-mini (if still failing - cheapest)
    if echo "\$result" | grep -qi "error\\|rate.limit\\|quota"; then
        result=\$(codex exec -s "\$sandbox" -m gpt-4.1-mini "\$prompt" -o "\$outfile" 2>&1)
    fi

    cat "\$outfile" 2>/dev/null
}
\`\`\`

### How It Works

1. First tries **gpt-5.3-codex** (smartest mode with xhigh reasoning)
2. Falls back to **o4-mini** if there's an error
3. Falls back to **gpt-4.1-mini** if still failing (cheapest)
4. Catches errors with these terms: "error", "rate.limit", "quota"

### Usage

\`\`\`bash
# Define the function first, then use it:

# Code analysis (read-only)
codex_with_fallback "read-only" "Find security vulnerabilities in this project" "/tmp/c1.txt"

# Simple bug fix (workspace-write)
codex_with_fallback "workspace-write" "Fix the null check in src/utils.js" "/tmp/c2.txt"

# Test writing (workspace-write)
codex_with_fallback "workspace-write" "Write unit tests for src/auth/login.js" "/tmp/c3.txt"
\`\`\`

### Updating Model Names

OpenAI periodically updates model names. To update the fallback chain, change these three model names:

- \`gpt-5.3-codex\` → latest codex model (xhigh reasoning)
- \`o4-mini\` → reasoning fallback model
- \`gpt-4.1-mini\` → cheapest fallback model

---

## 7. Usage Patterns and Examples

### Pattern 1: Single File Code Analysis

\`\`\`bash
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Analyze src/main.py for bugs and edge cases. Be specific with line numbers." -o /tmp/analysis.txt 2>/dev/null && cat /tmp/analysis.txt
\`\`\`

### Pattern 2: Code Review (Uncommitted Changes)

\`\`\`bash
codex review --uncommitted 2>/dev/null
\`\`\`

### Pattern 3: Code Review (Branch Comparison)

\`\`\`bash
codex review --base main 2>/dev/null
\`\`\`

### Pattern 4: Specific Commit Review

\`\`\`bash
codex review --commit abc1234 --title "Add user auth" 2>/dev/null
\`\`\`

### Pattern 5: Simple Bug Fix

\`\`\`bash
codex exec -s workspace-write --full-auto -m gpt-5.3-codex -c reasoning_effort=xhigh "Fix the off-by-one error in src/pagination.js" 2>/dev/null
\`\`\`

### Pattern 6: Test Writing

\`\`\`bash
codex exec -s workspace-write --full-auto -m gpt-5.3-codex -c reasoning_effort=xhigh "Write comprehensive unit tests for src/utils/date.js" 2>/dev/null
\`\`\`

### Pattern 7: Refactoring

\`\`\`bash
codex exec -s workspace-write --full-auto -m gpt-5.3-codex -c reasoning_effort=xhigh "Refactor src/legacy/handler.js to use async/await instead of callbacks" 2>/dev/null
\`\`\`

### Pattern 8: Parallel Multiple Analysis

\`\`\`bash
# Run 3 Codex agents in parallel with different tasks
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Find all TODO/FIXME comments and assess their priority" -o /tmp/c1.txt 2>/dev/null) &
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Check for common security vulnerabilities (XSS, injection, etc.)" -o /tmp/c2.txt 2>/dev/null) &
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Analyze code complexity and suggest simplifications" -o /tmp/c3.txt 2>/dev/null) &
wait

echo "=== TODOs ===" && cat /tmp/c1.txt
echo "=== Security ===" && cat /tmp/c2.txt
echo "=== Complexity ===" && cat /tmp/c3.txt
\`\`\`

### Pattern 9: Specific Directory Analysis

\`\`\`bash
# Specify working directory with -C
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh -C /path/to/subproject "Analyze this project structure and find architectural issues" -o /tmp/analysis.txt 2>/dev/null
\`\`\`

### Pattern 10: Code Explanation

\`\`\`bash
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Explain what src/core/engine.js does. Focus on the main algorithm and data flow." -o /tmp/explanation.txt 2>/dev/null && cat /tmp/explanation.txt
\`\`\`

---

## 8. Integrating Into Your Own Agents

You can add Codex delegation to any custom Claude Code agent. Template:

### Template for Any Agent with Codex Delegation

Add this section to any \`.claude/agents/your-agent.md\` file:

\`\`\`markdown
## CODEX DELEGATION

Codex does code-specific tasks. You verify findings and make decisions.

### Codex Fallback Function

Always define this at the start of your bash session:

\\\`\\\`\\\`bash
codex_with_fallback() {
    local sandbox="\$1"
    local prompt="\$2"
    local outfile="\$3"
    result=\$(codex exec -s "\$sandbox" -m gpt-5.3-codex -c reasoning_effort=xhigh "\$prompt" -o "\$outfile" 2>&1)
    if echo "\$result" | grep -qi "error\\|rate.limit\\|quota"; then
        result=\$(codex exec -s "\$sandbox" -m o4-mini "\$prompt" -o "\$outfile" 2>&1)
    fi
    if echo "\$result" | grep -qi "error\\|rate.limit\\|quota"; then
        result=\$(codex exec -s "\$sandbox" -m gpt-4.1-mini "\$prompt" -o "\$outfile" 2>&1)
    fi
    cat "\$outfile" 2>/dev/null
}
\\\`\\\`\\\`

### Workflow

1. Identify if the task is code-related
2. Choose sandbox: \`read-only\` for analysis, \`workspace-write\` for changes
3. Delegate to Codex with a specific, focused prompt
4. Verify Codex output (spot-check 1-2 items)
5. Use verified findings to make your decision
\`\`\`

### Example: Code Quality Agent

\`\`\`markdown
---
name: code-quality
description: Checks code quality using Codex for analysis
tools: Read, Bash, Glob, Grep
model: sonnet
---

# Code Quality Agent

## Codex Delegation

\\\`\\\`\\\`bash
codex_with_fallback() {
    local sandbox="\$1"
    local prompt="\$2"
    local outfile="\$3"
    result=\$(codex exec -s "\$sandbox" -m gpt-5.3-codex -c reasoning_effort=xhigh "\$prompt" -o "\$outfile" 2>&1)
    if echo "\$result" | grep -qi "error\\|rate.limit\\|quota"; then
        result=\$(codex exec -s "\$sandbox" -m o4-mini "\$prompt" -o "\$outfile" 2>&1)
    fi
    if echo "\$result" | grep -qi "error\\|rate.limit\\|quota"; then
        result=\$(codex exec -s "\$sandbox" -m gpt-4.1-mini "\$prompt" -o "\$outfile" 2>&1)
    fi
    cat "\$outfile" 2>/dev/null
}
\\\`\\\`\\\`

## Steps

1. **Codex scans code quality:**
   \\\`\\\`\\\`bash
   codex_with_fallback "read-only" "Analyze code quality: complexity, naming, patterns, dead code" "/tmp/quality.txt"
   \\\`\\\`\\\`
2. **Verify** - Check 1-2 flagged items in source
3. **Report** quality score: A / B / C / D / F
\`\`\`

### Example: Bug Hunter Agent (Codex + Gemini Together)

Some tasks use Codex and Gemini together:

\`\`\`markdown
## Delegation Points

| Step | Task           | Tool    | Does                              | Claude Verifies              |
| ---- | -------------- | ------- | --------------------------------- | ---------------------------- |
| 1    | Log Analysis   | Gemini  | Scan logs for error patterns      | Confirm which errors matter  |
| 2    | Code Analysis  | Codex   | Find bugs related to log errors   | Verify bugs are real         |
| 3    | Fix Generation | Codex   | Generate fix proposals            | Review and approve fixes     |
\`\`\`

Call the appropriate CLI within each step:

\`\`\`bash
# Step 1: Log analysis with Gemini
gemini_with_fallback "Find error patterns in these logs" "\$(cat /tmp/app.log)"

# Step 2: Code analysis with Codex
codex_with_fallback "read-only" "Find the root cause of NullPointerException in src/service/" "/tmp/bug.txt"

# Step 3: Fix suggestion with Codex
codex_with_fallback "workspace-write" "Fix the null check issue identified in src/service/UserService.java" "/tmp/fix.txt"
\`\`\`

---

## 9. Three-Tier Delegation: Gemini + Codex + Claude

The real power of this structure is using all three tools together.

### Task Distribution Matrix

| Task Type | First Choice | Second Choice | Last Resort |
| ---------- | ---------- | ------------- | -------- |
| JSON/CSV data analysis | Gemini 🔵 | Codex 🟠 | Claude ✅ |
| Log analysis | Gemini 🔵 | Codex 🟠 | Claude ✅ |
| Code review | Codex 🟠 | Gemini 🔵 | Claude ✅ |
| Bug detection | Codex 🟠 | Claude ✅ | - |
| Test writing | Codex 🟠 | Claude ✅ | - |
| Refactoring | Codex 🟠 | Claude ✅ | - |
| Simple code generation | Codex 🟠 | Claude ✅ | - |
| Architecture decision | Claude ✅ | - | - |
| Multi-step workflow | Claude ✅ | - | - |
| File comparison | Gemini 🔵 | Codex 🟠 | Claude ✅ |
| Documentation writing | Codex 🟠 | Gemini 🔵 | Claude ✅ |

### Combined Usage Example: \`x3 c3\`

When user says \`review this project x3 c3\`:

\`\`\`
✅ **1 Claude subagent activated**
- Agent 1: Architectural review and final judgment

🔵 **2 Gemini agents activated**
- Gemini 1: Scan all config files and documentation
- Gemini 2: Analyze dependency tree and package sizes

🟠 **3 Codex agents activated**
- Codex 1: Security vulnerability scan
- Codex 2: Code quality and complexity analysis
- Codex 3: Test coverage gaps analysis
\`\`\`

### Cost Comparison (Approximate)

| Scenario | Claude Only | Gemini + Claude | Gemini + Codex + Claude |
| ------- | ------------- | --------------- | ----------------------- |
| 50 file analysis | \$\$\$\$ | \$ (Gemini) + \$ (Claude verify) | \$ + \$ + \$ |
| Code review + fix | \$\$\$ | - | \$ (Codex review) + \$ (Codex fix) + \$ (Claude approve) |
| Log + bug analysis | \$\$\$\$ | \$ (Gemini logs) | \$ (Gemini logs) + \$ (Codex code) + \$ (Claude decide) |

---

## 10. Troubleshooting

### Codex Command Not Found

\`\`\`bash
# Check if codex is installed
which codex

# If not installed
npm install -g @openai/codex
\`\`\`

### Authentication Error

\`\`\`bash
# Login again
codex login

# Or check environment variable
echo \$OPENAI_API_KEY
\`\`\`

### Git Repo Error

\`\`\`bash
# If working outside a git repo
codex exec --skip-git-repo-check -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "prompt" -o /tmp/out.txt
\`\`\`

### Sandbox Permission Error

\`\`\`bash
# Try read-only first
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "prompt" -o /tmp/out.txt

# If write is needed, use workspace-write
codex exec -s workspace-write --full-auto -m gpt-5.3-codex -c reasoning_effort=xhigh "prompt"
\`\`\`

### Large Project Timeout

\`\`\`bash
# Focus on specific directory
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh -C src/specific-module "prompt" -o /tmp/out.txt
\`\`\`

### Rate Limit on All Models (Graceful Degradation)

If all three fallback models fail, **Claude Code automatically takes over:**

**Degradation chain:**
\`\`\`
gpt-5.3-codex (xhigh) → o4-mini → gpt-4.1-mini → ⚡ Claude Code takeover
\`\`\`

**How it works:**
1. \`codex_with_fallback()\` function tries 3 models
2. If all fail, it returns \`AGENT_FAILED\`
3. Claude Code detects this and does the task itself (using Read, Grep, Glob tools)
4. Announcement: \`⚡ Claude takeover — Codex agents failed, Claude taking over\`

**Important:** Failed agents are not silently skipped. Errors and takeovers are always announced.

### Codex Returns Empty Output

\`\`\`bash
# Check the -o file
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Say hello" -o /tmp/test.txt 2>&1
cat /tmp/test.txt

# Also check stderr (by removing 2>/dev/null)
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Say hello" -o /tmp/test.txt
\`\`\`

---

## Quick Start Checklist

- [ ] Install Codex CLI: \`npm install -g @openai/codex\`
- [ ] Authenticate: \`codex login\`
- [ ] Verify: \`codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Say hello" -o /tmp/test.txt --skip-git-repo-check\`
- [ ] Add Codex delegation section to your \`CLAUDE.md\` file
- [ ] Update shorthand table in your \`CLAUDE.md\` file (add c/c3/c5)
- [ ] Create \`.claude/commands/codex_agents.md\` file
- [ ] Test: Ask Claude Code "analyze my code c3"

---

## Summary of Core Concepts

| Concept                                           | Meaning                                              |
| ------------------------------------------------ | --------------------------------------------------- |
| \`codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "..." -o f\`  | Basic Codex CLI analysis call                      |
| \`codex exec -s workspace-write --full-auto "..."\` | Making code changes with Codex                     |
| \`codex review --uncommitted\`                      | Built-in code review feature                        |
| \`codex_with_fallback()\`                           | Automatic fallback between 3 models                  |
| \`c\` / \`c3\` / \`c5\`                                | Shortcuts that spawn Codex agents               |
| \`x3 c3\`                                          | Combined Claude + Gemini + Codex usage             |
| 🟠 emoji                                         | Codex agent indicator                              |
| \`AGENT_FAILED\`                                    | All models failed → Claude takeover signal    |
| ⚡ Claude takeover                                | Claude takes over when agents fail      |
| \`-s read-only\`                                    | Read-only sandbox (analysis)                        |
| \`-s workspace-write\`                              | Write-enabled sandbox (code changes)           |
| \`--full-auto\`                                     | Execute in sandbox without confirmation            |
`;

module.exports = content;
