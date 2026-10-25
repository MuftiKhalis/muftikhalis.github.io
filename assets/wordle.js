/* Word guessing game (5 letters, 6 tries). English and Indonesian word lists. */
(function () {
  var WORDS = {
    en: ("about above actor adult after again agree alarm album alone along angry apple arena argue arise array aside audio avoid award aware basic beach begin being below bench black blame blind block blood board brain bread break brick brief bring broad brown build burst cable carry catch cause chain chair chart cheap check chest chief child civil claim class clean clear climb clock close cloud coach coast color count court cover craft crash cream crowd daily dance death delay depth dirty doubt draft drama dream dress drink drive early earth eight empty enemy enjoy enter equal error event every exact exist extra faith false fault field fight final first flash floor focus force frame fresh front fruit funny giant given glass globe grace grade grain grand grant grass great green group guard guess guest guide happy heart heavy honey horse hotel house human ideal image index inner input issue joint judge juice knife known label large laser later laugh layer learn least leave legal level light limit local logic loose lower lucky lunch magic major maker march match maybe mayor media metal might minor model money month moral motor mount mouse mouth movie music never night noise north novel nurse ocean offer often order other owner paint panel paper party peace phase phone photo piece pilot pitch place plain plane plant plate point pound power press price pride prime print prior prize proof proud queen quick quiet quite radio raise range rapid ratio reach ready refer right river rough round route royal rural scale scene scope score sense serve seven shall shape share sharp sheet shelf shell shift shine shirt shock shoot short sight since skill sleep slide small smart smile smoke solid solve sound south space spare speak speed spend split sport staff stage stand start state steam steel stick still stock stone store storm story strip study stuff style sugar suite super sweet table taste teach thank theme there thick thing think third those three throw tight title today topic total touch tough tower trace track trade train treat trend trial tribe trick truck truly trust truth twice uncle under union unity until upper upset urban usage usual valid value video virus visit vital voice waste watch water wheel where which while white whole whose woman world worry worse worst worth would write wrong youth").split(" "),
    id: ("bahan bakar bantu bapak batas bawah bayar benar besar bibir bumbu buruk cabai cepat cerah dalam dapur darah datar dekat depan dunia emosi empat hujan hutan indah jalan jawab jelas jujur kabar kabel kaget kamar kanan kapal karya kasih kasur kecil kelas kerja kesal kuasa lemah lidah luang makan malam mampu mandi manis marah masuk mimpi minta mobil mulai murah nasib nilai nyata orang pagar pakai parah pasar pasti pedas pelan pergi perut pikir pintu pisau pulau punya putar putih rajin ramai sabar sakit salah sayap sayur sehat semua sinar subuh sudah suara sulit surat susah susun tahun takut tamat tanah tanda tebal tegas telur tenda tepat terus tidur tikus timur tiket tinta tulis tunai turun tutup ujian ulang untuk utara waktu warga warna wujud").split(" "),
  };

  /* Returns an array of "c" (right place), "p" (in the word), "a" (not in the word). */
  function score(guess, answer) {
    var res = new Array(guess.length).fill("a");
    var left = {};
    for (var i = 0; i < answer.length; i++) {
      if (guess[i] === answer[i]) res[i] = "c";
      else left[answer[i]] = (left[answer[i]] || 0) + 1;
    }
    for (var j = 0; j < guess.length; j++) {
      if (res[j] === "c") continue;
      if (left[guess[j]] > 0) {
        res[j] = "p";
        left[guess[j]]--;
      }
    }
    return res;
  }

  if (typeof module !== "undefined") module.exports = { WORDS: WORDS, score: score };
  if (typeof document === "undefined") return;

  var gridEl = document.getElementById("wd-grid");
  if (!gridEl) return;
  var kbEl = document.getElementById("wd-kb");
  var msgEl = document.getElementById("wd-msg");
  var lang = (document.documentElement.lang || "en").slice(0, 2) === "id" ? "id" : "en";
  var list = WORDS[lang];
  var answer, row, col, guesses, over, tiles = [], keyEls = {};

  function load(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var stats;
  try { stats = JSON.parse(load("wd-" + lang, "{}")); } catch (e) { stats = {}; }
  stats = { played: stats.played || 0, won: stats.won || 0, streak: stats.streak || 0 };

  function showStats() {
    document.getElementById("wd-stats").textContent = t("wd.stats", { p: stats.played, w: stats.won, s: stats.streak });
  }

  function build() {
    gridEl.textContent = "";
    tiles = [];
    for (var r = 0; r < 6; r++) {
      var rowEl = document.createElement("div");
      rowEl.className = "wd-row";
      var arr = [];
      for (var c = 0; c < 5; c++) {
        var d = document.createElement("div");
        d.className = "wd-tile";
        rowEl.appendChild(d);
        arr.push(d);
      }
      gridEl.appendChild(rowEl);
      tiles.push(arr);
    }
    if (!kbEl.childElementCount) {
      ["qwertyuiop", "asdfghjkl", "zxcvbnm"].forEach(function (line, i) {
        var rowEl = document.createElement("div");
        rowEl.className = "wd-krow";
        if (i === 2) rowEl.appendChild(key("Enter", t("wd.enter")));
        line.split("").forEach(function (ch) { rowEl.appendChild(key(ch, ch)); });
        if (i === 2) rowEl.appendChild(key("Backspace", "\u232b"));
        kbEl.appendChild(rowEl);
      });
    }
  }

  function key(k, label) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "wd-key" + (k.length > 1 ? " wide" : "");
    b.textContent = label;
    b.setAttribute("data-k", k);
    if (k === "Enter") b.setAttribute("aria-label", t("wd.enter"));
    if (k === "Backspace") b.setAttribute("aria-label", t("wd.delete"));
    keyEls[k] = b;
    return b;
  }

  function start() {
    answer = list[Math.floor(Math.random() * list.length)];
    row = 0; col = 0; over = false; guesses = [];
    msgEl.textContent = "";
    build();
    Object.keys(keyEls).forEach(function (k) { keyEls[k].removeAttribute("data-s"); });
    showStats();
  }

  function type(ch) {
    if (over || col >= 5) return;
    tiles[row][col].textContent = ch;
    tiles[row][col].setAttribute("data-filled", "1");
    col++;
  }
  function back() {
    if (over || col === 0) return;
    col--;
    tiles[row][col].textContent = "";
    tiles[row][col].removeAttribute("data-filled");
  }

  var RANK = { a: 1, p: 2, c: 3 };
  function submit() {
    if (over) return;
    if (col < 5) { msgEl.textContent = t("wd.short"); return; }
    var guess = tiles[row].map(function (d) { return d.textContent; }).join("");
    var res = score(guess, answer);
    res.forEach(function (s, i) {
      tiles[row][i].setAttribute("data-s", s);
      var k = keyEls[guess[i]];
      var cur = k.getAttribute("data-s");
      if (!cur || RANK[s] > RANK[cur]) k.setAttribute("data-s", s);
    });
    msgEl.textContent = "";
    if (guess === answer) return finish(true);
    row++; col = 0;
    if (row === 6) finish(false);
  }

  function finish(win) {
    over = true;
    stats.played++;
    if (win) { stats.won++; stats.streak++; } else { stats.streak = 0; }
    save("wd-" + lang, JSON.stringify(stats));
    msgEl.textContent = win ? t("wd.win", { n: row + 1 }) : t("wd.lose", { w: answer.toUpperCase() });
    showStats();
  }

  function press(k) {
    if (k === "Enter") submit();
    else if (k === "Backspace") back();
    else if (/^[a-z]$/.test(k)) type(k);
  }

  kbEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-k]");
    if (b) press(b.getAttribute("data-k"));
  });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (e.key === "Enter" && tag === "BUTTON") return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "Enter" || k === "Backspace" || /^[a-z]$/.test(k)) {
      e.preventDefault();
      press(k);
    }
  });
  document.getElementById("wd-new").addEventListener("click", start);
  start();
})();
