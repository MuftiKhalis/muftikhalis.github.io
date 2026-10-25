/* Pomodoro timer. */
(function () {
  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  function nextMode(mode, focusDone) {
    if (mode !== "focus") return "focus";
    return focusDone % 4 === 0 ? "long" : "short";
  }

  if (typeof module !== "undefined") module.exports = { fmt: fmt, nextMode: nextMode };
  if (typeof document === "undefined") return;

  var timeEl = document.getElementById("pomo-time");
  if (!timeEl) return;
  var modeEl = document.getElementById("pomo-mode");
  var startBtn = document.getElementById("pomo-start");
  var countEl = document.getElementById("pomo-count");
  var ins = { focus: document.getElementById("pomo-focus"), short: document.getElementById("pomo-short"), long: document.getElementById("pomo-long") };
  var baseTitle = document.title;

  function load(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  Object.keys(ins).forEach(function (k) {
    ins[k].value = load("pomo-" + k, ins[k].value);
    ins[k].addEventListener("change", function () {
      var v = Math.min(180, Math.max(1, parseInt(ins[k].value, 10) || 1));
      ins[k].value = v;
      save("pomo-" + k, v);
      if (!running && k === mode) reset();
    });
  });

  var today = new Date().toISOString().slice(0, 10);
  var done = load("pomo-day", "") === today ? parseInt(load("pomo-done", "0"), 10) : 0;
  var mode = "focus", running = false, endAt = 0, left = 0, timer = null;

  function minutes(m) { return parseInt(ins[m].value, 10) * 60; }

  function paint() {
    timeEl.textContent = fmt(left);
    modeEl.textContent = t("pomo." + mode);
    startBtn.textContent = running ? t("pomo.pause") : t("pomo.start");
    countEl.textContent = t("pomo.done", { n: done });
    document.title = running ? fmt(left) + " \u2013 " + t("pomo." + mode) : baseTitle;
    document.body.setAttribute("data-pomo", mode);
  }

  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      var ctx = new Ctx();
      for (var i = 0; i < 3; i++) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.frequency.value = 880;
        g.gain.value = 0.12;
        o.connect(g);
        g.connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.35);
        o.stop(ctx.currentTime + i * 0.35 + 0.2);
      }
    } catch (e) {}
  }

  function reset() {
    clearInterval(timer);
    running = false;
    left = minutes(mode);
    paint();
  }

  function finish() {
    clearInterval(timer);
    running = false;
    beep();
    if (mode === "focus") {
      done++;
      save("pomo-day", today);
      save("pomo-done", done);
    }
    mode = nextMode(mode, done);
    left = minutes(mode);
    paint();
  }

  function tick() {
    left = Math.round((endAt - Date.now()) / 1000);
    if (left <= 0) {
      left = 0;
      finish();
      return;
    }
    paint();
  }

  startBtn.addEventListener("click", function () {
    if (running) {
      running = false;
      clearInterval(timer);
      paint();
      return;
    }
    running = true;
    endAt = Date.now() + left * 1000;
    timer = setInterval(tick, 250);
    paint();
  });
  document.getElementById("pomo-reset").addEventListener("click", reset);
  document.getElementById("pomo-skip").addEventListener("click", function () {
    clearInterval(timer);
    running = false;
    mode = nextMode(mode, mode === "focus" ? done + 1 : done);
    left = minutes(mode);
    paint();
  });

  left = minutes(mode);
  paint();
})();
