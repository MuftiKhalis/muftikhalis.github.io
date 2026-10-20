/* Live clock: local time, date, weekday, time zone, and UTC. */
(function () {
  var timeEl = document.getElementById("clock-time");
  var dayEl = document.getElementById("clock-day");
  var dateEl = document.getElementById("clock-date");
  var zoneEl = document.getElementById("clock-zone");
  var utcEl = document.getElementById("clock-utc");
  if (!timeEl) return;

  var timeFmt = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  var utcFmt = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  });
  var dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "long" });
  var dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" });

  zoneEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";

  function tick() {
    var now = new Date();
    timeEl.textContent = timeFmt.format(now);
    timeEl.dateTime = now.toISOString();
    dayEl.textContent = dayFmt.format(now);
    dateEl.textContent = dateFmt.format(now);
    utcEl.textContent = utcFmt.format(now);
    setTimeout(tick, 1000 - (now.getMilliseconds() % 1000) + 5);
  }

  tick();
})();
