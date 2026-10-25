/* English quiz: grammar and vocabulary, random rounds with explanations. */
(function () {
  function shuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t0 = a[i]; a[i] = a[j]; a[j] = t0;
    }
    return a;
  }
  function pick(bank, kind, n, rng) {
    var pool = bank.filter(function (q) { return kind === "mix" || q.k === kind; });
    return shuffle(pool, rng).slice(0, n);
  }
  function valid(bank) {
    return bank.every(function (q) {
      return q.o.length === 4 && q.a >= 0 && q.a < 4 && q.en && q.id && q.q && (q.k === "g" || q.k === "v") &&
        (q.k !== "g" || q.q.indexOf("____") !== -1) && new Set(q.o).size === 4;
    });
  }

  if (typeof module !== "undefined") module.exports = { shuffle: shuffle, pick: pick, valid: valid };
  if (typeof document === "undefined" || !window.QUIZ) return;

  var startEl = document.getElementById("qz-start");
  if (!startEl) return;
  var playEl = document.getElementById("qz-play");
  var endEl = document.getElementById("qz-end");
  var kindEl = document.getElementById("qz-kind");
  var lang = (document.documentElement.lang || "en").slice(0, 2) === "id" ? "id" : "en";
  var round, idx, score, missed;

  function load(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function show(which) {
    startEl.hidden = which !== "start";
    playEl.hidden = which !== "play";
    endEl.hidden = which !== "end";
  }

  function begin() {
    round = pick(window.QUIZ, kindEl.value, 10, Math.random);
    idx = 0; score = 0; missed = [];
    show("play");
    ask();
  }

  function ask() {
    var q = round[idx];
    document.getElementById("qz-prog").textContent = t("qz.progress", { i: idx + 1, n: round.length });
    document.getElementById("qz-level").textContent = q.l + " \u00b7 " + t(q.k === "g" ? "qz.grammar" : "qz.vocab");
    document.getElementById("qz-q").textContent = q.q;
    var box = document.getElementById("qz-opts");
    box.textContent = "";
    var fb = document.getElementById("qz-fb");
    fb.hidden = true;
    fb.textContent = "";
    document.getElementById("qz-next").hidden = true;
    q._order = shuffle([0, 1, 2, 3], Math.random);
    q._order.forEach(function (orig) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "qz-opt";
      b.textContent = q.o[orig];
      b.addEventListener("click", function () { answer(orig); });
      box.appendChild(b);
    });
  }

  function answer(i) {
    var q = round[idx];
    var opts = document.querySelectorAll("#qz-opts .qz-opt");
    opts.forEach(function (b, p) {
      var orig = q._order[p];
      b.disabled = true;
      if (orig === q.a) b.classList.add("right");
      else if (orig === i) b.classList.add("wrong");
    });
    var right = i === q.a;
    if (right) score++; else missed.push(q);
    var fb = document.getElementById("qz-fb");
    fb.hidden = false;
    fb.className = "qz-fb " + (right ? "ok" : "no");
    var head = document.createElement("strong");
    head.textContent = right ? t("qz.right") : t("qz.wrong", { a: q.o[q.a] });
    var p = document.createElement("span");
    p.textContent = " " + q[lang];
    fb.appendChild(head);
    fb.appendChild(p);
    var next = document.getElementById("qz-next");
    next.hidden = false;
    next.textContent = idx === round.length - 1 ? t("qz.finish") : t("qz.next");
    next.focus();
  }

  function finish() {
    show("end");
    var pct = Math.round((score / round.length) * 100);
    document.getElementById("qz-score").textContent = score + " / " + round.length;
    var best = parseInt(load("qz-best", "0"), 10) || 0;
    if (score > best) {
      best = score;
      save("qz-best", best);
    }
    document.getElementById("qz-result").textContent = t("qz.result", { p: pct, b: best });
    var list = document.getElementById("qz-missed");
    list.textContent = "";
    missed.forEach(function (q) {
      var li = document.createElement("li");
      var a = document.createElement("strong");
      a.textContent = q.q.replace("____", q.o[q.a]);
      var b = document.createElement("span");
      b.textContent = q[lang];
      li.appendChild(a);
      li.appendChild(b);
      list.appendChild(li);
    });
    document.getElementById("qz-missed-wrap").hidden = !missed.length;
  }

  document.getElementById("qz-go").addEventListener("click", begin);
  document.getElementById("qz-again").addEventListener("click", function () { show("start"); });
  document.getElementById("qz-next").addEventListener("click", function () {
    if (idx === round.length - 1) finish();
    else { idx++; ask(); }
  });
  show("start");
})();
