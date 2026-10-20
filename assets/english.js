/* English resources: show one category at a time, or all. */
(function () {
  var buttons = document.querySelectorAll("[data-filter]");
  var groups = document.querySelectorAll(".res-group");
  if (!buttons.length || !groups.length) return;

  function apply(name) {
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === name));
    });
    groups.forEach(function (g) {
      g.hidden = !(name === "all" || g.id === name);
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      apply(b.getAttribute("data-filter"));
    });
  });

  var wanted = location.hash.slice(1);
  var known = Array.prototype.some.call(groups, function (g) { return g.id === wanted; });
  apply(known ? wanted : "grammar");
})();
