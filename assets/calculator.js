/* Calculator with percent, brackets, power, square root, memory and a saved history.
   Uses a small parser instead of eval(). */
(function () {
  var SYMBOL = { "+": "+", "-": "\u2212", "*": "\u00d7", "/": "\u00f7" };
  var BIN = "+-*/^";

  /* ---------- Parser ---------- */

  function tokenize(src) {
    var tokens = src.match(/\d+\.?\d*|\.\d+|[+\-*/^%()\u221a]/g) || [];
    if (tokens.join("") !== src) throw new Error("Invalid expression");
    return tokens;
  }

  /* Add the missing ")" at the end. Throws when there are too many ")". */
  function autoClose(src) {
    var depth = 0;
    for (var i = 0; i < src.length; i++) {
      if (src[i] === "(") depth++;
      else if (src[i] === ")" && --depth < 0) throw new Error("Unbalanced");
    }
    return src + new Array(depth + 1).join(")");
  }

  /* Evaluate "200+10%" -> 220. Percent follows common calculators:
     a + b% = a + a*b/100, a - b% likewise, a * b% = a * b/100. */
  function evaluate(src) {
    var tokens = tokenize(src);
    var pos = 0;
    function peek() { return tokens[pos]; }
    function bad() { throw new Error("Invalid expression"); }

    function primary() {
      var t = tokens[pos++];
      if (t === "(") {
        var r = expr();
        if (tokens[pos++] !== ")") bad();
        return { v: r.v, pct: false };
      }
      if (t === undefined || !/^[\d.]/.test(t)) bad();
      return { v: parseFloat(t), pct: false };
    }
    function postfix() {
      var p = primary();
      while (peek() === "%") {
        pos++;
        p = { v: p.v / 100, pct: true };
      }
      return p;
    }
    function power() {
      var b = postfix();
      if (peek() === "^") {
        pos++;
        var e = unary();
        return { v: Math.pow(b.v, e.v), pct: false };
      }
      return b;
    }
    function unary() {
      var p = peek();
      if (p === "-") {
        pos++;
        var r = unary();
        return { v: -r.v, pct: r.pct };
      }
      if (p === "\u221a") {
        pos++;
        var s = unary();
        if (s.v < 0) throw new Error("Negative root");
        return { v: Math.sqrt(s.v), pct: false };
      }
      return power();
    }
    function term() {
      var l = unary();
      for (;;) {
        var p = peek();
        var op;
        if (p === "*" || p === "/") op = tokens[pos++];
        else if (p === "(" || p === "\u221a") op = "*"; // 2(3+4) and 2√9
        else break;
        var r = unary();
        l = { v: op === "*" ? l.v * r.v : l.v / r.v, pct: false };
      }
      return l;
    }
    function expr() {
      var l = term();
      while (peek() === "+" || peek() === "-") {
        var op = tokens[pos++];
        var r = term();
        var rv = r.pct ? l.v * r.v : r.v;
        l = { v: op === "+" ? l.v + rv : l.v - rv, pct: false };
      }
      return l;
    }

    var result = expr();
    if (pos !== tokens.length) bad();
    return result.v;
  }

  function format(n) {
    if (!isFinite(n)) throw new Error("Not finite");
    return String(Number(n.toPrecision(12)));
  }

  /* "1234567.5" -> "1,234,567.5" (English) or "1.234.567,5" (Indonesian). Works on whole expressions. */
  function groupNumbers(text, lang) {
    if (/e/i.test(text)) return text;
    var id = lang === "id";
    var groupSep = id ? "." : ",";
    var decSep = id ? "," : ".";
    return text.replace(/\d+(?:\.\d*)?/g, function (m) {
      var parts = m.split(".");
      var whole = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);
      return parts.length > 1 ? whole + decSep + parts[1] : whole;
    });
  }

  /* Display form of an expression: symbols, spaces, thousands separators. */
  function pretty(src, lang) {
    if (/e/i.test(src)) return src.replace(/^-/, "\u2212");
    var s = groupNumbers(src, lang);
    s = s.replace(/(^|[(+\-*/^])-/g, "$1\u0001");
    s = s.replace(/[+\-*/]/g, function (c) { return " " + SYMBOL[c] + " "; });
    s = s.replace(/\u0001/g, "\u2212");
    return s.replace(/\s{2,}/g, " ").trim();
  }

  /* Toggle the sign of the number at the end: 5 -> (-5) -> 5. */
  function toggleSign(expr) {
    var m = /\(-(\d+\.?\d*)\)$/.exec(expr);
    if (m) return expr.slice(0, m.index) + m[1];
    m = /(\d+\.?\d*)$/.exec(expr);
    if (!m) return expr;
    var before = expr.slice(0, m.index);
    if (before === "-") return m[1];
    return before + "(-" + m[1] + ")";
  }

  if (typeof module !== "undefined") {
    module.exports = { evaluate: evaluate, format: format, groupNumbers: groupNumbers, pretty: pretty, autoClose: autoClose, toggleSign: toggleSign };
  }
  if (typeof document === "undefined") return;

  /* ---------- UI ---------- */

  var exprEl = document.getElementById("calc-expr");
  var resultEl = document.getElementById("calc-result");
  if (!exprEl || !resultEl) return;
  var memEl = document.getElementById("calc-mem");
  var histEl = document.getElementById("calc-history");
  var histClear = document.getElementById("calc-history-clear");

  var LANG = (document.documentElement.lang || "en").slice(0, 2);
  var expr = "";
  var done = false; // true right after "="
  var memory = 0;
  var history = [];

  function load(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  try { history = JSON.parse(load("calc-history", "[]")); } catch (e) { history = []; }
  if (!Array.isArray(history)) history = [];
  memory = parseFloat(load("calc-mem", "0")) || 0;

  function pr(s) { return pretty(s, LANG); }
  function show(text) { resultEl.textContent = text; }
  function render() { show(expr === "" ? "0" : pr(expr)); }
  function isDigit(c) { return c >= "0" && c <= "9"; }

  function paintMemory() {
    memEl.textContent = memory !== 0 ? "M" : "";
  }

  function paintHistory() {
    histEl.textContent = "";
    if (!history.length) {
      var empty = document.createElement("li");
      empty.className = "hist-empty";
      empty.textContent = t("calc.hist.empty");
      histEl.appendChild(empty);
    }
    history.forEach(function (h) {
      var li = document.createElement("li");
      var use = document.createElement("button");
      use.type = "button";
      use.className = "hist-use";
      use.setAttribute("aria-label", t("calc.hist.use", { r: pr(h.r) }));
      var e = document.createElement("span");
      e.textContent = pr(h.e) + " =";
      var r = document.createElement("strong");
      r.textContent = pr(h.r);
      use.appendChild(e);
      use.appendChild(r);
      use.addEventListener("click", function () { insertValue(h.r); });
      var again = document.createElement("button");
      again.type = "button";
      again.className = "file-btn";
      again.textContent = "\u21ba";
      again.setAttribute("aria-label", t("calc.hist.load", { e: pr(h.e) }));
      again.addEventListener("click", function () {
        expr = h.e;
        done = false;
        exprEl.textContent = "";
        render();
      });
      li.appendChild(use);
      li.appendChild(again);
      histEl.appendChild(li);
    });
    histClear.disabled = !history.length;
  }

  function remember(src, out) {
    history.unshift({ e: src, r: out });
    if (history.length > 100) history.length = 100;
    save("calc-history", JSON.stringify(history));
    paintHistory();
  }

  /* Put a number into the expression (from history or memory). */
  function insertValue(v) {
    var text = String(v);
    if (done || expr === "") {
      expr = text;
      done = false;
      exprEl.textContent = "";
    } else {
      var last = expr.slice(-1);
      if (isDigit(last) || last === "." || last === ")" || last === "%") return;
      expr += text.charAt(0) === "-" ? "(" + text + ")" : text;
    }
    render();
  }

  function press(val) {
    var last = expr.slice(-1);
    var isOp = BIN.indexOf(val) !== -1;

    if (done) {
      exprEl.textContent = "";
      var continues = isOp || val === "%";
      if (!continues) expr = "";
      done = false;
      render();
      last = expr.slice(-1);
    }

    if (isOp) {
      var startsValue = expr === "" || last === "(";
      if (startsValue) {
        if (val !== "-") return;
      } else if (BIN.indexOf(last) !== -1) {
        var canNegate = val === "-" && (last === "*" || last === "/" || last === "^");
        if (!canNegate) {
          if (expr.length === 1) return; // lone leading minus
          expr = expr.slice(0, -1);
        }
      }
      expr += val;
    } else if (val === "%") {
      if (!(isDigit(last) || last === ")" || last === "%")) return;
      expr += "%";
    } else if (val === "(") {
      expr += "(";
    } else if (val === ")") {
      var open = (expr.match(/\(/g) || []).length - (expr.match(/\)/g) || []).length;
      if (open <= 0 || !(isDigit(last) || last === ")" || last === "%")) return;
      expr += ")";
    } else if (val === "\u221a") {
      expr += "\u221a";
    } else if (val === ".") {
      if (last === ")" || last === "%") {
        expr += "*0.";
      } else {
        var seg = (expr.match(/[\d.]*$/) || [""])[0];
        if (seg.indexOf(".") !== -1) return;
        expr += seg === "" ? "0." : ".";
      }
    } else {
      if (last === ")" || last === "%") expr += "*";
      var cur = (expr.match(/[\d.]*$/) || [""])[0];
      if (cur === "0") expr = expr.slice(0, -1);
      expr += val;
    }
    render();
  }

  function clearAll() {
    expr = "";
    done = false;
    exprEl.textContent = "";
    render();
  }

  function backspace() {
    if (done) {
      clearAll();
      return;
    }
    expr = expr.slice(0, -1);
    render();
  }

  function cleanedSource() {
    var src = expr;
    while (src && (BIN.indexOf(src.slice(-1)) !== -1 || src.slice(-1) === "(" || src.slice(-1) === "\u221a")) src = src.slice(0, -1);
    return src === "" || src === "-" ? "" : autoClose(src);
  }

  function failed(shown) {
    exprEl.textContent = shown ? pr(shown) + " =" : "";
    expr = "";
    done = true;
    show(t("calc.error"));
  }

  function equals() {
    if (expr === "") return;
    var src;
    try { src = cleanedSource(); } catch (e) { return failed(expr); }
    if (src === "") return failed(expr);
    try {
      var out = format(evaluate(src));
      exprEl.textContent = pr(src) + " =";
      expr = out;
      done = true;
      show(pr(out));
      remember(src, out);
    } catch (e) {
      failed(src);
    }
  }

  function currentValue() {
    try {
      if (done) return parseFloat(expr);
      var src = cleanedSource();
      return src ? evaluate(src) : NaN;
    } catch (e) {
      return NaN;
    }
  }

  function memoryOp(k) {
    if (k === "MC") memory = 0;
    else if (k === "MR") {
      insertValue(format(memory));
      return;
    } else {
      var v = currentValue();
      if (!isFinite(v)) return;
      memory = Number((memory + (k === "M+" ? v : -v)).toPrecision(12));
    }
    save("calc-mem", String(memory));
    paintMemory();
  }

  function sign() {
    var wasDone = done;
    expr = toggleSign(expr);
    if (wasDone) {
      if (/^\(-/.test(expr)) expr = "-" + expr.slice(2, -1);
      done = false;
      exprEl.textContent = "";
    }
    render();
  }

  document.querySelectorAll("[data-key]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-key");
      if (k === "C") clearAll();
      else if (k === "DEL") backspace();
      else if (k === "=") equals();
      else if (k === "MC" || k === "MR" || k === "M+" || k === "M-") memoryOp(k);
      else if (k === "+/-") sign();
      else press(k);
    });
  });

  histClear.addEventListener("click", function () {
    history = [];
    save("calc-history", "[]");
    paintHistory();
  });

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target;
    if (tg && (tg.tagName === "INPUT" || tg.tagName === "SELECT" || tg.tagName === "TEXTAREA")) return;
    var k = e.key;
    if (k === "," && LANG === "id") k = ".";
    if (k === "Enter" && tg && tg.tagName === "BUTTON") return;
    if (/^[0-9]$/.test(k) || k === "." || BIN.indexOf(k) !== -1 || k === "%" || k === "(" || k === ")") {
      e.preventDefault();
      press(k);
    } else if (k === "Enter" || k === "=") {
      e.preventDefault();
      equals();
    } else if (k === "Backspace") {
      e.preventDefault();
      backspace();
    } else if (k === "Escape" || k === "Delete") {
      clearAll();
    }
  });

  paintMemory();
  paintHistory();
  render();
})();
