function bufferToBase64(buf) {
  var binstr = Array.prototype.map
    .call(buf, function (ch) {
      return String.fromCharCode(ch);
    })
    .join('');
  return btoa(binstr);
}

function base64ToBuffer(base64) {
  var binstr = atob(base64);
  var buf = new Uint8Array(binstr.length);
  Array.prototype.forEach.call(binstr, function (ch, i) {
    buf[i] = ch.charCodeAt(0);
  });
  return buf;
}
