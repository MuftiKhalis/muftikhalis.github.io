/* Month calendar (weeks start Monday). Click a day to see how far it is from today. */
(function () {
  var grid = document.getElementById("cal-grid");
  var title = document.getElementById("cal-title");
  var diffEl = document.getElementById("cal-diff");
  if (!grid || !title || !diffEl) return;

  var LOC = document.documentElement.lang || undefined;
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth();
  var selected = null; // {y, m, d}

  var fullDate = new Intl.DateTimeFormat(LOC, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  var monthTitle = new Intl.DateTimeFormat(LOC, { month: "long", year: "numeric" });

  function dayNumber(y, m, d) {
    return Math.round(Date.UTC(y, m, d) / 86400000);
  }

  function plural(n, word) {
    return n + " " + word + (n === 1 ? "" : "s");
  }

  function describe(y, m, d) {
    var diff = dayNumber(y, m, d) - dayNumber(today.getFullYear(), today.getMonth(), today.getDate());
    var label = fullDate.format(new Date(y, m, d));
    var text;
    if (diff === 0) text = t("cal.today");
    else if (diff > 0) text = t(diff === 1 ? "cal.ahead.one" : "cal.ahead.other", { n: diff });
    else text = t(-diff === 1 ? "cal.ago.one" : "cal.ago.other", { n: -diff });
    diffEl.innerHTML = "";
    diffEl.appendChild(document.createTextNode(text));
    var small = document.createElement("small");
    small.textContent = label;
    diffEl.appendChild(small);
  }

  function weekdayLabels() {
    var f = new Intl.DateTimeFormat(LOC, { weekday: "short" });
    var long = new Intl.DateTimeFormat(LOC, { weekday: "long" });
    var out = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(2024, 0, 1 + i); // 1 Jan 2024 is a Monday
      out.push({ short: f.format(d), long: long.format(d) });
    }
    return out;
  }

  var labels = weekdayLabels();

  function render() {
    title.textContent = monthTitle.format(new Date(year, month, 1));
    grid.textContent = "";

    labels.forEach(function (l) {
      var span = document.createElement("span");
      span.className = "cal-dow";
      span.textContent = l.short;
      span.title = l.long;
      grid.appendChild(span);
    });

    var first = new Date(year, month, 1).getDay(); // 0 = Sunday
    var offset = first === 0 ? 6 : first - 1;
    for (var i = 0; i < offset; i++) grid.appendChild(document.createElement("span"));

    var count = new Date(year, month + 1, 0).getDate();
    for (var day = 1; day <= count; day++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cal-day";
      b.textContent = day;
      b.setAttribute("aria-label", fullDate.format(new Date(year, month, day)));
      b.dataset.day = day;
      var isToday =
        year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
      if (isToday) b.setAttribute("aria-current", "date");
      var isSel = selected && selected.y === year && selected.m === month && selected.d === day;
      b.setAttribute("aria-pressed", isSel ? "true" : "false");
      grid.appendChild(b);
    }
  }

  grid.addEventListener("click", function (e) {
    var b = e.target.closest(".cal-day");
    if (!b) return;
    selected = { y: year, m: month, d: Number(b.dataset.day) };
    grid.querySelectorAll(".cal-day").forEach(function (x) {
      x.setAttribute("aria-pressed", x === b ? "true" : "false");
    });
    describe(selected.y, selected.m, selected.d);
  });

  function shift(delta) {
    month += delta;
    if (month < 0) {
      month = 11;
      year--;
    } else if (month > 11) {
      month = 0;
      year++;
    }
    render();
  }

  document.getElementById("cal-prev").addEventListener("click", function () {
    shift(-1);
  });
  document.getElementById("cal-next").addEventListener("click", function () {
    shift(1);
  });
  document.getElementById("cal-today").addEventListener("click", function () {
    year = today.getFullYear();
    month = today.getMonth();
    selected = { y: year, m: month, d: today.getDate() };
    render();
    describe(selected.y, selected.m, selected.d);
  });

  render();
})();
