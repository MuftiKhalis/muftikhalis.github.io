/* 2048. Swipe, arrow keys, WASD or the buttons. */
(function () {
  function slideRow(row) {
    var arr = row.filter(Boolean);
    var out = [];
    var score = 0;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === arr[i + 1]) {
        out.push(arr[i] * 2);
        score += arr[i] * 2;
        i++;
      } else {
        out.push(arr[i]);
      }
    }
    while (out.length < row.length) out.push(0);
    return { row: out, score: score };
  }

  function transpose(b) { return b[0].map(function (_, c) { return b.map(function (r) { return r[c]; }); }); }
  function rev(b) { return b.map(function (r) { return r.slice().reverse(); }); }

  function move(board, dir) {
    var b = board.map(function (r) { return r.slice(); });
    if (dir === "up" || dir === "down") b = transpose(b);
    if (dir === "right" || dir === "down") b = rev(b);
    var score = 0;
    b = b.map(function (r) { var s = slideRow(r); score += s.score; return s.row; });
    if (dir === "right" || dir === "down") b = rev(b);
    if (dir === "up" || dir === "down") b = transpose(b);
    var moved = b.some(function (r, i) { return r.some(function (v, j) { return v !== board[i][j]; }); });
    return { board: b, score: score, moved: moved };
  }

  function canMove(board) {
    return ["left", "right", "up", "down"].some(function (d) { return move(board, d).moved; });
  }

  function addTile(board, rng) {
    var empty = [];
    board.forEach(function (r, i) { r.forEach(function (v, j) { if (!v) empty.push([i, j]); }); });
    if (!empty.length) return board;
    var cell = empty[Math.floor(rng() * empty.length)];
    var b = board.map(function (r) { return r.slice(); });
    b[cell[0]][cell[1]] = rng() < 0.9 ? 2 : 4;
    return b;
  }

  if (typeof module !== "undefined") module.exports = { slideRow: slideRow, move: move, canMove: canMove, addTile: addTile };
  if (typeof document === "undefined") return;

  var boardEl = document.getElementById("g2048");
  if (!boardEl) return;
  var scoreEl = document.getElementById("g-score");
  var bestEl = document.getElementById("g-best");
  var msgEl = document.getElementById("g-msg");
  var board, score, best, won;

  function load(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  best = parseInt(load("2048-best", "0"), 10) || 0;

  function paint() {
    boardEl.textContent = "";
    board.forEach(function (r) {
      r.forEach(function (v) {
        var c = document.createElement("div");
        c.className = "tile";
        if (v) {
          c.textContent = v;
          c.setAttribute("data-v", v > 2048 ? "big" : v);
        }
        boardEl.appendChild(c);
      });
    });
    scoreEl.textContent = score;
    bestEl.textContent = best;
  }

  function start() {
    board = addTile(addTile([[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], Math.random), Math.random);
    score = 0;
    won = false;
    msgEl.textContent = "";
    paint();
  }

  function play(dir) {
    var r = move(board, dir);
    if (!r.moved) return;
    board = addTile(r.board, Math.random);
    score += r.score;
    if (score > best) {
      best = score;
      save("2048-best", best);
    }
    paint();
    if (!won && board.some(function (row) { return row.indexOf(2048) !== -1; })) {
      won = true;
      msgEl.textContent = t("g2048.win");
    } else if (!canMove(board)) {
      msgEl.textContent = t("g2048.over");
    }
  }

  var KEYS = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" };
  document.addEventListener("keydown", function (e) {
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || e.ctrlKey || e.metaKey || e.altKey) return;
    var d = KEYS[e.key];
    if (d) {
      e.preventDefault();
      play(d);
    }
  });

  var sx = 0, sy = 0;
  boardEl.addEventListener("touchstart", function (e) {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
  }, { passive: true });
  boardEl.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx;
    var dy = e.changedTouches[0].clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    play(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  }, { passive: true });

  document.querySelectorAll("[data-dir]").forEach(function (b) {
    b.addEventListener("click", function () { play(b.getAttribute("data-dir")); });
  });
  document.getElementById("g-new").addEventListener("click", start);
  start();
})();
