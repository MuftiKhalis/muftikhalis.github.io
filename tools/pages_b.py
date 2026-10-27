"""Tool and game pages in English and Indonesian."""
from html import escape
from pages_a import tr, label, desc, tool, head

CH_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'
CH_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'


def mk(L, slug, main, scripts=(), libs=(), css=(), extra_title=None):
    return dict(slug=slug, title=label(L, slug), desc=desc(L, slug), main=main, scripts=scripts, libs=libs, css=css)


def D(L):
    return lambda e, i: tr(L, e, i)


# ------------------------------------------------------------- Calendar
def calendar(L):
    T = D(L)
    panel = f"""        <div class="panel">
          <div class="cal-head">
            <button class="icon-btn" id="cal-prev" type="button" aria-label="{T('Previous month', 'Bulan sebelumnya')}">{CH_L}</button>
            <h2 id="cal-title" aria-live="polite"></h2>
            <button class="icon-btn" id="cal-next" type="button" aria-label="{T('Next month', 'Bulan berikutnya')}">{CH_R}</button>
          </div>
          <div class="cal-grid" id="cal-grid"></div>
          <p class="cal-diff" id="cal-diff" aria-live="polite">{T('Select a day.', 'Pilih sebuah hari.')}</p>
          <div class="cal-foot">
            <button class="btn btn-quiet" id="cal-today" type="button">{T('Go to today', 'Ke hari ini')}</button>
          </div>
        </div>"""
    main = tool(label(L, "calendar"), T("Pick a day to see how many days it is from today. Weeks start on Monday.",
                                          "Pilih sebuah hari untuk melihat berapa hari dari hari ini. Pekan dimulai hari Senin."), panel)
    return mk(L, "calendar", main, ("calendar.js",))


# ----------------------------------------------------------- Calculator
def calculator(L):
    T = D(L)

    def key(k, lab, aria, cls=""):
        c = f"key {cls}".strip()
        return f'<button class="{c}" type="button" data-key="{escape(k)}" aria-label="{aria}">{lab}</button>'

    keys = [
        key("MC", "MC", T("Clear memory", "Hapus memori"), "key-mem"), key("MR", "MR", T("Recall memory", "Panggil memori"), "key-mem"),
        key("M+", "M+", T("Add to memory", "Tambah ke memori"), "key-mem"), key("M-", "M&minus;", T("Subtract from memory", "Kurangi dari memori"), "key-mem"),
        key("(", "(", T("Open bracket", "Kurung buka"), "key-fn"), key(")", ")", T("Close bracket", "Kurung tutup"), "key-fn"),
        key("\u221a", "&radic;", T("Square root", "Akar kuadrat"), "key-fn"), key("^", "x<sup>y</sup>", T("Power", "Pangkat"), "key-fn"),
        key("C", "C", T("Clear", "Bersihkan"), "key-clear"), key("DEL", "DEL", T("Delete last", "Hapus terakhir"), "key-clear"),
        key("%", "%", T("Percent", "Persen"), "key-fn"), key("/", "&divide;", T("Divide", "Bagi"), "key-op"),
        key("7", "7", "7"), key("8", "8", "8"), key("9", "9", "9"), key("*", "&times;", T("Multiply", "Kali"), "key-op"),
        key("4", "4", "4"), key("5", "5", "5"), key("6", "6", "6"), key("-", "&minus;", T("Subtract", "Kurang"), "key-op"),
        key("1", "1", "1"), key("2", "2", "2"), key("3", "3", "3"), key("+", "+", T("Add", "Tambah"), "key-op"),
        key("+/-", "&plusmn;", T("Change sign", "Ubah tanda"), "key-fn"), key("0", "0", "0"),
        key(".", T(".", ","), T("Decimal point", "Koma desimal")), key("=", "=", T("Equals", "Sama dengan"), "key-eq"),
    ]
    keys_html = "\n            ".join(keys)
    lead = T(f"Percent, brackets, powers, square roots and memory. Keyboard works too: digits, <span style='white-space: nowrap'>+ &minus; * / ^ % ( )</span>, Enter and Backspace. Your recent calculations stay saved, even after you clear the screen.",
             f"Persen, kurung, pangkat, akar kuadrat, dan memori. Keyboard juga bisa: angka, <span style='white-space: nowrap'>+ &minus; * / ^ % ( )</span>, Enter, dan Backspace. Perhitungan terakhirmu tetap tersimpan, juga setelah layar dibersihkan.")
    main = f"""      <div class="tool calc-layout">
        <div class="calc-left">
          <div class="page-head">
            <h1>{label(L, "calculator")}</h1>
            <p>{lead}</p>
          </div>
          <div class="panel hist">
            <div class="hist-head">
              <h2>{T('History', 'Riwayat')}</h2>
              <button class="btn btn-quiet" id="calc-history-clear" type="button">{T('Clear history', 'Hapus riwayat')}</button>
            </div>
            <ol class="hist-list" id="calc-history"></ol>
          </div>
        </div>
        <div class="panel calc-panel">
          <div class="calc-screen">
            <span class="calc-mem" id="calc-mem" aria-hidden="true"></span>
            <div class="calc-expr" id="calc-expr"></div>
            <output class="calc-result" id="calc-result" aria-live="polite">0</output>
          </div>
          <div class="keys">
            {keys_html}
          </div>
        </div>
      </div>"""
    return mk(L, "calculator", main, ("calculator.js",))


# ---------------------------------------------------------------- Clock
def clock(L):
    T = D(L)
    panel = f"""        <div class="panel">
          <time class="clock-time" id="clock-time"></time>
          <p class="clock-day" id="clock-day"></p>
          <p id="clock-date"></p>
          <dl class="clock-meta">
            <div><dt>{T('Time zone', 'Zona waktu')}</dt><dd id="clock-zone"></dd></div>
            <div><dt>UTC</dt><dd id="clock-utc"></dd></div>
          </dl>
        </div>"""
    main = tool(label(L, "clock"), T("Local time, date and weekday. UTC is the time stamp satellite scenes use.",
                                       "Waktu lokal, tanggal, dan hari. UTC adalah cap waktu yang dipakai pada citra satelit."), panel)
    return mk(L, "clock", main, ("clock.js",))


# ----------------------------------------------------------- Tic Tac Toe
def tic_tac_toe(L):
    T = D(L)
    cells = "\n            ".join(f'<button class="cell" type="button" data-index="{i}"></button>' for i in range(9))
    panel = f"""        <div class="panel">
          <div class="ttt-options">
            <div class="field">
              <label for="mode-select">Mode</label>
              <select class="select" id="mode-select">
                <option value="pvai">{T('Player vs AI', 'Pemain vs AI')}</option>
                <option value="pvp">{T('Player vs Player', 'Pemain vs Pemain')}</option>
              </select>
            </div>
            <div id="pvai-options">
              <div class="field">
                <label for="level-select">{T('AI level', 'Level AI')}</label>
                <select class="select" id="level-select">
                  <option value="easy">{T('Easy', 'Mudah')}</option>
                  <option value="medium">{T('Medium', 'Sedang')}</option>
                  <option value="hard">{T('Hard', 'Sulit')}</option>
                  <option value="expert">{T('Expert', 'Ahli')}</option>
                  <option value="impossible">{T('Impossible', 'Mustahil')}</option>
                </select>
              </div>
              <div class="field">
                <label for="first-move-select">{T('First move', 'Giliran pertama')}</label>
                <select class="select" id="first-move-select">
                  <option value="player">{T('Player first', 'Pemain duluan')}</option>
                  <option value="ai">{T('AI first', 'AI duluan')}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="board" id="board" role="group" aria-label="{T('Game board', 'Papan permainan')}">
            {cells}
          </div>
          <div class="ttt-foot">
            <p class="ttt-status" id="ttt-status" role="status"></p>
            <button class="btn btn-quiet" id="ttt-reset" type="button">{T('Restart', 'Mulai ulang')}</button>
          </div>
        </div>"""
    main = tool("Tic Tac Toe", T("Play the computer at five levels, or take turns with a friend. You play X.",
                                   "Lawan komputer di lima level, atau bergantian dengan teman. Kamu bermain sebagai X."), panel)
    return mk(L, "tic_tac_toe", main, ("tictactoe.js",))


# ------------------------------------------------------------------ Map
def map_page(L):
    T = D(L)
    main = head(label(L, "map"), T("Search a place or a coordinate, click the map to read its latitude and longitude, or measure distance and area.",
                                     "Cari tempat atau koordinat, klik peta untuk melihat lintang dan bujurnya, atau ukur jarak dan luas.")) + f"""
      <div class="map-frame">
        <div class="map-ui" id="map-ui">
          <form class="map-search" id="map-form" role="search">
            <label class="sr" for="map-q">{T('Place name or coordinates', 'Nama tempat atau koordinat')}</label>
            <input class="input" id="map-q" type="search" placeholder="{T('Place or coordinates', 'Tempat atau koordinat')}" autocomplete="off">
            <button class="btn" type="submit">{T('Search', 'Cari')}</button>
            <button class="icon-btn" id="map-locate" type="button" aria-label="{T('Use my location', 'Gunakan lokasiku')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg></button>
            <button class="icon-btn" id="map-measure-btn" type="button" aria-pressed="false" aria-label="{T('Measure distance and area', 'Ukur jarak dan luas')}" title="{T('Measure distance and area', 'Ukur jarak dan luas')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/></svg></button>
          </form>
          <p class="map-status" id="map-status" role="status"></p>
          <ul class="map-results" id="map-results"></ul>
        </div>
        <div id="map" role="application" aria-label="{T('Interactive map', 'Peta interaktif')}"></div>
        <div class="map-info" id="map-info" aria-live="polite">{T('Click the map or search to read coordinates.', 'Klik peta atau cari untuk melihat koordinat.')}</div>
        <div class="map-measure" id="map-measure" hidden aria-live="polite"></div>
      </div>
      <p class="note" style="margin-top: var(--s-2);">{T('Coordinates also work in degrees: 5&deg;33&prime;N 95&deg;19&prime;E.', 'Koordinat juga bisa dalam derajat: 5&deg;33&prime;N 95&deg;19&prime;E.')}</p>"""
    return mk(L, "map", main, ("map.js",),
              libs=("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js", "geo.js"),
              css=("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",))


# ----------------------------------------------------------- Coordinates
def coordinates(L):
    T = D(L)
    panel = f"""        <div class="panel tool-card stack">
          <div class="field">
            <label for="cc-input">{T('Latitude and longitude', 'Lintang dan bujur')}</label>
            <input class="input" id="cc-input" type="text" value="5.5483, 95.3238" autocomplete="off" spellcheck="false" placeholder="5.5483, 95.3238">
          </div>
          <p class="note" id="cc-status" role="status"></p>
          <dl class="kv" id="cc-out"></dl>
          <div class="conv-actions">
            <button class="btn btn-quiet" id="cc-copy" type="button">{T('Copy all', 'Salin semua')}</button>
            <a class="btn btn-quiet" id="cc-map" href="map.html">{T('Show on map', 'Lihat di peta')}</a>
          </div>
          <h2 style="font-size: 1.25rem; margin-top: var(--s-3);">{T('From UTM', 'Dari UTM')}</h2>
          <div class="row2">
            <div class="field"><label for="cc-zone">{T('Zone (1\u201360)', 'Zona (1\u201360)')}</label><input class="input" id="cc-zone" type="number" min="1" max="60" value="46" inputmode="numeric"></div>
            <div class="field"><label for="cc-hemi">{T('Hemisphere', 'Belahan bumi')}</label>
              <select class="select" id="cc-hemi"><option value="N">{T('North (N)', 'Utara (N)')}</option><option value="S">{T('South (S)', 'Selatan (S)')}</option></select></div>
            <div class="field"><label for="cc-east">Easting (m)</label><input class="input" id="cc-east" type="number" inputmode="decimal" placeholder="500000"></div>
            <div class="field"><label for="cc-north">Northing (m)</label><input class="input" id="cc-north" type="number" inputmode="decimal" placeholder="613000"></div>
          </div>
          <div><button class="btn" id="cc-utm-go" type="button">{T('Convert', 'Konversi')}</button></div>
          <p class="note" id="cc-ustatus" role="status"></p>
        </div>"""
    main = tool(label(L, "coordinates"), T("Type a coordinate in any common format and see it as decimal degrees, degrees-minutes-seconds and UTM (WGS84). You can also convert from UTM.",
                                             "Ketik koordinat dalam format umum apa saja dan lihat sebagai derajat desimal, derajat-menit-detik, dan UTM (WGS84). Bisa juga konversi dari UTM."), panel)
    return mk(L, "coordinates", main, ("coordinates.js",), libs=("geo.js",))


# ----------------------------------------------------------------- Units
def units(L):
    T = D(L)
    panel = f"""        <div class="panel tool-card stack">
          <div class="field"><label for="u-cat">{T('Category', 'Kategori')}</label><select class="select" id="u-cat"></select></div>
          <div class="field"><label for="u-value">{T('Value', 'Nilai')}</label><input class="input" id="u-value" type="text" inputmode="decimal" value="1" autocomplete="off"></div>
          <div class="row2">
            <div class="field"><label for="u-from">{T('From', 'Dari')}</label><select class="select" id="u-from"></select></div>
            <div class="field"><label for="u-to">{T('To', 'Ke')}</label><select class="select" id="u-to"></select></div>
          </div>
          <div><button class="btn btn-quiet" id="u-swap" type="button">{T('Swap', 'Tukar')}</button></div>
          <p class="big-result" id="u-result" aria-live="polite"></p>
          <div id="u-table"></div>
        </div>"""
    main = tool(label(L, "units"), T("Convert length, area, mass, volume, speed, data and temperature.",
                                       "Konversi panjang, luas, massa, volume, kecepatan, data, dan suhu."), panel)
    return mk(L, "units", main, ("units.js",))


# ------------------------------------------------------------ Converter
def converter(L):
    T = D(L)
    priv = T("Files stay on your device. Nothing is uploaded.", "File tetap di perangkatmu. Tidak ada yang diunggah.")

    def file_tool(tid, title, intro, accept, multiple, run_label, dl_name, extra=""):
        mult = " multiple" if multiple else ""
        return f"""      <section class="conv" id="{tid}" aria-labelledby="{tid}-h" hidden>
        <h2 id="{tid}-h">{title}</h2>
        <p>{intro}</p>
        <input class="input" type="file" id="{tid}-input" accept="{accept}"{mult} aria-label="{T('Choose files', 'Pilih file')}">
        <ol class="filelist" id="{tid}-list"></ol>
{extra}        <div class="conv-actions">
          <button class="btn" id="{tid}-run" type="button" disabled>{run_label}</button>
          <a class="btn btn-quiet" id="{tid}-dl" download="{dl_name}" hidden></a>
        </div>
        <p class="form-status" id="{tid}-status" role="status"></p>
        <p class="privacy">{priv}</p>
      </section>"""

    merge = file_tool("merge", T("Merge PDFs", "Gabung PDF"), T("Combine several PDFs into one. Reorder them with the arrows.", "Gabungkan beberapa PDF jadi satu. Atur urutannya dengan tombol panah."),
                      "application/pdf,.pdf", True, T("Merge", "Gabungkan"), "merged.pdf")
    extract = file_tool("extract", T("Extract pages", "Ambil halaman"), T("Keep only some pages of a PDF. Pages can be repeated or reordered.", "Ambil sebagian halaman PDF. Halaman boleh diulang atau diurutkan ulang."),
                        "application/pdf,.pdf", False, T("Extract", "Ambil"), "extracted.pdf",
                        extra=f"""        <div class="conv-opts">
          <div class="field">
            <label for="extract-range">{T('Pages to keep', 'Halaman yang dipertahankan')}</label>
            <input class="input" id="extract-range" type="text" value="1" placeholder="1-3, 5, 8-" autocomplete="off">
          </div>
        </div>
""")
    images = file_tool("images", T("Images to PDF", "Gambar ke PDF"), T("Turn JPG, PNG or other images into one PDF, one image per page.", "Ubah gambar JPG, PNG, atau lainnya jadi satu PDF, satu gambar per halaman."),
                       "image/*", True, T("Create PDF", "Buat PDF"), "images.pdf",
                       extra=f"""        <div class="conv-opts">
          <div class="field">
            <label for="images-fit">{T('Page size', 'Ukuran halaman')}</label>
            <select class="select" id="images-fit">
              <option value="image">{T('Same as each image', 'Sama dengan tiap gambar')}</option>
              <option value="a4">{T('A4 with margins', 'A4 dengan margin')}</option>
            </select>
          </div>
        </div>
""")
    word = f"""      <section class="conv" id="word" aria-labelledby="word-h" hidden>
        <h2 id="word-h">{T('Word to PDF (basic)', 'Word ke PDF (dasar)')}</h2>
        <p>{T('Converts a .docx file to a preview, then use your browser&rsquo;s print dialog and choose &ldquo;Save as PDF&rdquo;. Fonts, headers and complex layout may differ from Word.', 'Mengubah file .docx menjadi pratinjau, lalu pakai dialog cetak browser dan pilih &ldquo;Simpan sebagai PDF&rdquo;. Font, header, dan tata letak rumit bisa berbeda dari Word.')}</p>
        <input class="input" type="file" id="word-input" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" aria-label="{T('Choose a Word file', 'Pilih file Word')}">
        <ol class="filelist" id="word-list"></ol>
        <div class="conv-actions">
          <button class="btn" id="word-run" type="button" disabled>{T('Convert', 'Konversi')}</button>
          <button class="btn btn-quiet" id="word-print" type="button" disabled>{T('Print or save as PDF', 'Cetak atau simpan sebagai PDF')}</button>
        </div>
        <p class="form-status" id="word-status" role="status"></p>
        <div class="docx-preview" id="word-preview" hidden></div>
        <p class="privacy">{priv}</p>
      </section>"""
    tabs = "\n        ".join(
        f'<button class="filter" type="button" data-conv="{i}" aria-pressed="false">{l}</button>'
        for i, l in [("merge", T("Merge PDFs", "Gabung PDF")), ("extract", T("Extract pages", "Ambil halaman")),
                     ("images", T("Images to PDF", "Gambar ke PDF")), ("word", T("Word to PDF", "Word ke PDF"))]
    )
    main = head(label(L, "converter"), T("PDF and document tools that run in your browser.", "Alat PDF dan dokumen yang jalan di browsermu.")) + f"""
      <div class="filters" role="group" aria-label="{T('Tool', 'Alat')}">
        {tabs}
      </div>

{merge}
{extract}
{images}
{word}"""
    return mk(L, "converter", main, ("converter.js",),
              libs=("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
                    "vendor/mammoth.browser.min.js"))


# ----------------------------------------------------------------- Images
def images(L):
    T = D(L)
    panel = f"""        <div class="panel tool-card stack">
          <div class="field"><label for="img-input">{T('Images', 'Gambar')}</label><input class="input" id="img-input" type="file" accept="image/*" multiple></div>
          <div class="row2">
            <div class="field"><label for="img-max">{T('Longest side (px, empty = keep)', 'Sisi terpanjang (px, kosong = tetap)')}</label><input class="input" id="img-max" type="number" min="16" step="1" value="1600" inputmode="numeric"></div>
            <div class="field"><label for="img-format">{T('Format', 'Format')}</label>
              <select class="select" id="img-format"><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></div>
          </div>
          <div class="field" id="img-quality-field"><label for="img-quality">{T('Quality', 'Kualitas')}: <output id="img-quality-out">80%</output></label>
            <input id="img-quality" type="range" min="0.3" max="1" step="0.05" value="0.8"></div>
          <div><button class="btn" id="img-run" type="button" disabled>{T('Shrink', 'Kecilkan')}</button></div>
          <p class="note" id="img-status" role="status"></p>
          <ul id="img-results"></ul>
          <p class="note">{T('Files stay on your device. Nothing is uploaded.', 'File tetap di perangkatmu. Tidak ada yang diunggah.')}</p>
        </div>"""
    main = tool(label(L, "images"), T("Make photos smaller for sharing or uploading. Choose a size and quality, then download the results.",
                                        "Perkecil foto untuk dibagikan atau diunggah. Pilih ukuran dan kualitas, lalu unduh hasilnya."), panel)
    return mk(L, "images", main, ("imgtool.js",))


# --------------------------------------------------------------- Markdown
def markdown(L):
    T = D(L)

    def tb(act, lab, aria, cls=""):
        c = f"tb {cls}".strip()
        return f'<button class="{c}" type="button" data-act="{act}" aria-label="{aria}" title="{aria}">{lab}</button>'

    bar = "\n          ".join([
        '<div class="md-group">' + tb("bold", "B", T("Bold (Ctrl+B)", "Tebal (Ctrl+B)")) + tb("italic", "I", T("Italic (Ctrl+I)", "Miring (Ctrl+I)"), "tb-i") + "</div>",
        '<div class="md-group">' + tb("h1", "H1", T("Heading 1", "Judul 1")) + tb("h2", "H2", T("Heading 2", "Judul 2")) + tb("h3", "H3", T("Heading 3", "Judul 3")) + "</div>",
        '<div class="md-group">' + tb("ul", "&bull; " + T("List", "Daftar"), T("Bulleted list", "Daftar poin")) + tb("ol", "1. " + T("List", "Daftar"), T("Numbered list", "Daftar bernomor")) + tb("quote", T("Quote", "Kutipan"), T("Quote", "Kutipan")) + "</div>",
        '<div class="md-group">' + tb("code", "&lt;/&gt;", T("Code", "Kode"), "tb-code") + tb("link", T("Link", "Tautan"), T("Link (Ctrl+K)", "Tautan (Ctrl+K)")) + tb("table", T("Table", "Tabel"), T("Table", "Tabel")) + "</div>",
    ])
    main = head(T("Markdown editor", "Editor Markdown"), T("Format with the toolbar, see the result live, then download the .md file. Nothing is uploaded.",
                                                            "Beri format lewat toolbar, lihat hasilnya langsung, lalu unduh file .md. Tidak ada yang diunggah.")) + f"""
      <div class="md-app" id="md-app" data-pane="write">
        <div class="md-bar" role="toolbar" aria-label="{T('Formatting', 'Format')}">
          {bar}
        </div>

        <div class="md-file">
          <label class="sr" for="md-name">{T('File name', 'Nama file')}</label>
          <input class="input" id="md-name" type="text" value="{T('untitled.md', 'tanpa-judul.md')}" autocomplete="off">
          <button class="btn btn-quiet" id="md-new" type="button">{T('New', 'Baru')}</button>
          <label class="btn btn-quiet md-open">{T('Open', 'Buka')}<input class="sr" id="md-open" type="file" accept=".md,.markdown,.txt,text/markdown,text/plain"></label>
          <button class="btn" id="md-download" type="button">{T('Download .md', 'Unduh .md')}</button>
          <button class="btn btn-quiet" id="md-html" type="button">{T('Download HTML', 'Unduh HTML')}</button>
          <button class="btn btn-quiet" id="md-docx" type="button">{T('Download DOCX', 'Unduh DOCX')}</button>
          <button class="btn btn-quiet" id="md-print" type="button">{T('Print or PDF', 'Cetak atau PDF')}</button>
        </div>

        <div class="md-tabs seg" role="group" aria-label="{T('Editor view', 'Tampilan editor')}">
          <button type="button" data-pane="write" aria-pressed="true">{T('Write', 'Tulis')}</button>
          <button type="button" data-pane="preview" aria-pressed="false">{T('Preview', 'Pratinjau')}</button>
        </div>

        <div class="md-grid">
          <div class="md-write">
            <label class="sr" for="md-text">{T('Markdown text', 'Teks Markdown')}</label>
            <textarea id="md-text" spellcheck="true"></textarea>
          </div>
          <div class="md-preview post-body" id="md-preview" aria-label="{T('Preview', 'Pratinjau')}"></div>
        </div>
        <p class="md-meta" id="md-meta"></p>
      </div>"""
    return mk(L, "markdown", main, ("markdown.js",), libs=("vendor/marked.min.js", "vendor/purify.min.js", "vendor/fflate.js", "md2docx.js"))


# ---------------------------------------------------------------------- QR
def qr(L):
    T = D(L)
    panel = f"""        <div class="panel tool-card stack">
          <div class="filters" role="group" aria-label="{T('Mode', 'Mode')}" style="margin-bottom: 0;">
            <button class="filter" type="button" data-qrtab="make" aria-pressed="true">{T('Create', 'Buat')}</button>
            <button class="filter" type="button" data-qrtab="scan" aria-pressed="false">{T('Scan', 'Pindai')}</button>
          </div>

          <div id="qr-make" class="stack">
            <div class="field"><label for="qr-text">{T('Text or link', 'Teks atau tautan')}</label>
              <textarea class="input" id="qr-text" rows="3" spellcheck="false">https://muftikhalis.github.io</textarea></div>
            <div class="row2">
              <div class="field"><label for="qr-ecl">{T('Error correction', 'Koreksi kesalahan')}</label>
                <select class="select" id="qr-ecl"><option value="L">{T('Low (7%)', 'Rendah (7%)')}</option><option value="M" selected>{T('Medium (15%)', 'Sedang (15%)')}</option><option value="Q">{T('Quartile (25%)', 'Kuartil (25%)')}</option><option value="H">{T('High (30%)', 'Tinggi (30%)')}</option></select></div>
              <div class="field"><label for="qr-size">{T('PNG size', 'Ukuran PNG')}</label>
                <select class="select" id="qr-size"><option value="256">256 px</option><option value="512" selected>512 px</option><option value="1024">1024 px</option></select></div>
            </div>
            <div class="qr-stage" id="qr-stage"></div>
            <p class="note" id="qr-status" role="status"></p>
            <div class="conv-actions">
              <button class="btn" id="qr-png" type="button" disabled>{T('Download PNG', 'Unduh PNG')}</button>
              <button class="btn btn-quiet" id="qr-svg" type="button" disabled>{T('Download SVG', 'Unduh SVG')}</button>
            </div>
          </div>

          <div id="qr-scan" class="stack" hidden>
            <video id="qr-video" class="qr-video" playsinline muted hidden></video>
            <div class="conv-actions" style="margin-top: 0;">
              <button class="btn" id="qr-cam" type="button">{T('Start camera', 'Nyalakan kamera')}</button>
              <label class="btn btn-quiet qr-file">{T('Scan from image', 'Pindai dari gambar')}<input class="sr" id="qr-file" type="file" accept="image/*"></label>
            </div>
            <p class="note" id="qr-scan-status" role="status"></p>
            <div class="qr-found" id="qr-found" hidden>
              <p class="note" style="margin-bottom: 0.35rem;">{T('Result', 'Hasil')}</p>
              <pre class="qr-found-text" id="qr-found-text"></pre>
              <div class="conv-actions">
                <button class="btn btn-quiet" id="qr-found-copy" type="button">{T('Copy', 'Salin')}</button>
                <a class="btn" id="qr-found-open" target="_blank" rel="noopener noreferrer" hidden>{T('Open link', 'Buka tautan')}</a>
              </div>
            </div>
            <p class="note">{T('The camera image stays on your device. Nothing is uploaded. Only open links you trust.', 'Gambar kamera tetap di perangkatmu. Tidak ada yang diunggah. Buka tautan hanya jika kamu percaya.')}</p>
          </div>
        </div>"""
    main = tool(label(L, "qr"), T("Make a QR code from any text or link and download it, or scan one with your camera or from an image.",
                                    "Buat kode QR dari teks atau tautan lalu unduh, atau pindai kode QR lewat kamera atau dari gambar."), panel)
    return mk(L, "qr", main, ("qr.js",), libs=("vendor/qrcode.js", "vendor/jsQR.js"))


# --------------------------------------------------------------- Password
def password(L):
    T = D(L)
    panel = f"""        <div class="panel tool-card stack">
          <div class="field"><label for="pw-out">{T('Password', 'Kata sandi')}</label>
            <input class="input" id="pw-out" type="text" readonly spellcheck="false" autocomplete="off"></div>
          <div class="conv-actions" style="margin-top: 0;">
            <button class="btn" id="pw-new" type="button">{T('Generate', 'Buat baru')}</button>
            <button class="btn btn-quiet" id="pw-copy" type="button">{T('Copy', 'Salin')}</button>
          </div>
          <meter class="meter" id="pw-meter" min="0" max="100" low="40" high="70" optimum="100" value="0" aria-hidden="true"></meter>
          <p class="note" id="pw-strength" role="status"></p>
          <div class="field"><label for="pw-len">{T('Length', 'Panjang')}: <output id="pw-len-out">16</output></label>
            <input id="pw-len" type="range" min="8" max="64" value="16"></div>
          <label class="check"><input id="pw-lower" type="checkbox" checked> {T('Lowercase (a\u2013z)', 'Huruf kecil (a\u2013z)')}</label>
          <label class="check"><input id="pw-upper" type="checkbox" checked> {T('Uppercase (A\u2013Z)', 'Huruf besar (A\u2013Z)')}</label>
          <label class="check"><input id="pw-digits" type="checkbox" checked> {T('Numbers (0\u20139)', 'Angka (0\u20139)')}</label>
          <label class="check"><input id="pw-symbols" type="checkbox" checked> {T('Symbols (!@#$\u2026)', 'Simbol (!@#$\u2026)')}</label>
          <label class="check"><input id="pw-amb" type="checkbox"> {T('Avoid look-alike characters (I, l, 1, O, 0)', 'Hindari karakter mirip (I, l, 1, O, 0)')}</label>
          <p class="note">{T('Generated in your browser with secure random numbers. Nothing is sent anywhere.', 'Dibuat di browsermu dengan angka acak yang aman. Tidak ada yang dikirim ke mana pun.')}</p>
        </div>"""
    main = tool(label(L, "password"), T("Make a strong random password. Longer is stronger.", "Buat kata sandi acak yang kuat. Makin panjang makin kuat."), panel)
    return mk(L, "password", main, ("password.js",))


# --------------------------------------------------------------- Pomodoro
def pomodoro(L):
    T = D(L)
    panel = f"""        <div class="panel pomo tool-card">
          <p class="pomo-mode" id="pomo-mode" role="status"></p>
          <time class="pomo-time" id="pomo-time">25:00</time>
          <div class="conv-actions" style="margin-top: 0;">
            <button class="btn" id="pomo-start" type="button">{T('Start', 'Mulai')}</button>
            <button class="btn btn-quiet" id="pomo-reset" type="button">{T('Reset', 'Atur ulang')}</button>
            <button class="btn btn-quiet" id="pomo-skip" type="button">{T('Skip', 'Lewati')}</button>
          </div>
          <p class="note" id="pomo-count" style="margin-top: var(--s-2);"></p>
          <div class="row2" style="margin-top: var(--s-3);">
            <div class="field"><label for="pomo-focus">{T('Focus (min)', 'Fokus (menit)')}</label><input class="input" id="pomo-focus" type="number" min="1" max="180" value="25" inputmode="numeric"></div>
            <div class="field"><label for="pomo-short">{T('Short break', 'Istirahat singkat')}</label><input class="input" id="pomo-short" type="number" min="1" max="180" value="5" inputmode="numeric"></div>
            <div class="field"><label for="pomo-long">{T('Long break', 'Istirahat panjang')}</label><input class="input" id="pomo-long" type="number" min="1" max="180" value="15" inputmode="numeric"></div>
          </div>
        </div>"""
    main = tool(label(L, "pomodoro"), T("Work in focused blocks with short breaks, and a longer break after four. A beep tells you when time is up.",
                                          "Bekerja dalam blok fokus dengan istirahat singkat, dan istirahat panjang setelah empat sesi. Bunyi bip menandakan waktu habis."), panel)
    return mk(L, "pomodoro", main, ("pomodoro.js",))


# ------------------------------------------------------------------ Notes
def notes(L):
    T = D(L)
    panel = f"""        <div class="panel tool-card stack">
          <h2 style="font-size: 1.25rem;">{T('Tasks', 'Tugas')}</h2>
          <form class="add-row" id="task-form">
            <label class="sr" for="task-input">{T('New task', 'Tugas baru')}</label>
            <input class="input" id="task-input" type="text" placeholder="{T('Add a task', 'Tambah tugas')}" autocomplete="off">
            <button class="btn" type="submit">{T('Add', 'Tambah')}</button>
          </form>
          <ul class="tasks" id="task-list"></ul>
          <div class="conv-actions" style="margin-top: 0;">
            <p class="note" id="task-left" style="margin: 0;"></p>
            <button class="btn btn-quiet" id="task-clear" type="button">{T('Clear completed', 'Hapus yang selesai')}</button>
          </div>
          <h2 style="font-size: 1.25rem; margin-top: var(--s-4);">{T('Notes', 'Catatan')}</h2>
          <label class="sr" for="note-text">{T('Notes', 'Catatan')}</label>
          <textarea class="input notepad" id="note-text" spellcheck="true"></textarea>
          <p class="note" id="note-status" role="status"></p>
          <p class="note">{T('Saved in this browser only. Clearing site data removes it.', 'Hanya tersimpan di browser ini. Menghapus data situs akan menghapusnya.')}</p>
        </div>"""
    main = tool(label(L, "notes"), T("A simple to-do list and a note pad. Everything is saved automatically in your browser.",
                                       "Daftar tugas sederhana dan buku catatan. Semuanya tersimpan otomatis di browsermu."), panel)
    return mk(L, "notes", main, ("notes.js",))


# ------------------------------------------------------------------- 2048
def game2048(L):
    T = D(L)
    panel = f"""        <div class="panel tool-card">
          <div class="game-bar">
            <div class="scorebox"><small>{T('Score', 'Skor')}</small><strong id="g-score">0</strong></div>
            <div class="scorebox"><small>{T('Best', 'Terbaik')}</small><strong id="g-best">0</strong></div>
            <button class="btn btn-quiet" id="g-new" type="button">{T('New game', 'Permainan baru')}</button>
          </div>
          <div class="g2048" id="g2048" aria-label="{T('Game board', 'Papan permainan')}"></div>
          <div class="dpad">
            <button class="up" type="button" data-dir="up" aria-label="{T('Up', 'Atas')}">&uarr;</button>
            <button class="left" type="button" data-dir="left" aria-label="{T('Left', 'Kiri')}">&larr;</button>
            <button class="down" type="button" data-dir="down" aria-label="{T('Down', 'Bawah')}">&darr;</button>
            <button class="right" type="button" data-dir="right" aria-label="{T('Right', 'Kanan')}">&rarr;</button>
          </div>
          <p class="game-msg" id="g-msg" role="status"></p>
        </div>"""
    main = tool("2048", T("Swipe, use the arrow keys (or WASD), or tap the buttons. Equal tiles merge. Reach 2048!",
                            "Geser, pakai tombol panah (atau WASD), atau ketuk tombol. Ubin yang sama bergabung. Capai 2048!"), panel)
    return mk(L, "2048", main, ("game2048.js",))


# ------------------------------------------------------------ Minesweeper
def minesweeper(L):
    T = D(L)
    panel = f"""        <div class="panel tool-card">
          <div class="game-bar">
            <div class="scorebox"><small>{T('Mines', 'Ranjau')}</small><strong id="ms-mines">10</strong></div>
            <div class="scorebox"><small>{T('Time', 'Waktu')}</small><strong id="ms-time">0</strong></div>
            <select class="select" id="ms-level" aria-label="{T('Level', 'Level')}" style="width: auto;">
              <option value="easy">{T('Beginner 9\u00d79', 'Pemula 9\u00d79')}</option>
              <option value="medium">{T('Intermediate 16\u00d716', 'Menengah 16\u00d716')}</option>
            </select>
            <button class="btn btn-quiet" id="ms-flagmode" type="button" aria-pressed="false">&#9873; {T('Flag mode', 'Mode bendera')}</button>
            <button class="btn btn-quiet" id="ms-new" type="button">{T('New game', 'Permainan baru')}</button>
          </div>
          <div class="ms-board" id="ms-board"></div>
          <p class="game-msg" id="ms-msg" role="status"></p>
        </div>"""
    main = tool("Minesweeper", T("Tap to reveal. Numbers show how many mines touch a square. Right-click, long-press or use Flag mode to mark a mine.",
                                   "Ketuk untuk membuka. Angka menunjukkan jumlah ranjau di sekitar kotak. Klik kanan, tekan lama, atau pakai Mode bendera untuk menandai ranjau."), panel)
    return mk(L, "minesweeper", main, ("minesweeper.js",))


# ----------------------------------------------------------------- Wordle
def wordle(L):
    T = D(L)
    panel = f"""        <div class="panel tool-card">
          <div class="wd-grid" id="wd-grid" aria-label="{T('Guesses', 'Tebakan')}"></div>
          <p class="game-msg" id="wd-msg" role="status" style="text-align: center;"></p>
          <div class="wd-kb" id="wd-kb"></div>
          <div class="game-bar" style="justify-content: space-between; margin: var(--s-3) 0 0;">
            <p class="note" id="wd-stats" style="margin: 0;"></p>
            <button class="btn btn-quiet" id="wd-new" type="button">{T('New word', 'Kata baru')}</button>
          </div>
        </div>"""
    main = tool(label(L, "wordle"), T("Guess the 5-letter English word in six tries. Green is right, yellow is in the word, grey is not. Any 5 letters are accepted.",
                                        "Tebak kata Indonesia 5 huruf dalam enam kesempatan. Hijau berarti tepat, kuning ada di kata itu, abu-abu tidak ada. Huruf apa pun sepanjang 5 huruf diterima."), panel)
    return mk(L, "wordle", main, ("wordle.js",))


# ------------------------------------------------------------------- Quiz
def quiz(L):
    T = D(L)
    panel = f"""        <div class="panel tool-card">
          <div id="qz-start">
            <div class="field"><label for="qz-kind">{T('Topic', 'Topik')}</label>
              <select class="select" id="qz-kind"><option value="mix">{T('Grammar and vocabulary', 'Grammar dan kosakata')}</option><option value="g">{T('Grammar only', 'Grammar saja')}</option><option value="v">{T('Vocabulary only', 'Kosakata saja')}</option></select></div>
            <p class="note" style="margin-top: var(--s-2);">{T('Ten random questions at B1\u2013C1 level, including inversion, cleft sentences and parallel structure. You get an explanation after every answer.', 'Sepuluh soal acak level B1\u2013C1, termasuk inversi, cleft sentence, dan struktur paralel. Kamu mendapat penjelasan setelah setiap jawaban.')}</p>
            <div class="conv-actions"><button class="btn" id="qz-go" type="button">{T('Start', 'Mulai')}</button></div>
          </div>
          <div id="qz-play" hidden>
            <div class="qz-meta"><span id="qz-prog"></span><span id="qz-level"></span></div>
            <p class="qz-q" id="qz-q"></p>
            <div class="qz-opts" id="qz-opts"></div>
            <p class="qz-fb" id="qz-fb" hidden></p>
            <div class="conv-actions"><button class="btn" id="qz-next" type="button" hidden></button></div>
          </div>
          <div id="qz-end" hidden>
            <p class="big-result" id="qz-score" style="margin-top: 0;"></p>
            <p id="qz-result"></p>
            <div id="qz-missed-wrap" hidden>
              <h2 style="font-size: 1.25rem; margin-top: var(--s-3);">{T('Review', 'Tinjau')}</h2>
              <ul class="qz-missed" id="qz-missed"></ul>
            </div>
            <div class="conv-actions"><button class="btn" id="qz-again" type="button">{T('Play again', 'Main lagi')}</button></div>
          </div>
        </div>"""
    main = tool(label(L, "quiz"), T("Practise English grammar and vocabulary in short rounds.", "Latihan grammar dan kosakata bahasa Inggris dalam putaran singkat."), panel)
    return mk(L, "quiz", main, ("quiz.js",), libs=("quiz-data.js",))


def tomd(L):
    T = D(L)
    panel = f"""        <div class="panel tool-card stack">
          <div class="field"><label for="tm-input">{T('File (PDF, Word, Excel or CSV)', 'File (PDF, Word, Excel, atau CSV)')}</label>
            <input class="input" id="tm-input" type="file" accept=".pdf,.docx,.xlsx,.xls,.csv,application/pdf"></div>
          <div class="conv-actions"><button class="btn" id="tm-run" type="button" disabled>{T('Convert', 'Konversi')}</button></div>
          <p class="note" id="tm-status" role="status"></p>
          <div class="field"><label for="tm-out">Markdown</label>
            <textarea class="input tm-out" id="tm-out" rows="14" spellcheck="false"></textarea></div>
          <div class="conv-actions" id="tm-actions" hidden>
            <button class="btn" id="tm-md" type="button">{T('Download .md', 'Unduh .md')}</button>
            <button class="btn" id="tm-docx" type="button">{T('Download .docx', 'Unduh .docx')}</button>
            <button class="btn btn-quiet" id="tm-copy" type="button">{T('Copy', 'Salin')}</button>
            <button class="btn btn-quiet" id="tm-editor" type="button" data-href="markdown.html">{T('Open in editor', 'Buka di editor')}</button>
          </div>
          <ul class="facts">
            <li>{T('<strong>PDF:</strong> works for PDFs that contain text. Headings are guessed from font size. Scanned PDFs (pictures of pages) need OCR and are not supported; tables and multi-column pages come out as plain text.', '<strong>PDF:</strong> bisa untuk PDF yang berisi teks. Judul ditebak dari ukuran huruf. PDF hasil pindai (gambar halaman) butuh OCR dan belum didukung; tabel dan halaman berkolom jadi teks biasa.')}</li>
            <li>{T('<strong>Word (.docx):</strong> headings, lists, tables, bold and italic are kept. Images are skipped.', '<strong>Word (.docx):</strong> judul, daftar, tabel, tebal, dan miring dipertahankan. Gambar dilewati.')}</li>
            <li>{T('<strong>Excel and CSV:</strong> every sheet becomes a table (first 2,000 rows).', '<strong>Excel dan CSV:</strong> tiap lembar menjadi tabel (2.000 baris pertama).')}</li>
          </ul>
          <p class="note">{T('Files stay on your device. Nothing is uploaded. Check the result: automatic conversion is never perfect.', 'File tetap di perangkatmu. Tidak ada yang diunggah. Periksa hasilnya: konversi otomatis tidak pernah sempurna.')}</p>
        </div>"""
    main = tool(label(L, "tomd"), T("Turn a PDF, Word, Excel or CSV file into Markdown, edit it, then download it as .md or as a Word file.",
                                      "Ubah file PDF, Word, Excel, atau CSV jadi Markdown, edit, lalu unduh sebagai .md atau file Word."), panel)
    return mk(L, "tomd", main, ("mdconvert.js",),
              libs=("vendor/pdf.min.js", "vendor/mammoth.browser.min.js", "vendor/turndown.js", "vendor/turndown-plugin-gfm.js",
                    "vendor/xlsx.mini.min.js", "vendor/marked.min.js", "vendor/fflate.js", "md2docx.js"))


def ascii_page(L):
    T = D(L)
    main = head(label(L, "ascii"), T("Turn a photo into text. Choose black and white or colour, the characters, and the size. Download it as text or as a picture.",
                                      "Ubah foto jadi teks. Pilih hitam putih atau berwarna, karakter, dan ukuran. Unduh sebagai teks atau gambar.")) + f"""
      <div class="ascii-app">
        <div class="panel stack ascii-controls">
          <div class="field"><label for="as-input">{T('Photo', 'Foto')}</label><input class="input" id="as-input" type="file" accept="image/*"></div>
          <div class="field"><label for="as-mode">{T('Style', 'Gaya')}</label>
            <select class="select" id="as-mode"><option value="bw">{T('Black and white', 'Hitam putih')}</option><option value="color">{T('Colour', 'Berwarna')}</option></select></div>
          <div class="field"><label for="as-bg">{T('Background', 'Latar')}</label>
            <select class="select" id="as-bg"><option value="dark">{T('Dark', 'Gelap')}</option><option value="light">{T('Light', 'Terang')}</option></select></div>
          <div class="field"><label for="as-ramp">{T('Characters', 'Karakter')}</label>
            <select class="select" id="as-ramp"><option value="standard">{T('Standard', 'Standar')}</option><option value="detailed">{T('Detailed', 'Detail')}</option><option value="blocks">{T('Blocks', 'Blok')}</option><option value="simple">{T('Simple', 'Sederhana')}</option></select></div>
          <div class="field"><label for="as-cols">{T('Width', 'Lebar')}: <output id="as-cols-out">100</output> {T('characters', 'karakter')}</label>
            <input id="as-cols" type="range" min="20" max="240" step="1" value="100"></div>
          <div class="field"><label for="as-contrast">{T('Contrast', 'Kontras')}</label>
            <input id="as-contrast" type="range" min="0.5" max="2.5" step="0.1" value="1.2"></div>
          <div class="field"><label for="as-bright">{T('Brightness', 'Kecerahan')}</label>
            <input id="as-bright" type="range" min="-0.4" max="0.4" step="0.05" value="0"></div>
          <label class="check"><input id="as-invert" type="checkbox"> {T('Invert', 'Balik')}</label>
          <p class="note" id="as-status" role="status"></p>
          <div class="conv-actions" style="margin-top: 0;">
            <button class="btn" id="as-png" type="button" disabled>{T('Download PNG', 'Unduh PNG')}</button>
            <button class="btn btn-quiet" id="as-txt" type="button" disabled>{T('Download .txt', 'Unduh .txt')}</button>
            <button class="btn btn-quiet" id="as-copy" type="button" disabled>{T('Copy text', 'Salin teks')}</button>
          </div>
          <p class="note">{T('The photo stays on your device. Nothing is uploaded.', 'Foto tetap di perangkatmu. Tidak ada yang diunggah.')}</p>
        </div>
        <div class="ascii-stage dark" id="as-stage">
          <p class="ascii-empty" id="as-empty">{T('Choose a photo to begin.', 'Pilih foto untuk memulai.')}</p>
          <pre id="as-pre" hidden></pre>
          <canvas id="as-canvas" hidden aria-label="{T('ASCII art', 'Seni ASCII')}"></canvas>
        </div>
      </div>"""
    return mk(L, "ascii", main, ("asciiart.js",))


PAGES_B = [calendar, calculator, clock, tic_tac_toe, map_page, coordinates, units, converter, images, markdown, tomd, ascii_page, qr, password,
           pomodoro, notes, game2048, minesweeper, wordle, quiz]
