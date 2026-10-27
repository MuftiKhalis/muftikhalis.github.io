/* Markdown editor: toolbar, live preview, download .md/.html, autosave in the browser. */
(function () {
  /* ---------- Pure text edits (also used by tests). Each returns {value, start, end}. ---------- */

  function wrap(v, s, e, left, right, placeholder) {
    var sel = v.slice(s, e);
    if (s - left.length >= 0 && v.slice(s - left.length, s) === left && v.slice(e, e + right.length) === right) {
      return { value: v.slice(0, s - left.length) + sel + v.slice(e + right.length), start: s - left.length, end: e - left.length };
    }
    if (sel.length >= left.length + right.length && sel.indexOf(left) === 0 && sel.slice(sel.length - right.length) === right) {
      var inner = sel.slice(left.length, sel.length - right.length);
      return { value: v.slice(0, s) + inner + v.slice(e), start: s, end: s + inner.length };
    }
    var text = sel || placeholder;
    return { value: v.slice(0, s) + left + text + right + v.slice(e), start: s + left.length, end: s + left.length + text.length };
  }

  /* kind: ul | ol | quote | h1 | h2 | h3 */
  function lineEdit(v, s, e, kind) {
    var endRef = e > s && v.charAt(e - 1) === "\n" ? e - 1 : e;
    var ls = v.lastIndexOf("\n", s - 1) + 1;
    var le = v.indexOf("\n", endRef);
    if (le === -1) le = v.length;
    var lines = v.slice(ls, le).split("\n");
    var isHeading = kind.charAt(0) === "h";
    var re = kind === "ul" ? /^[-*+]\s+/ : kind === "ol" ? /^\d+\.\s+/ : kind === "quote" ? /^>\s?/ : /^#{1,6}\s+/;

    var targets = lines.map(function (l, i) { return i; }).filter(function (i) { return lines[i].trim() !== ""; });
    if (!targets.length) targets = lines.map(function (l, i) { return i; });
    var allHave = targets.every(function (i) { return re.test(lines[i]); });

    var n = 0;
    var out = lines.map(function (l, i) {
      if (targets.indexOf(i) === -1) return l;
      if (isHeading) {
        var lvl = parseInt(kind.slice(1), 10);
        var m = /^(#{1,6})\s+/.exec(l);
        if (m && m[1].length === lvl) return l.replace(re, "");
        return new Array(lvl + 1).join("#") + " " + l.replace(re, "");
      }
      if (allHave) return l.replace(re, "");
      n++;
      var prefix = kind === "ul" ? "- " : kind === "quote" ? "> " : n + ". ";
      return prefix + l.replace(re, "");
    });
    var block = out.join("\n");
    var single = lines.length === 1;
    return {
      value: v.slice(0, ls) + block + v.slice(le),
      start: single && s === e ? ls + block.length : ls,
      end: ls + block.length,
    };
  }

  /* Insert a block with blank lines around it. */
  function insertBlock(v, s, e, block) {
    var before = v.slice(0, s);
    var after = v.slice(e);
    var pre = before === "" || /\n\n$/.test(before) ? "" : /\n$/.test(before) ? "\n" : "\n\n";
    var post = after === "" || /^\n\n/.test(after) ? "" : /^\n/.test(after) ? "\n" : "\n\n";
    return {
      value: before + pre + block + post + after,
      start: s + pre.length,
      end: s + pre.length + block.length,
      pre: pre.length,
    };
  }

  function makeLink(v, s, e, placeholder) {
    var sel = v.slice(s, e);
    var text = sel || placeholder || "link text";
    var url = "https://";
    var value = v.slice(0, s) + "[" + text + "](" + url + ")" + v.slice(e);
    var urlStart = s + text.length + 3;
    return sel
      ? { value: value, start: urlStart, end: urlStart + url.length }
      : { value: value, start: s + 1, end: s + 1 + text.length };
  }

  function makeCode(v, s, e, placeholder) {
    var sel = v.slice(s, e);
    if (sel.indexOf("\n") !== -1) {
      var r = insertBlock(v, s, e, "```\n" + sel.replace(/\n$/, "") + "\n```");
      return { value: r.value, start: r.start + 4, end: r.start + 4 + sel.replace(/\n$/, "").length };
    }
    return wrap(v, s, e, "`", "`", placeholder || "code");
  }

  function makeTable(v, s, e, labels) {
    var a = (labels && labels[0]) || "Column A";
    var b = (labels && labels[1]) || "Column B";
    var c = (labels && labels[2]) || "Cell";
    var r = insertBlock(v, s, e, "| " + a + " | " + b + " |\n| --- | --- |\n| " + c + " | " + c + " |");
    return { value: r.value, start: r.start + 2, end: r.start + 2 + a.length };
  }

  /* Enter inside a list or quote: continue it, or end it when the item is empty. Returns {value, pos} or null. */
  function continueList(v, pos) {
    var ls = v.lastIndexOf("\n", pos - 1) + 1;
    var le = v.indexOf("\n", pos);
    if (le === -1) le = v.length;
    if (pos !== le) return null;
    var line = v.slice(ls, le);
    var m = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(line);
    var prefix, rest;
    if (m) {
      rest = m[3];
      var marker = /^\d+\.$/.test(m[2]) ? parseInt(m[2], 10) + 1 + "." : m[2];
      prefix = m[1] + marker + " ";
    } else {
      var q = /^(\s*>\s?)(.*)$/.exec(line);
      if (!q) return null;
      prefix = q[1].replace(/\s*$/, "") + " ";
      rest = q[2];
    }
    if (rest.trim() === "") {
      return { value: v.slice(0, ls) + v.slice(le), pos: ls };
    }
    var ins = "\n" + prefix;
    return { value: v.slice(0, pos) + ins + v.slice(pos), pos: pos + ins.length };
  }

  function safeName(name, ext) {
    var n = String(name || "").replace(/[\\/:*?"<>|]+/g, "-").trim() || "untitled";
    if (ext === "md") return /\.(md|markdown|txt)$/i.test(n) ? n : n + ".md";
    return n.replace(/\.(md|markdown|txt|html?|docx)$/i, "") + "." + ext;
  }

  function count(text) {
    var words = (text.match(/\S+/g) || []).length;
    return { words: words, chars: text.length };
  }

  if (typeof module !== "undefined") {
    module.exports = {
      wrap: wrap, lineEdit: lineEdit, insertBlock: insertBlock, makeLink: makeLink, makeCode: makeCode,
      makeTable: makeTable, continueList: continueList, safeName: safeName, count: count,
    };
  }
  if (typeof document === "undefined") return;

  /* ---------- UI ---------- */

  var app = document.getElementById("md-app");
  var ta = document.getElementById("md-text");
  var preview = document.getElementById("md-preview");
  if (!app || !ta || !preview) return;

  var nameEl = document.getElementById("md-name");
  var metaEl = document.getElementById("md-meta");

  var SAMPLE = t("md.sample");

  function load(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  var savedText = load("md-text");
  ta.value = savedText === null ? SAMPLE : savedText;
  nameEl.value = load("md-name") || t("md.untitled");

  var renderTimer = null;
  function render() {
    var md = ta.value;
    if (!window.marked || !window.DOMPurify) {
      preview.textContent = t("md.nolib");
      return;
    }
    if (md.trim() === "") {
      preview.innerHTML = '<p class="md-empty"></p>';
      preview.firstChild.textContent = t("md.empty");
      return;
    }
    preview.innerHTML = window.DOMPurify.sanitize(window.marked.parse(md));
  }

  if (window.DOMPurify && window.DOMPurify.addHook) {
    window.DOMPurify.addHook("afterSanitizeAttributes", function (node) {
      if (node.tagName === "A" && node.getAttribute("href")) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  function updateMeta(saved) {
    var c = count(ta.value);
    metaEl.textContent = t(c.words === 1 ? "md.meta.one" : "md.meta.other", { w: c.words, c: c.chars }) + (saved ? " " + t("md.saved") : "");
  }

  var saveTimer = null;
  function onChange() {
    updateMeta(false);
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 120);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      save("md-text", ta.value);
      save("md-name", nameEl.value);
      updateMeta(true);
    }, 500);
  }

  function applyEdit(res) {
    var old = ta.value;
    var nw = res.value;
    var p = 0;
    var max = Math.min(old.length, nw.length);
    while (p < max && old.charCodeAt(p) === nw.charCodeAt(p)) p++;
    var so = old.length;
    var sn = nw.length;
    while (so > p && sn > p && old.charCodeAt(so - 1) === nw.charCodeAt(sn - 1)) {
      so--;
      sn--;
    }
    ta.focus();
    ta.setSelectionRange(p, so);
    var ok = false;
    try {
      ok = document.execCommand("insertText", false, nw.slice(p, sn));
    } catch (err) {}
    if (!ok || ta.value !== nw) {
      ta.value = nw;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
    ta.setSelectionRange(res.start, res.end);
  }

  function act(name) {
    var v = ta.value;
    var s = ta.selectionStart;
    var e = ta.selectionEnd;
    var res;
    switch (name) {
      case "bold": res = wrap(v, s, e, "**", "**", t("md.ph.bold")); break;
      case "italic": res = wrap(v, s, e, "*", "*", t("md.ph.italic")); break;
      case "h1": case "h2": case "h3": case "ul": case "ol": case "quote": res = lineEdit(v, s, e, name); break;
      case "code": res = makeCode(v, s, e, t("md.ph.code")); break;
      case "link": res = makeLink(v, s, e, t("md.ph.link")); break;
      case "table": res = makeTable(v, s, e, [t("md.ph.cola"), t("md.ph.colb"), t("md.ph.cell")]); break;
      default: return;
    }
    applyEdit(res);
  }

  app.querySelectorAll("[data-act]").forEach(function (b) {
    b.addEventListener("click", function () {
      act(b.getAttribute("data-act"));
    });
  });

  ta.addEventListener("input", onChange);
  nameEl.addEventListener("input", onChange);

  ta.addEventListener("keydown", function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey && !e.shiftKey) {
      var k = e.key.toLowerCase();
      var map = { b: "bold", i: "italic", k: "link" };
      if (map[k]) {
        e.preventDefault();
        act(map[k]);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !mod && !e.altKey && ta.selectionStart === ta.selectionEnd) {
      var r = continueList(ta.value, ta.selectionStart);
      if (r) {
        e.preventDefault();
        applyEdit({ value: r.value, start: r.pos, end: r.pos });
      }
    }
  });

  function download(filename, text, mime) {
    var a = document.createElement("a");
    var url = URL.createObjectURL(new Blob([text], { type: mime }));
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  document.getElementById("md-download").addEventListener("click", function () {
    download(safeName(nameEl.value, "md"), ta.value, "text/markdown;charset=utf-8");
  });

  document.getElementById("md-html").addEventListener("click", function () {
    var h1 = preview.querySelector("h1");
    var title = h1 ? h1.textContent : safeName(nameEl.value, "md").replace(/\.[^.]+$/, "");
    var doc =
      '<!DOCTYPE html>\n<html lang="' + (document.documentElement.lang || 'en') + '">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' +
      esc(title) +
      "</title>\n<style>body{max-width:42rem;margin:2rem auto;padding:0 1rem;font:1.0625rem/1.6 system-ui,sans-serif;color:#14181a}" +
      "pre{background:#f3f4f6;padding:1rem;overflow:auto}code{background:#f3f4f6;padding:.1em .3em;border-radius:4px}" +
      "pre code{padding:0;background:none}blockquote{margin-left:0;padding-left:1rem;border-left:3px solid #999;color:#555}" +
      "table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:.3rem .6rem}img{max-width:100%}</style>\n</head>\n<body>\n" +
      preview.innerHTML +
      "\n</body>\n</html>\n";
    download(safeName(nameEl.value, "html"), doc, "text/html;charset=utf-8");
  });

  document.getElementById("md-docx").addEventListener("click", function () {
    try {
      download(safeName(nameEl.value, "docx"), window.Md2Docx.build(ta.value), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    } catch (e) {
      metaEl.textContent = t("md.docxfail");
    }
  });

  document.getElementById("md-print").addEventListener("click", function () {
    render();
    window.print();
  });

  document.getElementById("md-new").addEventListener("click", function () {
    if (ta.value.trim() !== "" && !window.confirm(t("md.confirm"))) return;
    ta.value = "";
    nameEl.value = t("md.untitled");
    onChange();
    ta.focus();
  });

  document.getElementById("md-open").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      ta.value = String(r.result).replace(/^\uFEFF/, "");
      nameEl.value = f.name;
      onChange();
    };
    r.readAsText(f);
    e.target.value = "";
  });

  var tabs = app.querySelectorAll("[data-pane]");
  function showPane(name) {
    app.setAttribute("data-pane", name);
    tabs.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-pane") === name));
    });
    if (name === "preview") render();
  }
  tabs.forEach(function (b) {
    b.addEventListener("click", function () {
      showPane(b.getAttribute("data-pane"));
    });
  });
  showPane("write");

  render();
  updateMeta(savedText !== null);
})();
