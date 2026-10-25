/* Password generator. Uses crypto.getRandomValues with rejection sampling. */
(function () {
  var SETS = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    digits: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{};:,.?/",
  };
  var AMBIGUOUS = /[Il1O0o]/g;

  function randomInt(max, c) {
    var limit = Math.floor(4294967296 / max) * max;
    var buf = new Uint32Array(1);
    do {
      c.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % max;
  }

  function pools(opts) {
    var out = [];
    ["lower", "upper", "digits", "symbols"].forEach(function (k) {
      if (!opts[k]) return;
      var s = opts.noAmbiguous ? SETS[k].replace(AMBIGUOUS, "") : SETS[k];
      if (s) out.push(s);
    });
    return out;
  }

  function generate(opts, c) {
    var p = pools(opts);
    if (!p.length) return "";
    var len = Math.max(p.length, opts.length);
    var all = p.join("");
    var chars = p.map(function (s) { return s.charAt(randomInt(s.length, c)); });
    while (chars.length < len) chars.push(all.charAt(randomInt(all.length, c)));
    for (var i = chars.length - 1; i > 0; i--) {
      var j = randomInt(i + 1, c);
      var tmp = chars[i];
      chars[i] = chars[j];
      chars[j] = tmp;
    }
    return chars.join("");
  }

  function entropyBits(opts) {
    var size = pools(opts).join("").length;
    return size ? Math.max(opts.length, pools(opts).length) * Math.log2(size) : 0;
  }

  function strengthKey(bits) {
    return bits < 40 ? "weak" : bits < 60 ? "fair" : bits < 80 ? "good" : "strong";
  }

  if (typeof module !== "undefined") module.exports = { generate: generate, entropyBits: entropyBits, strengthKey: strengthKey, pools: pools, randomInt: randomInt };
  if (typeof document === "undefined") return;

  var out = document.getElementById("pw-out");
  if (!out) return;
  var len = document.getElementById("pw-len");
  var lenOut = document.getElementById("pw-len-out");
  var meter = document.getElementById("pw-meter");
  var label = document.getElementById("pw-strength");
  var copyBtn = document.getElementById("pw-copy");
  var checks = { lower: "pw-lower", upper: "pw-upper", digits: "pw-digits", symbols: "pw-symbols", noAmbiguous: "pw-amb" };

  function opts() {
    var o = { length: parseInt(len.value, 10) };
    Object.keys(checks).forEach(function (k) { o[k] = document.getElementById(checks[k]).checked; });
    return o;
  }

  function run() {
    var o = opts();
    lenOut.textContent = o.length;
    var any = o.lower || o.upper || o.digits || o.symbols;
    if (!any) {
      out.value = "";
      label.textContent = t("pw.pick");
      meter.value = 0;
      return;
    }
    out.value = generate(o, window.crypto);
    var bits = entropyBits(o);
    meter.value = Math.min(100, Math.round((bits / 100) * 100));
    label.textContent = t("pw.strength." + strengthKey(bits)) + " \u2013 " + Math.round(bits) + " bit";
  }

  document.getElementById("pw-new").addEventListener("click", run);
  len.addEventListener("input", run);
  Object.keys(checks).forEach(function (k) { document.getElementById(checks[k]).addEventListener("change", run); });
  copyBtn.addEventListener("click", function () {
    if (!out.value) return;
    var done = function (key) {
      copyBtn.textContent = t(key);
      setTimeout(function () { copyBtn.textContent = t("pw.copy"); }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(out.value).then(function () { done("pw.copied"); }, function () { done("pw.copyfail"); });
    } else {
      out.select();
      done(document.execCommand && document.execCommand("copy") ? "pw.copied" : "pw.copyfail");
    }
  });

  run();
})();
