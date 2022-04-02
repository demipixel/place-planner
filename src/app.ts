import express from 'express';
import { getCurrentImage } from './get-image';
import path from 'path';

const app = express();

let cachedImage: any = null;

app.use('/image', (req, res) => {
  res.set('Content-Type', 'image/png');
  res.send(cachedImage);
});

app.use(express.static(path.join(__dirname, '../public')));

app.listen(2995, () => {
  console.log('Listening on port 2995');
});

function refreshImageCache() {
  getCurrentImage()
    .then((image) => {
      cachedImage = image;
    })
    .catch(console.error);
}

refreshImageCache();
setInterval(refreshImageCache, 20 * 1000);
