const config = require('../src/environments/supabase-production.json');
const testProject = 'jfjjsvmqvpghknytydac';

function validateProductionConfig({ url, publishableKey }) {
  if (!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(url || '')) {
    throw new Error('Configureer eerst de aparte Supabase-productie-URL.');
  }
  if (url.includes(testProject)) {
    throw new Error('Productie mag niet naar het Supabase-testproject verwijzen.');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey || '')) {
    throw new Error('Gebruik uitsluitend een publieke Supabase publishable key voor productie.');
  }
  return { url, publishableKey };
}

if (require.main === module) {
  validateProductionConfig(config);
  console.log('Aparte Supabase-productieconfiguratie gecontroleerd.');
}
module.exports = { validateProductionConfig };
