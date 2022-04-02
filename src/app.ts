import { json } from 'body-parser';
import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

import { getBuildById, saveNewBuild } from './db';
import { getCurrentImage } from './get-image';

const app = express();

let cachedImage: any = null;

app.use(
  json({
    limit: '50kb',
  }),
);

app.use('/image', (req, res) => {
  res.set('Content-Type', 'image/png');
  res.send(cachedImage);
});

app.put('/build', (req, res) => {
  saveNewBuild(req.body.build)
    .then((buildId) => {
      res.send(buildId);
    })
    .catch((err) => {
      console.error(err);
      res.send(500);
    });
});

app.get('/build/:buildId', (req, res) => {
  getBuildById(req.params.buildId)
    .then((build) => {
      res.send(build);
    })
    .catch((err) => {
      console.error(err);
      res.send(500);
    });
});

app.use(express.static(path.join(__dirname, '../public')));

const PORT = process.env.NODE_ENV != 'production' ? 2995 : 443;

const certPath = '/etc/letsencrypt/live/plan.place/fullchain.pem';
const keyPath = '/etc/letsencrypt/live/plan.place/privkey.pem';
const server = (
  process.env.NODE_ENV == 'production'
    ? https.createServer(
        {
          cert: fs.existsSync(certPath) ? fs.readFileSync(certPath) : undefined,
          key: fs.existsSync(keyPath) ? fs.readFileSync(keyPath) : undefined,
        },
        app,
      )
    : http.createServer(app)
).listen(PORT, () => {
  console.log('Server live on port ' + PORT);
});

function requireHTTPS(req: any, res: any, next: any) {
  if (!req.secure && process.env.NODE_ENV == 'production') {
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}

if (process.env.NODE_ENV == 'production') {
  app.listen(80);
  app.use(requireHTTPS);
}

function refreshImageCache() {
  getCurrentImage()
    .then((image) => {
      cachedImage = image;
    })
    .catch(console.error);
}

refreshImageCache();
setInterval(refreshImageCache, 20 * 1000);
