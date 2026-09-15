const fs = require('node:fs/promises');
const { api } = require('./firebase-api.cjs');
const source = 'voetbal-app-6fa54';
const collections = ['seasons', 'competitions', 'players', 'games'];

async function main() {
  const documents = [];
  for (const collection of collections) {
    let pageToken;
    do {
      const url = new URL(
        `https://firestore.googleapis.com/v1/projects/${source}/databases/(default)/documents/${collection}`,
      );
      url.searchParams.set('pageSize', '300');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const page = await api(url);
      for (const document of page.documents || []) {
        documents.push({
          path: document.name.split('/documents/')[1],
          fields: document.fields || {},
        });
      }
      pageToken = page.nextPageToken;
    } while (pageToken);
  }
  const capturedAt = new Date().toISOString();
  const file = `backups/supabase-source-${capturedAt.replace(/[:.]/g, '-')}.json`;
  await fs.mkdir('backups', { recursive: true });
  await fs.writeFile(file, JSON.stringify({ source, capturedAt, documents }, null, 2), {
    flag: 'wx',
  });
  console.log(
    JSON.stringify({
      file,
      counts: Object.fromEntries(
        collections.map((name) => [
          name,
          documents.filter((doc) => doc.path.startsWith(name + '/')).length,
        ]),
      ),
    }),
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
