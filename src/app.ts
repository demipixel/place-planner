import express from 'express';
import { getCurrentImage } from './get-image';
import path from 'path';
import http from 'http';
import https from 'https';
import fs from 'fs';

const app = express();

let cachedImage: any = null;

app.use('/image', (req, res) => {
  res.set('Content-Type', 'image/png');
  res.send(cachedImage);
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
