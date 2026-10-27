/* Photo -> ASCII art, black & white or colour. Runs in the browser. */
(function () {
  /* Ramps go from the lightest mark (empty) to the heaviest. */
  var RAMPS = {
    standard: " .:-=+*#%@",
    detailed: " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    blocks: " \u2591\u2592\u2593\u2588",
    simple: " .oO@",
  };
  var CELL_ASPECT = 0.5; // a character is about twice as tall as it is wide

  function rowsFor(width, height, cols) {
    return Math.max(1, Math.round((height / width) * cols * CELL_ASPECT));
  }

  /* img: {data: RGBA, width, height}. opts: {ramp, bgDark, contrast, brightness, invert}.
     Returns {cols, rows, lines, colors} where colors holds r,g,b per character. */
  function toAscii(img, opts) {
    var ramp = opts.ramp || RAMPS.standard;
    var contrast = opts.contrast === undefined ? 1 : opts.contrast;
    var brightness = opts.brightness || 0;
    var bgDark = opts.bgDark !== false;
    var cols = img.width;
    var rows = img.height;
    var lines = [];
    var colors = new Uint8ClampedArray(cols * rows * 3);
    var last = ramp.length - 1;
    for (var y = 0; y < rows; y++) {
      var line = "";
      for (var x = 0; x < cols; x++) {
        var i = (y * cols + x) * 4;
        var a = img.data[i + 3] / 255;
        var bg = bgDark ? 0 : 255;
        var r = img.data[i] * a + bg * (1 - a);
        var g = img.data[i + 1] * a + bg * (1 - a);
        var b = img.data[i + 2] * a + bg * (1 - a);
        var v = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        v = (v - 0.5) * contrast + 0.5 + brightness;
        v = Math.min(1, Math.max(0, v));
        var density = bgDark ? v : 1 - v;
        if (opts.invert) density = 1 - density;
        line += ramp.charAt(Math.round(density * last));
        var c = (y * cols + x) * 3;
        colors[c] = r;
        colors[c + 1] = g;
        colors[c + 2] = b;
      }
      lines.push(line);
    }
    return { cols: cols, rows: rows, lines: lines, colors: colors };
  }

  if (typeof module !== "undefined") module.exports = { RAMPS: RAMPS, toAscii: toAscii, rowsFor: rowsFor };
  if (typeof document === "undefined") return;

  var input = document.getElementById("as-input");
  if (!input) return;
  var colsEl = document.getElementById("as-cols");
  var colsOut = document.getElementById("as-cols-out");
  var modeEl = document.getElementById("as-mode");
  var bgEl = document.getElementById("as-bg");
  var rampEl = document.getElementById("as-ramp");
  var contrastEl = document.getElementById("as-contrast");
  var brightEl = document.getElementById("as-bright");
  var invertEl = document.getElementById("as-invert");
  var stage = document.getElementById("as-stage");
  var pre = document.getElementById("as-pre");
  var canvas = document.getElementById("as-canvas");
  var statusEl = document.getElementById("as-status");
  var dlTxt = document.getElementById("as-txt");
  var dlPng = document.getElementById("as-png");
  var copyBtn = document.getElementById("as-copy");

  var source = null; // decoded image
  var result = null;
  var CW = 8;
  var CH = 16;

  function decode(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: "from-image" }).catch(function () { return viaImg(file); });
    }
    return viaImg(file);
  }
  function viaImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  function sample() {
    var w = source.width || source.naturalWidth;
    var h = source.height || source.naturalHeight;
    var cols = parseInt(colsEl.value, 10);
    var rows = rowsFor(w, h, cols);
    var c = document.createElement("canvas");
    c.width = cols;
    c.height = rows;
    var ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    var bgDark = bgEl.value === "dark";
    ctx.fillStyle = bgDark ? "#000" : "#fff";
    ctx.fillRect(0, 0, cols, rows);
    ctx.drawImage(source, 0, 0, cols, rows);
    return ctx.getImageData(0, 0, cols, rows);
  }

  function paintCanvas(res, color, bgDark) {
    canvas.width = res.cols * CW;
    canvas.height = res.rows * CH;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = bgDark ? "#000" : "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 13px 'DejaVu Sans Mono', Menlo, Consolas, monospace";
    ctx.textBaseline = "top";
    for (var y = 0; y < res.rows; y++) {
      for (var x = 0; x < res.cols; x++) {
        var ch = res.lines[y].charAt(x);
        if (ch === " ") continue;
        if (color) {
          var i = (y * res.cols + x) * 3;
          ctx.fillStyle = "rgb(" + res.colors[i] + "," + res.colors[i + 1] + "," + res.colors[i + 2] + ")";
        } else {
          ctx.fillStyle = bgDark ? "#fff" : "#000";
        }
        ctx.fillText(ch, x * CW, y * CH);
      }
    }
  }

  function render() {
    if (!source) return;
    colsOut.textContent = colsEl.value;
    var bgDark = bgEl.value === "dark";
    var color = modeEl.value === "color";
    result = toAscii(sample(), {
      ramp: RAMPS[rampEl.value],
      bgDark: bgDark,
      contrast: parseFloat(contrastEl.value),
      brightness: parseFloat(brightEl.value),
      invert: invertEl.checked,
    });
    var emptyHint = document.getElementById("as-empty");
    if (emptyHint) emptyHint.hidden = true;
    stage.className = "ascii-stage " + (bgDark ? "dark" : "light");
    paintCanvas(result, color, bgDark);
    canvas.hidden = !color;
    pre.hidden = color;
    if (!color) {
      pre.textContent = result.lines.join("\n");
      var width = stage.clientWidth || 600;
      pre.style.fontSize = Math.max(3, Math.min(14, width / (result.cols * 0.6))) + "px";
    }
    dlTxt.disabled = dlPng.disabled = copyBtn.disabled = false;
    statusEl.textContent = t("as.size", { c: result.cols, r: result.rows });
  }

  function save(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }

  input.addEventListener("change", function () {
    var f = input.files && input.files[0];
    if (!f) return;
    statusEl.textContent = t("as.loading");
    decode(f).then(function (img) {
      source = img;
      render();
    }, function () {
      statusEl.textContent = t("as.failed");
    });
  });
  [colsEl, contrastEl, brightEl].forEach(function (el) { el.addEventListener("input", render); });
  [modeEl, bgEl, rampEl, invertEl].forEach(function (el) { el.addEventListener("change", render); });

  dlTxt.addEventListener("click", function () {
    if (result) save(new Blob([result.lines.join("\n") + "\n"], { type: "text/plain;charset=utf-8" }), "ascii.txt");
  });
  dlPng.addEventListener("click", function () {
    if (result) canvas.toBlob(function (b) { save(b, "ascii.png"); }, "image/png");
  });
  copyBtn.addEventListener("click", function () {
    if (!result) return;
    var text = result.lines.join("\n");
    var done = function (k) {
      copyBtn.textContent = t(k);
      setTimeout(function () { copyBtn.textContent = t("as.copy"); }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done("as.copied"); }, function () { done("as.copyfail"); });
    else done("as.copyfail");
  });
})();
