let renderer, viewport, websocket;

function createRenderer() {
  renderer = new PIXI.Renderer({
    backgroundColor: 0x333333,
    width: window.innerWidth,
    height: window.innerHeight,
    resolution: window.devicePixelRatio,
    antialias: true,
  });
  document.body.appendChild(renderer.view);
  renderer.view.style.position = 'fixed';
  renderer.view.style.width = '100vw';
  renderer.view.style.height = '100vh';
  renderer.view.style.top = 0;
  renderer.view.style.left = 0;
  renderer.view.style.background = 'rgba(0,0,0,.1)';
}

function start() {
  createRenderer();
  createViewport(renderer);
  createColorPicker();
  window.onresize = () => {
    renderer.resize(window.innerWidth, window.innerHeight);
    viewport.resize(window.innerWidth, window.innerHeight);
  };
  update();

  window.addEventListener('message', console.log);

  window.onbeforeunload = function () {
    return 'None of your changes will be saved unless you click the "share" button and save the URL!';
  };
}

function update() {
  // if (viewport.dirty) {
  renderer.render(viewport);
  // render gui
  //   viewport.dirty = false;
  // }
  requestAnimationFrame(() => update());
}
