function createViewport(renderer) {
  // create the viewport
  // viewport = new Viewport({    // use with modern build toolchain
  viewport = new pixi_viewport.Viewport({
    // screenWidth: window.innerWidth, // screen width used by viewport (eg, size of canvas)
    // screenHeight: window.innerHeight, // screen height used by viewport (eg, size of canvas)
    // worldWidth: WORLD_WIDTH, // world width used by viewport (automatically calculated based on container width)
    // worldHeight: WORLD_HEIGHT, // world height used by viewport (automatically calculated based on container height)
    threshold: 2, // number of pixels to move to trigger an input event (e.g., drag, pinch) or disable a clicked event
    passiveWheel: false, // whether the 'wheel' event is set to passive (note: if false, e.preventDefault() will be called when wheel is used over the viewport)
    // stopPropagation: false,                      // whether to stopPropagation of events that impact the viewport (except wheel events, see options.passiveWheel)
    // forceHitArea: null,                          // change the default hitArea from world size to a new value
    // noTicker: false,                             // set this if you want to manually call update() function on each frame
    // ticker: PIXI.Ticker.shared,                  // use this PIXI.ticker for updates
    interaction: renderer.plugins.interaction, // InteractionManager, available from instantiated WebGLRenderer/CanvasRenderer.plugins.interaction - used to calculate pointer position relative to canvas location on screen
    // divWheel: null,                              // div to attach the wheel event (uses document.body as default)
    // disableOnContextMenu: false,                 // remove oncontextmenu=() => {} from the divWheel element
  });

  viewport
    .drag({
      // direction: 'all',                // (x, y, or all) direction to drag
      // pressDrag: true,                 // whether click to drag is active
      // wheel: true,                     // use wheel to scroll in direction (unless wheel plugin is active)
      // wheelScroll: 1,                  // number of pixels to scroll with each wheel spin
      // reverse: false,                  // reverse the direction of the wheel scroll
      // clampWheel: false,               // clamp wheel (to avoid weird bounce with mouse wheel)
      // underflow: 'center',             // (top-left, top-center, etc.) where to place world if too small for screen
      // factor: 1,                       // factor to multiply drag to increase the speed of movement
      // mouseButtons: 'all',             // changes which mouse buttons trigger drag, use: 'all', 'left', right' 'middle', or some combination, like, 'middle-right'; you may want to set viewport.options.disableOnContextMenu if you want to use right-click dragging
      // keyToPress: ['ShiftLeft', 'ShiftRight'], // array containing https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code codes of keys that can be pressed for the drag to be triggered, e.g.: ['ShiftLeft', 'ShiftRight'}
      // ignoreKeyToPressOnTouch: false,  // ignore keyToPress for touch events
      // lineHeight: 20,                  // scaling factor for non-DOM_DELTA_PIXEL scrolling events (used for firefox mouse scrolling)
    })
    .decelerate({
      friction: 0.95, // percent to decelerate after movement
      // bounce: 0.8,                 // percent to decelerate when past boundaries (only applicable when viewport.bounce() is active)
      // minSpeed: 0.01,              // minimum velocity before stopping/reversing acceleration
    })
    .pinch({
      // noDrag: false,               // disable two-finger dragging
      // percent: 1,                  // percent to modify pinch speed
      // factor: 1,                   // factor to multiply two-finger drag to increase the speed of movement
      // center: null,                // place this point at center during zoom instead of center of two fingers
      // axis: 'all',                 // axis to zoom
    })
    .wheel({
      // percent: 0.1,                // smooth the zooming by providing the number of frames to zoom between wheel spins
      // interrupt: true,             // stop smoothing with any user input on the viewport
      // reverse: false,              // reverse the direction of the scroll
      // center: null,                // place this point at center during zoom instead of current mouse position
      // lineHeight: 20,	            // scaling factor for non-DOM_DELTA_PIXEL scrolling events
      // axis: 'all',                 // axis to zoom
    });

  // viewport.clamp({
  //   left: -viewport.worldWidth / 2, // whether to clamp to the left and at what value
  //   right: viewport.worldWidth * 1.5, // whether to clamp to the right and at what value
  //   top: -viewport.worldHeight / 2, // whether to clamp to the top and at what value
  //   bottom: viewport.worldHeight * 1.5, // whether to clamp to the bottom and at what value
  //   // direction: 'all', // (all, x, or y) using clamps of [0, viewport.worldWidth / viewport.worldHeight]; replaces left / right / top / bottom if set
  //   underflow: 'none', // where to place world if too small for screen (e.g., top - right, center, none, bottomleft)
  // });

  viewport.clampZoom({
    minWidth: null, // minimum width
    minHeight: null, // minimum height
    maxWidth: null, // maximum width
    maxHeight: null, // maximum height
    minScale: 0.05, // minimum scale
    maxScale: 20, // minimum scale
  });

  // create elements
  grid = new Grid();
  // border(viewport, BORDER);

  // fit and center the world into the panel
  viewport.fit();
  viewport.moveCenter((10 * WIDTH) / 2, (10 * HEIGHT) / 2);
}
