/* Minesweeper. Left click/tap reveals, right click, long press or Flag mode places a flag. */
(function () {
  function neighbors(i, rows, cols) {
    var r = Math.floor(i / cols), c = i % cols, out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.push(rr * cols + cc);
      }
    }
    return out;
  }

  /* Mines never land on the first click or (when there is room) its neighbours. */
  function placeMines(rows, cols, mines, safe, rng) {
    var total = rows * cols;
    var banned = {};
    banned[safe] = true;
    var near = neighbors(safe, rows, cols);
    if (total - 1 - near.length >= mines) near.forEach(function (n) { banned[n] = true; });
    var pool = [];
    for (var i = 0; i < total; i++) if (!banned[i]) pool.push(i);
    for (var k = pool.length - 1; k > 0; k--) {
      var j = Math.floor(rng() * (k + 1));
      var tmp = pool[k]; pool[k] = pool[j]; pool[j] = tmp;
    }
    var arr = new Array(total).fill(false);
    pool.slice(0, mines).forEach(function (m) { arr[m] = true; });
    return arr;
  }

  function counts(mines, rows, cols) {
    return mines.map(function (m, i) {
      return neighbors(i, rows, cols).filter(function (n) { return mines[n]; }).length;
    });
  }

  /* Reveal cell i, flooding through zeros. Returns the list of newly revealed cells. */
  function flood(i, mines, cnt, revealed, flagged, rows, cols) {
    var out = [];
    var stack = [i];
    while (stack.length) {
      var c = stack.pop();
      if (revealed[c] || flagged[c] || mines[c]) continue;
      revealed[c] = true;
      out.push(c);
      if (cnt[c] === 0) neighbors(c, rows, cols).forEach(function (n) { if (!revealed[n]) stack.push(n); });
    }
    return out;
  }

  if (typeof module !== "undefined") module.exports = { neighbors: neighbors, placeMines: placeMines, counts: counts, flood: flood };
  if (typeof document === "undefined") return;

  var boardEl = document.getElementById("ms-board");
  if (!boardEl) return;
  var levelEl = document.getElementById("ms-level");
  var minesEl = document.getElementById("ms-mines");
  var timeEl = document.getElementById("ms-time");
  var msgEl = document.getElementById("ms-msg");
  var flagBtn = document.getElementById("ms-flagmode");
  var LEVELS = { easy: [9, 9, 10], medium: [16, 16, 40] };
  var rows, cols, total, mines, cnt, revealed, flagged, started, over, flagMode, timer, secs, cells;

  function stop() { clearInterval(timer); timer = null; }

  function reset() {
    stop();
    var L = LEVELS[levelEl.value];
    rows = L[0]; cols = L[1]; total = L[2];
    mines = null; cnt = null; started = false; over = false; secs = 0;
    revealed = new Array(rows * cols).fill(false);
    flagged = new Array(rows * cols).fill(false);
    msgEl.textContent = "";
    boardEl.style.setProperty("--cols", cols);
    boardEl.textContent = "";
    cells = [];
    for (var i = 0; i < rows * cols; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ms-cell";
      b.dataset.i = i;
      b.setAttribute("aria-label", t("ms.cell", { r: Math.floor(i / cols) + 1, c: (i % cols) + 1 }));
      boardEl.appendChild(b);
      cells.push(b);
    }
    paintCounters();
  }

  function paintCounters() {
    var f = flagged.filter(Boolean).length;
    minesEl.textContent = total - f;
    timeEl.textContent = secs;
  }

  function paintCell(i) {
    var b = cells[i];
    b.className = "ms-cell";
    b.textContent = "";
    if (revealed[i]) {
      b.classList.add("open");
      b.disabled = true;
      if (mines[i]) { b.classList.add("mine"); b.textContent = "\u2739"; }
      else if (cnt[i]) { b.textContent = cnt[i]; b.setAttribute("data-n", cnt[i]); }
    } else if (flagged[i]) {
      b.classList.add("flag");
      b.textContent = "\u2691";
    }
  }

  function end(win) {
    over = true;
    stop();
    if (!win) {
      mines.forEach(function (m, i) { if (m) { revealed[i] = true; paintCell(i); } });
    } else {
      mines.forEach(function (m, i) { if (m && !flagged[i]) { flagged[i] = true; paintCell(i); } });
    }
    msgEl.textContent = win ? t("ms.win", { s: secs }) : t("ms.lose");
    paintCounters();
  }

  function reveal(i) {
    if (over || flagged[i] || revealed[i]) return;
    if (!started) {
      started = true;
      mines = placeMines(rows, cols, total, i, Math.random);
      cnt = counts(mines, rows, cols);
      timer = setInterval(function () { secs++; timeEl.textContent = secs; }, 1000);
    }
    if (mines[i]) {
      revealed[i] = true;
      paintCell(i);
      cells[i].classList.add("boom");
      end(false);
      return;
    }
    flood(i, mines, cnt, revealed, flagged, rows, cols).forEach(paintCell);
    var open = revealed.filter(Boolean).length;
    if (open === rows * cols - total) end(true);
  }

  function toggleFlag(i) {
    if (over || revealed[i]) return;
    flagged[i] = !flagged[i];
    paintCell(i);
    paintCounters();
  }

  var pressTimer = null, longPressed = false;
  boardEl.addEventListener("click", function (e) {
    var b = e.target.closest(".ms-cell");
    if (!b) return;
    if (longPressed) { longPressed = false; return; }
    var i = +b.dataset.i;
    if (flagMode) toggleFlag(i); else reveal(i);
  });
  boardEl.addEventListener("contextmenu", function (e) {
    var b = e.target.closest(".ms-cell");
    if (!b) return;
    e.preventDefault();
    toggleFlag(+b.dataset.i);
  });
  boardEl.addEventListener("touchstart", function (e) {
    var b = e.target.closest(".ms-cell");
    if (!b) return;
    longPressed = false;
    pressTimer = setTimeout(function () {
      longPressed = true;
      toggleFlag(+b.dataset.i);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 450);
  }, { passive: true });
  ["touchend", "touchmove", "touchcancel"].forEach(function (ev) {
    boardEl.addEventListener(ev, function () { clearTimeout(pressTimer); }, { passive: true });
  });

  flagBtn.addEventListener("click", function () {
    flagMode = !flagMode;
    flagBtn.setAttribute("aria-pressed", String(flagMode));
  });
  levelEl.addEventListener("change", reset);
  document.getElementById("ms-new").addEventListener("click", reset);
  flagMode = false;
  reset();
})();
