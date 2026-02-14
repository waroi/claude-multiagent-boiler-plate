---
description: Delegate code tasks and analysis to Codex CLI agents
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [task description]
---

# Codex Agents - Simple Code Tasks & Analysis

**Triggered by:** `c`, `c2`, `c3`, `c5` at end of command, or `/codex_agents`

This skill runs parallel Codex CLI calls for code tasks and analysis. Codex handles simple code work so Claude can focus on complex decisions.

## STEP 1: Announce with Orange Indicator (REQUIRED)

**You MUST announce activation before doing anything else:**

🟠 **3 Codex agents activated**

- Codex 1: [what this agent will do]
- Codex 2: [what this agent will do]
- Codex 3: [what this agent will do]

**Parse the shorthand:**

- `c` or `c3` → 3 Codex agents (default)
- `c2` → 2 Codex agents
- `c5` → 5 Codex agents

## STEP 2: Determine Sandbox Mode

Choose the appropriate sandbox based on the task:

| Task Type | Sandbox Mode | Flag |
| --------- | ------------ | ---- |
| Analysis, review, reading code | `read-only` | `-s read-only` |
| Bug fixes, refactoring, test writing | `workspace-write` | `-s workspace-write` |

**Default to `read-only`** unless the task explicitly requires code changes.

## STEP 3: Run Codex CLI Commands (REQUIRED)

**You MUST actually run Codex CLI commands. This is the whole point.**

### Single Codex Agent (c or c1)

```bash
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Analyze src/ for potential bugs. List issues by file with line numbers." -o /tmp/codex_out.txt 2>/dev/null && cat /tmp/codex_out.txt
```

### Multiple Codex Agents (c2, c3, c5)

Run in parallel using background jobs:

```bash
# Agent 1: Code analysis
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Review src/auth/ for security issues. Be concise." -o /tmp/c1.txt 2>/dev/null) &

# Agent 2: Test coverage analysis
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Check test coverage gaps in src/. List untested functions." -o /tmp/c2.txt 2>/dev/null) &

# Agent 3: Code quality
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Find code smells and dead code in src/. Be specific." -o /tmp/c3.txt 2>/dev/null) &

wait

echo "=== Codex 1: Security ===" && cat /tmp/c1.txt
echo "=== Codex 2: Test Coverage ===" && cat /tmp/c2.txt
echo "=== Codex 3: Code Quality ===" && cat /tmp/c3.txt
```

### Code Review (Built-in)

```bash
# Review uncommitted changes
codex review --uncommitted 2>/dev/null

# Review against a branch
codex review --base main 2>/dev/null
```

### Code Changes (workspace-write)

```bash
# Simple bug fix
codex exec -s workspace-write --full-auto -m gpt-5.3-codex -c reasoning_effort=xhigh "Fix the null pointer exception in src/utils/parser.js line 42" 2>/dev/null

# Generate tests
codex exec -s workspace-write --full-auto -m gpt-5.3-codex -c reasoning_effort=xhigh "Write unit tests for src/auth/login.js" -o /tmp/c_result.txt 2>/dev/null
```

### Automatic Model Fallback

```bash
codex_with_fallback() {
    local sandbox="$1"
    local prompt="$2"
    local outfile="$3"

    # Primary: gpt-5.3-codex with xhigh reasoning
    result=$(codex exec -s "$sandbox" -m gpt-5.3-codex -c reasoning_effort=xhigh "$prompt" -o "$outfile" 2>&1)

    # Fallback 1: o4-mini
    if echo "$result" | grep -qi "error\|rate.limit\|quota"; then
        result=$(codex exec -s "$sandbox" -m o4-mini "$prompt" -o "$outfile" 2>&1)
    fi

    # Fallback 2: gpt-4.1-mini
    if echo "$result" | grep -qi "error\|rate.limit\|quota"; then
        result=$(codex exec -s "$sandbox" -m gpt-4.1-mini "$prompt" -o "$outfile" 2>&1)
    fi

    # All models failed → signal for Claude takeover
    if [ ! -s "$outfile" ] || echo "$result" | grep -qi "error\|rate.limit\|quota"; then
        echo "AGENT_FAILED"
        return 1
    fi

    cat "$outfile" 2>/dev/null
}

# Usage:
codex_with_fallback "read-only" "Analyze this code for bugs" "/tmp/c1.txt"
```

### CLI Syntax Reference

```bash
# Analysis (read-only)
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "prompt" -o /tmp/out.txt

# Code changes (write access)
codex exec -s workspace-write --full-auto -m gpt-5.3-codex -c reasoning_effort=xhigh "prompt"

# Code review
codex review --uncommitted

# Specific working directory
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh -C /path/to/project "prompt" -o /tmp/out.txt

# Flags:
# -s = sandbox mode (read-only | workspace-write)
# -m = model
# -o = output last message to file
# --full-auto = skip approval prompts (sandboxed)
# -C = working directory
# --skip-git-repo-check = allow running outside git repos
```

## STEP 4: Report Results (REQUIRED FORMAT)

**Your report MUST include the Codex commands you ran:**

🟠 **Codex Analysis Complete**

**Commands ran:**

- Codex 1: `codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "..." -o /tmp/c1.txt`
- Codex 2: `codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "..." -o /tmp/c2.txt`
- Codex 3: `codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "..." -o /tmp/c3.txt`

**Findings:**

- [Finding 1 from Codex]
- [Finding 2 from Codex]
- [Finding 3 from Codex]

**Summary:** [Brief synthesis of what Codex found]

## What Codex Is Good For

| Task | Example Command |
| ---- | --------------- |
| Code analysis | `codex exec -s read-only "Find bugs in src/"` |
| Code review | `codex review --uncommitted` |
| Simple bug fixes | `codex exec -s workspace-write --full-auto "Fix typo in..."` |
| Test generation | `codex exec -s workspace-write --full-auto "Write tests for..."` |
| Refactoring | `codex exec -s workspace-write --full-auto "Rename X to Y in..."` |
| Code explanation | `codex exec -s read-only "Explain what src/core/engine.js does"` |

## What Codex Cannot Do (Use Claude Instead)

- Complex multi-step architectural changes
- Final decisions on design approaches
- Work requiring judgment across multiple systems
- Deployment and infrastructure changes
- Tasks needing conversation context

## Codex vs Gemini vs Claude

| Aspect | Gemini (🔵) | Codex (🟠) | Claude (✅) |
| ------ | ----------- | ---------- | ---------- |
| Cost | Cheapest | Medium | Highest |
| Can write files | No | Yes (sandboxed) | Yes |
| Best for | Bulk text analysis | Code tasks | Complex decisions |
| Speed | Fast | Medium | Varies |
| Context | Large | Medium | Large |

**Rule of thumb:**
- Text/data analysis → Gemini
- Code-specific tasks → Codex
- Complex judgment → Claude

## Combining with Other Agents

When the user says something like `fix bugs x3 c3`:

1. First announce all:

✅ **1 Claude subagent activated**
- Agent 1: [Claude task requiring judgment]

🔵 **2 Gemini agents activated**
- Gemini 1-2: [bulk analysis tasks]

🟠 **3 Codex agents activated**
- Codex 1-3: [code tasks]

2. Run Claude subagents for judgment/complex work
3. Run Gemini agents via CLI for bulk analysis
4. Run Codex agents via CLI for code tasks
5. Synthesize all results

## Graceful Degradation

**If all Codex models fail (output file empty or contains `AGENT_FAILED`):**

⚡ **Claude takes over** — perform the code analysis yourself using native tools:

1. Announce: `⚡ Claude takeover — Codex agents failed, Claude devralıyor`
2. Read the code files using Read, Grep, Glob tools
3. Analyze the code directly
4. Report findings with the same format as Codex would

**Degradation chain:**
```
gpt-5.3-codex (xhigh) → o4-mini → gpt-4.1-mini → ⚡ Claude takeover
```

**Do NOT skip failed agents silently.** Always announce which agents failed and that Claude is taking over.

## Error Handling

**If Codex fails:**

1. Check if `codex` is in PATH → `which codex`
2. Check authentication → `codex login`
3. Try with a different model → `-m o4-mini`
4. Check sandbox permissions → try `-s read-only` first
5. For git issues → add `--skip-git-repo-check`

**If response is empty or cut off:**

- Prompt too vague → be more specific
- Project too large → point to specific directory with `-C`
- Try splitting into smaller tasks across more agents
