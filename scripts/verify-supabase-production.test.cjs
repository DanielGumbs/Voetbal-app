const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateProductionConfig } = require('./verify-supabase-production.cjs');

const config = {
  url: 'https://abcdefghijklmnopqrst.supabase.co',
  publishableKey: 'sb_publishable_unit_test_only',
};
test('accepts a separate production project with a public client key', () => {
  assert.deepEqual(validateProductionConfig(config), config);
});
test('refuses missing or malformed project settings', () => {
  for (const url of ['', 'http://abcdefghijklmnopqrst.supabase.co', config.url + '/unexpected']) {
    assert.throws(() => validateProductionConfig({ ...config, url }));
  }
});
test('refuses to connect production to the test database', () => {
  assert.throws(() =>
    validateProductionConfig({ ...config, url: 'https://jfjjsvmqvpghknytydac.supabase.co' }),
  );
});
test('rejects secret keys and missing public keys', () => {
  for (const publishableKey of ['', 'sb_secret_test', 'eyJhbGciOiJIUzI1NiJ9']) {
    assert.throws(() => validateProductionConfig({ ...config, publishableKey }));
  }
});
