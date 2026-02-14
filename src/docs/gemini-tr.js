'use strict';

const content = `# Claude Code için Gemini CLI Entegrasyonu

Gemini CLI'yi, Claude Code içinde düşük maliyetli ve paralel bir analiz katmanı olarak kullanmaya yönelik kapsamlı bir rehber. Gemini, büyük ölçekli salt-okunur işleri üstlenir. Claude ise değerlendirme, karar verme ve dosyaya yazma işlerini üstlenir.

> **Not:** Bu rehber Gemini katmanını anlatır. Kod odaklı görevler için Codex CLI entegrasyonu da mevcuttur — bkz. \`codex-integration.md\`. Üç katmanlı yapı: Gemini (🔵 metin/data) + Codex (🟠 kod) + Claude (✅ karar).

---

## İçindekiler

1. [Felsefe](#1-felsefe)
2. [Ön Koşullar](#2-ön-koşullar)
3. [Kurulum Genel Bakış](#3-kurulum-genel-bakış)
4. [CLAUDE.md Yapılandırması](#4-claudemd-yapılandırması)
5. [Investigator Agent](#5-investigator-agent)
6. [Gemini Agents Skill](#6-gemini-agents-skill)
7. [Fallback Function](#7-fallback-function)
8. [Kullanım Kalıpları ve Örnekler](#8-kullanım-kalıpları-ve-örnekler)
9. [Kendi Agent'larına Entegre Etme](#9-kendi-agentlarına-entegre-etme)
10. [Sorun Giderme](#10-sorun-giderme)

---

## 1. Felsefe

Bu rehber Gemini katmanına odaklanır. Tam yapı **üç katmanlı bir delegasyon modeli**dir (Gemini + Codex + Claude). Gemini katmanı:

| Rol                       | Claude Code                                           | Gemini CLI                                 |
| ------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| **Amaç**                  | Değerlendirme, karar, yazma                           | Kapsamlı analiz, desen bulma               |
| **Maliyet**               | Daha yüksek                                           | Çok daha ucuz                              |
| **Yetenekler**            | Tam (okuma + yazma + çalıştırma)                      | Salt-okunur analiz                         |
| **En uygun olduğu işler** | Çok adımlı işler, nihai kararlar, dosya düzenlemeleri | 50+ dosya tarama, özetleme, veri doğrulama |

**Kalıp:**

1. Veriyi topla (dosyaları indir, bulut depodan akıt)
2. Veriyi, belirli bir istemle Gemini CLI'ye aktar
3. Claude, Gemini bulgularını doğrular (1-2 öğeyi örnek kontrol eder)
4. Claude nihai kararı verir ve raporlar

**Bu neden işe yarar:**

- Gemini CLI, toplu metin analizi için pratikte ücretsiz sayılır
- Claude token'ları pahalıdır. 100 JSON dosyasını okumaya harcama
- Gemini paralel çalışabilir (birden çok arka plan işi)
- Gemini'nin yapamadığı değerlendirme katmanını Claude sağlar

---

## 2. Ön Koşullar

### Gemini CLI'yi Kur

\`\`\`bash
npm install -g @google/gemini-cli
\`\`\`

Ya da Google'ın en güncel kurulum yönergelerini takip et.

### Kurulumu Doğrula

\`\`\`bash
which gemini        # Bir yol döndürmeli
gemini --version    # Sürümü göstermeli
\`\`\`

### Kimlik Doğrulama

Gemini CLI, Google Cloud kimlik doğrulaması ister. Çalıştır:

\`\`\`bash
gemini  # İlk çalıştırma auth için yönlendirecek
\`\`\`

Tarayıcı tabanlı doğrulama akışını tamamla. Doğrulama sonrası CLI, her terminal oturumunda çalışır.

### Çalıştığını Doğrula

\`\`\`bash
echo "Hello, what is 2+2?" | gemini -p "Answer this question" -o text 2>/dev/null
\`\`\`

"4" içeren bir yanıt almalısın.

---

## 3. Kurulum Genel Bakış

Projende şu dosyaları oluşturman veya değiştirmen gerekir:

\`\`\`
your-project/
  CLAUDE.md                         # Gemini delegasyon kuralları ekle
  .claude/
    agents/
      investigator.md               # İnceleme alt-agent'ı (önce Gemini)
    commands/
      gemini_agents.md              # Toplu Gemini analizi becerisi
\`\`\`

Bu belgenin geri kalanı, her dosya için birebir içerikleri verir.

---

## 4. \`CLAUDE.md\` Yapılandırması

Aşağıdaki bölümleri projenin \`CLAUDE.md\` dosyasına ekle. Bu, Claude Code'a Gemini'ye ne zaman ve nasıl delegasyon yapacağını söyler.

### Bölüm 1: Gemini Delegasyon Kuralları

\`\`\`markdown
## Gemini Delegation

**When the user says "use gemini"**, offload bulk analysis to Gemini CLI:

\\\`\\\`\\\`bash
cat data.json | gemini -p "Analyze this" -o text 2>/dev/null
\\\`\\\`\\\`

**Appropriate for Gemini:** Bulk file analysis, pattern finding, summarization, data validation, log analysis, code review of large diffs

**Keep with Claude:** File writes, multi-step work, final decisions, deployments, anything requiring judgment

**Gemini is READ-ONLY** - it cannot write files or run modifying commands.
\`\`\`

### Bölüm 2: Paralel Agent Kısaltması ("x" komutları)

\`\`\`markdown
## "x" Shorthand - Parallel Agents

**Number after letter = agent count. Letter alone defaults to 3.**

| Shorthand  | Claude | Gemini | Codex | Total |
| ---------- | ------ | ------ | ----- | ----- |
| \`x3\`       | 1      | 2      | 0     | 3     |
| \`x5\`       | 1      | 4      | 0     | 5     |
| \`c\` / \`c3\` | 0      | 0      | 3     | 3     |
| \`c2\`       | 0      | 0      | 2     | 2     |
| \`c5\`       | 0      | 0      | 5     | 5     |
| \`g\` / \`g3\` | 0      | 3      | 0     | 3     |
| \`g2\`       | 0      | 2      | 0     | 2     |
| \`g5\`       | 0      | 5      | 0     | 5     |

**Combine freely:** \`analyze code x3 c3\` = 1 Claude + 2 Gemini + 3 Codex = 6 agents

**Announce with emojis:** ✅ = Claude subagents, 🔵 = Gemini agents, 🟠 = Codex agents

**Gemini fallback:** gemini-pro → gemini-2.5-pro → gemini-flash

**Codex fallback:** gpt-5.3-codex (xhigh) → o4-mini → gpt-4.1-mini

**⚠️ Gemini is READ-ONLY** - cannot write files or run modifying commands.

**⚠️ Codex defaults to READ-ONLY** - use \`workspace-write\` sandbox only when code changes are needed.
\`\`\`

### Bölüm 3: Proaktif Agent'lar (İsteğe Bağlı)

Gemini kullanması gereken özel agent'ların varsa burada listele:

\`\`\`markdown
## Proactive Subagents

These trigger automatically - announce with ✅ emoji:

| Subagent       | Triggers When                                  |
| -------------- | ---------------------------------------------- |
| \`investigator\` | When \`x3\` or \`x5\` shorthand is used (Claude+Gemini) |
\`\`\`

---

## 5. Investigator Agent

Bu dosyayı \`.claude/agents/investigator.md\` yoluna oluştur. Bu, toplu analiz için Gemini kullanan ana alt-agent'tır.

\`\`\`markdown
---
name: investigator
description: General investigation agent spawned via "x" shorthand. Uses Gemini CLI for bulk analysis, Claude for verification and judgment.
tools: Read, Bash, Glob, Grep
model: sonnet
---

# Investigator Agent

You are an investigation subagent spawned to analyze a specific aspect of a task. You use Gemini CLI for bulk work and verify findings before reporting.

## FIRST: Announce Yourself

**Always start by announcing to the user:**

✅ **Investigator** - [Your assigned task]...

## Your Task

You were given a specific investigation task. Focus only on that task and report findings.

## GEMINI-FIRST APPROACH

**Always use Gemini CLI for bulk reading/analysis.** You verify Gemini's output, you don't do the bulk work yourself.

### The Pattern

1. Gather data (download/stream files)
2. Pipe to Gemini with specific prompt
3. Verify Gemini's findings (spot-check 1-2 items)
4. Report back

## Gemini CLI Usage (with Automatic Fallback)

When quota is exceeded, automatically fall back to the next model:

\\\`\\\`\\\`bash

# Helper function - define at start of any investigation

gemini_with_fallback() {
local prompt="$1"
local input="$2"

    # Primary: Gemini Pro
    result=\\$(echo "\\$input" | gemini -m gemini-pro -p "\\$prompt" -o text 2>&1)

    # Fallback 1: Gemini 2.5 Pro (if quota/error)
    if [ -z "\\$result" ] || echo "\\$result" | grep -qi "quota\\\\|rate.limit\\\\|resource.exhausted"; then
        result=\\$(echo "\\$input" | gemini -m gemini-2.5-pro -p "\\$prompt" -o text 2>&1)
    fi

    # Fallback 2: Gemini Flash (if still failing)
    if [ -z "\\$result" ] || echo "\\$result" | grep -qi "quota\\\\|rate.limit\\\\|resource.exhausted"; then
        result=\\$(echo "\\$input" | gemini -m gemini-flash -p "\\$prompt" -o text 2>&1)
    fi

    echo "\\$result"

}

# Usage examples:

# Single local file

gemini_with_fallback "Analyze this for errors" "\\$(cat file.json)"

# Multiple files

gemini_with_fallback "Check all these for issues" "\\$(cat /tmp/data/\\*.json)"

# Stream from cloud storage (no local download)

gemini_with_fallback "Find problems" "\\$(aws s3 cp s3://your-bucket/file.json - --profile your-profile)"
\\\`\\\`\\\`

**Always use:**

- \`-o text\` for clean output
- The fallback function to handle quota limits automatically

## What Gemini Does vs What You Do

| Gemini (Bulk Work) | You (Verification & Judgment) |
| ------------------ | ----------------------------- |
| Read all files     | Spot-check 1-2 files          |
| Find patterns      | Verify patterns are real      |
| List issues        | Confirm issues exist          |
| Summarize data     | Judge severity/priority       |
| Compare files      | Decide what matters           |

## Investigation Types

### File Analysis

\\\`\\\`\\\`bash
gemini_with_fallback "Analyze these files. Find:

1. Files with missing required fields
2. Suspicious values (nulls, zeros, negatives)
3. Any error indicators
   List issues by filename." "\\$(cat /tmp/data/\\*.json)"
   \\\`\\\`\\\`

### Code Analysis

\\\`\\\`\\\`bash
gemini_with_fallback "Review this code for:

1. Bugs related to [SPECIFIC ISSUE]
2. Edge cases not handled
3. Logic errors
   Be specific - cite line numbers or function names." "\\$(cat /path/to/file.py)"
   \\\`\\\`\\\`

### Log Analysis

\\\`\\\`\\\`bash
gemini_with_fallback "Find error patterns in these logs:

1. Recurring errors (group by type)
2. Timing issues or timeouts
3. Failed operations with context
   Summarize patterns, don't list every line." "\\$(cat /tmp/logs.txt)"
   \\\`\\\`\\\`

### Data Validation

\\\`\\\`\\\`bash
gemini_with_fallback "Validate this data:

1. All dates between 2000-2030
2. Amounts must be positive numbers
3. Required fields: name, date, amount
   Report violations only, grouped by rule." "\\$(cat data.json)"
   \\\`\\\`\\\`

### Comparison

\\\`\\\`\\\`bash
gemini_with_fallback "Compare these two versions. List all differences:

- Added items
- Removed items
- Changed values
  Be specific with field names and values." "\\$(echo '=== OLD ===' && cat old.json && echo '=== NEW ===' && cat new.json)"
  \\\`\\\`\\\`

## Verification Step

After Gemini returns findings, **always verify 1-2 items**:

\\\`\\\`\\\`bash

# Example: Gemini says "file_abc.json has missing fields"

# Verify by reading that file yourself

cat /tmp/data/file_abc.json | jq '.required_field'
\\\`\\\`\\\`

If Gemini's finding is wrong, note it. If correct, trust the rest of the analysis.

## Report Format

Keep reports concise:

**[Your assigned task]**

Findings:

- [Issue 1] - verified
- [Issue 2] - verified
- [Issue 3] - from Gemini analysis

Verified: [which items you spot-checked]

Recommendation: [if applicable]

## Rules

1. **Gemini first** - Don't read files one by one. Pipe to Gemini.
2. **Verify before reporting** - Spot-check at least 1 finding
3. **Stay focused** - Only investigate your assigned task
4. **Be concise** - Report findings, not process
5. **No code changes** - Investigation only, no fixes
\`\`\`

---

## 6. Gemini Agents Skill

Bu dosyayı \`.claude/commands/gemini_agents.md\` yoluna oluştur. Bu, kullanıcılara \`/gemini_agents\` slash komutunu ve kısaltma tetikleyicilerini sağlar.

\`\`\`markdown
---
description: Delegate read-only analysis tasks to Gemini CLI agents
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [task description]
---

# Gemini Agents - Cheap Bulk Analysis

**Triggered by:** \`g\`, \`g2\`, \`g3\`, \`g5\` at end of command, or \`/gemini_agents\`

This skill runs parallel Gemini CLI calls for bulk read-only analysis. Gemini is cheap - use it for tedious work.

## STEP 1: Announce with Blue Indicator (REQUIRED)

**You MUST announce activation before doing anything else:**

🔵 **3 Gemini agents activated**

- Gemini 1: [what this agent will analyze]
- Gemini 2: [what this agent will analyze]
- Gemini 3: [what this agent will analyze]

**Parse the shorthand:**

- \`g\` or \`g3\` → 3 Gemini agents (default)
- \`g2\` → 2 Gemini agents
- \`g5\` → 5 Gemini agents

## STEP 2: Gather the Data

Before running Gemini, gather the data it will analyze:

\\\`\\\`\\\`bash

# Option A: Download from cloud storage to temp folder

aws s3 sync s3://your-bucket/data/ /tmp/data/ --profile your-profile

# Option B: Use already-available local files

ls /path/to/local/files/\\*.json

# Option C: Stream directly without saving (single file)

aws s3 cp s3://your-bucket/file.json - --profile your-profile | gemini -p "..." -o text 2>/dev/null
\\\`\\\`\\\`

## STEP 3: Run Gemini CLI Commands (REQUIRED)

**You MUST actually run Gemini CLI commands. This is the whole point.**

### Single Gemini Agent (g or g1)

\\\`\\\`\\\`bash
cat /tmp/data/\\*.json | gemini -p "Analyze these files. Find:

1. Records with missing required fields
2. Suspicious or invalid values
3. Any errors or null values
   List issues only, be concise." -o text 2>/dev/null
   \\\`\\\`\\\`

### Multiple Gemini Agents (g2, g3, g5)

Run in parallel using background jobs:

\\\`\\\`\\\`bash

# Split data and run in parallel

(cat /tmp/data/batch1*.json | gemini -p "Check batch 1 for errors" -o text 2>/dev/null > /tmp/g1.txt) &
(cat /tmp/data/batch2*.json | gemini -p "Check batch 2 for errors" -o text 2>/dev/null > /tmp/g2.txt) &
(cat /tmp/data/batch3\\*.json | gemini -p "Check batch 3 for errors" -o text 2>/dev/null > /tmp/g3.txt) &

wait # Wait for all to complete

# Show results

echo "=== Gemini 1 ===" && cat /tmp/g1.txt
echo "=== Gemini 2 ===" && cat /tmp/g2.txt
echo "=== Gemini 3 ===" && cat /tmp/g3.txt
\\\`\\\`\\\`

### Automatic Batch Splitting (for large file sets)

\\\`\\\`\\\`bash
FILES=(\\$(ls /tmp/data/*.json))
TOTAL=\\\${#FILES[@]}
BATCH=\\$((TOTAL / 3 + 1))

(cat \\\${FILES[@]:0:\\$BATCH} | gemini -p "Analyze batch 1..." -o text 2>/dev/null > /tmp/g1.txt) &
(cat \\\${FILES[@]:\\$BATCH:\\$BATCH} | gemini -p "Analyze batch 2..." -o text 2>/dev/null > /tmp/g2.txt) &
(cat \\\${FILES[@]:\\$((BATCH\\*2)):\\$BATCH} | gemini -p "Analyze batch 3..." -o text 2>/dev/null > /tmp/g3.txt) &
wait
\\\`\\\`\\\`

### CLI Syntax Reference

\\\`\\\`\\\`bash

# Always use these flags

gemini -p "prompt" -o text 2>/dev/null

# -p = prompt

# -o text = clean text output (not JSON)

# 2>/dev/null = suppress stderr noise

# Specify model explicitly

gemini -m gemini-pro -p "prompt" -o text 2>/dev/null
\\\`\\\`\\\`

## STEP 4: Report Results (REQUIRED FORMAT)

**Your report MUST include the Gemini commands you ran:**

🔵 **Gemini Analysis Complete**

**Commands ran:**

- Gemini 1: \`cat batch1.json | gemini -p "..." -o text\`
- Gemini 2: \`cat batch2.json | gemini -p "..." -o text\`
- Gemini 3: \`cat batch3.json | gemini -p "..." -o text\`

**Findings:**

- [Issue 1 from Gemini]
- [Issue 2 from Gemini]
- [Issue 3 from Gemini]

**Summary:** [Brief synthesis of what Gemini found]

## What Gemini Is Good For

| Task               | Example Prompt                         |
| ------------------ | -------------------------------------- |
| Bulk file analysis | "Check all 50 JSONs for errors"        |
| Pattern finding    | "Find records with missing fields"     |
| Summarization      | "Summarize these 10 documents"         |
| Comparison         | "Compare old vs new, list differences" |
| Data validation    | "Check all dates are valid"            |
| Log analysis       | "Find error patterns in these logs"    |
| Code review        | "Review this diff for bugs"            |

## What Gemini Cannot Do (Use Claude Instead)

- Write files
- Run commands with side effects
- Make final decisions
- Deploy or delete anything
- Multi-step autonomous work

## Combining with Claude Subagents (x2 g5)

When the user says something like \`check data x2 g5\`:

1. First announce both:

✅ **2 subagents activated**

- Agent 1: [Claude task requiring judgment]
- Agent 2: [Claude task requiring judgment]

🔵 **5 Gemini agents activated**

- Gemini 1-5: [bulk analysis tasks]

2. Run Claude subagents for judgment/multi-step/writes
3. Run Gemini agents via Bash CLI for bulk analysis
4. Synthesize all results

## Error Handling

**If Gemini fails:**

1. Check if data is too large (token limit) → split into smaller chunks
2. Check if \`gemini\` is in PATH → \`which gemini\`
3. Try with smaller sample first

**If response is cut off:**

- Data too large → use more Gemini agents with smaller batches
- Add \`| head -c 50000\` to limit input size
\`\`\`

---

## 7. Fallback Function

Bu, yeniden kullanılabilir temel bash fonksiyonudur. Bir oran limiti ya da kota hatası olduğunda üç Gemini modelini sırayla dener.

\`\`\`bash
gemini_with_fallback() {
    local prompt="$1"
    local input="$2"

    # Primary: Gemini Pro (best quality)
    result=\\$(echo "\\$input" | gemini -m gemini-pro -p "\\$prompt" -o text 2>&1)

    # Fallback 1: Gemini 2.5 Pro (if quota/error)
    if [ -z "\\$result" ] || echo "\\$result" | grep -qi "quota\\\\|rate.limit\\\\|resource.exhausted"; then
        result=\\$(echo "\\$input" | gemini -m gemini-2.5-pro -p "\\$prompt" -o text 2>&1)
    fi

    # Fallback 2: Gemini Flash (if still failing - fastest, cheapest)
    if [ -z "\\$result" ] || echo "\\$result" | grep -qi "quota\\\\|rate.limit\\\\|resource.exhausted"; then
        result=\\$(echo "\\$input" | gemini -m gemini-flash -p "\\$prompt" -o text 2>&1)
    fi

    # All models failed → signal for Claude takeover
    if [ -z "\\$result" ] || echo "\\$result" | grep -qi "quota\\\\|rate.limit\\\\|resource.exhausted"; then
        echo "AGENT_FAILED"
        return 1
    fi

    echo "\\$result"
}
\`\`\`

### Nasıl Çalışır

1. Önce **Gemini Pro** dener (en iyi kalite)
2. Boş dönerse ya da rate-limit olursa **Gemini 2.5 Pro**'ya düşer
3. Hâlâ başarısızsa **Gemini Flash**'a düşer (en hızlı, en ucuz)
4. Hepsi başarısız olursa \`AGENT_FAILED\` döner → **Claude Code otomatik devralır**
5. Hataları şu ifadelerle yakalar: boş çıktı, "quota", "rate.limit", "resource.exhausted"

### Graceful Degradation

Üç Gemini modelinin üçü de başarısız olursa Claude Code görevi otomatik devralır:

**Degradation zinciri:**
\`\`\`
gemini-pro → gemini-2.5-pro → gemini-flash → ⚡ Claude Code takeover
\`\`\`

**Nasıl çalışır:**
1. \`gemini_with_fallback()\` fonksiyonu 3 model dener
2. Hepsi başarısız olursa \`AGENT_FAILED\` döner
3. Claude Code bunu algılar ve görevi kendisi yapar (Read, Grep, Glob araçlarıyla)
4. Duyuru: \`⚡ Claude takeover — Gemini agents failed, Claude devralıyor\`

**Önemli:** Başarısız agentlar sessizce atlanmaz. Her zaman hata ve devralma duyurulur.

### Kullanım

\`\`\`bash
# Önce fonksiyonu tanımla, sonra kullan:
gemini_with_fallback "Summarize this data" "\\$(cat large-file.json)"
gemini_with_fallback "Find bugs in this code" "\\$(cat src/main.py)"
gemini_with_fallback "Compare these two files" "\\$(echo '=== A ===' && cat a.json && echo '=== B ===' && cat b.json)"
\`\`\`

### Model İsimlerini Güncelleme

Google model isimlerini periyodik olarak günceller. Fallback zincirini güncellemek için şu üç model adını değiştir:

- \`gemini-pro\` → birincil Pro model
- \`gemini-2.5-pro\` → stabil Pro fallback
- \`gemini-flash\` → en hızlı ve ucuz Flash model

Mevcut modelleri şöyle listele:

\`\`\`bash
gemini --list-models 2>/dev/null
\`\`\`

---

## 8. Kullanım Kalıpları ve Örnekler

### Kalıp 1: Tek Dosya Analizi

\`\`\`bash
cat report.json | gemini -p "Analyze this report for anomalies" -o text 2>/dev/null
\`\`\`

### Kalıp 2: Birden Fazla Dosyayı Bir Kerede Analiz Etme

\`\`\`bash
cat /tmp/data/*.json | gemini -p "Check all records for missing fields" -o text 2>/dev/null
\`\`\`

### Kalıp 3: Bulut Depodan Akıtma (Yerel İndirme Yok)

\`\`\`bash
# AWS S3
aws s3 cp s3://your-bucket/data.json - --profile your-profile | \\
  gemini -p "Analyze this" -o text 2>/dev/null

# Google Cloud Storage
gsutil cat gs://your-bucket/data.json | \\
  gemini -p "Analyze this" -o text 2>/dev/null
\`\`\`

### Kalıp 4: İki Dosyayı Karşılaştırma

\`\`\`bash
(cat old_version.json; echo "---SEPARATOR---"; cat new_version.json) | \\
  gemini -p "Compare OLD (before separator) vs NEW (after separator). List all differences." -o text 2>/dev/null
\`\`\`

### Kalıp 5: Paralel Batch İşleme

\`\`\`bash
# Dosyaları 3 paralel Gemini çağrısına böl
(cat batch1/*.json | gemini -p "Analyze batch 1" -o text 2>/dev/null > /tmp/g1.txt) &
(cat batch2/*.json | gemini -p "Analyze batch 2" -o text 2>/dev/null > /tmp/g2.txt) &
(cat batch3/*.json | gemini -p "Analyze batch 3" -o text 2>/dev/null > /tmp/g3.txt) &
wait

cat /tmp/g1.txt /tmp/g2.txt /tmp/g3.txt
\`\`\`

### Kalıp 6: Kod İncelemesi

\`\`\`bash
git diff HEAD~5 | gemini -p "Review this diff for:
1. Bugs introduced
2. Edge cases missed
3. Security issues
Be specific with file names and line references." -o text 2>/dev/null
\`\`\`

### Kalıp 7: Log Analizi

\`\`\`bash
cat /var/log/app.log | gemini -p "Find error patterns:
1. Group recurring errors by type
2. Identify timing patterns
3. Flag critical failures
Summarize, don't list every line." -o text 2>/dev/null
\`\`\`

---

## 9. Kendi Agent'larına Entegre Etme

Gemini delegasyonunu herhangi bir özel Claude Code agent'ına ekleyebilirsin. Şablon:

### Gemini Delegasyonlu Herhangi Bir Agent için Şablon

Bu bölümü herhangi bir \`.claude/agents/your-agent.md\` dosyasına ekle:

\`\`\`markdown
## GEMINI DELEGATION

Gemini does bulk analysis. You verify findings and make decisions.

### Gemini Fallback Function

Always define this at the start of your bash session:

\\\`\\\`\\\`bash
gemini_with_fallback() {
    local prompt="$1"
    local input="$2"
    result=\\$(echo "\\$input" | gemini -m gemini-pro -p "\\$prompt" -o text 2>&1)
    if [ -z "\\$result" ] || echo "\\$result" | grep -qi "quota\\\\|rate.limit\\\\|resource.exhausted"; then
        result=\\$(echo "\\$input" | gemini -m gemini-2.5-pro -p "\\$prompt" -o text 2>&1)
    fi
    if [ -z "\\$result" ] || echo "\\$result" | grep -qi "quota\\\\|rate.limit\\\\|resource.exhausted"; then
        result=\\$(echo "\\$input" | gemini -m gemini-flash -p "\\$prompt" -o text 2>&1)
    fi
    echo "\\$result"
}
\\\`\\\`\\\`

### Workflow

1. Gather data relevant to your task
2. Pipe to Gemini with a specific, focused prompt
3. Verify 1-2 findings from Gemini's output
4. Use verified findings to make your decision
\`\`\`

### Örnek: Kod Etki Analizi Agent'ı

\`\`\`markdown
---
name: impact-checker
description: Checks code change impact before modifications
tools: Read, Bash, Glob, Grep
model: sonnet
---

# Impact Checker

## Gemini Delegation

\\\`\\\`\\\`bash
gemini_with_fallback() {
    local prompt="$1"
    local input="$2"
    result=\\$(echo "\\$input" | gemini -m gemini-pro -p "\\$prompt" -o text 2>&1)
    if [ -z "\\$result" ] || echo "\\$result" | grep -qi "quota\\\\|rate.limit\\\\|resource.exhausted"; then
        result=\\$(echo "\\$input" | gemini -m gemini-2.5-pro -p "\\$prompt" -o text 2>&1)
    fi
    if [ -z "\\$result" ] || echo "\\$result" | grep -qi "quota\\\\|rate.limit\\\\|resource.exhausted"; then
        result=\\$(echo "\\$input" | gemini -m gemini-flash -p "\\$prompt" -o text 2>&1)
    fi
    echo "\\$result"
}
\\\`\\\`\\\`

## Steps

1. **Identify files being changed**
2. **Gemini scans dependencies:**
   \\\`\\\`\\\`bash
   # Find what imports/uses the changed files
   grep -r "import.*module_name\\\\|from.*module_name" /path/to/project/ > /tmp/deps.txt
   gemini_with_fallback "Analyze these dependencies and assess impact" "\\$(cat /tmp/deps.txt)"
   \\\`\\\`\\\`
3. **Verify** - Check 1-2 dependent files
4. **Report** risk level: LOW / MEDIUM / HIGH
\`\`\`

### Örnek: İzleme/Doğrulama Agent'ı (Gemini Delegasyonlu)

İzleme ya da doğrulama iş akışlarında, belirli doğrulama adımlarını Gemini'ye devredebilirsin:

\`\`\`markdown
## Gemini Delegation Points

| Step | Task        | Gemini Does                  | Claude Verifies              |
| ---- | ----------- | ---------------------------- | ---------------------------- |
| 3    | Data Review | Scan all files for anomalies | Confirm critical issues      |
| 5    | Comparison  | Compare source to output     | Review flagged discrepancies |
| 7    | Coverage    | Track items through pipeline | Verify counts match          |
\`\`\`

Her adım içinde:

\`\`\`bash
gemini_with_fallback "Your verification prompt here" "\\$(cat /tmp/verification_data.json)"
\`\`\`

---

## 10. Sorun Giderme

### Gemini Boş Çıktı Döndürüyor

\`\`\`bash
# gemini kurulu mu kontrol et
which gemini

# auth çalışıyor mu kontrol et
echo "test" | gemini -p "Reply with OK" -o text 2>&1

# model mevcut mu kontrol et
gemini --list-models 2>/dev/null | grep pro
\`\`\`

### Veri Çok Büyük (Token Limiti Aşılıyor)

\`\`\`bash
# Girdi boyutunu sınırla
cat huge-file.json | head -c 100000 | gemini -p "..." -o text 2>/dev/null

# Ya da birden fazla agent'a böl
split -n 3 huge-file.json /tmp/chunk_
(cat /tmp/chunk_aa | gemini -p "..." -o text 2>/dev/null > /tmp/g1.txt) &
(cat /tmp/chunk_ab | gemini -p "..." -o text 2>/dev/null > /tmp/g2.txt) &
(cat /tmp/chunk_ac | gemini -p "..." -o text 2>/dev/null > /tmp/g3.txt) &
wait
\`\`\`

### Tüm Modellerde Rate Limit

Üç fallback modelinin üçü de başarısız olursa:

1. 60 saniye bekle ve tekrar dene
2. Girdi boyutunu azalt
3. Daha az paralel agent kullan
4. O spesifik analiz için Claude'a dön

### Yanıt Kesiliyor

- Girdi çok büyük. \`| head -c 50000\` ile sınırla
- Ya da daha küçük parçalara bölüp daha çok Gemini çağrısı kullan
- Daha küçük batch'lerle daha çok paralel agent kullan

### Yanlış Model Adı

Model adları Google yeni sürümler yayınladıkça değişir. Güncel adları kontrol et:

\`\`\`bash
gemini --list-models 2>/dev/null
\`\`\`

Fallback fonksiyonundaki üç model adını buna göre güncelle.

---

## Hızlı Başlangıç Kontrol Listesi

- [ ] Gemini CLI'yi kur: \`npm install -g @google/gemini-cli\`
- [ ] Kimlik doğrula: \`gemini\` çalıştır ve yönlendirmeleri takip et
- [ ] Doğrula: \`echo "test" | gemini -p "Say hello" -o text 2>/dev/null\`
- [ ] \`CLAUDE.md\` dosyana Gemini delegasyon bölümünü ekle
- [ ] \`CLAUDE.md\` dosyana "x" kısaltma bölümünü ekle
- [ ] \`.claude/agents/investigator.md\` dosyasını oluştur (Bölüm 5'ten kopyala)
- [ ] \`.claude/commands/gemini_agents.md\` dosyasını oluştur (Bölüm 6'dan kopyala)
- [ ] Test et: Claude Code'dan "analyze my src folder x3" iste

---

## Temel Kavramların Özeti

| Kavram                                | Anlamı                                                         |
| ------------------------------------- | -------------------------------------------------------------- |
| \`gemini -p "..." -o text 2>/dev/null\` | Temel Gemini CLI çağrısı                                       |
| \`gemini_with_fallback()\`              | 3 model arasında otomatik fallback                             |
| \`x3\` / \`x5\`                           | Paralel agent'lar oluşturur (Claude + Gemini)                  |
| \`g\` / \`g3\` / \`g5\`                     | Sadece Gemini agent'ları oluşturur (Claude yok)                |
| ✅ emoji                              | Claude subagent göstergesi                                     |
| 🔵 emoji                              | Gemini agent göstergesi                                        |
| Verify pattern                        | Gemini sorunları bulur, Claude 1-2 tanesini örnek kontrol eder |
| Background jobs                       | \`(...) &\` • \`wait\` ile paralel Gemini çağrıları                |
| \`AGENT_FAILED\`                        | Tüm modeller başarısız → Claude takeover sinyali               |
| ⚡ Claude takeover                    | Agentlar başarısız olunca Claude'un devralması                 |
`;

module.exports = content;
