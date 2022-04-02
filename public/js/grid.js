const HEIGHT = 1000;
const WIDTH = 1000;
const SIZE = 10;

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

    this.sprite = new PIXI.Sprite();
    this.sprite.width = WIDTH * SIZE;
    this.sprite.height = HEIGHT * SIZE;
    this.sprite.x = 0;
    this.sprite.y = 0;
    this.sprite.zIndex = -1;
    this.sprite.alpha = 0.25;
    viewport.addChild(this.sprite);

    this.refreshRealImage(() => this.loadBuild(), true);
  }

  refreshRealImage(cb, isFirstLoad = false) {
    PIXI.Texture.fromURL('/image?r=' + Math.random())
      .then((texture) => {
        this.sprite.texture = texture;
        this.sprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        if (cb) {
          cb();
        }
        let canvas = document.createElement('CANVAS');
        canvas.width = WIDTH * SIZE;
        canvas.height = HEIGHT * SIZE;
        let ctx = canvas.getContext('2d');

        ctx.drawImage(texture.baseTexture.resource.source, 0, 0);

        let pixel = ctx.getImageData(0, 0, 1000, 1000);
        for (let i = 0; i < pixel.data.length; i += 4) {
          let x = Math.floor(i / 4) % 1000;
          let y = Math.floor(i / 4 / 1000);
          this.actualGrid[x][y] = COLOR_MAP_NUM.indexOf(
            rgbToNum({
              r: pixel.data[i],
              g: pixel.data[i + 1],
              b: pixel.data[i + 2],
            }),
          );
        }

        // if (!this.editing && isFirstLoad) {
        //   this.toggleHideRight(true);
        //   document.getElementById('hide-right-checkbox').checked = true;
        // }
      })
      .catch((err) => {
        alert(
          'There was an error loading the image. Please try again later :(',
        );
        console.error(err);
      });
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
      sprite.x = x * SIZE;
      sprite.y = y * SIZE;
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

    this.startClickPoint = viewport.toWorld(
      event.data.global.x,
      event.data.global.y,
    );
  }

  onButtonUp(event) {
    if (this.cancelClick && !this.isCopyKeyDown(event)) {
      this.cancelClick = false;
      if (this.editing) {
        return;
      }
    }

    const colorPicker = document.getElementById('color-picker');
    const instruct = document.getElementById('instruct');
    if (
      (event.data.global.x <= colorPicker.clientWidth + 10 &&
        event.data.global.y <= colorPicker.clientHeight + 10) ||
      (event.data.global.x <= instruct.clientWidth + 10 &&
        event.data.global.y >= window.innerHeight - instruct.clientHeight - 10)
    ) {
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

    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
      return;
    }

    if (this.editing) {
      if (selectedColor === COLOR_MAP.length - 1) {
        this.deleteSprite(x, y);
      } else {
        this.setSpriteColor(x, y, selectedColor);
      }
    } else {
      this.openLink(x, y);
    }
  }

  onButtonMove(event) {
    if (viewport.moving) {
      this.cancelClick = true;
    }

    // check if space or shift keys are down
    const isShiftDown = event.data.originalEvent.shiftKey;
    const isClicking = event.data.originalEvent.buttons === 1;

    if (
      this.editing &&
      !isShiftDown &&
      !this.isCopyKeyDown(event) &&
      isClicking
    ) {
      this.onButtonUp(event);
    }

    if (!this.editing) {
      const point = viewport.toWorld(event.data.global.x, event.data.global.y);
      const x = Math.floor(point.x / 10);
      const y = Math.floor(point.y / 10);

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
      // .then(() => {
      //   this.toggleHideRight(true);
      //   document.getElementById('hide-right-checkbox').checked = true;
      // })
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

    let topLeftX = null;
    let topLeftY = null;

    for (let i = 0; i < arr.length; i += 4) {
      const lowerX = arr[i];
      const lowerY = arr[i + 1];
      const upper = arr[i + 2];

      const x = lowerX + Math.floor(upper / 16) * 256;
      const y = lowerY + (upper % 16) * 256;

      const numColors = arr[i + 3];
      const colors = arr.slice(i + 4, i + 4 + numColors);
      i += numColors;

      if (topLeftX === null) {
        topLeftX = x;
        topLeftY = y;
      }

      if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
        continue;
      }

      for (let j = 0; j < numColors; j++) {
        if (colors[j] >= 0 && colors[j] < COLOR_MAP.length - 1) {
          const miniX = x + Math.floor((y + j) / HEIGHT);
          const miniY = (y + j) % HEIGHT;
          this.setSpriteColor(miniX, miniY, colors[j]);
        }
      }
    }

    viewport.animate({
      position: new PIXI.Point(topLeftX * SIZE, topLeftY * SIZE),
      ease: 'easeInOutCubic',
      duration: 3000,
      scale: 1,
    });
  }

  share() {
    fetch('/build', {
      method: 'PUT',
      body: JSON.stringify({ build: this.getBase64OfDrawn() }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.text())
      .then((buildId) => {
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
    this.sprite.alpha = opacity;
  }

  toggleHideRight(force) {
    this.hideRight = force === undefined ? !this.hideRight : force;

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
