import fs from 'fs';

import { generateId } from './util';

type Data = {
  builds: {
    [buildId: string]: {
      createdAt: number;
      lastViewedAt: number;
      data: string;
      ip: string;
      views: number;
    };
  };
};

const db = JSON.parse(
  fs.readFileSync('./data.json', 'utf8') || '{"builds":{}}',
) as Data;

let lastDbSaveAt = 0;
let saveInProgress = false;
async function saveDb() {
  lastDbSaveAt = Date.now();

  if (saveInProgress) {
    setTimeout(saveDb, 3000);
    return;
  }

  saveInProgress = true;
  return new Promise<void>((resolve, reject) => {
    fs.writeFile('./data.json', JSON.stringify(db), (err: any) => {
      saveInProgress = false;
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function requestDbSave() {
  saveDb().catch(console.error);
}

export async function saveNewBuild(str: string, ip: string) {
  if (str.length > 50_000) {
    throw new Error('String too long');
  }

  let id;
  do {
    id = await generateId();
  } while (db.builds[id]);

  db.builds[id] = {
    createdAt: Date.now(),
    lastViewedAt: Date.now(),
    data: str,
    ip,
    views: 0,
  };

  requestDbSave();
  return id;
}

export async function getBuildById(id: string) {
  if (id.startsWith('_')) {
    throw new Error('Invalid id');
  }

  id = id.toUpperCase();
  if (db.builds[id]) {
    db.builds[id].views++;
    db.builds[id].lastViewedAt = Date.now();

    if (Date.now() - lastDbSaveAt > 15_000) {
      requestDbSave();
    }

    return db.builds[id].data;
  } else {
    return null;
  }
}
