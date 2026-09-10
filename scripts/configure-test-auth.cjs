const { api } = require('./firebase-api.cjs');
async function main() {
  const url =
    'https://identitytoolkit.googleapis.com/admin/v2/projects/voetbal-app-6fa54-test/config';
  const config = await api(url);
  const authorizedDomains = [
    ...new Set([
      ...(config.authorizedDomains || []),
      'localhost',
      '127.0.0.1',
      'voetbal-app-6fa54-test.firebaseapp.com',
      'voetbal-app-6fa54-test.web.app',
    ]),
  ];
  await api(`${url}?updateMask=authorizedDomains`, 'PATCH', { authorizedDomains });
  console.log('Local development and test hosting domains configured in test project only.');
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
