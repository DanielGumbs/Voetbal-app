const fs = require('node:fs/promises');
const { api } = require('./firebase-api.cjs');
const source = 'voetbal-app-6fa54';
const target = 'voetbal-app-6fa54-test';
const base = (project) =>
  `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;

async function readAll(project) {
  const documents = [];
  async function walk(parent = '') {
    let token;
    do {
      const page = await api(`${base(project)}${parent}:listCollectionIds`, 'POST', {
        pageSize: 100,
        ...(token ? { pageToken: token } : {}),
      });
      for (const collection of page.collectionIds || []) {
        let pageToken;
        do {
          const url = new URL(`${base(project)}${parent}/${collection}`);
          url.searchParams.set('pageSize', '300');
          url.searchParams.set('showMissing', 'true');
          if (pageToken) url.searchParams.set('pageToken', pageToken);
          const result = await api(url);
          for (const document of result.documents || []) {
            const path = document.name.split('/documents/')[1];
            if (document.createTime) documents.push({ path, fields: document.fields || {} });
            await walk(`/${path}`);
          }
          pageToken = result.nextPageToken;
        } while (pageToken);
      }
      token = page.nextPageToken;
    } while (token);
  }
  await walk();
  return documents.sort((a, b) => a.path.localeCompare(b.path));
}

async function main() {
  const mode = process.argv[2];
  if (!['backup', 'copy', 'verify'].includes(mode)) throw new Error('Use backup, copy or verify.');
  if (source === target) throw new Error('Source and target must differ.');
  if (mode === 'backup') {
    const documents = await readAll(source);
    await fs.mkdir('backups', { recursive: true });
    const file = `backups/production-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    await fs.writeFile(
      file,
      JSON.stringify({ source, capturedAt: new Date().toISOString(), documents }, null, 2),
      { flag: 'wx' },
    );
    console.log(`Backup: ${file}; ${documents.length} documents. Production was only read.`);
    return;
  }
  const backup = JSON.parse(await fs.readFile(process.argv[3], 'utf8'));
  if (backup.source !== source) throw new Error('Unexpected backup source.');
  const expected = backup.documents;
  if (mode === 'copy') {
    if ((await readAll(target)).length)
      throw new Error('Test database must be empty. Refusing to overwrite existing data.');
    for (let offset = 0; offset < expected.length; offset += 200) {
      await api(`${base(target)}:commit`, 'POST', {
        writes: expected.slice(offset, offset + 200).map((document) => ({
          update: {
            name: `projects/${target}/databases/(default)/documents/${document.path}`,
            fields: document.fields,
          },
          currentDocument: { exists: false },
        })),
      });
    }
  }
  const actual = await readAll(target);
  const canonical = (value) =>
    JSON.stringify(value, function (key, val) {
      if (val && typeof val === 'object' && !Array.isArray(val))
        return Object.fromEntries(Object.entries(val).sort(([a], [b]) => a.localeCompare(b)));
      return val;
    });
  if (canonical(expected) !== canonical(actual)) throw new Error('Copy verification failed.');
  console.log(
    `Verified ${actual.length} documents including IDs and fields in the separate test project.`,
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
