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

  /* Returns the text of the first QR code found in RGBA pixels, or null. */
  function decode(lib, data, w, h) {
    var r = lib(data, w, h, { inversionAttempts: "attemptBoth" });
    return r && r.data ? r.data : null;
  }

  if (typeof module !== "undefined") module.exports = { make: make, svg: svg, pixels: pixels, decode: decode };
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

  /* ---------- Scan ---------- */
  var tabs = document.querySelectorAll("[data-qrtab]");
  var secMake = document.getElementById("qr-make");
  var secScan = document.getElementById("qr-scan");
  var video = document.getElementById("qr-video");
  var camBtn = document.getElementById("qr-cam");
  var fileEl = document.getElementById("qr-file");
  var scanStatus = document.getElementById("qr-scan-status");
  var foundBox = document.getElementById("qr-found");
  var foundText = document.getElementById("qr-found-text");
  var foundCopy = document.getElementById("qr-found-copy");
  var foundOpen = document.getElementById("qr-found-open");
  if (!video || typeof jsQR === "undefined") return;

  var stream = null;
  var timer = null;
  var frame = document.createElement("canvas");

  function showTab(name) {
    tabs.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-qrtab") === name)); });
    secMake.hidden = name !== "make";
    secScan.hidden = name !== "scan";
    if (name !== "scan") stopCam();
  }
  tabs.forEach(function (b) { b.addEventListener("click", function () { showTab(b.getAttribute("data-qrtab")); }); });
  showTab(location.hash === "#scan" ? "scan" : "make");

  function found(text) {
    foundBox.hidden = false;
    foundText.textContent = text;
    var isUrl = /^https?:\/\//i.test(text);
    foundOpen.hidden = !isUrl;
    if (isUrl) foundOpen.href = text;
    scanStatus.textContent = t("qr.found");
  }

  function stopCam() {
    clearTimeout(timer);
    timer = null;
    if (stream) stream.getTracks().forEach(function (tr) { tr.stop(); });
    stream = null;
    video.srcObject = null;
    video.hidden = true;
    camBtn.textContent = t("qr.cam.start");
  }

  function loop() {
    if (!stream) return;
    if (video.readyState >= 2 && video.videoWidth) {
      var scale = Math.min(1, 640 / video.videoWidth);
      var w = Math.round(video.videoWidth * scale);
      var h = Math.round(video.videoHeight * scale);
      frame.width = w;
      frame.height = h;
      var ctx = frame.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, w, h);
      var r = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
      if (r && r.data) {
        found(r.data);
        stopCam();
        return;
      }
    }
    timer = setTimeout(loop, 100);
  }

  async function startCam() {
    foundBox.hidden = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      scanStatus.textContent = window.isSecureContext === false ? t("qr.cam.insecure") : t("qr.cam.unsupported");
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    } catch (e) {
      scanStatus.textContent = e && /NotAllowed|Permission|Security/i.test(e.name) ? t("qr.cam.denied") : e && /NotFound|Overconstrained/i.test(e.name) ? t("qr.cam.none") : t("qr.cam.unsupported");
      return;
    }
    video.srcObject = stream;
    video.setAttribute("playsinline", "");
    video.muted = true;
    video.hidden = false;
    try { await video.play(); } catch (e) {}
    camBtn.textContent = t("qr.cam.stop");
    scanStatus.textContent = t("qr.cam.scanning");
    loop();
  }

  camBtn.addEventListener("click", function () {
    if (stream) { stopCam(); scanStatus.textContent = ""; }
    else startCam();
  });
  window.addEventListener("pagehide", stopCam);

  fileEl.addEventListener("change", function () {
    var f = fileEl.files && fileEl.files[0];
    fileEl.value = "";
    if (!f) return;
    foundBox.hidden = true;
    scanStatus.textContent = t("qr.reading");
    var load = window.createImageBitmap ? createImageBitmap(f, { imageOrientation: "from-image" }) : new Promise(function (res, rej) {
      var u = URL.createObjectURL(f);
      var im = new Image();
      im.onload = function () { URL.revokeObjectURL(u); res(im); };
      im.onerror = rej;
      im.src = u;
    });
    load.then(function (img) {
      var iw = img.width || img.naturalWidth;
      var ih = img.height || img.naturalHeight;
      var scale = Math.min(1, 1600 / Math.max(iw, ih));
      frame.width = Math.max(1, Math.round(iw * scale));
      frame.height = Math.max(1, Math.round(ih * scale));
      var ctx = frame.getContext("2d", { willReadFrequently: true });
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, frame.width, frame.height);
      ctx.drawImage(img, 0, 0, frame.width, frame.height);
      var text = decode(jsQR, ctx.getImageData(0, 0, frame.width, frame.height).data, frame.width, frame.height);
      if (text) found(text);
      else scanStatus.textContent = t("qr.notfound");
    }, function () {
      scanStatus.textContent = t("qr.notfound");
    });
  });

  foundCopy.addEventListener("click", function () {
    var done = function (k) {
      foundCopy.textContent = t(k);
      setTimeout(function () { foundCopy.textContent = t("qr.copy"); }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(foundText.textContent).then(function () { done("qr.copied"); }, function () { done("qr.copyfail"); });
    else done("qr.copyfail");
  });
})();
