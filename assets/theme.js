/* Theme: palette + mode, saved in the browser. Loaded in <head> so the page never flashes. */
(function () {
  var root = document.documentElement;
  var PALETTES = ["ocean", "forest", "stone", "plum"];
  var MODES = ["auto", "light", "dark"];
  var BROWSER_BAR = {
    ocean: ["#f0f4f8", "#0c1622"],
    forest: ["#f2f5ee", "#0e1a14"],
    stone: ["#f3f3f3", "#121214"],
    plum: ["#f6f2f7", "#170f1b"],
  };
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function load(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  var palette = load("palette", "ocean");
  var mode = load("mode", "auto");
  if (PALETTES.indexOf(palette) < 0) palette = "ocean";
  if (MODES.indexOf(mode) < 0) mode = "auto";

  function resolved() {
    return mode === "auto" ? (mq && mq.matches ? "dark" : "light") : mode;
  }

  function sync() {
    document.querySelectorAll("[data-palette-btn]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-palette-btn") === palette));
    });
    document.querySelectorAll("[data-mode-btn]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-mode-btn") === mode));
    });
  }

  function apply() {
    var r = resolved();
    root.setAttribute("data-palette", palette);
    root.setAttribute("data-mode", r);
    var bar = BROWSER_BAR[palette][r === "dark" ? 1 : 0];
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute("content", bar);
      m.removeAttribute("media");
    });
    document.dispatchEvent(new Event("themechange"));
  }

  apply();

  if (mq) {
    var onSystem = function () {
      if (mode === "auto") apply();
    };
    if (mq.addEventListener) mq.addEventListener("change", onSystem);
    else if (mq.addListener) mq.addListener(onSystem);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-palette-btn]").forEach(function (b) {
      b.addEventListener("click", function () {
        palette = b.getAttribute("data-palette-btn");
        save("palette", palette);
        apply();
        sync();
      });
    });
    document.querySelectorAll("[data-mode-btn]").forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-mode-btn");
        save("mode", mode);
        apply();
        sync();
      });
    });
    sync();
  });
})();
