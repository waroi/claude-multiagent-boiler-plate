'use strict';

const content = `# Claude Code için Codex CLI Entegrasyonu

Codex CLI'yi, Claude Code içinde kod odaklı görevler için orta maliyetli bir delegasyon katmanı olarak kullanmaya yönelik kapsamlı bir rehber. Codex, basit kod işlerini ve kod analizini üstlenir. Claude ise karmaşık değerlendirme, mimari kararlar ve çok adımlı işleri üstlenir.

---

## İçindekiler

1. [Felsefe](#1-felsefe)
2. [Ön Koşullar](#2-ön-koşullar)
3. [Kurulum Genel Bakış](#3-kurulum-genel-bakış)
4. [CLAUDE.md Yapılandırması](#4-claudemd-yapılandırması)
5. [Codex Agents Skill](#5-codex-agents-skill)
6. [Fallback Function](#6-fallback-function)
7. [Kullanım Kalıpları ve Örnekler](#7-kullanım-kalıpları-ve-örnekler)
8. [Kendi Agent'larına Entegre Etme](#8-kendi-agentlarına-entegre-etme)
9. [Üç Katmanlı Delegasyon: Gemini + Codex + Claude](#9-üç-katmanlı-delegasyon-gemini--codex--claude)
10. [Sorun Giderme](#10-sorun-giderme)

---

## 1. Felsefe

Temel fikir, **üç katmanlı bir delegasyon modeli**dir:

| Rol                       | Claude Code (✅)                                      | Codex CLI (🟠)                                    | Gemini CLI (🔵)                            |
| ------------------------- | ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| **Amaç**                  | Değerlendirme, karar, karmaşık iş                    | Kod analizi, basit kod işleri                     | Kapsamlı metin analizi, desen bulma        |
| **Maliyet**               | En yüksek                                             | Orta                                              | En ucuz                                    |
| **Yetenekler**            | Tam (okuma + yazma + çalıştırma)                      | Sandbox (read-only veya workspace-write)          | Salt-okunur analiz                         |
| **En uygun olduğu işler** | Çok adımlı işler, nihai kararlar, mimari              | Bug fix, test yazma, refactoring, kod review      | 50+ dosya tarama, özetleme, veri doğrulama |

**Kalıp:**

1. Görevi analiz et: kod işi mi, veri analizi mi, karmaşık karar mı?
2. Kod işi → Codex'e delege et
3. Veri/metin analizi → Gemini'ye delege et
4. Karmaşık karar → Claude kendi yapar
5. Sonuçları birleştir ve raporla

**Bu neden işe yarar:**

- Claude token'ları pahalıdır. Basit bug fix'leri Claude'a yaptırmak israf
- Codex, OpenAI'ın kodlama modelleriyle çalışır — kod semantiğini iyi anlar
- Codex sandbox modunda güvenli çalışır (read-only veya izole workspace)
- Her model kendi güçlü alanında kullanılır = en iyi maliyet/performans dengesi
- Codex dosya yazabilir — Gemini'nin aksine basit kod değişiklikleri yapabilir

---

## 2. Ön Koşullar

### Codex CLI'yi Kur

\`\`\`bash
npm install -g @openai/codex
\`\`\`

### Kurulumu Doğrula

\`\`\`bash
which codex        # Bir yol döndürmeli
codex --version    # Sürümü göstermeli (örn. codex-cli 0.98.0)
\`\`\`

### Kimlik Doğrulama

Codex CLI, OpenAI API key'i ister. Çalıştır:

\`\`\`bash
codex login
\`\`\`

Tarayıcı tabanlı doğrulama akışını tamamla. Ya da \`OPENAI_API_KEY\` environment variable'ını ayarla:

\`\`\`bash
export OPENAI_API_KEY="sk-..."
\`\`\`

### Çalıştığını Doğrula

\`\`\`bash
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Say hello and confirm you are working" -o /tmp/codex_test.txt --skip-git-repo-check 2>/dev/null && cat /tmp/codex_test.txt
\`\`\`

Bir onay yanıtı almalısın.

---

## 3. Kurulum Genel Bakış

Projende şu dosyaları oluşturman veya değiştirmen gerekir:

\`\`\`
your-project/
  CLAUDE.md                         # Codex delegasyon kuralları ekle
  .claude/
    agents/
      investigator.md               # İnceleme alt-agent'ı (Gemini + Codex)
    commands/
      gemini_agents.md              # Toplu Gemini analizi becerisi (mevcut)
      codex_agents.md               # Codex kod analizi becerisi (yeni)
  Gemini-Integration.md             # Gemini entegrasyon dökümantasyonu (mevcut)
  codex-integration.md              # Bu dosya (yeni)
\`\`\`

---

## 4. CLAUDE.md Yapılandırması

Aşağıdaki bölümü projenin \`CLAUDE.md\` dosyasına ekle. Bu, Claude Code'a Codex'e ne zaman ve nasıl delegasyon yapacağını söyler.

### Bölüm: Codex Delegasyon Kuralları

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

### Bölüm: Kısayol Tablosuna Codex Ekle

Mevcut "x" kısayol tablosunu güncelle ve Codex kısayollarını ekle:

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

Bu dosyayı \`.claude/commands/codex_agents.md\` yoluna oluştur. Bu, kullanıcılara \`/codex_agents\` slash komutunu ve \`c\`/\`c3\`/\`c5\` kısaltma tetikleyicilerini sağlar.

Dosyanın tam içeriği \`.claude/commands/codex_agents.md\` dosyasında bulunur. Temel yapısı:

### Adım 1: Duyuru (🟠 emoji ile)

\`\`\`
🟠 **3 Codex agents activated**

- Codex 1: [görev açıklaması]
- Codex 2: [görev açıklaması]
- Codex 3: [görev açıklaması]
\`\`\`

### Adım 2: Sandbox Modu Seç

| Görev Tipi | Sandbox Modu | Flag |
| ---------- | ------------ | ---- |
| Analiz, review, okuma | \`read-only\` | \`-s read-only\` |
| Bug fix, refactoring, test yazma | \`workspace-write\` | \`-s workspace-write\` |

### Adım 3: Codex CLI Komutlarını Çalıştır

\`\`\`bash
# 3 paralel Codex agent
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Security review src/auth/" -o /tmp/c1.txt) &
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Find dead code in src/" -o /tmp/c2.txt) &
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Check error handling patterns" -o /tmp/c3.txt) &
wait

cat /tmp/c1.txt /tmp/c2.txt /tmp/c3.txt
\`\`\`

### Adım 4: Sonuçları Raporla

\`\`\`
🟠 **Codex Analysis Complete**

**Commands ran:**
- Codex 1: \`codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "..." -o /tmp/c1.txt\`
- Codex 2: \`codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "..." -o /tmp/c2.txt\`
- Codex 3: \`codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "..." -o /tmp/c3.txt\`

**Findings:**
- [Bulgu 1]
- [Bulgu 2]

**Summary:** [Özet]
\`\`\`

---

## 6. Fallback Function

Bu, yeniden kullanılabilir temel bash fonksiyonudur. Bir hata ya da rate limit olduğunda üç OpenAI modelini sırayla dener.

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

### Nasıl Çalışır

1. Önce **gpt-5.3-codex** dener (xhigh reasoning ile en zeki mod)
2. Hata olursa **o4-mini**'ye düşer
3. Hâlâ başarısızsa **gpt-4.1-mini**'ye düşer (en ucuz)
4. Hataları şu ifadelerle yakalar: "error", "rate.limit", "quota"

### Kullanım

\`\`\`bash
# Önce fonksiyonu tanımla, sonra kullan:

# Kod analizi (read-only)
codex_with_fallback "read-only" "Find security vulnerabilities in this project" "/tmp/c1.txt"

# Basit bug fix (workspace-write)
codex_with_fallback "workspace-write" "Fix the null check in src/utils.js" "/tmp/c2.txt"

# Test yazma (workspace-write)
codex_with_fallback "workspace-write" "Write unit tests for src/auth/login.js" "/tmp/c3.txt"
\`\`\`

### Model İsimlerini Güncelleme

OpenAI model isimlerini periyodik olarak günceller. Fallback zincirini güncellemek için şu üç model adını değiştir:

- \`gpt-5.3-codex\` → en güncel codex model (xhigh reasoning)
- \`o4-mini\` → reasoning fallback model
- \`gpt-4.1-mini\` → en ucuz fallback model

---

## 7. Kullanım Kalıpları ve Örnekler

### Kalıp 1: Tek Dosya Kod Analizi

\`\`\`bash
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Analyze src/main.py for bugs and edge cases. Be specific with line numbers." -o /tmp/analysis.txt 2>/dev/null && cat /tmp/analysis.txt
\`\`\`

### Kalıp 2: Kod Review (Uncommitted Değişiklikler)

\`\`\`bash
codex review --uncommitted 2>/dev/null
\`\`\`

### Kalıp 3: Kod Review (Branch Karşılaştırma)

\`\`\`bash
codex review --base main 2>/dev/null
\`\`\`

### Kalıp 4: Belirli Commit Review

\`\`\`bash
codex review --commit abc1234 --title "Add user auth" 2>/dev/null
\`\`\`

### Kalıp 5: Basit Bug Fix

\`\`\`bash
codex exec -s workspace-write --full-auto -m gpt-5.3-codex -c reasoning_effort=xhigh "Fix the off-by-one error in src/pagination.js" 2>/dev/null
\`\`\`

### Kalıp 6: Test Yazma

\`\`\`bash
codex exec -s workspace-write --full-auto -m gpt-5.3-codex -c reasoning_effort=xhigh "Write comprehensive unit tests for src/utils/date.js" 2>/dev/null
\`\`\`

### Kalıp 7: Refactoring

\`\`\`bash
codex exec -s workspace-write --full-auto -m gpt-5.3-codex -c reasoning_effort=xhigh "Refactor src/legacy/handler.js to use async/await instead of callbacks" 2>/dev/null
\`\`\`

### Kalıp 8: Paralel Çoklu Analiz

\`\`\`bash
# 3 Codex agent farklı görevlerle paralel çalıştır
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Find all TODO/FIXME comments and assess their priority" -o /tmp/c1.txt 2>/dev/null) &
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Check for common security vulnerabilities (XSS, injection, etc.)" -o /tmp/c2.txt 2>/dev/null) &
(codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Analyze code complexity and suggest simplifications" -o /tmp/c3.txt 2>/dev/null) &
wait

echo "=== TODOs ===" && cat /tmp/c1.txt
echo "=== Security ===" && cat /tmp/c2.txt
echo "=== Complexity ===" && cat /tmp/c3.txt
\`\`\`

### Kalıp 9: Belirli Dizin Analizi

\`\`\`bash
# -C ile çalışma dizini belirt
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh -C /path/to/subproject "Analyze this project structure and find architectural issues" -o /tmp/analysis.txt 2>/dev/null
\`\`\`

### Kalıp 10: Kod Açıklama

\`\`\`bash
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Explain what src/core/engine.js does. Focus on the main algorithm and data flow." -o /tmp/explanation.txt 2>/dev/null && cat /tmp/explanation.txt
\`\`\`

---

## 8. Kendi Agent'larına Entegre Etme

Codex delegasyonunu herhangi bir özel Claude Code agent'ına ekleyebilirsin. Şablon:

### Codex Delegasyonlu Herhangi Bir Agent için Şablon

Bu bölümü herhangi bir \`.claude/agents/your-agent.md\` dosyasına ekle:

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

### Örnek: Kod Kalite Agent'ı

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

### Örnek: Bug Hunter Agent'ı (Codex + Gemini Beraber)

Bazı görevlerde Codex ve Gemini birlikte kullanılır:

\`\`\`markdown
## Delegation Points

| Step | Task           | Tool    | Does                              | Claude Verifies              |
| ---- | -------------- | ------- | --------------------------------- | ---------------------------- |
| 1    | Log Analysis   | Gemini  | Scan logs for error patterns      | Confirm which errors matter  |
| 2    | Code Analysis  | Codex   | Find bugs related to log errors   | Verify bugs are real         |
| 3    | Fix Generation | Codex   | Generate fix proposals            | Review and approve fixes     |
\`\`\`

Her adım içinde uygun CLI'yi çağır:

\`\`\`bash
# Step 1: Gemini ile log analizi
gemini_with_fallback "Find error patterns in these logs" "\$(cat /tmp/app.log)"

# Step 2: Codex ile kod analizi
codex_with_fallback "read-only" "Find the root cause of NullPointerException in src/service/" "/tmp/bug.txt"

# Step 3: Codex ile fix önerisi
codex_with_fallback "workspace-write" "Fix the null check issue identified in src/service/UserService.java" "/tmp/fix.txt"
\`\`\`

---

## 9. Üç Katmanlı Delegasyon: Gemini + Codex + Claude

Bu yapının asıl gücü, üç aracı birlikte kullanmaktır.

### Görev Dağılım Matrisi

| Görev Tipi | İlk Tercih | İkinci Tercih | Son Çare |
| ---------- | ---------- | ------------- | -------- |
| JSON/CSV veri analizi | Gemini 🔵 | Codex 🟠 | Claude ✅ |
| Log analizi | Gemini 🔵 | Codex 🟠 | Claude ✅ |
| Kod review | Codex 🟠 | Gemini 🔵 | Claude ✅ |
| Bug tespiti | Codex 🟠 | Claude ✅ | - |
| Test yazma | Codex 🟠 | Claude ✅ | - |
| Refactoring | Codex 🟠 | Claude ✅ | - |
| Basit kod üretme | Codex 🟠 | Claude ✅ | - |
| Mimari karar | Claude ✅ | - | - |
| Çok adımlı iş akışı | Claude ✅ | - | - |
| Dosya karşılaştırma | Gemini 🔵 | Codex 🟠 | Claude ✅ |
| Dokümantasyon yazma | Codex 🟠 | Gemini 🔵 | Claude ✅ |

### Kombin Kullanım Örneği: \`x3 c3\`

Kullanıcı \`review this project x3 c3\` dediğinde:

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

### Maliyet Karşılaştırması (Yaklaşık)

| Senaryo | Sadece Claude | Gemini + Claude | Gemini + Codex + Claude |
| ------- | ------------- | --------------- | ----------------------- |
| 50 dosya analizi | \$\$\$\$ | \$ (Gemini) + \$ (Claude verify) | \$ + \$ + \$ |
| Kod review + fix | \$\$\$ | - | \$ (Codex review) + \$ (Codex fix) + \$ (Claude approve) |
| Log + bug analizi | \$\$\$\$ | \$ (Gemini logs) | \$ (Gemini logs) + \$ (Codex code) + \$ (Claude decide) |

---

## 10. Sorun Giderme

### Codex Komutu Bulunamıyor

\`\`\`bash
# codex kurulu mu kontrol et
which codex

# Kurulu değilse
npm install -g @openai/codex
\`\`\`

### Authentication Hatası

\`\`\`bash
# Yeniden login ol
codex login

# Ya da environment variable kontrol et
echo \$OPENAI_API_KEY
\`\`\`

### Git Repo Hatası

\`\`\`bash
# Git repo dışında çalışıyorsan
codex exec --skip-git-repo-check -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "prompt" -o /tmp/out.txt
\`\`\`

### Sandbox İzin Hatası

\`\`\`bash
# Önce read-only dene
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "prompt" -o /tmp/out.txt

# Yazma gerekiyorsa workspace-write kullan
codex exec -s workspace-write --full-auto -m gpt-5.3-codex -c reasoning_effort=xhigh "prompt"
\`\`\`

### Büyük Proje Timeout

\`\`\`bash
# Belirli dizine odakla
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh -C src/specific-module "prompt" -o /tmp/out.txt
\`\`\`

### Tüm Modellerde Rate Limit (Graceful Degradation)

Üç fallback modelinin üçü de başarısız olursa **Claude Code otomatik olarak devralır:**

**Degradation zinciri:**
\`\`\`
gpt-5.3-codex (xhigh) → o4-mini → gpt-4.1-mini → ⚡ Claude Code takeover
\`\`\`

**Nasıl çalışır:**
1. \`codex_with_fallback()\` fonksiyonu 3 model dener
2. Hepsi başarısız olursa \`AGENT_FAILED\` döner
3. Claude Code bunu algılar ve görevi kendisi yapar (Read, Grep, Glob araçlarıyla)
4. Duyuru: \`⚡ Claude takeover — Codex agents failed, Claude devralıyor\`

**Önemli:** Başarısız agentlar sessizce atlanmaz. Her zaman hata ve devralma duyurulur.

### Codex Boş Çıktı Döndürüyor

\`\`\`bash
# -o dosyasını kontrol et
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Say hello" -o /tmp/test.txt 2>&1
cat /tmp/test.txt

# stderr'i de kontrol et (2>/dev/null kaldırarak)
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Say hello" -o /tmp/test.txt
\`\`\`

---

## Hızlı Başlangıç Kontrol Listesi

- [ ] Codex CLI'yi kur: \`npm install -g @openai/codex\`
- [ ] Kimlik doğrula: \`codex login\`
- [ ] Doğrula: \`codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Say hello" -o /tmp/test.txt --skip-git-repo-check\`
- [ ] \`CLAUDE.md\` dosyana Codex delegasyon bölümünü ekle
- [ ] \`CLAUDE.md\` dosyandaki kısayol tablosunu güncelle (c/c3/c5 ekle)
- [ ] \`.claude/commands/codex_agents.md\` dosyasını oluştur
- [ ] Test et: Claude Code'dan "analyze my code c3" iste

---

## Temel Kavramların Özeti

| Kavram                                           | Anlamı                                              |
| ------------------------------------------------ | --------------------------------------------------- |
| \`codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "..." -o f\`  | Temel Codex CLI analiz çağrısı                      |
| \`codex exec -s workspace-write --full-auto "..."\` | Codex ile kod değişikliği yapma                     |
| \`codex review --uncommitted\`                      | Yerleşik kod review özelliği                        |
| \`codex_with_fallback()\`                           | 3 model arasında otomatik fallback                  |
| \`c\` / \`c3\` / \`c5\`                                | Codex agent'ları oluşturan kısayollar               |
| \`x3 c3\`                                          | Claude + Gemini + Codex kombin kullanım             |
| 🟠 emoji                                         | Codex agent göstergesi                              |
| \`AGENT_FAILED\`                                    | Tüm modeller başarısız → Claude takeover sinyali    |
| ⚡ Claude takeover                                | Agentlar başarısız olunca Claude'un devralması      |
| \`-s read-only\`                                    | Salt-okunur sandbox (analiz)                        |
| \`-s workspace-write\`                              | Yazma izinli sandbox (kod değişiklikleri)           |
| \`--full-auto\`                                     | Onay istemeden sandbox içinde çalıştırma            |
`;

module.exports = content;
