/* Interactive map: search by coordinates or place name, click to read coordinates, measure distance and area. */
(function () {
  if (typeof document === "undefined" || typeof L === "undefined" || !window.Geo) return;
  var G = window.Geo;

  var mapEl = document.getElementById("map");
  if (!mapEl) return;

  var form = document.getElementById("map-form");
  var input = document.getElementById("map-q");
  var results = document.getElementById("map-results");
  var info = document.getElementById("map-info");
  var statusEl = document.getElementById("map-status");
  var locateBtn = document.getElementById("map-locate");
  var measureBtn = document.getElementById("map-measure-btn");
  var measureBox = document.getElementById("map-measure");

  var map = L.map(mapEl, { zoomControl: false }).setView([5.5483, 95.3238], 12);
  L.control.zoom({ position: "bottomright" }).addTo(map);

  function baseUrl() {
    var dark = document.documentElement.getAttribute("data-mode") === "dark";
    return "https://{s}.basemaps.cartocdn.com/" + (dark ? "dark_all" : "light_all") + "/{z}/{x}/{y}{r}.png";
  }
  var base = L.tileLayer(baseUrl(), {
    subdomains: "abcd",
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  });
  document.addEventListener("themechange", function () {
    base.setUrl(baseUrl());
  });
  var street = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  });
  var satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19, attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics" }
  );
  base.addTo(map);
  var layers = {};
  layers[t("map.layer.map")] = base;
  layers[t("map.layer.street")] = street;
  layers[t("map.layer.satellite")] = satellite;
  L.control.layers(layers, null, { position: "topright" }).addTo(map);
  L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

  ["map-ui", "map-info", "map-measure"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && L.DomEvent) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  });

  var pinIcon = L.divIcon({ className: "pin", html: "<span></span>", iconSize: [24, 24], iconAnchor: [12, 12] });
  var marker = null;

  function fmt(n) {
    return n.toFixed(5);
  }

  function place(lat, lng, name, zoom) {
    if (marker) marker.setLatLng([lat, lng]);
    else marker = L.marker([lat, lng], { icon: pinIcon, keyboard: false }).addTo(map);
    if (zoom) map.setView([lat, lng], zoom);

    var decimal = fmt(lat) + ", " + fmt(lng);
    info.textContent = "";
    if (name) {
      var title = document.createElement("strong");
      title.textContent = name;
      info.appendChild(title);
    }
    var dec = document.createElement("div");
    dec.textContent = decimal;
    var dms = document.createElement("div");
    dms.className = "map-dms";
    dms.textContent = G.toDMS(lat, true) + " " + G.toDMS(lng, false);
    info.appendChild(dec);
    info.appendChild(dms);

    var row = document.createElement("div");
    row.className = "map-actions";
    var copy = document.createElement("button");
    copy.type = "button";
    copy.className = "btn btn-quiet";
    copy.textContent = t("map.copy");
    copy.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(decimal).then(
          function () { copy.textContent = t("map.copied"); },
          function () { copy.textContent = t("map.copyfail"); }
        );
      } else {
        copy.textContent = t("map.copyunsupported");
      }
      setTimeout(function () { copy.textContent = t("map.copy"); }, 1500);
    });
    var osm = document.createElement("a");
    osm.href = "https://www.openstreetmap.org/?mlat=" + lat + "&mlon=" + lng + "#map=16/" + lat + "/" + lng;
    osm.target = "_blank";
    osm.rel = "noopener noreferrer";
    osm.textContent = t("map.osm");
    row.appendChild(copy);
    row.appendChild(osm);
    info.appendChild(row);
  }

  /* ---------- Measure ---------- */

  var measuring = false;
  var pts = [];
  var shape = L.layerGroup().addTo(map);
  var COLOR = "#d97706";

  function fmtDist(m) {
    return m < 1000 ? m.toFixed(1) + " m" : (m / 1000).toFixed(2) + " km";
  }
  function fmtArea(m2) {
    if (m2 < 10000) return m2.toFixed(1) + " m\u00b2";
    if (m2 < 1e6) return (m2 / 10000).toFixed(2) + " ha (" + Math.round(m2).toLocaleString(document.documentElement.lang) + " m\u00b2)";
    return (m2 / 1e6).toFixed(3) + " km\u00b2 (" + (m2 / 10000).toLocaleString(document.documentElement.lang, { maximumFractionDigits: 0 }) + " ha)";
  }

  function drawMeasure() {
    shape.clearLayers();
    var ll = pts.map(function (p) { return [p.lat, p.lng]; });
    if (pts.length >= 3) L.polygon(ll, { color: COLOR, weight: 3, fillOpacity: 0.18, interactive: false }).addTo(shape);
    else if (pts.length === 2) L.polyline(ll, { color: COLOR, weight: 3, interactive: false }).addTo(shape);
    pts.forEach(function (p) {
      L.circleMarker([p.lat, p.lng], { radius: 5, color: "#fff", weight: 2, fillColor: COLOR, fillOpacity: 1, interactive: false }).addTo(shape);
    });

    measureBox.textContent = "";
    function line(label, value) {
      var d = document.createElement("div");
      var a = document.createElement("span");
      a.className = "map-dms";
      a.textContent = label + " ";
      var b = document.createElement("strong");
      b.textContent = value;
      d.appendChild(a);
      d.appendChild(b);
      measureBox.appendChild(d);
    }
    if (!pts.length) {
      var hint = document.createElement("div");
      hint.textContent = t("map.measure.hint");
      measureBox.appendChild(hint);
    } else {
      line(t("map.points"), String(pts.length));
      line(t("map.distance"), fmtDist(G.pathLength(pts, false)));
      if (pts.length >= 3) {
        line(t("map.perimeter"), fmtDist(G.pathLength(pts, true)));
        line(t("map.area"), fmtArea(G.polygonArea(pts)));
      }
    }
    var row = document.createElement("div");
    row.className = "map-actions";
    [["map.undo", function () { pts.pop(); drawMeasure(); }], ["map.clear", function () { pts = []; drawMeasure(); }], ["map.done", function () { setMeasuring(false); }]].forEach(function (a) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-quiet";
      b.textContent = t(a[0]);
      b.addEventListener("click", a[1]);
      row.appendChild(b);
    });
    measureBox.appendChild(row);
  }

  function setMeasuring(on) {
    measuring = on;
    measureBtn.setAttribute("aria-pressed", String(on));
    measureBox.hidden = !on;
    info.hidden = on;
    mapEl.classList.toggle("measuring", on);
    if (on) {
      map.doubleClickZoom.disable();
      drawMeasure();
    } else {
      map.doubleClickZoom.enable();
      pts = [];
      shape.clearLayers();
    }
  }

  measureBtn.addEventListener("click", function () {
    setMeasuring(!measuring);
  });

  map.on("click", function (e) {
    var p = e.latlng.wrap();
    if (measuring) {
      pts.push({ lat: p.lat, lng: p.lng });
      drawMeasure();
      return;
    }
    results.textContent = "";
    statusEl.textContent = "";
    place(p.lat, p.lng, null, null);
  });

  /* ---------- Search ---------- */

  function showResults(list) {
    results.textContent = "";
    list.forEach(function (r) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = r.display_name;
      b.addEventListener("click", function () {
        place(parseFloat(r.lat), parseFloat(r.lon), r.display_name, 14);
      });
      li.appendChild(b);
      results.appendChild(li);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = input.value.trim();
    results.textContent = "";
    if (!q) {
      statusEl.textContent = t("map.typeprompt");
      return;
    }
    var c = G.parseCoords(q);
    if (c) {
      statusEl.textContent = "";
      place(c.lat, c.lng, null, 15);
      return;
    }
    statusEl.textContent = t("map.searching");
    fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=" + document.documentElement.lang + "&q=" + encodeURIComponent(q), {
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        if (!r.ok) throw new Error("Search failed");
        return r.json();
      })
      .then(function (list) {
        if (!list.length) {
          statusEl.textContent = t("map.notfound");
          return;
        }
        statusEl.textContent = t(list.length === 1 ? "map.results.one" : "map.results.other", { n: list.length });
        showResults(list);
        place(parseFloat(list[0].lat), parseFloat(list[0].lon), list[0].display_name, 14);
      })
      .catch(function () {
        statusEl.textContent = t("map.unavailable");
      });
  });

  locateBtn.addEventListener("click", function () {
    if (!navigator.geolocation) {
      statusEl.textContent = t("map.nolocation");
      return;
    }
    statusEl.textContent = t("map.finding");
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        statusEl.textContent = "";
        results.textContent = "";
        place(pos.coords.latitude, pos.coords.longitude, t("map.yourloc"), 15);
      },
      function () {
        statusEl.textContent = t("map.locfail");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  /* Open at a coordinate from the link map.html#lat,lng */
  var fromHash = G.parseCoords(decodeURIComponent(location.hash.slice(1)));
  if (fromHash) place(fromHash.lat, fromHash.lng, null, 15);
})();
