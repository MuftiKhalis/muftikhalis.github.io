/* Interactive map: search by coordinates or place name, click to read coordinates. */
(function () {
  /* ---------- Coordinate helpers (pure, also used by tests) ---------- */

  function inRange(lat, lng) {
    return isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  }

  /* Accepts: "5.5483, 95.3238", "5.5483 95.3238", "5.5483N 95.3238E",
     "5°33'N 95°19'E", "5°33'0.5\"N 95°19'25\"E". Latitude first unless letters say otherwise. */
  function parseCoords(input) {
    var s = String(input || "").trim().replace(/[\u2032\u2019]/g, "'").replace(/[\u2033\u201d]/g, '"');
    if (!s) return null;

    var dms = /(\d+(?:\.\d+)?)\s*(?:\u00b0|d)\s*(?:(\d+(?:\.\d+)?)\s*'\s*)?(?:(\d+(?:\.\d+)?)\s*"\s*)?([NSEW])/gi;
    var found = [];
    var m;
    while ((m = dms.exec(s)) !== null) {
      var v = parseFloat(m[1]) + (m[2] ? parseFloat(m[2]) / 60 : 0) + (m[3] ? parseFloat(m[3]) / 3600 : 0);
      var h = m[4].toUpperCase();
      if (h === "S" || h === "W") v = -v;
      found.push({ v: v, h: h });
    }
    if (found.length === 2) return fromPair(found[0], found[1]);

    var dec = /^([+-]?\d+(?:\.\d+)?)\s*\u00b0?\s*([NSEW])?\s*[,;\s]\s*([+-]?\d+(?:\.\d+)?)\s*\u00b0?\s*([NSEW])?$/i.exec(s);
    if (!dec) return null;
    var a = { v: parseFloat(dec[1]), h: dec[2] ? dec[2].toUpperCase() : "" };
    var b = { v: parseFloat(dec[3]), h: dec[4] ? dec[4].toUpperCase() : "" };
    if (a.h === "S" || a.h === "W") a.v = -Math.abs(a.v);
    if (b.h === "S" || b.h === "W") b.v = -Math.abs(b.v);
    return fromPair(a, b);
  }

  function fromPair(a, b) {
    var lat, lng;
    var aLng = a.h === "E" || a.h === "W";
    var bLat = b.h === "N" || b.h === "S";
    if (aLng || bLat) {
      lat = b.v;
      lng = a.v;
    } else {
      lat = a.v;
      lng = b.v;
    }
    return inRange(lat, lng) ? { lat: lat, lng: lng } : null;
  }

  function toDMS(value, isLat) {
    var hemi = isLat ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
    var abs = Math.abs(value);
    var d = Math.floor(abs);
    var mFull = (abs - d) * 60;
    var min = Math.floor(mFull);
    var sec = ((mFull - min) * 60).toFixed(1);
    if (sec === "60.0") {
      sec = "0.0";
      min += 1;
    }
    if (min === 60) {
      min = 0;
      d += 1;
    }
    return d + "\u00b0" + min + "\u2032" + sec + "\u2033" + hemi;
  }

  if (typeof module !== "undefined") {
    module.exports = { parseCoords: parseCoords, toDMS: toDMS };
  }
  if (typeof document === "undefined" || typeof L === "undefined") return;

  /* ---------- Map ---------- */

  var mapEl = document.getElementById("map");
  if (!mapEl) return;

  var form = document.getElementById("map-form");
  var input = document.getElementById("map-q");
  var results = document.getElementById("map-results");
  var info = document.getElementById("map-info");
  var statusEl = document.getElementById("map-status");
  var locateBtn = document.getElementById("map-locate");

  var map = L.map(mapEl).setView([5.5483, 95.3238], 12);
  var street = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  });
  var satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19, attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics" }
  );
  street.addTo(map);
  L.control.layers({ Street: street, Satellite: satellite }).addTo(map);
  L.control.scale({ imperial: false }).addTo(map);

  var marker = null;

  function fmt(n) {
    return n.toFixed(5);
  }

  function place(lat, lng, name, zoom) {
    if (marker) marker.setLatLng([lat, lng]);
    else marker = L.marker([lat, lng]).addTo(map);
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
    dms.textContent = toDMS(lat, true) + " " + toDMS(lng, false);
    info.appendChild(dec);
    info.appendChild(dms);

    var row = document.createElement("div");
    row.className = "map-actions";
    var copy = document.createElement("button");
    copy.type = "button";
    copy.className = "btn btn-quiet";
    copy.textContent = "Copy coordinates";
    copy.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(decimal).then(
          function () { copy.textContent = "Copied"; },
          function () { copy.textContent = "Copy failed"; }
        );
      } else {
        copy.textContent = "Copy not supported";
      }
      setTimeout(function () { copy.textContent = "Copy coordinates"; }, 1500);
    });
    var osm = document.createElement("a");
    osm.href = "https://www.openstreetmap.org/?mlat=" + lat + "&mlon=" + lng + "#map=16/" + lat + "/" + lng;
    osm.target = "_blank";
    osm.rel = "noopener noreferrer";
    osm.textContent = "Open in OpenStreetMap";
    row.appendChild(copy);
    row.appendChild(osm);
    info.appendChild(row);
  }

  map.on("click", function (e) {
    var p = e.latlng.wrap();
    results.textContent = "";
    statusEl.textContent = "";
    place(p.lat, p.lng, null, null);
  });

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
      statusEl.textContent = "Type a place name or coordinates.";
      return;
    }

    var c = parseCoords(q);
    if (c) {
      statusEl.textContent = "";
      place(c.lat, c.lng, null, 15);
      return;
    }

    statusEl.textContent = "Searching\u2026";
    fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=" + encodeURIComponent(q), {
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        if (!r.ok) throw new Error("Search failed");
        return r.json();
      })
      .then(function (list) {
        if (!list.length) {
          statusEl.textContent = "No place found. Try coordinates like 5.5483, 95.3238.";
          return;
        }
        statusEl.textContent = list.length + (list.length === 1 ? " result." : " results.");
        showResults(list);
        place(parseFloat(list[0].lat), parseFloat(list[0].lon), list[0].display_name, 14);
      })
      .catch(function () {
        statusEl.textContent = "Place search is unavailable right now. Coordinates still work.";
      });
  });

  locateBtn.addEventListener("click", function () {
    if (!navigator.geolocation) {
      statusEl.textContent = "Location is not supported by this browser.";
      return;
    }
    statusEl.textContent = "Finding your location\u2026";
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        statusEl.textContent = "";
        results.textContent = "";
        place(pos.coords.latitude, pos.coords.longitude, "Your location", 15);
      },
      function () {
        statusEl.textContent = "Could not get your location. Check the browser permission.";
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
})();
