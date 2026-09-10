const { chmodSync } = require('node:fs');
const { spawnSync, execFileSync } = require('node:child_process');
const current = spawnSync('git', ['config', '--get', 'core.hooksPath'], { encoding: 'utf8' });
if (current.status !== 0 && current.status !== 1)
  throw new Error('Kan Git-configuratie niet lezen.');
if (current.stdout.trim() && current.stdout.trim() !== '.githooks') {
  throw new Error(
    'Er is al een andere hooksPath ingesteld. Voeg de pre-push-controle toe aan je bestaande hooks.',
  );
}
if (process.platform !== 'win32') chmodSync('.githooks/pre-push', 0o755);
execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks']);
console.log('Productie pre-push-controle geïnstalleerd voor deze checkout.');
