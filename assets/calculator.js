/* Calculator. Uses a small parser instead of eval(). */
(function () {
  var OPS = "+-*/";
  var SYMBOL = { "+": "+", "-": "\u2212", "*": "\u00d7", "/": "\u00f7" };

  /* Evaluate "12+3.5*2" -> number. Throws on invalid input. */
  function evaluate(src) {
    var tokens = src.match(/\d+\.?\d*|\.\d+|[+\-*/]/g) || [];
    if (tokens.join("") !== src) throw new Error("Invalid expression");
    var pos = 0;

    function factor() {
      var t = tokens[pos++];
      if (t === "-") return -factor();
      if (t === undefined || OPS.indexOf(t) !== -1) throw new Error("Invalid expression");
      return parseFloat(t);
    }
    function term() {
      var v = factor();
      while (tokens[pos] === "*" || tokens[pos] === "/") {
        var op = tokens[pos++];
        var r = factor();
        v = op === "*" ? v * r : v / r;
      }
      return v;
    }
    function expr() {
      var v = term();
      while (tokens[pos] === "+" || tokens[pos] === "-") {
        var op = tokens[pos++];
        var r = term();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    }

    var result = expr();
    if (pos !== tokens.length) throw new Error("Invalid expression");
    return result;
  }

  function format(n) {
    if (!isFinite(n)) throw new Error("Not finite");
    return String(Number(n.toPrecision(12)));
  }

  if (typeof module !== "undefined") {
    module.exports = { evaluate: evaluate, format: format };
  }
  if (typeof document === "undefined") return;

  var exprEl = document.getElementById("calc-expr");
  var resultEl = document.getElementById("calc-result");
  if (!exprEl || !resultEl) return;

  var expr = "";
  var done = false; // true right after "="

  function show(text) {
    resultEl.textContent = text;
  }

  function render() {
    show(
      expr === ""
        ? "0"
        : expr.replace(/[+\-*/]/g, function (c) {
            return " " + SYMBOL[c] + " ";
          }).replace(/^ \u2212 /, "\u2212")
    );
  }

  function press(val) {
    var last = expr.slice(-1);
    var isOp = OPS.indexOf(val) !== -1;

    if (done) {
      exprEl.textContent = "";
      if (!isOp) expr = "";
      done = false;
      render();
    }

    if (isOp) {
      if (expr === "") {
        if (val !== "-") return;
      } else if (OPS.indexOf(last) !== -1) {
        if (expr.length === 1) return; // lone leading minus
        expr = expr.slice(0, -1);
      }
      expr += val;
    } else if (val === ".") {
      var seg = (expr.match(/[\d.]*$/) || [""])[0];
      if (seg.indexOf(".") !== -1) return;
      expr += seg === "" ? "0." : ".";
    } else {
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

  function equals() {
    if (expr === "") return;
    var src = expr;
    while (src && OPS.indexOf(src.slice(-1)) !== -1) src = src.slice(0, -1);
    if (src === "" || src === "-") return;
    try {
      var out = format(evaluate(src));
      exprEl.textContent = render_expr(src) + " =";
      expr = out;
      done = true;
      show(out.replace(/^-/, "\u2212"));
    } catch (e) {
      exprEl.textContent = render_expr(src) + " =";
      expr = "";
      done = true;
      show("Error");
    }
  }

  function render_expr(src) {
    return src
      .replace(/[+\-*/]/g, function (c) {
        return " " + SYMBOL[c] + " ";
      })
      .replace(/^ \u2212 /, "\u2212");
  }

  document.querySelectorAll("[data-key]").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-key");
      if (k === "C") clearAll();
      else if (k === "DEL") backspace();
      else if (k === "=") equals();
      else press(k);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) return;
    var k = e.key;
    if (k === "Enter" && t && t.tagName === "BUTTON") return;
    if (/^[0-9]$/.test(k) || k === "." || OPS.indexOf(k) !== -1) {
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

  render();
})();
