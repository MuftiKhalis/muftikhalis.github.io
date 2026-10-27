/* PDF / DOCX / XLSX -> Markdown, and Markdown -> DOCX download. Everything runs in the browser. */
(function () {
  var EN = {
    "tm.imgomitted": "[image omitted]",
    "tm.truncated": "Only the first {n} rows of this sheet are shown.",
    "tm.emptysheet": "This sheet is empty.",
  };
  function T(key, vars) {
    if (typeof window !== "undefined" && typeof window.t === "function") return window.t(key, vars);
    return (EN[key] || key).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
  }

  /* ---------- tables ---------- */

  function cellText(v) {
    return String(v === null || v === undefined ? "" : v).replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
  }

  /* rows: array of arrays. First row becomes the header. */
  function tableToMd(rows) {
    var width = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    if (!width || !rows.length) return "";
    var norm = rows.map(function (r) {
      var out = r.map(cellText);
      while (out.length < width) out.push("");
      return out;
    });
    var head = norm[0].map(function (c, i) { return c || "Col " + (i + 1); });
    var lines = ["| " + head.join(" | ") + " |", "| " + head.map(function () { return "---"; }).join(" | ") + " |"];
    norm.slice(1).forEach(function (r) { lines.push("| " + r.join(" | ") + " |"); });
    return lines.join("\n");
  }

  var MAX_ROWS = 2000;
  var STYLE_MAP = [
    "p[style-name='Code'] => pre:separator('\\n')",
    "p[style-name='Source Code'] => pre:separator('\\n')",
    "p[style-name='HTML Preformatted'] => pre:separator('\\n')",
    "p[style-name='Quote'] => blockquote > p:fresh",
    "p[style-name='Block Text'] => blockquote > p:fresh",
    "p[style-name='Intense Quote'] => blockquote > p:fresh",
  ];

  function workbookToMd(wb, XLSX) {
    var parts = [];
    wb.SheetNames.forEach(function (name) {
      var ws = wb.Sheets[name];
      var rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "", blankrows: false });
      while (rows.length && rows[rows.length - 1].every(function (c) { return String(c).trim() === ""; })) rows.pop();
      var width = 0;
      rows.forEach(function (r) {
        for (var i = r.length - 1; i >= 0; i--) if (String(r[i]).trim() !== "") { width = Math.max(width, i + 1); break; }
      });
      rows = rows.map(function (r) { return r.slice(0, width); });
      var block = "## " + cellText(name) + "\n\n";
      if (!rows.length || !width) {
        block += T("tm.emptysheet");
      } else {
        var cut = rows.length > MAX_ROWS;
        block += tableToMd(cut ? rows.slice(0, MAX_ROWS) : rows);
        if (cut) block += "\n\n_" + T("tm.truncated", { n: MAX_ROWS }) + "_";
      }
      parts.push(block);
    });
    return parts.join("\n\n") + "\n";
  }

  /* ---------- PDF text -> Markdown (heuristic) ---------- */

  function median(nums) {
    if (!nums.length) return 0;
    var a = nums.slice().sort(function (x, y) { return x - y; });
    return a[Math.floor(a.length / 2)];
  }

  /* items: [{str, x, y, h, w}] for one page, in PDF coordinates (y grows upwards). Returns lines top to bottom. */
  function groupLines(items) {
    var list = items.filter(function (it) { return it.str !== undefined && (it.str.trim() !== "" || it.w > 0); });
    list.sort(function (a, b) { return b.y - a.y || a.x - b.x; });
    var lines = [];
    list.forEach(function (it) {
      var line = lines[lines.length - 1];
      var tol = Math.max(2, (it.h || 10) * 0.45);
      if (line && Math.abs(line.y - it.y) <= tol) {
        line.items.push(it);
        line.h = Math.max(line.h, it.h || 0);
      } else {
        lines.push({ y: it.y, h: it.h || 10, items: [it] });
      }
    });
    lines.forEach(function (line) {
      line.items.sort(function (a, b) { return a.x - b.x; });
      var text = "";
      var prevEnd = null;
      line.items.forEach(function (it) {
        if (prevEnd !== null && it.x - prevEnd > (line.h || 10) * 0.2 && !/\s$/.test(text) && !/^\s/.test(it.str)) text += " ";
        text += it.str;
        prevEnd = it.x + (it.w || 0);
      });
      line.text = text.replace(/\s+/g, " ").trim();
      line.x = line.items[0].x;
    });
    return lines.filter(function (l) { return l.text !== ""; });
  }

  function norm(text) { return text.toLowerCase(); }
  var PAGE_NUMBER = /^(?:(?:page|halaman|hal\.?|p\.)\s*)?\d{1,4}(?:\s*(?:of|dari|\/)\s*\d{1,4})?$|^[-\u2013\u2014]\s*\d{1,4}\s*[-\u2013\u2014]$/i;

  /* pages: array of arrays of items. Returns Markdown. */
  function pdfPagesToMarkdown(pages) {
    var pageLines = pages.map(groupLines);

    var sizes = [];
    pageLines.forEach(function (ls) {
      ls.forEach(function (l) { for (var i = 0; i < Math.min(l.text.length, 80); i += 8) sizes.push(Math.round(l.h * 2) / 2); });
    });
    var body = median(sizes) || 10;

    // drop running headers/footers and bare page numbers
    if (pageLines.length >= 3) {
      var counts = {};
      pageLines.forEach(function (ls) {
        var seen = {};
        ls.slice(0, 2).concat(ls.slice(-2)).forEach(function (l) {
          var k = norm(l.text);
          if (!seen[k]) { seen[k] = true; counts[k] = (counts[k] || 0) + 1; }
        });
      });
      var need = Math.max(2, Math.ceil(pageLines.length * 0.6));
      pageLines = pageLines.map(function (ls) {
        return ls.filter(function (l, i) {
          var edge = i < 2 || i >= ls.length - 2;
          return !(edge && (counts[norm(l.text)] >= need || PAGE_NUMBER.test(l.text)));
        });
      });
    }

    var out = [];
    pageLines.forEach(function (ls) {
      var para = [];
      var prev = null;
      function flush() {
        if (!para.length) return;
        var text = "";
        para.forEach(function (ln) {
          if (!text) text = ln;
          else if (/[a-z\u00e0-\u00ff]-$/i.test(text) && /^[a-z\u00e0-\u00ff]/i.test(ln)) text += ln; // keep the hyphen: "baris-baris"
          else text += " " + ln;
        });
        out.push(text);
        para = [];
      }
      ls.forEach(function (l) {
        var ratio = l.h / body;
        var gap = prev ? prev.y - l.y : 0;
        var bullet = /^([\u2022\u25e6\u25aa\u25cf\u00b7*\-\u2013\u2014])\s+(.*)$/.exec(l.text);
        var numbered = /^(\d{1,3})[.)]\s+(.*)$/.exec(l.text);

        if (ratio >= 1.15 && l.text.length <= 120) {
          flush();
          var level = ratio >= 1.8 ? "#" : ratio >= 1.4 ? "##" : "###";
          out.push(level + " " + l.text);
        } else if (bullet) {
          flush();
          para.push("- " + bullet[2]);
          out.push(para.join(" "));
          para = [];
          prev = l;
          prev.bullet = true;
          return;
        } else if (numbered) {
          flush();
          out.push(numbered[1] + ". " + numbered[2]);
          prev = l;
          prev.bullet = true;
          return;
        } else {
          var newPara = !prev || gap > l.h * 1.7 || (prev.heading);
          if (prev && prev.bullet && gap <= l.h * 1.7 && l.x > prev.x + 2 && out.length) {
            out[out.length - 1] += " " + l.text; // wrapped list item
            prev = l;
            prev.bullet = true;
            return;
          }
          if (newPara) flush();
          para.push(l.text);
        }
        prev = l;
        prev.heading = ratio >= 1.15 && l.text.length <= 120;
      });
      flush();
    });
    var kind = function (s) { return /^- /.test(s) ? "b" : /^\d{1,3}\. /.test(s) ? "n" : ""; };
    var text = "";
    out.forEach(function (block, i) {
      var same = i > 0 && kind(block) && kind(out[i - 1]) === kind(block);
      text += i === 0 ? block : (same ? "\n" : "\n\n") + block;
    });
    return text.replace(/\n{3,}/g, "\n\n") + "\n";
  }

  /* ---------- HTML -> Markdown (from DOCX via mammoth) ---------- */

  function htmlToMd(html, Turndown, gfm, parseHtml) {
    var doc = parseHtml(html);
    doc.querySelectorAll("td, th").forEach(function (cell) {
      var ps = cell.querySelectorAll("p");
      if (ps.length) cell.innerHTML = Array.prototype.map.call(ps, function (p) { return p.innerHTML; }).join(" ");
    });
    doc.querySelectorAll("table").forEach(function (table) {
      var first = table.querySelector("tr");
      if (first) first.querySelectorAll("td").forEach(function (td) {
        var th = doc.createElement("th");
        th.innerHTML = td.innerHTML;
        td.replaceWith(th);
      });
    });
    var svc = new Turndown({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced", emDelimiter: "*" });
    if (gfm) svc.use(gfm);
    svc.addRule("plainPre", {
      filter: function (node) { return node.nodeName === "PRE" && !node.querySelector("code"); },
      replacement: function (content, node) { return "\n\n```\n" + node.textContent.replace(/\n+$/, "") + "\n```\n\n"; },
    });
    svc.addRule("img", { filter: "img", replacement: function () { return "_" + T("tm.imgomitted") + "_"; } });
    return svc.turndown(doc.body.innerHTML)
      .replace(/^(\s*)([-*+]|\d+\.)[ \t]{2,}/gm, "$1$2 ")
      .replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  if (typeof module !== "undefined") {
    module.exports = { STYLE_MAP: STYLE_MAP, tableToMd: tableToMd, workbookToMd: workbookToMd, pdfPagesToMarkdown: pdfPagesToMarkdown, htmlToMd: htmlToMd, groupLines: groupLines };
  }
  if (typeof document === "undefined") return;

  /* ---------- page ---------- */

  var input = document.getElementById("tm-input");
  if (!input) return;
  var runBtn = document.getElementById("tm-run");
  var statusEl = document.getElementById("tm-status");
  var outEl = document.getElementById("tm-out");
  var actions = document.getElementById("tm-actions");
  var nameBase = "document";

  function readBuffer(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
      r.readAsArrayBuffer(file);
    });
  }

  async function fromPdf(buf) {
    var lib = window.pdfjsLib;
    if (!lib) throw new Error(T("tm.nolib"));
    var me = document.querySelector('script[src*="mdconvert.js"]');
    lib.GlobalWorkerOptions.workerSrc = me.src.replace(/mdconvert\.js.*$/, "vendor/pdf.worker.min.js");
    var pdf = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
    var pages = [];
    var chars = 0;
    for (var p = 1; p <= pdf.numPages; p++) {
      var page = await pdf.getPage(p);
      var content = await page.getTextContent();
      var items = content.items.map(function (it) {
        chars += it.str.length;
        return { str: it.str, x: it.transform[4], y: it.transform[5], h: Math.hypot(it.transform[2], it.transform[3]) || it.height, w: it.width };
      });
      pages.push(items);
    }
    if (!chars) throw new Error(T("tm.scanned"));
    return pdfPagesToMarkdown(pages);
  }

  async function fromDocx(buf) {
    if (!window.mammoth || !window.TurndownService) throw new Error(T("tm.nolib"));
    var res = await window.mammoth.convertToHtml({ arrayBuffer: buf }, { styleMap: STYLE_MAP });
    var gfm = window.turndownPluginGfm && window.turndownPluginGfm.gfm;
    return htmlToMd(res.value, window.TurndownService, gfm, function (h) { return new DOMParser().parseFromString(h, "text/html"); });
  }

  async function fromSheet(buf) {
    if (!window.XLSX) throw new Error(T("tm.nolib"));
    var wb = window.XLSX.read(buf, { type: "array" });
    return workbookToMd(wb, window.XLSX);
  }

  async function run() {
    var f = input.files && input.files[0];
    if (!f) return;
    var ext = (f.name.split(".").pop() || "").toLowerCase();
    nameBase = f.name.replace(/\.[^.]+$/, "") || "document";
    statusEl.textContent = T("tm.reading");
    outEl.value = "";
    actions.hidden = true;
    try {
      var buf = await readBuffer(f);
      var md;
      if (ext === "pdf") md = await fromPdf(buf);
      else if (ext === "docx") md = await fromDocx(buf);
      else if (ext === "xlsx" || ext === "xls" || ext === "csv") md = await fromSheet(buf);
      else throw new Error(T("tm.unsupported"));
      outEl.value = md;
      actions.hidden = false;
      statusEl.textContent = T("tm.done", { n: md.length });
    } catch (e) {
      statusEl.textContent = e && e.message ? e.message : T("tm.fail");
    }
  }

  function download(name, data, mime) {
    var a = document.createElement("a");
    var url = URL.createObjectURL(new Blob([data], { type: mime }));
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  input.addEventListener("change", function () {
    runBtn.disabled = !(input.files && input.files.length);
    statusEl.textContent = "";
  });
  runBtn.addEventListener("click", run);
  document.getElementById("tm-md").addEventListener("click", function () {
    download(nameBase + ".md", outEl.value, "text/markdown;charset=utf-8");
  });
  document.getElementById("tm-docx").addEventListener("click", function () {
    try {
      download(nameBase + ".docx", window.Md2Docx.build(outEl.value), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    } catch (e) {
      statusEl.textContent = T("tm.fail");
    }
  });
  document.getElementById("tm-copy").addEventListener("click", function () {
    var b = this;
    var done = function (k) { b.textContent = T(k); setTimeout(function () { b.textContent = T("tm.copy"); }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(outEl.value).then(function () { done("tm.copied"); }, function () { done("tm.copyfail"); });
    else done("tm.copyfail");
  });
  document.getElementById("tm-editor").addEventListener("click", function () {
    try {
      localStorage.setItem("md-text", outEl.value);
      localStorage.setItem("md-name", nameBase + ".md");
    } catch (e) {}
    location.href = this.getAttribute("data-href");
  });
})();
