/* Contact form. Add an endpoint (for example a Formspree URL) to the form's
   data-endpoint attribute to enable sending. */
(function () {
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (!form || !status) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var endpoint = form.getAttribute("data-endpoint");
    if (!endpoint) {
      status.textContent = t("contact.notset");
      return;
    }
    status.textContent = t("contact.sending");
    fetch(endpoint, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        if (!r.ok) throw new Error("Request failed");
        form.reset();
        status.textContent = t("contact.sent");
      })
      .catch(function () {
        status.textContent = t("contact.failed");
      });
  });
})();
