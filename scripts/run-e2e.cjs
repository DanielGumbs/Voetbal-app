const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const env = { ...process.env };
const javaRoot = path.resolve('.tools/java21');
if (!env.JAVA_HOME && fs.existsSync(javaRoot)) {
  const folder = fs
    .readdirSync(javaRoot)
    .find((name) =>
      fs.existsSync(
        path.join(javaRoot, name, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'),
      ),
    );
  if (folder) env.JAVA_HOME = path.join(javaRoot, folder);
}
const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'PATH';
env[pathKey] = [
  ...(env.JAVA_HOME ? [path.join(env.JAVA_HOME, 'bin')] : []),
  path.dirname(process.execPath),
  env[pathKey] || '',
].join(path.delimiter);
if (spawnSync('java', ['-version'], { env, stdio: 'ignore' }).status !== 0) {
  console.error(
    'Java 21 is required for Firebase emulators. Set JAVA_HOME (see docs/release-1.md).',
  );
  process.exit(1);
}
const firebaseCli = require.resolve('firebase-tools/lib/bin/firebase');
const result = spawnSync(
  process.execPath,
  [
    firebaseCli,
    'emulators:exec',
    '--config',
    'firebase.e2e.json',
    '--project',
    'demo-voetbal-e2e',
    '--only',
    'auth,firestore',
    '--non-interactive',
    'npm run e2e:inside',
  ],
  { env, stdio: 'inherit' },
);
process.exit(result.status ?? 1);
