/* Unit converter. */
(function () {
  var CATS = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, "in": 0.0254, nmi: 1852 },
    area: { "m\u00b2": 1, "km\u00b2": 1e6, ha: 1e4, "cm\u00b2": 1e-4, acre: 4046.8564224, "ft\u00b2": 0.09290304, "mi\u00b2": 2589988.110336 },
    mass: { kg: 1, g: 0.001, mg: 1e-6, t: 1000, lb: 0.45359237, oz: 0.028349523125 },
    volume: { L: 1, mL: 0.001, "m\u00b3": 1000, "gal (US)": 3.785411784, "cup (US)": 0.2365882365, "fl oz (US)": 0.0295735295625, tbsp: 0.01478676478125, tsp: 0.00492892159375 },
    speed: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, kn: 1852 / 3600 },
    data: { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824 },
    temperature: { "\u00b0C": 1, "\u00b0F": 1, K: 1 },
  };

  function toCelsius(v, u) {
    return u === "\u00b0F" ? ((v - 32) * 5) / 9 : u === "K" ? v - 273.15 : v;
  }
  function fromCelsius(c, u) {
    return u === "\u00b0F" ? (c * 9) / 5 + 32 : u === "K" ? c + 273.15 : c;
  }

  function convert(cat, value, from, to) {
    if (cat === "temperature") return fromCelsius(toCelsius(value, from), to);
    var units = CATS[cat];
    return (value * units[from]) / units[to];
  }

  function format(n) {
    if (!isFinite(n)) return "\u2013";
    if (n === 0) return "0";
    var abs = Math.abs(n);
    if (abs >= 1e12 || abs < 1e-6) return n.toExponential(6).replace(/\.?0+e/, "e");
    return String(Number(n.toPrecision(10)));
  }

  if (typeof module !== "undefined") module.exports = { CATS: CATS, convert: convert, format: format };
  if (typeof document === "undefined") return;

  var catSel = document.getElementById("u-cat");
  var valEl = document.getElementById("u-value");
  var fromSel = document.getElementById("u-from");
  var toSel = document.getElementById("u-to");
  var resEl = document.getElementById("u-result");
  var tableEl = document.getElementById("u-table");
  if (!catSel) return;

  Object.keys(CATS).forEach(function (c) {
    var o = document.createElement("option");
    o.value = c;
    o.textContent = t("units.cat." + c);
    catSel.appendChild(o);
  });

  function fill(sel, units, pick) {
    sel.textContent = "";
    units.forEach(function (u) {
      var o = document.createElement("option");
      o.value = u;
      o.textContent = u;
      sel.appendChild(o);
    });
    sel.value = pick;
  }

  var DEFAULTS = { length: ["km", "mi"], area: ["ha", "acre"], mass: ["kg", "lb"], volume: ["L", "gal (US)"], speed: ["km/h", "mph"], data: ["MB", "MiB"], temperature: ["\u00b0C", "\u00b0F"] };

  function setCategory() {
    var units = Object.keys(CATS[catSel.value]);
    var d = DEFAULTS[catSel.value];
    fill(fromSel, units, d[0]);
    fill(toSel, units, d[1]);
    update();
  }

  function update() {
    var cat = catSel.value;
    var v = parseFloat(valEl.value.replace(",", "."));
    tableEl.textContent = "";
    if (!isFinite(v)) {
      resEl.textContent = "\u2013";
      return;
    }
    resEl.textContent = format(convert(cat, v, fromSel.value, toSel.value)) + " " + toSel.value;
    Object.keys(CATS[cat]).forEach(function (u) {
      var row = document.createElement("div");
      var a = document.createElement("span");
      a.textContent = u;
      var b = document.createElement("span");
      b.textContent = format(convert(cat, v, fromSel.value, u));
      row.appendChild(a);
      row.appendChild(b);
      tableEl.appendChild(row);
    });
  }

  catSel.addEventListener("change", setCategory);
  [valEl, fromSel, toSel].forEach(function (el) {
    el.addEventListener("input", update);
    el.addEventListener("change", update);
  });
  document.getElementById("u-swap").addEventListener("click", function () {
    var a = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = a;
    update();
  });

  setCategory();
})();
