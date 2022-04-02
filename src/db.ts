import fs from 'fs';

import { generateId } from './util';

type Data = {
  builds: { [buildId: string]: string };
};

const db = JSON.parse(
  fs.readFileSync('./data.json', 'utf8') || '{"builds":{}}',
) as Data;

let saveInProgress = false;
async function saveDb() {
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

export async function saveNewBuild(str: string) {
  if (str.length > 50_000) {
    throw new Error('String too long');
  }

  let id;
  do {
    id = await generateId();
  } while (db.builds[id]);

  db.builds[id] = str;

  requestDbSave();
  return id;
}

export async function getBuildById(id: string) {
  if (id.startsWith('_')) {
    throw new Error('Invalid id');
  }

  return db.builds[id.toUpperCase()];
}
