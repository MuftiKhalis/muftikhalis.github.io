/* QR code generator (uses the qrcode-generator library). */
(function () {
  function make(lib, text, ecl) {
    lib.stringToBytes = lib.stringToBytesFuncs["UTF-8"];
    var q = lib(0, ecl || "M");
    q.addData(text);
    q.make();
    return q;
  }

  function svg(q, margin) {
    var n = q.getModuleCount();
    var m = margin === undefined ? 4 : margin;
    var d = "";
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (q.isDark(r, c)) d += "M" + (c + m) + " " + (r + m) + "h1v1h-1z";
      }
    }
    var s = n + 2 * m;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + " " + s + '" shape-rendering="crispEdges"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }

  /* RGBA pixels of the code, `scale` pixels per module (used for PNG export and tests). */
  function pixels(q, scale, margin) {
    var n = q.getModuleCount();
    var m = margin === undefined ? 4 : margin;
    var size = (n + 2 * m) * scale;
    var data = new Uint8ClampedArray(size * size * 4).fill(255);
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        var r = Math.floor(y / scale) - m;
        var c = Math.floor(x / scale) - m;
        if (r >= 0 && c >= 0 && r < n && c < n && q.isDark(r, c)) {
          var i = (y * size + x) * 4;
          data[i] = data[i + 1] = data[i + 2] = 0;
        }
      }
    }
    return { data: data, size: size };
  }

  if (typeof module !== "undefined") module.exports = { make: make, svg: svg, pixels: pixels };
  if (typeof document === "undefined" || typeof qrcode === "undefined") return;

  var input = document.getElementById("qr-text");
  if (!input) return;
  var eclSel = document.getElementById("qr-ecl");
  var sizeSel = document.getElementById("qr-size");
  var stage = document.getElementById("qr-stage");
  var status = document.getElementById("qr-status");
  var dlSvg = document.getElementById("qr-svg");
  var dlPng = document.getElementById("qr-png");
  var current = null;

  function render() {
    var text = input.value;
    stage.textContent = "";
    status.textContent = "";
    current = null;
    dlSvg.disabled = dlPng.disabled = true;
    if (!text.trim()) {
      status.textContent = t("qr.empty");
      return;
    }
    try {
      current = make(qrcode, text, eclSel.value);
    } catch (e) {
      status.textContent = t("qr.toolong");
      return;
    }
    stage.innerHTML = svg(current);
    var el = stage.firstChild;
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", t("qr.alt"));
    dlSvg.disabled = dlPng.disabled = false;
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

  dlSvg.addEventListener("click", function () {
    if (current) save(new Blob([svg(current)], { type: "image/svg+xml" }), "qr.svg");
  });
  dlPng.addEventListener("click", function () {
    if (!current) return;
    var target = parseInt(sizeSel.value, 10);
    var n = current.getModuleCount() + 8;
    var scale = Math.max(1, Math.round(target / n));
    var px = pixels(current, scale);
    var c = document.createElement("canvas");
    c.width = c.height = px.size;
    c.getContext("2d").putImageData(new ImageData(px.data, px.size, px.size), 0, 0);
    c.toBlob(function (b) { save(b, "qr.png"); }, "image/png");
  });

  input.addEventListener("input", render);
  eclSel.addEventListener("change", render);
  render();
})();
