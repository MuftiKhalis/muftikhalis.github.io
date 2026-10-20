/* Illustrative NDVI raster for the home page.
   Generated in the browser from value noise. It is not real satellite imagery. */
(function () {
  var stage = document.getElementById("raster-stage");
  var canvas = document.getElementById("raster-canvas");
  var cursor = document.getElementById("raster-cursor");
  var valEl = document.getElementById("raster-val");
  var classEl = document.getElementById("raster-class");
  if (!stage || !canvas || !canvas.getContext) return;

  var COLS = 40;
  var ROWS = 30;
  var SEED = 20190;
  var PROMPT = "Point at a pixel to read its NDVI.";

  function hash(x, y) {
    var h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ SEED;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function smooth(t) {
    return t * t * (3 - 2 * t);
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function vnoise(x, y) {
    var xi = Math.floor(x);
    var yi = Math.floor(y);
    var xf = smooth(x - xi);
    var yf = smooth(y - yi);
    return lerp(
      lerp(hash(xi, yi), hash(xi + 1, yi), xf),
      lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), xf),
      yf
    );
  }
  function fbm(x, y) {
    return vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.15;
  }

  /* NDVI value for one pixel: noise field, a built-up patch, and a river. */
  var values = new Float32Array(COLS * ROWS);
  var cx = COLS * 0.38;
  var cy = ROWS * 0.58;
  for (var y = 0; y < ROWS; y++) {
    for (var x = 0; x < COLS; x++) {
      var v = -0.05 + fbm(x / 9, y / 9) * 1.15;
      var d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      v -= 0.6 * Math.exp(-d2 / (2 * 7 * 7));
      v += (hash(x, y) - 0.5) * 0.12;
      var river = ROWS * 0.22 + Math.sin(x / 5.5) * 3 + x * 0.28;
      if (Math.abs(y - river) < 1.2) v = -0.16 + (hash(x + 7, y) - 0.5) * 0.08;
      values[y * COLS + x] = Math.max(-0.2, Math.min(0.9, v));
    }
  }

  var STOPS = [
    [0.0, 154, 107, 62],
    [0.2, 215, 182, 91],
    [0.42, 141, 178, 85],
    [0.65, 46, 125, 75],
    [0.9, 31, 92, 58],
  ];

  function color(v) {
    if (v < 0) {
      var k = (v + 0.2) / 0.2; // 0..1
      return [lerp(48, 70, k), lerp(104, 130, k), lerp(134, 158, k)];
    }
    for (var i = 1; i < STOPS.length; i++) {
      if (v <= STOPS[i][0]) {
        var a = STOPS[i - 1];
        var b = STOPS[i];
        var t = (v - a[0]) / (b[0] - a[0]);
        return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
      }
    }
    var last = STOPS[STOPS.length - 1];
    return [last[1], last[2], last[3]];
  }

  function label(v) {
    if (v < 0) return "Water";
    if (v < 0.1) return "Bare ground or built-up";
    if (v < 0.3) return "Sparse vegetation";
    if (v < 0.5) return "Moderate vegetation";
    return "Dense vegetation";
  }

  canvas.width = COLS;
  canvas.height = ROWS;
  var ctx = canvas.getContext("2d");
  var img = ctx.createImageData(COLS, ROWS);

  function paintUpTo(progress) {
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        var i = (y * COLS + x) * 4;
        if ((x + y) / (COLS + ROWS - 2) <= progress) {
          var c = color(values[y * COLS + x]);
          img.data[i] = c[0];
          img.data[i + 1] = c[1];
          img.data[i + 2] = c[2];
          img.data[i + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  /* One orchestrated moment: the raster fills in diagonally, once. */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    paintUpTo(1);
  } else {
    var start = null;
    var DURATION = 1100;
    (function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / DURATION);
      paintUpTo(p);
      if (p < 1) requestAnimationFrame(frame);
    })(performance.now());
  }

  cursor.style.width = 100 / COLS + "%";
  cursor.style.height = 100 / ROWS + "%";

  function read(e) {
    var r = stage.getBoundingClientRect();
    var col = Math.min(COLS - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * COLS)));
    var row = Math.min(ROWS - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * ROWS)));
    var v = values[row * COLS + col];
    cursor.style.left = (col * 100) / COLS + "%";
    cursor.style.top = (row * 100) / ROWS + "%";
    cursor.classList.add("on");
    valEl.textContent = "NDVI " + (v < 0 ? "\u2212" : "") + Math.abs(v).toFixed(2);
    classEl.textContent = label(v);
  }

  function clear() {
    cursor.classList.remove("on");
    valEl.textContent = "NDVI";
    classEl.textContent = PROMPT;
  }

  stage.addEventListener("pointermove", read);
  stage.addEventListener("pointerdown", read);
  stage.addEventListener("pointerleave", clear);
  stage.addEventListener("pointercancel", clear);
})();
