/* Home page: filter the tool grid by group. */
(function () {
  var chips = document.querySelectorAll("[data-filter]");
  var tiles = document.querySelectorAll(".all-tools [data-group]");
  if (!chips.length || !tiles.length) return;
  chips.forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-filter");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === b)); });
      tiles.forEach(function (t) { t.hidden = f !== "all" && t.getAttribute("data-group") !== f; });
    });
  });
})();
