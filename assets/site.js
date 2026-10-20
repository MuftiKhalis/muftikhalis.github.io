/* Menu drawer: open/close, Esc, focus handling, scroll lock. */
(function () {
  var btn = document.getElementById("menu-btn");
  var drawer = document.getElementById("menu-panel");
  var scrim = document.getElementById("scrim");
  var closeBtn = document.getElementById("menu-close");
  if (!btn || !drawer || !scrim) return;

  function isOpen() {
    return drawer.classList.contains("open");
  }

  function setOpen(open) {
    drawer.classList.toggle("open", open);
    scrim.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Close" : "Menu";
    if (open) {
      closeBtn.focus();
    } else {
      btn.focus();
    }
  }

  btn.addEventListener("click", function () {
    setOpen(!isOpen());
  });
  closeBtn.addEventListener("click", function () {
    setOpen(false);
  });
  scrim.addEventListener("click", function () {
    setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (!isOpen()) return;
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key !== "Tab") return;
    var focusable = drawer.querySelectorAll("a[href], button");
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
})();
