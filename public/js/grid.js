const HEIGHT = 2000;
const WIDTH = 2000;
const PIXEL_SIZE = 10;

const IMG_SIZE = 1000;

class Grid {
  constructor() {
    this.editing = false;
    if (!window.location.hash && !window.location.search) {
      this.startEditing();
    }
    this.drawGrid = [];
    this.actualGrid = [];
    this.hoverPos = { x: 0, y: 0 };

    viewport.sortableChildren = true;

    this.container = new PIXI.Container();
    this.container.zIndex = 10;

    this.coordsDom = document.getElementById('coords');

    const onButtonDown = this.onButtonDown.bind(this);
    const onButtonUp = this.onButtonUp.bind(this);
    const onButtonMove = this.onButtonMove.bind(this);

    viewport
      .on('mousedown', onButtonDown)
      .on('mouseup', onButtonUp)
      .on('mousemove', onButtonMove)
      .on('mouseupoutside', onButtonUp)
      .on('touchstart', onButtonDown)
      .on('touchend', onButtonUp)
      .on('touchendoutside', onButtonUp)
      .on('touchmove', onButtonMove);

    this.container.interactive = true;

    viewport.addChild(this.container);

    for (let x = 0; x < WIDTH; x++) {
      this.drawGrid[x] = [];
      this.actualGrid[x] = [];
      for (let y = 0; y < HEIGHT; y++) {
        this.drawGrid[x][y] = null;
        this.actualGrid[x][y] = null;
      }
    }

    this.sprites = [];
    for (let i = 0; i < 4; i++) {
      const sprite = new PIXI.Sprite();
      this.sprites.push(sprite);
      sprite.width = IMG_SIZE * PIXEL_SIZE;
      sprite.height = IMG_SIZE * PIXEL_SIZE;
      sprite.x = (i % 2) * IMG_SIZE * PIXEL_SIZE;
      sprite.y = Math.floor(i / 2) * IMG_SIZE * PIXEL_SIZE;
      sprite.zIndex = -1;
      sprite.alpha = 0.15;
      viewport.addChild(sprite);
    }

    this.refreshRealImage(() => this.loadBuild(), true);
  }

  refreshRealImage(cb, isFirstLoad = false) {
    let loadCount = 0;
    for (let image = 0; image < 4; image++) {
      PIXI.Texture.fromURL('/image?i=' + image + '&r=' + Math.random())
        .then((texture) => {
          this.sprites[image].texture = texture;
          this.sprites[image].texture.baseTexture.scaleMode =
            PIXI.SCALE_MODES.NEAREST;

          let canvas = document.createElement('CANVAS');
          canvas.width = IMG_SIZE * PIXEL_SIZE;
          canvas.height = IMG_SIZE * PIXEL_SIZE;
          let ctx = canvas.getContext('2d');

          ctx.drawImage(texture.baseTexture.resource.source, 0, 0);

          let pixel = ctx.getImageData(0, 0, 1000, 1000);
          for (let i = 0; i < pixel.data.length; i += 4) {
            let x = (Math.floor(i / 4) % 1000) + (image % 2) * 1000;
            let y = Math.floor(i / 4 / 1000) + Math.floor(image / 2) * 1000;
            this.actualGrid[x][y] = COLOR_MAP_NUM.indexOf(
              rgbToNum({
                r: pixel.data[i],
                g: pixel.data[i + 1],
                b: pixel.data[i + 2],
              }),
            );
          }

          if (this.hideRight) {
            this.toggleHideRight();
            this.toggleHideRight();
          }

          if (!this.editing && isFirstLoad) {
            this.toggleHideRight(true);
            document.getElementById('hide-right-checkbox').checked = true;
          }

          if (++loadCount === 4 && cb) {
            cb();
          }
        })
        .catch((err) => {
          alert(
            'There was an error loading the image. Please try again later :(',
          );
          console.error(err);
        });
    }
  }

  test() {
    const image = new Image();
    image.src = '/img/star-wars.png';
    let canvas = document.createElement('CANVAS');
    canvas.width = WIDTH * PIXEL_SIZE;
    canvas.height = HEIGHT * PIXEL_SIZE;
    let ctx = canvas.getContext('2d');

    image.onload = () => {
      ctx.drawImage(image, 0, 0);

      let pixel = ctx.getImageData(0, 0, 100, 145);

      let str = '';
      for (let i = 0; i < pixel.data.length; i += 4) {
        let x = (Math.floor(i / 4) % 100) + 571;
        let y = Math.floor(i / 4 / 100) + 699;
        //Find closet color
        const color = COLOR_MAP.reduce(
          (acc, curr, index) => {
            if (index === COLOR_MAP.length - 1) {
              return acc;
            }
            const distance = Math.sqrt(
              Math.pow(Math.abs(curr.r - pixel.data[i]), 2) +
                Math.pow(Math.abs(curr.g - pixel.data[i + 1]), 2) +
                Math.pow(Math.abs(curr.b - pixel.data[i + 2]), 2),
            );
            if (distance < acc.distance) {
              return {
                index,
                distance,
              };
            }
            return acc;
          },
          { index: null, distance: Infinity },
        ).index;
        str += 'grid.setSpriteColor(' + x + ',' + y + ',' + color + ')\n';
      }

      console.log(str);
    };
  }

  openLink(x, y) {
    if (this.drawGrid[x][y]) {
      // https://new.reddit.com/r/place/?cx=696&cy=657&px=65
      window.open(`https://new.reddit.com/r/place/?cx=${x}&cy=${y}&px=12`);
    }
  }

  setSpriteColor(x, y, color) {
    if (!this.drawGrid[x][y]) {
      const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      sprite.width = 10;
      sprite.height = 10;
      sprite.x = x * PIXEL_SIZE;
      sprite.y = y * PIXEL_SIZE;
      this.container.addChild(sprite);
      this.drawGrid[x][y] = sprite;
    }
    this.drawGrid[x][y].tint = COLOR_MAP_NUM[color];
  }

  deleteSprite(x, y) {
    this.container.removeChild(this.drawGrid[x][y]);
    this.drawGrid[x][y] = null;
  }

  onButtonDown(event) {
    if (viewport.moving) {
      this.cancelClick = true;
    }

    this.hadMouseDown = true;

    this.startClickPoint = viewport.toWorld(
      event.data.global.x,
      event.data.global.y,
    );

    if (
      !this.editing &&
      !this.isCopyKeyDown(event) &&
      !event.data.originalEvent.shiftKey
    ) {
      this.doClickAction(event);
    }
  }

  onButtonUp(event) {
    if (this.isCopyKeyDown(event) || !this.editing) {
      this.doClickAction(event, true);
    }
    this.hadMouseDown = false;
  }

  doClickAction(event, isUp = false) {
    if (this.cancelClick && (!this.editing || !this.isCopyKeyDown(event))) {
      this.cancelClick = false;
      return;
    }

    if (this.isEventInGUI(event)) {
      return;
    }

    const point = viewport.toWorld(event.data.global.x, event.data.global.y);
    const x = Math.floor(point.x / 10);
    const y = Math.floor(point.y / 10);

    if (this.startClickPoint && this.isCopyKeyDown(event)) {
      const startX = Math.floor(this.startClickPoint.x / 10);
      const startY = Math.floor(this.startClickPoint.y / 10);
      this.makeDrawn(startX, startY, x, y);
      return;
    }

    this.startClickPoint = null;

    if (!this.hadMouseDown || x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
      return;
    }

    if (this.editing) {
      if (selectedColor === COLOR_MAP.length - 1) {
        this.deleteSprite(x, y);
      } else {
        this.setSpriteColor(x, y, selectedColor);
      }
    } else if (isUp) {
      setTimeout(() => this.openLink(x, y), 50);
    }
  }

  isEventInGUI(event) {
    const colorPicker = document.getElementById('color-picker');
    const instruct = document.getElementById('instruct');

    return (
      (event.data.global.x <= colorPicker.clientWidth + 10 &&
        event.data.global.y <= colorPicker.clientHeight + 10) ||
      (event.data.global.x <= instruct.clientWidth + 10 &&
        event.data.global.y >= window.innerHeight - instruct.clientHeight - 10)
    );
  }

  onButtonMove(event) {
    this.cancelClick = viewport.moving;

    // check if space or shift keys are down
    const isShiftDown = event.data.originalEvent.shiftKey;
    const isClicking = event.data.originalEvent.buttons === 1;

    if (
      this.editing &&
      !isShiftDown &&
      !this.isCopyKeyDown(event) &&
      isClicking
    ) {
      this.doClickAction(event);
    }

    const point = viewport.toWorld(event.data.global.x, event.data.global.y);
    const x = Math.floor(point.x / 10);
    const y = Math.floor(point.y / 10);

    this.coordsDom.innerText = x + ' , ' + y;

    // Hover animation when in viewing mode
    if (!this.editing) {
      if (this.hoverPos.x !== x || this.hoverPos.y !== y) {
        const oldSprite = this.drawGrid[this.hoverPos.x]?.[this.hoverPos.y];
        if (oldSprite) {
          oldSprite.alpha = 1.0;
        }

        this.hoverPos.x = x;
        this.hoverPos.y = y;
        const newSprite = this.drawGrid[this.hoverPos.x]?.[this.hoverPos.y];
        if (newSprite) {
          newSprite.alpha = 0.5;
        }
      }
    }
  }

  makeDrawn(startX, startY, endX, endY) {
    for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
      for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
        if (this.actualGrid?.[x]?.[y] !== undefined) {
          this.setSpriteColor(x, y, this.actualGrid[x][y]);
        }
      }
    }
  }

  isCopyKeyDown(event) {
    // Option key
    return event.data.originalEvent.altKey;
  }

  getBase64OfDrawn() {
    var arr = [];
    let groupPos = null;
    let groupColors = [];

    const pushGroup = () => {
      const lowerX = groupPos.x % 256;
      const lowerY = groupPos.y % 256;
      const upperX = Math.floor(groupPos.x / 256);
      const upperY = Math.floor(groupPos.y / 256);
      const upper = upperX * 16 + upperY;

      arr.push(lowerX, lowerY, upper, groupColors.length, ...groupColors);
    };

    for (let x = 0; x < WIDTH; x++) {
      for (let y = 0; y < HEIGHT; y++) {
        if (this.drawGrid[x][y]) {
          if (groupPos === null) {
            groupPos = { x, y };
          }
          groupColors.push(COLOR_MAP_NUM.indexOf(this.drawGrid[x][y].tint));
        } else if (groupPos) {
          pushGroup();
          groupPos = null;
          groupColors = [];
        }
      }
    }

    if (groupPos) {
      pushGroup();
    }

    var data = new Uint8Array(arr);

    var base64 = bufferToBase64(data);
    console.log('Lengths: ', arr.length, base64.length);

    return base64;
  }

  loadBuild() {
    const hash = window.location.hash.slice(1);
    if (hash.length > 1) {
      this.loadHash(hash);
      return;
    }

    // get buildId param from url
    const buildId = window.location.search.slice(1);
    if (!buildId) {
      return;
    }

    fetch('/build/' + buildId)
      .then((res) => res.text())
      .then((text) => this.loadHash(text))
      .then(() => {
        this.toggleHideRight(true);
        document.getElementById('hide-right-checkbox').checked = true;
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to load build');
      });
  }

  loadHash(hash) {
    const data = base64ToBuffer(hash);
    const arr = Array.from(data);

    if (arr.length === 0) {
      return;
    }

    let sumX = 0;
    let sumY = 0;
    let count = 0;

    for (let i = 0; i < arr.length; i += 4) {
      const lowerX = arr[i];
      const lowerY = arr[i + 1];
      const upper = arr[i + 2];

      const x = lowerX + Math.floor(upper / 16) * 256;
      const y = lowerY + (upper % 16) * 256;

      const numColors = arr[i + 3];
      const colors = arr.slice(i + 4, i + 4 + numColors);
      i += numColors;

      if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
        continue;
      }

      for (let j = 0; j < numColors; j++) {
        if (colors[j] >= 0 && colors[j] < COLOR_MAP.length - 1) {
          const miniX = x + Math.floor((y + j) / HEIGHT);
          const miniY = (y + j) % HEIGHT;
          this.setSpriteColor(miniX, miniY, colors[j]);

          sumX += miniX;
          sumY += miniY;
          count++;
        }
      }
    }

    const centerX = Math.floor(sumX / count);
    const centerY = Math.floor(sumY / count);

    viewport.animate({
      position: new PIXI.Point(centerX * PIXEL_SIZE, centerY * PIXEL_SIZE),
      ease: 'easeInOutCubic',
      duration: 3000,
      scale: 1,
    });
  }

  share() {
    (this.editing
      ? fetch('/build', {
          method: 'PUT',
          body: JSON.stringify({ build: this.getBase64OfDrawn() }),
          headers: {
            'Content-Type': 'application/json',
          },
        }).then((res) => res.text())
      : // If we're viewing, it's the same as the URL
        Promise.resolve(window.location.search.slice(1))
    ).then((buildId) => {
      const url =
        window.location.origin + window.location.pathname + '?' + buildId;

      window.prompt(
        "Copy this URL and share it with others! They'll be able to view what you drew and start contributing to /r/place!",
        url,
      );
    });
  }

  clear(withPrompt) {
    if (
      withPrompt &&
      !window.confirm('Are you sure you want to clear everything?')
    ) {
      return;
    }

    for (let x = 0; x < WIDTH; x++) {
      for (let y = 0; y < HEIGHT; y++) {
        if (this.drawGrid[x][y]) {
          this.drawGrid[x][y].destroy();
          this.drawGrid[x][y] = null;
        }
      }
    }
  }

  startEditing() {
    this.editing = true;
    document.getElementById('edit-button').style.display = 'none';
    document.getElementById('clear-button').style.display = '';

    viewport.drag({
      keyToPress: ['ShiftLeft', 'ShiftRight'],
    });
  }

  setOpacity(opacity) {
    for (const sprite of this.sprites) {
      sprite.alpha = opacity;
    }
  }

  setBuildOpacity(opacity) {
    this.container.alpha = opacity;
  }

  toggleHideRight(force) {
    this.hideRight = force === undefined ? !this.hideRight : force;

    const domText = document.getElementById('hide-right-text');

    domText.style.color = this.hideRight ? 'red' : '';

    for (let x = 0; x < WIDTH; x++) {
      for (let y = 0; y < HEIGHT; y++) {
        if (this.hideRight) {
          if (
            this.drawGrid[x][y] &&
            COLOR_MAP_NUM.indexOf(this.drawGrid[x][y].tint) ===
              this.actualGrid[x][y]
          ) {
            this.drawGrid[x][y].visible = false;
          }
        } else {
          if (this.drawGrid[x][y]) {
            this.drawGrid[x][y].visible = true;
          }
        }
      }
    }
  }
}
