const { execFileSync, spawnSync } = require('node:child_process');

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
function runNpm(script) {
  // Only our fixed npm script names are accepted; no shell-supplied arguments.
  if (!/^[a-z:-]+$/.test(script)) throw new Error('Invalid npm script.');
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) throw new Error(`${script} is mislukt; productie is geblokkeerd.`);
}
module.exports = { git, runNpm };
