/* Coordinate converter: lat/long (any format), DMS and UTM. */
(function () {
  var input = document.getElementById("cc-input");
  if (!input || !window.Geo) return;
  var G = window.Geo;
  var out = document.getElementById("cc-out");
  var status = document.getElementById("cc-status");
  var mapLink = document.getElementById("cc-map");
  var copyBtn = document.getElementById("cc-copy");
  var lines = [];

  function row(label, value) {
    var d = document.createElement("div");
    var a = document.createElement("dt");
    a.textContent = label;
    var b = document.createElement("dd");
    b.textContent = value;
    d.appendChild(a);
    d.appendChild(b);
    out.appendChild(d);
    lines.push(label + ": " + value);
  }

  function show(p) {
    out.textContent = "";
    lines = [];
    row(t("cc.decimal"), p.lat.toFixed(6) + ", " + p.lng.toFixed(6));
    row(t("cc.dms"), G.toDMS(p.lat, true) + " " + G.toDMS(p.lng, false));
    var u = G.toUTM(p.lat, p.lng);
    if (u) {
      row("UTM", u.zone + u.band + "  " + u.easting.toFixed(2) + " mE  " + u.northing.toFixed(2) + " mN");
      row(t("cc.utmzone"), u.zone + u.hemisphere + " (WGS84)");
    } else {
      row("UTM", t("cc.noutm"));
    }
    mapLink.href = "map.html#" + p.lat.toFixed(6) + "," + p.lng.toFixed(6);
    mapLink.hidden = false;
    copyBtn.hidden = false;
  }

  function fromText() {
    var v = input.value.trim();
    out.textContent = "";
    mapLink.hidden = copyBtn.hidden = true;
    if (!v) { status.textContent = t("cc.hint"); return; }
    var p = G.parseCoords(v);
    if (!p) { status.textContent = t("cc.bad"); return; }
    status.textContent = "";
    show(p);
  }

  input.addEventListener("input", fromText);

  var zone = document.getElementById("cc-zone");
  var hemi = document.getElementById("cc-hemi");
  var east = document.getElementById("cc-east");
  var north = document.getElementById("cc-north");
  var ustatus = document.getElementById("cc-ustatus");
  document.getElementById("cc-utm-go").addEventListener("click", function () {
    var z = parseInt(zone.value, 10);
    var e = parseFloat(east.value);
    var n = parseFloat(north.value);
    if (!(z >= 1 && z <= 60) || !isFinite(e) || !isFinite(n)) { ustatus.textContent = t("cc.utmbad"); return; }
    var p = G.fromUTM(z, hemi.value, e, n);
    if (!(Math.abs(p.lat) <= 90) || !(Math.abs(p.lng) <= 180)) { ustatus.textContent = t("cc.utmbad"); return; }
    ustatus.textContent = "";
    input.value = p.lat.toFixed(6) + ", " + p.lng.toFixed(6);
    fromText();
    out.scrollIntoView({ block: "nearest" });
  });

  copyBtn.addEventListener("click", function () {
    var text = lines.join("\n");
    var done = function (k) {
      copyBtn.textContent = t(k);
      setTimeout(function () { copyBtn.textContent = t("cc.copy"); }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done("cc.copied"); }, function () { done("cc.copyfail"); });
    } else {
      done("cc.copyfail");
    }
  });

  fromText();
})();
