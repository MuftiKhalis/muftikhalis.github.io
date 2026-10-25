/* Quick notes and tasks, saved in the browser. */
(function () {
  var form = document.getElementById("task-form");
  if (!form) return;
  var input = document.getElementById("task-input");
  var list = document.getElementById("task-list");
  var left = document.getElementById("task-left");
  var clearBtn = document.getElementById("task-clear");
  var note = document.getElementById("note-text");
  var noteStatus = document.getElementById("note-status");

  function load(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var tasks;
  try { tasks = JSON.parse(load("tasks", "[]")); } catch (e) { tasks = []; }
  if (!Array.isArray(tasks)) tasks = [];

  function persist() { save("tasks", JSON.stringify(tasks)); }

  function render() {
    list.textContent = "";
    tasks.forEach(function (task) {
      var li = document.createElement("li");
      if (task.done) li.className = "done";
      var label = document.createElement("label");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!task.done;
      cb.addEventListener("change", function () {
        task.done = cb.checked;
        persist();
        render();
      });
      var span = document.createElement("span");
      span.textContent = task.text;
      label.appendChild(cb);
      label.appendChild(span);
      var del = document.createElement("button");
      del.type = "button";
      del.className = "file-btn";
      del.textContent = "\u00d7";
      del.setAttribute("aria-label", t("tasks.delete", { name: task.text }));
      del.addEventListener("click", function () {
        tasks = tasks.filter(function (x) { return x !== task; });
        persist();
        render();
      });
      li.appendChild(label);
      li.appendChild(del);
      list.appendChild(li);
    });
    var open = tasks.filter(function (x) { return !x.done; }).length;
    left.textContent = tasks.length ? t("tasks.left", { n: open }) : t("tasks.empty");
    clearBtn.disabled = !tasks.some(function (x) { return x.done; });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    tasks.push({ text: text, done: false });
    input.value = "";
    persist();
    render();
    input.focus();
  });
  clearBtn.addEventListener("click", function () {
    tasks = tasks.filter(function (x) { return !x.done; });
    persist();
    render();
  });

  note.value = load("note", "");
  var timer = null;
  note.addEventListener("input", function () {
    noteStatus.textContent = "";
    clearTimeout(timer);
    timer = setTimeout(function () {
      save("note", note.value);
      noteStatus.textContent = t("notes.saved");
    }, 400);
  });

  render();
})();
