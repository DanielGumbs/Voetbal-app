const fs = require('node:fs');
const path = require('node:path');
const mode = process.argv[2];
if (!['production', 'test'].includes(mode)) throw new Error('Expected production or test.');
const root = process.argv[3] || 'dist/voetbal-app/browser';
const code = fs
  .readdirSync(root)
  .filter((file) => file.endsWith('.js'))
  .map((file) => fs.readFileSync(path.join(root, file), 'utf8'))
  .join('\n');
const firebaseProduction = '1:847097436854:web:4ffef09f7b17be3165e417';
const firebaseTest = '1:381274041149:web:0d8856660fca146344b354';
const supabase = 'Configureer de Supabase-project-URL';
const matches =
  mode === 'production'
    ? code.includes(firebaseProduction) && !code.includes(supabase)
    : code.includes(supabase) &&
      !code.includes(firebaseProduction) &&
      !code.includes('firestore.googleapis.com');
if (!matches || code.includes(firebaseTest))
  throw new Error(`Build configuration does not match ${mode}. Deployment stopped.`);
console.log(`Verified ${mode} build: ${mode === 'production' ? 'Firebase' : 'Supabase'} backend.`);
