const fs = require('node:fs');
const crypto = require('node:crypto');
function decode(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
  if ('mapValue' in value)
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decode(v)]),
    );
  throw new Error('Unsupported Firestore field');
}
const file = process.argv[2];
const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
if (backup.source !== 'voetbal-app-6fa54') throw new Error('Unexpected source');
const tables = Object.fromEntries(
  ['seasons', 'competitions', 'players', 'games'].map((t) => [t, []]),
);
for (const document of backup.documents) {
  const [table, id, ...rest] = document.path.split('/');
  if (!tables[table] || rest.length) throw new Error('Unexpected document');
  tables[table].push({
    ...Object.fromEntries(Object.entries(document.fields).map(([k, v]) => [k, decode(v)])),
    id,
  });
}
const allowed = {
  seasons: ['id', 'name'],
  competitions: ['id', 'seasonId', 'type'],
  players: ['id', 'name', 'number', 'seasonId', 'competitionIds'],
  games: [
    'id',
    'opponent',
    'date',
    'scoreTeam',
    'scoreOpponent',
    'league',
    'players',
    'events',
    'seasonId',
    'competitionId',
  ],
};
for (const [table, rows] of Object.entries(tables))
  for (const row of rows) {
    if (Object.keys(row).some((k) => !allowed[table].includes(k)))
      throw new Error('Unmapped field in ' + table);
  }
const ids = tables.players.map((p) => p.id);
const index = (id) => {
  const i = ids.indexOf(id);
  if (i < 0) throw new Error('Unknown player ' + id);
  return i;
};
const payload = {
  s: tables.seasons.map((s) => [s.id, s.name]),
  c: tables.competitions.map((c) => [c.id, c.seasonId, c.type]),
  p: tables.players.map((p) => [
    p.id,
    p.name,
    p.number,
    p.seasonId ?? null,
    p.competitionIds ?? null,
  ]),
  g: tables.games.map((g) => {
    if (g.seasonId || g.competitionId) throw new Error('This compact import expects legacy games');
    return [
      g.id,
      g.opponent,
      g.date,
      g.scoreTeam ?? null,
      g.scoreOpponent ?? null,
      g.league,
      (g.players ?? []).map(index),
      (g.events ?? []).map((e) => {
        if (
          Object.keys(e).some((k) => !['playerId', 'type'].includes(k)) ||
          !['goal', 'assist'].includes(e.type)
        )
          throw new Error('Unexpected event');
        return [index(e.playerId), e.type === 'goal' ? 0 : 1];
      }),
    ];
  }),
};
const packed = JSON.stringify(payload);
if (packed.includes('$import$')) throw new Error('Source contains SQL payload delimiter');
const digest = crypto.createHash('sha256').update(packed).digest('hex');
fs.writeFileSync(file.replace('.json', '.compact.json'), packed);
const template = fs.readFileSync(
  require('node:path').join(__dirname, 'supabase-import-template.sql'),
  'utf8',
);
const md5 = crypto.createHash('md5').update(packed).digest('hex');
fs.writeFileSync(
  file.replace('.json', '.sql'),
  template.replace('__PAYLOAD__', () => packed).replace('__MD5__', md5),
);
console.log(
  JSON.stringify({
    counts: Object.fromEntries(Object.entries(tables).map(([t, r]) => [t, r.length])),
    legacyPlayers: tables.players.filter((p) => !p.seasonId || p.seasonId === 'previous-season')
      .length,
    goals: tables.games.flatMap((g) => g.events || []).filter((e) => e.type === 'goal').length,
    assists: tables.games.flatMap((g) => g.events || []).filter((e) => e.type === 'assist').length,
    bytes: packed.length,
    sha256: digest,
    md5,
  }),
);
console.log(packed);
