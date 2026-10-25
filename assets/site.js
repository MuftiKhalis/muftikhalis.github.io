/* Site chrome: menu drawer, quick search (Ctrl+K), install button, service worker. */
(function () {
  var btn = document.getElementById("menu-btn");
  var drawer = document.getElementById("menu-panel");
  var scrim = document.getElementById("scrim");
  var closeBtn = document.getElementById("menu-close");

  /* ---------- Menu drawer ---------- */
  function isOpen() {
    return drawer.classList.contains("open");
  }
  function setOpen(open) {
    drawer.classList.toggle("open", open);
    scrim.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? t("menu.close") : t("menu.open");
    if (open) closeBtn.focus();
    else btn.focus();
  }

  if (btn && drawer && scrim) {
    btn.addEventListener("click", function () { setOpen(!isOpen()); });
    closeBtn.addEventListener("click", function () { setOpen(false); });
    scrim.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      var focusable = drawer.querySelectorAll("a[href], button:not([hidden])");
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------- Quick search ---------- */
  var searchBtn = document.getElementById("search-btn");
  var items = [];
  if (drawer) {
    drawer.querySelectorAll("a[data-desc]").forEach(function (a) {
      items.push({ label: a.textContent.trim(), href: a.getAttribute("href"), desc: a.getAttribute("data-desc"), key: (a.getAttribute("data-k") || "").toLowerCase() });
    });
  }

  var pal, palInput, palList, palSel = 0, palShown = [], palReturn = null;

  function buildPalette() {
    pal = document.createElement("div");
    pal.className = "pal";
    pal.hidden = true;
    pal.innerHTML =
      '<div class="pal-box" role="dialog" aria-modal="true">' +
      '<input class="pal-input" type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" autocomplete="off" spellcheck="false">' +
      '<ul class="pal-list" id="pal-list" role="listbox"></ul></div>';
    document.body.appendChild(pal);
    palInput = pal.querySelector("input");
    palList = pal.querySelector("ul");
    pal.querySelector(".pal-box").setAttribute("aria-label", t("search.title"));
    palInput.placeholder = t("search.placeholder");
    palInput.setAttribute("aria-label", t("search.title"));
    pal.addEventListener("mousedown", function (e) { if (e.target === pal) closePalette(); });
    palInput.addEventListener("input", function () { palSel = 0; renderPalette(); });
    palInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (palShown[palSel]) location.href = palShown[palSel].href;
      } else if (e.key === "Escape") { e.preventDefault(); closePalette(); }
    });
  }

  function move(d) {
    if (!palShown.length) return;
    palSel = (palSel + d + palShown.length) % palShown.length;
    renderPalette();
  }

  function renderPalette() {
    var q = palInput.value.trim().toLowerCase();
    palShown = items.filter(function (it) {
      return !q || (it.label + " " + it.desc + " " + it.key).toLowerCase().indexOf(q) !== -1;
    });
    palList.textContent = "";
    if (!palShown.length) {
      var none = document.createElement("li");
      none.className = "pal-none";
      none.textContent = t("search.none");
      palList.appendChild(none);
      return;
    }
    palShown.forEach(function (it, i) {
      var li = document.createElement("li");
      li.id = "pal-" + i;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === palSel));
      var a = document.createElement("a");
      a.href = it.href;
      var n = document.createElement("strong");
      n.textContent = it.label;
      var d = document.createElement("span");
      d.textContent = it.desc;
      a.appendChild(n);
      a.appendChild(d);
      li.appendChild(a);
      palList.appendChild(li);
    });
    palInput.setAttribute("aria-activedescendant", "pal-" + palSel);
    var cur = document.getElementById("pal-" + palSel);
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" });
  }

  function openPalette() {
    if (!items.length) return;
    if (!pal) buildPalette();
    palReturn = document.activeElement;
    pal.hidden = false;
    document.body.classList.add("menu-open");
    palInput.value = "";
    palSel = 0;
    renderPalette();
    palInput.focus();
  }
  function closePalette() {
    pal.hidden = true;
    document.body.classList.remove("menu-open");
    if (palReturn && palReturn.focus) palReturn.focus();
  }

  if (searchBtn) searchBtn.addEventListener("click", openPalette);
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
      var tag = e.target && e.target.tagName;
      if (tag === "TEXTAREA") return; /* the Markdown editor uses Ctrl+K for links */
      e.preventDefault();
      if (pal && !pal.hidden) closePalette();
      else openPalette();
    }
  });

  /* ---------- Install button ---------- */
  var installBtn = document.getElementById("install-btn");
  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    if (installBtn) installBtn.hidden = false;
  });
  window.addEventListener("appinstalled", function () {
    deferred = null;
    if (installBtn) installBtn.hidden = true;
  });
  if (installBtn) {
    installBtn.addEventListener("click", function () {
      if (!deferred) return;
      deferred.prompt();
      deferred = null;
      installBtn.hidden = true;
    });
  }

  /* ---------- Service worker (offline use) ---------- */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    var self = document.querySelector('script[src*="assets/site.js"]');
    if (self) {
      var root = self.src.replace(/assets\/site\.js.*$/, "");
      window.addEventListener("load", function () {
        navigator.serviceWorker.register(root + "sw.js").catch(function () {});
      });
    }
  }
})();
