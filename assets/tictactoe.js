/* Tic Tac Toe. Human is X; the AI is O. Five AI levels. */
(function () {
  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  function winner(b) {
    for (var i = 0; i < LINES.length; i++) {
      var l = LINES[i];
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) {
        return { mark: b[l[0]], line: l };
      }
    }
    return null;
  }

  function empties(b) {
    var out = [];
    for (var i = 0; i < 9; i++) if (!b[i]) out.push(i);
    return out;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /* A cell that completes a line for `mark`, or -1. */
  function finishing(b, mark) {
    var free = empties(b);
    for (var i = 0; i < free.length; i++) {
      b[free[i]] = mark;
      var w = winner(b);
      b[free[i]] = "";
      if (w) return free[i];
    }
    return -1;
  }

  function minimax(b, turn, ai) {
    var w = winner(b);
    if (w) return w.mark === ai ? 10 : -10;
    var free = empties(b);
    if (!free.length) return 0;
    var best = turn === ai ? -Infinity : Infinity;
    var other = turn === "O" ? "X" : "O";
    for (var i = 0; i < free.length; i++) {
      b[free[i]] = turn;
      var score = minimax(b, other, ai);
      b[free[i]] = "";
      // prefer faster wins and slower losses
      score += score > 0 ? -1 : score < 0 ? 1 : 0;
      best = turn === ai ? Math.max(best, score) : Math.min(best, score);
    }
    return best;
  }

  function optimal(b, ai) {
    var human = ai === "O" ? "X" : "O";
    var free = empties(b);
    var bestScore = -Infinity;
    var bestMoves = [];
    for (var i = 0; i < free.length; i++) {
      b[free[i]] = ai;
      var s = minimax(b, human, ai);
      b[free[i]] = "";
      if (s > bestScore) {
        bestScore = s;
        bestMoves = [free[i]];
      } else if (s === bestScore) {
        bestMoves.push(free[i]);
      }
    }
    return pick(bestMoves);
  }

  function heuristic(b, ai, useShape) {
    var human = ai === "O" ? "X" : "O";
    var m = finishing(b, ai);
    if (m !== -1) return m;
    m = finishing(b, human);
    if (m !== -1) return m;
    if (useShape) {
      if (!b[4]) return 4;
      var corners = [0, 2, 6, 8].filter(function (i) { return !b[i]; });
      if (corners.length) return pick(corners);
    }
    return pick(empties(b));
  }

  function chooseMove(b, level, ai) {
    switch (level) {
      case "easy":
        return pick(empties(b));
      case "medium":
        return heuristic(b, ai, false);
      case "hard":
        return heuristic(b, ai, true);
      case "expert":
        return Math.random() < 0.85 ? optimal(b, ai) : heuristic(b, ai, true);
      default:
        return optimal(b, ai);
    }
  }

  if (typeof module !== "undefined") {
    module.exports = { winner: winner, chooseMove: chooseMove, empties: empties };
  }
  if (typeof document === "undefined") return;

  var boardEl = document.getElementById("board");
  if (!boardEl) return;

  var cells = Array.prototype.slice.call(boardEl.querySelectorAll(".cell"));
  var statusEl = document.getElementById("ttt-status");
  var modeSel = document.getElementById("mode-select");
  var levelSel = document.getElementById("level-select");
  var firstSel = document.getElementById("first-move-select");
  var aiOptions = document.getElementById("pvai-options");

  var board, current, over, token = 0;

  function vsAI() {
    return modeSel.value === "pvai";
  }

  function paint(winLine) {
    cells.forEach(function (c, i) {
      var mark = board[i];
      c.textContent = mark;
      if (mark) c.dataset.mark = mark;
      else delete c.dataset.mark;
      c.disabled = over || !!mark || (vsAI() && current === "O");
      c.classList.toggle("win", !!winLine && winLine.indexOf(i) !== -1);
      var row = Math.floor(i / 3) + 1;
      var col = (i % 3) + 1;
      c.setAttribute("aria-label", "Row " + row + ", column " + col + ", " + (mark || "empty"));
    });
  }

  function say(text) {
    statusEl.textContent = text;
  }

  function turnText() {
    if (vsAI()) return current === "X" ? "Your turn (X)" : "AI is thinking\u2026";
    return current + "\u2019s turn";
  }

  function finish(w) {
    over = true;
    if (w) {
      var who = vsAI() ? (w.mark === "X" ? "You win!" : "AI wins.") : w.mark + " wins!";
      say(who);
      paint(w.line);
    } else {
      say("It\u2019s a draw.");
      paint(null);
    }
  }

  function afterMove() {
    var w = winner(board);
    if (w || !empties(board).length) {
      finish(w);
      return;
    }
    current = current === "X" ? "O" : "X";
    say(turnText());
    paint(null);
    if (vsAI() && current === "O") scheduleAI();
  }

  function scheduleAI() {
    var mine = token;
    setTimeout(function () {
      if (mine !== token || over) return;
      var move = chooseMove(board.slice(), levelSel.value, "O");
      board[move] = "O";
      afterMove();
    }, 450);
  }

  function reset() {
    token++;
    board = Array(9).fill("");
    over = false;
    current = vsAI() && firstSel.value === "ai" ? "O" : "X";
    aiOptions.hidden = !vsAI();
    say(turnText());
    paint(null);
    if (vsAI() && current === "O") scheduleAI();
  }

  boardEl.addEventListener("click", function (e) {
    var c = e.target.closest(".cell");
    if (!c || over) return;
    var i = cells.indexOf(c);
    if (board[i] || (vsAI() && current !== "X")) return;
    board[i] = current;
    afterMove();
  });

  [modeSel, levelSel, firstSel].forEach(function (el) {
    el.addEventListener("change", reset);
  });
  document.getElementById("ttt-reset").addEventListener("click", reset);

  reset();
})();
