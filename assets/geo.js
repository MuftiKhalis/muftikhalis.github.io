/* Shared geo helpers: coordinate parsing/formatting, distance, area, UTM. Exposed as window.Geo. */
(function (root) {
  var R = 6371008.8; // mean Earth radius in metres

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

  /* ---------- Distance and area on a sphere ---------- */

  function rad(d) { return (d * Math.PI) / 180; }

  function haversine(a, b) {
    var dLat = rad(b.lat - a.lat);
    var dLng = rad(b.lng - a.lng);
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function pathLength(points, closed) {
    var sum = 0;
    for (var i = 1; i < points.length; i++) sum += haversine(points[i - 1], points[i]);
    if (closed && points.length > 2) sum += haversine(points[points.length - 1], points[0]);
    return sum;
  }

  /* Polygon area in square metres (spherical excess, edges as great circles). */
  function polygonArea(points) {
    if (points.length < 3) return 0;
    var sum = 0;
    for (var i = 0; i < points.length; i++) {
      var p1 = points[i];
      var p2 = points[(i + 1) % points.length];
      sum += rad(p2.lng - p1.lng) * (2 + Math.sin(rad(p1.lat)) + Math.sin(rad(p2.lat)));
    }
    return Math.abs((sum * R * R) / 2);
  }

  /* ---------- UTM (WGS84, Kruger series to 4th order) ---------- */

  var A_AXIS = 6378137;
  var F = 1 / 298.257223563;
  var K0 = 0.9996;
  var N_ = F / (2 - F);
  var N2 = N_ * N_, N3 = N2 * N_, N4 = N3 * N_;
  var AA = (A_AXIS / (1 + N_)) * (1 + N2 / 4 + N4 / 64);
  var ALPHA = [
    N_ / 2 - (2 * N2) / 3 + (5 * N3) / 16 + (41 * N4) / 180,
    (13 * N2) / 48 - (3 * N3) / 5 + (557 * N4) / 1440,
    (61 * N3) / 240 - (103 * N4) / 140,
    (49561 * N4) / 161280,
  ];
  var BETA = [
    N_ / 2 - (2 * N2) / 3 + (37 * N3) / 96 - N4 / 360,
    N2 / 48 + N3 / 15 - (437 * N4) / 1440,
    (17 * N3) / 480 - (37 * N4) / 840,
    (4397 * N4) / 161280,
  ];
  var DELTA = [
    2 * N_ - (2 * N2) / 3 - 2 * N3 + (116 * N4) / 45,
    (7 * N2) / 3 - (8 * N3) / 5 - (227 * N4) / 45,
    (56 * N3) / 15 - (136 * N4) / 35,
    (4279 * N4) / 630,
  ];
  var BANDS = "CDEFGHJKLMNPQRSTUVWX";

  function utmZone(lng) {
    return Math.min(60, Math.max(1, Math.floor((lng + 180) / 6) + 1));
  }

  function toUTM(lat, lng, forceZone) {
    if (!(lat >= -80 && lat <= 84) || !(Math.abs(lng) <= 180)) return null;
    var zone = forceZone || utmZone(lng);
    var phi = rad(lat);
    var dl = rad(lng - (zone * 6 - 183));
    var e = (2 * Math.sqrt(N_)) / (1 + N_);
    var sinPhi = Math.sin(phi);
    var t = Math.sinh(Math.atanh(sinPhi) - e * Math.atanh(e * sinPhi));
    var xi0 = Math.atan2(t, Math.cos(dl));
    var eta0 = Math.asinh(Math.sin(dl) / Math.sqrt(t * t + Math.cos(dl) * Math.cos(dl)));
    var xi = xi0, eta = eta0;
    for (var j = 1; j <= 4; j++) {
      xi += ALPHA[j - 1] * Math.sin(2 * j * xi0) * Math.cosh(2 * j * eta0);
      eta += ALPHA[j - 1] * Math.cos(2 * j * xi0) * Math.sinh(2 * j * eta0);
    }
    var north = lat >= 0;
    return {
      zone: zone,
      band: BANDS.charAt(Math.min(19, Math.floor((lat + 80) / 8))),
      hemisphere: north ? "N" : "S",
      easting: 500000 + K0 * AA * eta,
      northing: (north ? 0 : 10000000) + K0 * AA * xi,
    };
  }

  function fromUTM(zone, hemisphere, easting, northing) {
    var xi = (northing - (hemisphere === "S" ? 10000000 : 0)) / (K0 * AA);
    var eta = (easting - 500000) / (K0 * AA);
    var xi1 = xi, eta1 = eta;
    for (var j = 1; j <= 4; j++) {
      xi1 -= BETA[j - 1] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta);
      eta1 -= BETA[j - 1] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta);
    }
    var chi = Math.asin(Math.sin(xi1) / Math.cosh(eta1));
    var phi = chi;
    for (var k = 1; k <= 4; k++) phi += DELTA[k - 1] * Math.sin(2 * k * chi);
    var lam = Math.atan2(Math.sinh(eta1), Math.cos(xi1));
    return { lat: (phi * 180) / Math.PI, lng: zone * 6 - 183 + (lam * 180) / Math.PI };
  }

  var Geo = {
    parseCoords: parseCoords, toDMS: toDMS, haversine: haversine, pathLength: pathLength,
    polygonArea: polygonArea, toUTM: toUTM, fromUTM: fromUTM, utmZone: utmZone,
  };
  if (typeof module !== "undefined") module.exports = Geo;
  else root.Geo = Geo;
})(typeof window !== "undefined" ? window : this);
