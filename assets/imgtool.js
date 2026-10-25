/* Image compressor / resizer. Runs in the browser; nothing is uploaded. */
(function () {
  var input = document.getElementById("img-input");
  if (!input) return;
  var maxEl = document.getElementById("img-max");
  var fmtEl = document.getElementById("img-format");
  var qEl = document.getElementById("img-quality");
  var qOut = document.getElementById("img-quality-out");
  var qField = document.getElementById("img-quality-field");
  var runBtn = document.getElementById("img-run");
  var statusEl = document.getElementById("img-status");
  var list = document.getElementById("img-results");
  var files = [];
  var urls = [];

  function size(b) {
    return b < 1048576 ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / 1048576).toFixed(2) + " MB";
  }

  function syncOpts() {
    qOut.textContent = Math.round(qEl.value * 100) + "%";
    qField.hidden = fmtEl.value === "image/png";
  }

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

  function dims(src, max) {
    var w = src.width || src.naturalWidth;
    var h = src.height || src.naturalHeight;
    if (max && Math.max(w, h) > max) {
      var k = max / Math.max(w, h);
      return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
    }
    return { w: w, h: h };
  }

  function encode(src, d, type, quality) {
    return new Promise(function (resolve, reject) {
      var c = document.createElement("canvas");
      c.width = d.w;
      c.height = d.h;
      var ctx = c.getContext("2d");
      if (type === "image/jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, d.w, d.h);
      }
      ctx.drawImage(src, 0, 0, d.w, d.h);
      c.toBlob(function (b) { return b ? resolve(b) : reject(new Error("encode")); }, type, quality);
    });
  }

  var EXT = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" };

  async function run() {
    urls.forEach(function (u) { URL.revokeObjectURL(u); });
    urls = [];
    list.textContent = "";
    var max = parseInt(maxEl.value, 10) || 0;
    var type = fmtEl.value;
    var done = 0;
    statusEl.textContent = t("img.working");
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var li = document.createElement("li");
      try {
        var src = await decode(f);
        var d = dims(src, max);
        var out = await encode(src, d, type, parseFloat(qEl.value));
        if (src.close) src.close();
        var url = URL.createObjectURL(out);
        urls.push(url);
        var saved = Math.round((1 - out.size / f.size) * 100);
        var name = document.createElement("span");
        name.className = "file-name";
        name.textContent = f.name.replace(/\.[^.]+$/, "") + "-small." + EXT[out.type || type];
        var meta = document.createElement("span");
        meta.className = "file-meta";
        meta.textContent = d.w + "\u00d7" + d.h + " \u00b7 " + size(f.size) + " \u2192 " + size(out.size) + " (" + (saved >= 0 ? "\u2212" + saved : "+" + -saved) + "%)";
        var a = document.createElement("a");
        a.className = "btn btn-quiet";
        a.href = url;
        a.download = name.textContent;
        a.textContent = t("img.download");
        li.appendChild(name);
        li.appendChild(meta);
        li.appendChild(a);
        done++;
      } catch (e) {
        li.textContent = t("img.failed", { name: f.name });
      }
      list.appendChild(li);
    }
    statusEl.textContent = t("img.done", { n: done });
  }

  input.addEventListener("change", function () {
    files = Array.prototype.slice.call(input.files);
    runBtn.disabled = !files.length;
    statusEl.textContent = files.length ? t("img.selected", { n: files.length }) : "";
  });
  fmtEl.addEventListener("change", syncOpts);
  qEl.addEventListener("input", syncOpts);
  runBtn.addEventListener("click", run);
  syncOpts();
})();
