const { getGlobalDefaultAccount, getAccessToken } = require('firebase-tools/lib/auth');

let token;
async function api(url, method = 'GET', body) {
  if (!token) {
    const account = getGlobalDefaultAccount();
    if (!account) throw new Error('Run npm run firebase:login first.');
    token = (
      await getAccessToken(account.tokens.refresh_token, [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/firebase',
      ])
    ).access_token;
  }
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      `${method} ${new URL(url).pathname}: ${response.status} ${result.error?.message || 'Request failed'}`,
    );
  return result;
}
module.exports = { api };
