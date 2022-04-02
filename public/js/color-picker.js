const COLOR_MAP = [
  hexToRgb('#FF4500'),
  hexToRgb('#FFA800'),
  hexToRgb('#FFD635'),
  hexToRgb('#00A368'),
  hexToRgb('#7EED56'),
  hexToRgb('#2450A4'),
  hexToRgb('#3690EA'),
  hexToRgb('#51E9F4'),
  hexToRgb('#811E9F'),
  hexToRgb('#B44AC0'),
  hexToRgb('#FF99AA'),
  hexToRgb('#9C6926'),
  hexToRgb('#000000'),
  hexToRgb('#898D90'),
  hexToRgb('#D4D7D9'),
  hexToRgb('#FFFFFF'),
  hexToRgb('#FEFFFF'), // Erase
];

const COLOR_MAP_NUM = COLOR_MAP.map(rgbToNum);

let selectedColor = 0;

function hexToRgb(str) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(str);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex({ r, g, b }) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function rgbToNum({ r, g, b }) {
  return (r << 16) | (g << 8) | b;
}

function createColorPicker() {
  const container = document.getElementById('color-picker');
  for (let i = 0; i < COLOR_MAP.length; i++) {
    const hexColor = rgbToHex(COLOR_MAP[i]);
    const div = document.createElement('div');
    div.style.backgroundColor = hexColor;
    div.style.height = '30px';
    div.style.width = '30px';
    if (i === COLOR_MAP.length - 1) {
      const img = document.createElement('img');
      img.src =
        'data:image/png;base64,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';

      img.style.width = '30px';
      img.style.height = '30px';
      div.appendChild(img);
    }
    div.addEventListener('click', (e) => {
      selectedColor = i;
      container.style.background = hexColor;
    });
    container.appendChild(div);
  }
}
