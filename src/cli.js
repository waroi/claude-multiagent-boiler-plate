'use strict';

const readline = require('readline');

function ask(rl, question, options) {
  return new Promise((resolve) => {
    console.log(`  ? ${question}`);
    options.forEach((opt, i) => {
      console.log(`    (${i + 1}) ${opt.label}${opt.note ? ` — ${opt.note}` : ''}`);
    });
    process.stdout.write('  > ');

    rl.once('line', (line) => {
      const num = parseInt(line.trim(), 10);
      if (num >= 1 && num <= options.length) {
        resolve(options[num - 1].value);
      } else {
        resolve(options[0].value);
      }
    });
  });
}

async function promptUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: !!process.stdin.isTTY
  });

  const tools = await ask(rl, 'Which AI tools will you use?', [
    { label: 'Gemini only', note: 'text/data analysis', value: 'gemini' },
    { label: 'Codex only', note: 'code analysis', value: 'codex' },
    { label: 'Both', note: 'recommended', value: 'both' }
  ]);

  console.log('');

  const docs = await ask(rl, 'Include documentation files?', [
    { label: 'Minimal', note: 'config files only', value: 'minimal' },
    { label: 'Full', note: 'config + guides + usage docs', value: 'full' }
  ]);

  let lang = 'en';
  if (docs === 'full') {
    console.log('');
    lang = await ask(rl, 'Documentation language?', [
      { label: 'English', value: 'en' },
      { label: 'Turkish', value: 'tr' },
      { label: 'Both', value: 'both' }
    ]);
  }

  rl.close();

  return { tools, docs, lang };
}

function defaultAnswers() {
  return { tools: 'both', docs: 'full', lang: 'en' };
}

module.exports = { promptUser, defaultAnswers };
