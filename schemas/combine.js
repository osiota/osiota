#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function readJson(filePath) {
  const txt = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(txt);
}

(async () => {
  try {
    const schemasDir = path.dirname(__filename);
    process.chdir(schemasDir);

    const files = (await fs.promises.readdir(schemasDir))
      .filter(f => f.endsWith('.json'))
      .filter(f => f !== 'all.json' && f !== 'all-map.json');

    // Generate all.json
    // with {"$defs": <merged>}
    const defs = {};
    for (const f of files) {
      const name = path.basename(f, '.json');
      const obj = await readJson(path.join(schemasDir, f));
      defs[name] = obj;
    }

    const allJson = { $defs: defs };
    await fs.promises.writeFile(
      path.join(schemasDir, 'all.json'),
      JSON.stringify(allJson, null, 2),
      'utf8'
    );

    // Generate all-map.json
    const map = {};
    for (const f of files) {
      const key = `https://osiota.net/schemas/${f}`;
      const obj = await readJson(path.join(schemasDir, f));
      map[key] = obj;
    }

    await fs.promises.writeFile(
      path.join(schemasDir, 'all-map.json'),
      JSON.stringify(map, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
