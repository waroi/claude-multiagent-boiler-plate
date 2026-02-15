'use strict';

const content = `# Claude Code Coklu Agent Yapisi - Kullanim Rehberi

> Bu belge, Claude Code icinde Gemini ve Codex CLI araclarini paralel olarak kullanan coklu agent yapisinin nasil kurulacagini ve kullanilacagini adim adim anlatir.

---

## Bu Yapi Ne Ise Yarar?

Claude Code tek basina her seyi yapar ama pahalidir. Bu yapi, basit isleri daha ucuz AI modellerine yonlendirerek hem maliyet dusurur hem de paralel calisarak hiz kazandirir.

**Uc katmanli model:**

| Katman | AI | Emoji | Ne Yapar | Maliyet |
|--------|----|-------|----------|---------|
| 1 | Claude | ✅ | Karmasik kararlar, dosya yazma, mimari | En pahali |
| 2 | Codex | 🟠 | Kod analizi, bug fix, test yazma, refactoring | Orta |
| 3 | Gemini | 🔵 | Toplu metin/veri analizi, log okuma, ozet cikarma | En ucuz |

**Basit kural:** Claude dusunur, Codex kod yazar, Gemini okur.

---

## 1. On Kosullar

Bu yapiyi kullanmak icin bilgisayarinda su araclarin kurulu olmasi gerekir:

### Claude Code (zaten kurulu)

Claude Code CLI'yi kullaniyorsan zaten kurulu demektir.

### Gemini CLI

\`\`\`bash
npm install -g @google/gemini-cli
\`\`\`

Kurduktan sonra bir kez calistirip giris yap:

\`\`\`bash
gemini
\`\`\`

Ekrandaki yonergeleri takip et. Google hesabinla giris yapacaksin.

**Dogrulama:**
\`\`\`bash
echo "test" | gemini -p "Say hello" -o text 2>/dev/null
\`\`\`

Ciktida "hello" benzeri bir yanit goruyorsan kurulum tamam.

### Codex CLI

\`\`\`bash
npm install -g @openai/codex
\`\`\`

Giris yap:

\`\`\`bash
codex login
\`\`\`

**Dogrulama:**
\`\`\`bash
codex exec -s read-only -m gpt-5.3-codex -c reasoning_effort=xhigh "Say hello" -o /tmp/test.txt --skip-git-repo-check && cat /tmp/test.txt
\`\`\`

### Bash (Windows icin)

Tum komutlar bash sozdizimi kullanir. Windows'taysan su seceneklerden biri gerekli:

- **Git Bash** (Git ile birlikte gelir - onerilen)
- **WSL** (Windows Subsystem for Linux)

---

## 2. Yapiyi Projeye Ekleme

Bu boilerplate'i herhangi bir projeye eklemek icin su dosyalari kopyala:

\`\`\`
senin-projen/
├── CLAUDE.md                          ← Ana konfigürasyon (ZORUNLU)
└── .claude/
    ├── settings.local.json            ← İzinler (ZORUNLU)
    ├── agents/
    │   └── investigator.md            ← Arastirma alt-agent'i
    └── commands/
        ├── codex_agents.md            ← Codex becerisi
        └── gemini_agents.md           ← Gemini becerisi
\`\`\`

**Minimum kurulum:** Sadece \`CLAUDE.md\` ve \`.claude/\` klasorunu kopyala. Dokumantasyon dosyalari (\`codex-integration.md\`, \`Gemini-Integration.md\`, \`KULLANIM.md\`) opsiyoneldir.

---

## 3. Kisayollar (Shorthand'ler)

Bu yapinin kalbi kisayollardir. Komutunun sonuna bir kisayol ekleyerek paralel agent'lar olusturursun.

### Kisayol Tablosu

| Yazdigin | Ne Olur | Toplam Agent |
|----------|---------|--------------|
| \`x3\` | 1 Claude + 2 Gemini | 3 |
| \`x5\` | 1 Claude + 4 Gemini | 5 |
| \`c\` veya \`c3\` | 3 Codex | 3 |
| \`c2\` | 2 Codex | 2 |
| \`c5\` | 5 Codex | 5 |
| \`g\` veya \`g3\` | 3 Gemini | 3 |
| \`g2\` | 2 Gemini | 2 |
| \`g5\` | 5 Gemini | 5 |

### Nasil Kullanilir

Komutunun sonuna kisayolu ekle. Hepsi bu.

\`\`\`
bu kodu analiz et c3
\`\`\`

Bu komut 3 Codex agent'i olusturur ve kodu paralel olarak analiz eder.

\`\`\`
projeyi incele x5
\`\`\`

Bu komut 1 Claude investigator + 4 Gemini agent = 5 agent olusturur.

\`\`\`
bu klasoru tara g3
\`\`\`

Bu komut 3 Gemini agent'i olusturur ve klasoru paralel olarak tarar.

### Kisayollari Birlestirme

Birden fazla kisayolu ayni anda kullanabilirsin:

\`\`\`
projeyi analiz et x5 c5
\`\`\`

Bu komut: 1 Claude + 4 Gemini + 5 Codex = **10 agent** olusturur.

\`\`\`
kodu incele x3 c3
\`\`\`

Bu komut: 1 Claude + 2 Gemini + 3 Codex = **6 agent** olusturur.

---

## 4. Gercek Kullanim Ornekleri

### Ornek 1: Kod Analizi (Codex ile)

**Yazdigin:**
\`\`\`
src klasorundeki buglari bul c3
\`\`\`

**Ne olur:**
1. Claude 3 Codex agent'i olusturur
2. Her agent farkli bir aciyla kodu analiz eder (guvenlik, test kapsamı, kod kalitesi)
3. Sonuclar toplanir ve sana sunulur

**Gordugun:**
\`\`\`
🟠 3 Codex agents activated
- Codex 1: Guvenlik aciklari taraniyor
- Codex 2: Test kapsamı kontrol ediliyor
- Codex 3: Kod kalitesi analiz ediliyor

🟠 Codex Analysis Complete
Findings:
- src/auth.js:42 - SQL injection riski
- src/utils.js:15 - Null kontrolu eksik
- ...
\`\`\`

### Ornek 2: Veri Analizi (Gemini ile)

**Yazdigin:**
\`\`\`
log dosyalarini analiz et g3
\`\`\`

**Ne olur:**
1. Claude 3 Gemini agent'i olusturur
2. Log dosyalari 3 parcaya bolunur ve paralel analiz edilir
3. Hata kaliplari, tekrarlanan sorunlar raporlanir

### Ornek 3: Kapsamli Analiz (Hepsi birlikte)

**Yazdigin:**
\`\`\`
projeyi bastin bastan analiz et x3 c3
\`\`\`

**Ne olur:**
1. ✅ 1 Claude investigator - derinlemesine arastirma yapar
2. 🔵 2 Gemini agent - dokumantasyon ve veri analizi yapar
3. 🟠 3 Codex agent - kod analizi yapar
4. Toplam 6 agent paralel calisir
5. Sonuclar sentezlenir ve tek bir rapor halinde sunulur

### Ornek 4: Kod Duzeltme (Codex ile)

**Yazdigin:**
\`\`\`
bulunan buglari duzelt c3
\`\`\`

**Ne olur:**
1. Codex agent'lari \`workspace-write\` modunda calisir
2. Buglari otomatik olarak duzeltir
3. Degisiklikler dosyalara yazilir

---

## 5. Fallback Sistemi (Otomatik Yedekleme)

Her agent bir model zinciri kullanir. Birinci model basarisiz olursa otomatik olarak bir sonrakine gecer.

### Gemini Zinciri

\`\`\`
gemini-pro  →  gemini-2.5-pro  →  gemini-flash
  (en iyi)       (orta)            (en ucuz)
\`\`\`

### Codex Zinciri

\`\`\`
gpt-5.3-codex (xhigh)  →  o4-mini  →  gpt-4.1-mini
      (en iyi)              (orta)       (en ucuz)
\`\`\`

Bu tamamen otomatiktir. Senin bir sey yapmana gerek yok.

---

## 6. Graceful Degradation (Otomatik Devralma)

Bazen tum modellerin kredisi biter veya rate limit'e takilir. Bu durumda:

\`\`\`
Agent modeli 1 (en iyi)
  ↓ basarisiz
Agent modeli 2 (orta)
  ↓ basarisiz
Agent modeli 3 (en ucuz)
  ↓ basarisiz
⚡ Claude Code devralir (kendi araclariyla analiz yapar)
\`\`\`

**Ornek senaryo:**

1. \`projeyi analiz et x5 c5\` yazdin
2. 4 Gemini agent calisiyor ama kredi limiti doldu → hepsi basarisiz
3. 5 Codex agent calisiyor ama rate limit → hepsi basarisiz
4. Claude bunu algilar ve su mesaji gosterir:

\`\`\`
⚡ Claude takeover — Gemini agents failed, Claude devraliyor
⚡ Claude takeover — Codex agents failed, Claude devraliyor
\`\`\`

5. Claude, Read/Grep/Glob araclariyla analizi kendisi yapar
6. Sonuc raporu ayni formatta sunulur

**Senin yapman gereken bir sey yok.** Sistem otomatik devralir.

---

## 7. Emoji Gostergeleri

Agent'lar calisirken emoji'lerden hangi tipin aktif oldugunu anlayabilirsin:

| Emoji | Anlami |
|-------|--------|
| ✅ | Claude subagent calisiyor |
| 🔵 | Gemini agent calisiyor |
| 🟠 | Codex agent calisiyor |
| ⚡ | Claude devralma (agent basarisiz oldu) |

---

## 8. Hangi Durumda Hangi Kisayol?

| Yapacagin Is | Onerilen Kisayol | Neden |
|-------------|-----------------|-------|
| Kod analizi / bug tespiti | \`c3\` | Codex kodu anlar |
| Kod duzeltme / refactoring | \`c3\` | Codex dosya yazabilir |
| Test yazma | \`c3\` | Codex test uretebilir |
| Log / veri analizi | \`g3\` | Gemini ucuz ve hizli |
| Dokumantasyon okuma | \`g3\` | Gemini toplu metin okur |
| Genel proje analizi | \`x3\` | Claude + Gemini = derinlik + genislik |
| Kapsamli her sey analizi | \`x5 c5\` | Maksimum paralel guc |
| Hizli tek bakis | \`c\` veya \`g\` | 3 agent varsayilan |

---

## 9. Dosya Yapisi Aciklamasi

\`\`\`
projen/
├── CLAUDE.md                    ← Claude Code bunu her zaman okur.
│                                   Delegasyon kurallari, kisayollar,
│                                   fallback zincirleri burada tanimli.
│
├── .claude/
│   ├── settings.local.json      ← Hangi bash komutlarina izin
│   │                               verildigini tanimlar.
│   │
│   ├── agents/
│   │   └── investigator.md      ← x3/x5 kullanildiginda otomatik
│   │                               calisan arastirma agent'i.
│   │                               Gemini + Codex kullanir.
│   │
│   └── commands/
│       ├── codex_agents.md      ← c/c3/c5 kisayollarinin
│       │                           nasil calisacagini tanimlar.
│       │
│       └── gemini_agents.md     ← g/g3/g5 kisayollarinin
│                                   nasil calisacagini tanimlar.
│
├── codex-integration.md         ← (Opsiyonel) Codex entegrasyonunun
│                                   detayli Turkce dokumantasyonu.
│
├── Gemini-Integration.md        ← (Opsiyonel) Gemini entegrasyonunun
│                                   detayli Turkce dokumantasyonu.
│
└── KULLANIM.md                  ← (Opsiyonel) Bu dosya.
\`\`\`

---

## 10. Sik Sorulan Sorular

### "Agent basarisiz oldu" mesaji goruyorum?

Normal. Modellerin kredi limiti veya rate limit'i olabilir. Sistem otomatik olarak bir sonraki modele gecer. Tum modeller basarisiz olursa Claude devralir.

### Windows'ta calisir mi?

Evet, ama bash gerekli. Git Bash veya WSL kullan. Tum komutlar bash sozdizimi kullanir.

### Kendi modellerimi ekleyebilir miyim?

Evet. \`CLAUDE.md\` dosyasindaki fallback zincirlerini degistir. Ornegin:

\`\`\`
**Codex fallback:** gpt-5.3-codex (xhigh) → o4-mini → gpt-4.1-mini → ⚡ Claude takeover
\`\`\`

Bu satirdaki model isimlerini kendi tercihlerine gore degistirebilirsin.

### Baska bir projeye nasil tasiyabilirim?

1. \`CLAUDE.md\` dosyasini projenin kokune kopyala
2. \`.claude/\` klasorunu projenin kokune kopyala
3. Hazir. Claude Code o projeyi actiginda yapiyi otomatik olarak taninacaktir.

### Sadece Gemini veya sadece Codex kullanabilir miyim?

Evet.
- Sadece Gemini: \`g3\` veya \`g5\` kisayolunu kullan
- Sadece Codex: \`c3\` veya \`c5\` kisayolunu kullan
- Ikisi birden: \`x3 c3\` gibi birlestir

### Kac agent kullanabilirim?

| Kisayol | Agent Sayisi |
|---------|-------------|
| \`c2\` / \`g2\` | 2 |
| \`c\` / \`c3\` / \`g\` / \`g3\` / \`x3\` | 3 |
| \`c5\` / \`g5\` / \`x5\` | 5 |
| \`x5 c5\` | 10 (1 Claude + 4 Gemini + 5 Codex) |

### Maliyet nasil hesaplanir?

- Gemini: Google'in ucretsiz katmani vardir, asildiktan sonra ucretli
- Codex: OpenAI kredisi kullanir
- Claude: Anthropic plani/kredisi kullanir

Bu yapi maliyeti dusurur cunku pahali Claude tokenlarini sadece karmasik isler icin harcar, basit isleri ucuz modellere yonlendirir.

---

## 11. Hizli Baslangic (5 Dakikada Hazir)

### Yontem A: npm ile Kurulum (Onerilen)

\`\`\`bash
# 1. Gemini kur ve giris yap
npm install -g @google/gemini-cli
gemini  # yonergeleri takip et

# 2. Codex kur ve giris yap
npm install -g @openai/codex
codex login

# 3. Projene git ve generator'i calistir
cd /path/to/your/project
npx claude-agents-delegation init

# 4. Projeyi Claude Code ile ac ve dene
claude  # Claude Code'u ac

# 5. Ilk komutunu yaz
# "bu projeyi analiz et c3"
\`\`\`

\`init\` komutu sana hangi araclari kullanmak istedigini, dokumantasyon seviyesini ve dili sorar. Soru sormadan varsayilanlarla kurmak icin \`--yes\` veya \`-y\` flag'ini kullan. Non-interactive ortamlarda (CI/CD) varsayilanlar otomatik kullanilir.

### Yontem B: Manuel Kopyalama

\`\`\`bash
# 1. Gemini kur ve giris yap
npm install -g @google/gemini-cli
gemini  # yonergeleri takip et

# 2. Codex kur ve giris yap
npm install -g @openai/codex
codex login

# 3. Bu boilerplate'i projene kopyala
cp CLAUDE.md /path/to/your/project/
cp -r .claude/ /path/to/your/project/

# 4. Projeyi Claude Code ile ac ve dene
cd /path/to/your/project
claude  # Claude Code'u ac

# 5. Ilk komutunu yaz
# "bu projeyi analiz et c3"
\`\`\`

Hepsi bu. Artik coklu agent yapisin hazir.

---

## 12. Sorun Giderme

### Codex agent'lari Windows'ta basarisiz oluyor

Codex CLI'nin \`read-only\` sandbox'i Windows'ta dosya okuma komutlarini (PowerShell \`Get-Content\`, \`findstr\` vb.) engelleyebilir. Basit prompt'lar calisir ama dosya analizi basarisiz olabilir.

**Cozum yollari:**
- PowerShell/cmd yerine **Git Bash** veya **WSL** kullan
- Dosya icerigini dogrudan pipe'la: \`cat dosya.js | codex exec -s read-only "Bunu analiz et"\`
- Tum Codex agent'lari basarisiz olursa Claude otomatik devralir (graceful degradation)

### Gemini bos cikti donduruyor

\`\`\`bash
# Gemini kurulu mu kontrol et
which gemini

# Auth calisiyor mu kontrol et
echo "test" | gemini -p "Reply with OK" -o text 2>&1
\`\`\`

### "Agent basarisiz oldu" mesaji

Bu normaldir. Modellerin kredi limiti veya rate limit'i dolmus olabilir. Sistem otomatik olarak bir sonraki modele gecer. Tum modeller basarisiz olursa Claude devralir.
`;

module.exports = content;
