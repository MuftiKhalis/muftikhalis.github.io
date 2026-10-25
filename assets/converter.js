/* PDF and Word tools. Everything runs in the browser; files never leave the device. */
(function () {
  var EN = {
    "conv.err.empty": "Enter the pages to keep, for example 1-3, 5.",
    "conv.err.read": "Cannot read \u201c{p}\u201d. Use numbers like 2, 3-5 or 8-.",
    "conv.err.outside": "Page {n} is outside this PDF (1\u2013{total}).",
    "conv.err.backwards": "Range \u201c{p}\u201d runs backwards.",
  };
  function T(key, vars) {
    if (typeof window !== "undefined" && typeof window.t === "function") return window.t(key, vars);
    return (EN[key] || key).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
  }

  /* ---------- Pure helpers (also used by tests) ---------- */

  /* "1-3, 5, 8-" with total=10 -> [0,1,2,4,7,8,9]. Throws Error with a readable message. */
  function parseRanges(src, total) {
    var parts = String(src || "").split(",").map(function (p) { return p.trim(); }).filter(Boolean);
    if (!parts.length) throw new Error(T("conv.err.empty"));
    var out = [];
    parts.forEach(function (p) {
      var m = /^(\d+)?\s*(-)?\s*(\d+)?$/.exec(p);
      if (!m || (!m[1] && !m[3])) throw new Error(T("conv.err.read", { p: p }));
      var a, b;
      if (!m[2]) {
        a = b = parseInt(m[1], 10);
      } else {
        a = m[1] ? parseInt(m[1], 10) : 1;
        b = m[3] ? parseInt(m[3], 10) : total;
      }
      if (a < 1 || b < 1 || a > total || b > total) throw new Error(T("conv.err.outside", { n: a > total || a < 1 ? a : b, total: total }));
      if (a > b) throw new Error(T("conv.err.backwards", { p: p }));
      for (var i = a; i <= b; i++) out.push(i - 1);
    });
    return out;
  }

  async function mergePdfs(PDFLib, buffers) {
    var out = await PDFLib.PDFDocument.create();
    for (var i = 0; i < buffers.length; i++) {
      var doc = await PDFLib.PDFDocument.load(buffers[i]);
      var pages = await out.copyPages(doc, doc.getPageIndices());
      pages.forEach(function (p) { out.addPage(p); });
    }
    return out.save();
  }

  async function extractPages(PDFLib, buffer, indices) {
    var src = await PDFLib.PDFDocument.load(buffer);
    var out = await PDFLib.PDFDocument.create();
    var pages = await out.copyPages(src, indices);
    pages.forEach(function (p) { out.addPage(p); });
    return out.save();
  }

  /* items: [{bytes: Uint8Array, kind: "jpg"|"png"}]; fit: "image" | "a4" */
  async function imagesToPdf(PDFLib, items, fit) {
    var out = await PDFLib.PDFDocument.create();
    for (var i = 0; i < items.length; i++) {
      var img = items[i].kind === "jpg" ? await out.embedJpg(items[i].bytes) : await out.embedPng(items[i].bytes);
      if (fit === "a4") {
        var W = 595.28, H = 841.89, M = 36;
        var page = out.addPage([W, H]);
        var scale = Math.min((W - 2 * M) / img.width, (H - 2 * M) / img.height, 1);
        var w = img.width * scale, h = img.height * scale;
        page.drawImage(img, { x: (W - w) / 2, y: (H - h) / 2, width: w, height: h });
      } else {
        var pw = img.width * 0.75, ph = img.height * 0.75; // pixels to points
        var pg = out.addPage([pw, ph]);
        pg.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
      }
    }
    return out.save();
  }

  if (typeof module !== "undefined") {
    module.exports = { parseRanges: parseRanges, mergePdfs: mergePdfs, extractPages: extractPages, imagesToPdf: imagesToPdf };
  }
  if (typeof document === "undefined") return;

  /* ---------- UI ---------- */

  var tabs = document.querySelectorAll("[data-conv]");
  var sections = document.querySelectorAll(".conv");
  if (!tabs.length) return;

  function showTool(name) {
    tabs.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-conv") === name));
    });
    sections.forEach(function (s) {
      s.hidden = s.id !== name;
    });
  }
  tabs.forEach(function (b) {
    b.addEventListener("click", function () {
      showTool(b.getAttribute("data-conv"));
    });
  });
  var wanted = location.hash.slice(1);
  var known = Array.prototype.some.call(sections, function (s) { return s.id === wanted; });
  showTool(known ? wanted : "merge");

  function $(id) {
    return document.getElementById(id);
  }

  function libMissing(name, status) {
    if (window[name]) return false;
    status.textContent = T("conv.nolib");
    return true;
  }

  function size(bytes) {
    return bytes < 1048576 ? Math.max(1, Math.round(bytes / 1024)) + " KB" : (bytes / 1048576).toFixed(1) + " MB";
  }

  function readBuffer(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
      r.readAsArrayBuffer(file);
    });
  }

  /* A reorderable list of chosen files. */
  function fileList(inputEl, listEl, onChange, multiple) {
    var files = [];

    function render() {
      listEl.textContent = "";
      files.forEach(function (f, i) {
        var li = document.createElement("li");
        var name = document.createElement("span");
        name.className = "file-name";
        name.textContent = f.name;
        var meta = document.createElement("span");
        meta.className = "file-meta";
        meta.textContent = size(f.size);
        li.appendChild(name);
        li.appendChild(meta);

        var btns = document.createElement("span");
        btns.className = "file-btns";
        function add(label, text, fn, disabled) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "file-btn";
          b.textContent = text;
          b.setAttribute("aria-label", label + " " + f.name);
          b.disabled = !!disabled;
          b.addEventListener("click", fn);
          btns.appendChild(b);
        }
        if (multiple) {
          add("Move up", "\u2191", function () { swap(i, i - 1); }, i === 0);
          add("Move down", "\u2193", function () { swap(i, i + 1); }, i === files.length - 1);
        }
        add("Remove", "\u00d7", function () { files.splice(i, 1); render(); onChange(files); });
        li.appendChild(btns);
        listEl.appendChild(li);
      });
    }

    function swap(a, b) {
      var t = files[a];
      files[a] = files[b];
      files[b] = t;
      render();
      onChange(files);
    }

    inputEl.addEventListener("change", function () {
      var picked = Array.prototype.slice.call(inputEl.files);
      files = multiple ? files.concat(picked) : picked.slice(0, 1);
      inputEl.value = "";
      render();
      onChange(files);
    });

    return { get: function () { return files; } };
  }

  var urls = {};
  function offer(linkId, bytes, filename, mime) {
    var a = $(linkId);
    if (urls[linkId]) URL.revokeObjectURL(urls[linkId]);
    urls[linkId] = URL.createObjectURL(new Blob([bytes], { type: mime || "application/pdf" }));
    a.href = urls[linkId];
    a.download = filename;
    a.textContent = "Download " + filename;
    a.hidden = false;
  }

  function fail(statusEl, e) {
    var msg = e && e.message ? e.message : "";
    if (/encrypt/i.test(msg)) msg = T("conv.encrypted");
    else if (/No PDF header|Failed to parse|Invalid|Expected instance/i.test(msg)) msg = T("conv.notpdf");
    statusEl.textContent = msg || T("conv.wrong");
  }

  /* Merge */
  (function () {
    var run = $("merge-run"), dl = $("merge-dl"), st = $("merge-status");
    var list = fileList($("merge-input"), $("merge-list"), function (f) {
      run.disabled = f.length < 2;
      dl.hidden = true;
      st.textContent = f.length === 1 ? T("conv.addmore") : "";
    }, true);
    run.addEventListener("click", async function () {
      if (libMissing("PDFLib", st)) return;
      st.textContent = T("conv.merging");
      try {
        var bufs = await Promise.all(list.get().map(readBuffer));
        var out = await mergePdfs(window.PDFLib, bufs);
        offer("merge-dl", out, "merged.pdf");
        st.textContent = T("conv.done.size", { s: size(out.length) });
      } catch (e) {
        fail(st, e);
      }
    });
  })();

  /* Extract pages */
  (function () {
    var run = $("extract-run"), dl = $("extract-dl"), st = $("extract-status"), range = $("extract-range");
    var pageCount = 0;
    var list = fileList($("extract-input"), $("extract-list"), async function (f) {
      run.disabled = f.length === 0;
      dl.hidden = true;
      pageCount = 0;
      st.textContent = "";
      if (f.length && !libMissing("PDFLib", st)) {
        try {
          var doc = await window.PDFLib.PDFDocument.load(await readBuffer(f[0]));
          pageCount = doc.getPageCount();
          st.textContent = T(pageCount === 1 ? "conv.pages.one" : "conv.pages.other", { n: pageCount });
        } catch (e) {
          fail(st, e);
        }
      }
    }, false);
    run.addEventListener("click", async function () {
      if (libMissing("PDFLib", st)) return;
      try {
        if (!pageCount) throw new Error(T("conv.choose"));
        var idx = parseRanges(range.value, pageCount);
        st.textContent = T("conv.working");
        var out = await extractPages(window.PDFLib, await readBuffer(list.get()[0]), idx);
        offer("extract-dl", out, "extracted.pdf");
        st.textContent = T(idx.length === 1 ? "conv.done.one" : "conv.done.other", { n: idx.length, s: size(out.length) });
      } catch (e) {
        fail(st, e);
      }
    });
  })();

  /* Images to PDF */
  (function () {
    var run = $("images-run"), dl = $("images-dl"), st = $("images-status"), fit = $("images-fit");
    var list = fileList($("images-input"), $("images-list"), function (f) {
      run.disabled = f.length === 0;
      dl.hidden = true;
      st.textContent = "";
    }, true);

    function toPng(file) {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          var c = document.createElement("canvas");
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext("2d").drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          c.toBlob(function (blob) {
            if (!blob) return reject(new Error(T("conv.imgconv", { name: file.name })));
            readBuffer(blob).then(function (b) { resolve({ bytes: new Uint8Array(b), kind: "png" }); }, reject);
          }, "image/png");
        };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          reject(new Error(T("conv.imgread", { name: file.name })));
        };
        img.src = url;
      });
    }

    async function prepare(file) {
      if (file.type === "image/jpeg") return { bytes: new Uint8Array(await readBuffer(file)), kind: "jpg" };
      if (file.type === "image/png") return { bytes: new Uint8Array(await readBuffer(file)), kind: "png" };
      return toPng(file);
    }

    run.addEventListener("click", async function () {
      if (libMissing("PDFLib", st)) return;
      st.textContent = T("conv.building");
      try {
        var items = [];
        for (var f of list.get()) items.push(await prepare(f));
        var out = await imagesToPdf(window.PDFLib, items, fit.value);
        offer("images-dl", out, "images.pdf");
        st.textContent = T(items.length === 1 ? "conv.done.one" : "conv.done.other", { n: items.length, s: size(out.length) });
      } catch (e) {
        fail(st, e);
      }
    });
  })();

  /* Word to PDF (basic): convert to HTML, then use the browser's print dialog. */
  (function () {
    var run = $("word-run"), st = $("word-status"), preview = $("word-preview"), printBtn = $("word-print");
    var list = fileList($("word-input"), $("word-list"), function (f) {
      run.disabled = f.length === 0;
      printBtn.disabled = true;
      preview.hidden = true;
      preview.textContent = "";
      st.textContent = "";
    }, false);
    run.addEventListener("click", async function () {
      if (libMissing("mammoth", st)) return;
      st.textContent = T("conv.converting");
      try {
        var file = list.get()[0];
        if (!/\.docx$/i.test(file.name)) throw new Error(T("conv.onlydocx"));
        var res = await window.mammoth.convertToHtml({ arrayBuffer: await readBuffer(file) });
        preview.innerHTML = res.value;
        preview.hidden = false;
        printBtn.disabled = false;
        st.textContent = res.messages.length
          ? T("conv.converted.simple")
          : T("conv.converted.ok");
      } catch (e) {
        st.textContent = e && e.message ? e.message : T("conv.wordfail");
      }
    });
    printBtn.addEventListener("click", function () {
      window.print();
    });
  })();
})();
