const fs = require('node:fs');
const path = require('node:path');
const mode = process.argv[2];
if (!['production', 'test'].includes(mode)) throw new Error('Expected production or test.');
const root = 'dist/voetbal-app/browser';
const code = fs
  .readdirSync(root)
  .filter((file) => file.endsWith('.js'))
  .map((file) => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');
const required =
  mode === 'production'
    ? '1:847097436854:web:4ffef09f7b17be3165e417'
    : '1:381274041149:web:0d8856660fca146344b354';
const forbidden =
  mode === 'production'
    ? '1:381274041149:web:0d8856660fca146344b354'
    : '1:847097436854:web:4ffef09f7b17be3165e417';
if (!code.includes(required) || code.includes(forbidden))
  throw new Error(`Build configuration does not match ${mode}. Deployment stopped.`);
console.log(`Verified ${mode} build: only the intended Firebase app configuration is bundled.`);
