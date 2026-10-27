"""Navigation registry and the core pages (home, about, contact, downloads, English resources), in English and Indonesian."""
from html import escape
from urllib.parse import urlparse

LANGS = ("en", "id")

GROUP_LABELS = {
    "pages": ("Pages", "Halaman"),
    "learn": ("Learn", "Belajar"),
    "maps": ("Maps", "Peta"),
    "everyday": ("Everyday", "Sehari-hari"),
    "files": ("Files and text", "Berkas dan teks"),
    "games": ("Games", "Permainan"),
}

# group, slug (file stem), en label, id label, en description, id description, search keywords
NAV = [
    ("pages", "index", "Home", "Beranda", "Back to the start page.", "Kembali ke halaman awal.", "home beranda start"),
    ("pages", "about", "About", "Tentang", "Who I am and what I am learning.", "Siapa aku dan apa yang sedang kupelajari.", "about tentang profil"),
    ("pages", "blog", "Blog", "Blog", "Notes and write-ups.", "Catatan dan tulisan.", "blog posts tulisan artikel"),
    ("pages", "contact", "Contact", "Kontak", "Send me a message.", "Kirim pesan kepadaku.", "contact kontak pesan email"),
    ("learn", "english", "English", "English", "Grammar, TOEFL and IELTS practice, scholarship and eBook links.", "Tautan grammar, latihan TOEFL dan IELTS, beasiswa, dan eBook.", "toefl ielts grammar belajar inggris beasiswa ebook"),
    ("learn", "quiz", "English quiz", "Kuis English", "Ten-question grammar and vocabulary rounds with explanations.", "Putaran 10 soal grammar dan kosakata dengan penjelasan.", "quiz kuis soal grammar vocabulary kosakata latihan"),
    ("maps", "map", "Map", "Peta", "Search places or coordinates, measure distance and area.", "Cari tempat atau koordinat, ukur jarak dan luas.", "map peta lokasi jarak luas ukur gis"),
    ("maps", "coordinates", "Coordinates", "Koordinat", "Convert between decimal, degrees-minutes-seconds and UTM.", "Konversi desimal, derajat-menit-detik, dan UTM.", "utm dms lat long koordinat gps konversi"),
    ("maps", "units", "Units", "Satuan", "Length, area, mass, volume, speed, data and temperature.", "Panjang, luas, massa, volume, kecepatan, data, dan suhu.", "unit satuan konversi convert hektar acre"),
    ("everyday", "calculator", "Calculator", "Kalkulator", "Percent, brackets, powers, memory and a saved history.", "Persen, kurung, pangkat, memori, dan riwayat tersimpan.", "calculator kalkulator hitung persen riwayat memori"),
    ("everyday", "calendar", "Calendar", "Kalender", "Count the days from today to any date.", "Hitung selisih hari dari hari ini ke tanggal mana pun.", "calendar kalender tanggal hari"),
    ("everyday", "clock", "Clock", "Jam", "Live local time, date, weekday and UTC.", "Jam lokal langsung, tanggal, hari, dan UTC.", "clock jam waktu utc"),
    ("everyday", "pomodoro", "Pomodoro", "Pomodoro", "Focus timer with short and long breaks.", "Timer fokus dengan istirahat singkat dan panjang.", "pomodoro timer fokus belajar"),
    ("everyday", "notes", "Notes and tasks", "Catatan dan tugas", "Quick notes and a to-do list, saved in your browser.", "Catatan cepat dan daftar tugas, tersimpan di browser.", "notes catatan todo tugas checklist"),
    ("files", "converter", "PDF converter", "Konverter PDF", "Merge, split and convert PDF, image and Word files in your browser.", "Gabung, pisah, dan konversi PDF, gambar, dan Word di browser.", "pdf word docx merge split gabung pisah konversi"),
    ("files", "images", "Image compressor", "Kompres gambar", "Shrink and resize photos without uploading them.", "Kecilkan dan ubah ukuran foto tanpa mengunggah.", "image gambar foto compress kompres resize jpg png webp"),
    ("files", "markdown", "Markdown editor", "Editor Markdown", "Write with a toolbar, preview live, download as .md.", "Tulis dengan toolbar, pratinjau langsung, unduh sebagai .md.", "markdown md editor tulis"),
    ("files", "tomd", "To Markdown", "Ke Markdown", "Turn PDF, Word and Excel files into Markdown, and Markdown into Word.", "Ubah file PDF, Word, dan Excel jadi Markdown, dan Markdown jadi Word.", "pdf docx xlsx excel word csv markdown konversi docx"),
    ("files", "ascii", "Photo to ASCII", "Foto ke ASCII", "Turn a photo into ASCII art, black and white or in colour.", "Ubah foto jadi seni ASCII, hitam putih atau berwarna.", "ascii art foto gambar teks warna seni"),
    ("files", "qr", "QR code", "Kode QR", "Make QR codes, or scan them with the camera or from an image.", "Buat kode QR, atau pindai lewat kamera atau dari gambar.", "qr code kode barcode tautan link scan pindai kamera"),
    ("files", "password", "Password generator", "Pembuat kata sandi", "Random passwords with a strength estimate.", "Kata sandi acak dengan perkiraan kekuatan.", "password sandi generator acak kuat"),
    ("games", "tic_tac_toe", "Tic Tac Toe", "Tic Tac Toe", "Play the computer at five levels, or a friend.", "Lawan komputer di lima level, atau lawan teman.", "tic tac toe xo game permainan"),
    ("games", "2048", "2048", "2048", "Slide and merge tiles to reach 2048.", "Geser dan gabungkan ubin sampai 2048.", "2048 game puzzle angka"),
    ("games", "minesweeper", "Minesweeper", "Minesweeper", "Clear the board without hitting a mine.", "Bersihkan papan tanpa menginjak ranjau.", "minesweeper ranjau game"),
    ("games", "wordle", "Word guess", "Tebak kata", "Guess the 5-letter word in six tries.", "Tebak kata 5 huruf dalam enam kesempatan.", "wordle tebak kata word game"),
]
INLINE_SLUGS = ("about", "blog", "english", "contact")
INFO = {n[1]: n for n in NAV}


def tr(L, en, idn):
    return en if L == "en" else idn


def label(L, slug):
    n = INFO[slug]
    return n[2] if L == "en" else n[3]


def desc(L, slug):
    n = INFO[slug]
    return n[4] if L == "en" else n[5]


def head(h1, lead):
    return f"""      <div class="page-head">
        <h1>{h1}</h1>
        <p>{lead}</p>
      </div>
"""


def tool(h1, lead, panel):
    return f"""      <div class="tool">
        <div class="page-head">
          <h1>{h1}</h1>
          <p>{lead}</p>
        </div>
{panel}
      </div>"""


# ----------------------------------------------------------------- Home
def home(L):
    T = lambda e, i: tr(L, e, i)
    tool_groups = []
    for g in ("learn", "maps", "everyday", "files", "games"):
        rows = "\n".join(
            f'            <li><a href="{n[1]}.html"><span class="name">{escape(n[2] if L == "en" else n[3])}</span><span class="what">{escape(n[4] if L == "en" else n[5])}</span></a></li>'
            for n in NAV if n[0] == g
        )
        tool_groups.append(f"""          <div>
            <h3>{GROUP_LABELS[g][0 if L == "en" else 1]}</h3>
            <ul class="index">
{rows}
            </ul>
          </div>""")
    main = f"""      <section class="hero">
        <div class="hero-text">
          <h1>{T('Reading vegetation from space, one <span style="white-space: nowrap">10-metre</span> pixel at a time.', 'Membaca vegetasi dari luar angkasa, satu piksel <span style="white-space: nowrap">10 meter</span> sekali lihat.')}</h1>
          <p>{T('I&rsquo;m Mufti Khalis, a biology graduate from Universitas Syiah Kuala in Banda Aceh. This is my small corner of the web: a few handy tools, a plain-language look at remote sensing, and English study links.', 'Aku Mufti Khalis, lulusan biologi Universitas Syiah Kuala di Banda Aceh. Ini pojok kecilku di web: beberapa alat yang berguna, penjelasan remote sensing yang mudah dipahami, dan tautan belajar bahasa Inggris.')}</p>
        </div>

        <figure class="raster">
          <div class="raster-stage" id="raster-stage">
            <canvas id="raster-canvas" role="img" aria-label="{T('Illustrative NDVI raster showing a river, patches of dense vegetation and a built-up area.', 'Raster NDVI ilustrasi yang menampilkan sungai, petak vegetasi rapat, dan kawasan terbangun.')}"></canvas>
            <div class="raster-cursor" id="raster-cursor"></div>
          </div>
          <div class="raster-readout" aria-hidden="true">
            <strong id="raster-val">NDVI</strong>
            <span id="raster-class">{T('Point at a pixel to read its NDVI.', 'Arahkan ke sebuah piksel untuk melihat nilai NDVI-nya.')}</span>
          </div>
          <div class="raster-legend"></div>
          <div class="raster-scale"><span>&minus;0.2</span><span>0.9</span></div>
          <figcaption>{T('Illustrative raster generated in your browser, not real imagery. Each square stands for one 10&nbsp;m Sentinel-2 pixel.', 'Raster ilustrasi yang dibuat di browsermu, bukan citra asli. Tiap kotak mewakili satu piksel Sentinel-2 berukuran 10&nbsp;m.')}</figcaption>
        </figure>
      </section>

      <section class="section" aria-labelledby="ndvi-h">
        <div class="finding">
          <div>
            <h2 id="ndvi-h">{T('NDVI, explained simply', 'NDVI, dijelaskan sederhana')}</h2>
            <p>{T('Healthy plants absorb red light for photosynthesis and reflect a lot of near-infrared light (NIR). NDVI compares the two, so a satellite can tell green, growing vegetation from bare ground or water.', 'Tumbuhan sehat menyerap cahaya merah untuk fotosintesis dan memantulkan banyak cahaya inframerah dekat (NIR). NDVI membandingkan keduanya, sehingga satelit bisa membedakan vegetasi hijau yang tumbuh dari lahan terbuka atau air.')}</p>
            <p>{T('The result runs from &minus;1 to 1. Roughly: water is below 0, bare ground and buildings sit close to 0, and dense, healthy vegetation is high, often above 0.5. Exact cut-offs depend on the sensor and the place.', 'Hasilnya berkisar dari &minus;1 sampai 1. Kira-kira: air di bawah 0, lahan terbuka dan bangunan mendekati 0, dan vegetasi rapat yang sehat bernilai tinggi, sering di atas 0,5. Batas pastinya bergantung pada sensor dan lokasi.')}</p>
          </div>
          <div>
            <p class="formula">NDVI = (NIR &minus; Red) / (NIR + Red)</p>
            <ul class="scale">
              <li><span class="chip" style="background: var(--water)"></span><span>{T('Water', 'Air')}</span><span class="range">{T('below 0', 'di bawah 0')}</span></li>
              <li><span class="chip" style="background: var(--bare)"></span><span>{T('Bare ground, built-up', 'Lahan terbuka, terbangun')}</span><span class="range">{T('0 to 0.1', '0 sampai 0,1')}</span></li>
              <li><span class="chip" style="background: var(--sparse)"></span><span>{T('Sparse vegetation', 'Vegetasi jarang')}</span><span class="range">{T('0.1 to 0.3', '0,1 sampai 0,3')}</span></li>
              <li><span class="chip" style="background: var(--mid)"></span><span>{T('Moderate vegetation', 'Vegetasi sedang')}</span><span class="range">{T('0.3 to 0.5', '0,3 sampai 0,5')}</span></li>
              <li><span class="chip" style="background: var(--dense)"></span><span>{T('Dense vegetation', 'Vegetasi rapat')}</span><span class="range">{T('above 0.5', 'di atas 0,5')}</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section class="section" aria-labelledby="tools-h">
        <h2 id="tools-h">{T('Small tools', 'Alat-alat kecil')}</h2>
        <p class="note" style="margin-bottom: var(--s-3);">{T('Press Ctrl+K (or the search button) to jump to any tool.', 'Tekan Ctrl+K (atau tombol cari) untuk loncat ke alat mana pun.')}</p>
        <div class="tool-groups">
{chr(10).join(tool_groups)}
        </div>
      </section>"""
    return dict(
        slug="index",
        title=T("Home", "Beranda"),
        desc=T("Mufti Khalis, biology graduate in Banda Aceh. Small web tools, a plain-language NDVI explainer and English study links.",
               "Mufti Khalis, lulusan biologi di Banda Aceh. Alat web kecil, penjelasan NDVI yang mudah dipahami, dan tautan belajar bahasa Inggris."),
        main=main, scripts=("raster.js",), jsonld="home",
    )


# ---------------------------------------------------------------- About
def about(L):
    T = lambda e, i: tr(L, e, i)
    main = head(T("About", "Tentang"), T("Biology graduate from Banda Aceh, curious about maps, satellites and small web tools.",
                                           "Lulusan biologi dari Banda Aceh, penasaran dengan peta, satelit, dan alat web kecil.")) + f"""
      <div class="prose">
        <div>
          <p>{T('I&rsquo;m from Sigli and live in Banda Aceh, Aceh. I studied Biology at the Faculty of Mathematics and Natural Sciences (FMIPA), Universitas Syiah Kuala.', 'Aku berasal dari Sigli dan tinggal di Banda Aceh, Aceh. Aku kuliah Biologi di Fakultas Matematika dan Ilmu Pengetahuan Alam (FMIPA), Universitas Syiah Kuala.')}</p>
          <p>{T('This site is where I keep things I find useful: small tools, notes while I learn remote sensing and GIS, and links for studying English. It is a hobby project, so expect it to keep changing.', 'Situs ini tempat aku menyimpan hal-hal yang menurutku berguna: alat kecil, catatan selama belajar remote sensing dan GIS, serta tautan untuk belajar bahasa Inggris. Ini proyek iseng, jadi akan terus berubah.')}</p>
        </div>
        <div>
          <h2>{T('Currently learning', 'Sedang dipelajari')}</h2>
          <ul class="facts">
            <li>{T('Remote sensing basics: how satellites measure vegetation, water and land.', 'Dasar-dasar remote sensing: bagaimana satelit mengukur vegetasi, air, dan lahan.')}</li>
            <li>{T('GIS tools such as ArcGIS and Google Earth Engine.', 'Perangkat GIS seperti ArcGIS dan Google Earth Engine.')}</li>
            <li>{T('Python for working with maps and data.', 'Python untuk mengolah peta dan data.')}</li>
          </ul>
        </div>
      </div>"""
    return dict(
        slug="about", title=T("About", "Tentang"),
        desc=T("About Mufti Khalis: biology graduate from Universitas Syiah Kuala, based in Banda Aceh, learning remote sensing and GIS.",
               "Tentang Mufti Khalis: lulusan biologi Universitas Syiah Kuala, tinggal di Banda Aceh, sedang belajar remote sensing dan GIS."),
        main=main,
    )


# -------------------------------------------------------------- Contact
def contact(L):
    T = lambda e, i: tr(L, e, i)
    main = head(T("Contact", "Kontak"), T("Send me a message with the form below.", "Kirim pesan lewat formulir di bawah.")) + f"""
      <form class="form" id="contact-form" data-endpoint="" novalidate>
        <div class="field">
          <label for="c-name">{T('Name', 'Nama')}</label>
          <input class="input" id="c-name" name="name" type="text" autocomplete="name" required>
        </div>
        <div class="field">
          <label for="c-email">Email</label>
          <input class="input" id="c-email" name="email" type="email" autocomplete="email" required>
        </div>
        <div class="field">
          <label for="c-message">{T('Message', 'Pesan')}</label>
          <textarea class="input" id="c-message" name="message" rows="6" required></textarea>
        </div>
        <div>
          <button class="btn" type="submit">{T('Send message', 'Kirim pesan')}</button>
        </div>
        <p class="form-status" id="form-status" role="status"></p>
      </form>"""
    return dict(slug="contact", title=T("Contact", "Kontak"), desc=T("Contact Mufti Khalis.", "Hubungi Mufti Khalis."),
                main=main, scripts=("contact.js",))


# ------------------------------------------------------------ Downloads
def download(L):
    T = lambda e, i: tr(L, e, i)
    main = head(T("Downloads", "Unduhan"), T("Files to save and keep.", "File untuk disimpan.")) + f"""
      <div class="empty">
        <h2>{T('Nothing to download yet', 'Belum ada yang bisa diunduh')}</h2>
        <p>{T('Files will be listed here once they are available.', 'File akan muncul di sini kalau sudah tersedia.')}</p>
      </div>"""
    return dict(slug="download", title=T("Downloads", "Unduhan"), desc=T("Downloads from Mufti Khalis.", "Unduhan dari Mufti Khalis."),
                main=main, noindex=True, nav=False)


# --------------------------------------------------------------- English
RES = [
    ("grammar", ("Grammar", "Grammar"), ("Grammar", "Grammar"), [
        ("Fabelia", "https://www.fabelia.com/belajar-grammar/"),
        ("Grammar Bahasa Inggris", "https://grammarbahasainggris.net/"),
        ("7ESL", "https://7esl.com/grammar/"),
        ("Talk English", "https://www.talkenglish.com/grammar/grammar.aspx"),
        ("Learn English", "https://learnenglish.britishcouncil.org/grammar"),
    ]),
    ("structure", ("Simple structure", "Struktur sederhana"), ("Simple structure", "Struktur kalimat sederhana"), [
        ("Grammar Bahasa Inggris", "https://grammarbahasainggris.net/sentence-structure"),
        ("Sederet", "https://www.sederet.com/tutorial/sentence-structure-simple-sentence/"),
        ("UNR", "https://www.unr.edu/writing-speaking-center/student-resources/writing-speaking-resources/basic-sentence-pattern-in-english"),
        ("Wordy", "https://www.wordy.com/writers-workshop/basic-english-sentence-structure/"),
        ("Academic Guides", "https://academicguides.waldenu.edu/writingcenter/grammar/sentencestructure"),
    ]),
    ("tests", ("Practice tests", "Latihan tes"), ("Free practice tests: TOEFL and IELTS", "Latihan tes gratis: TOEFL dan IELTS"), [
        ("Take IELTS", "https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests"),
        ("Test Glider", "https://www.testglider.com/"),
        ("Test Den", "https://www.testden.com/challenge/free-toefl.asp"),
        ("Best My Test", "https://www.bestmytest.com/toefl/practice-test"),
        ("IELTS Writing", "https://www.ielts-writing.info/EXAM/"),
        ("ESL Lounge", "https://www.esl-lounge.com/toefl.php"),
    ]),
    ("scholarship", ("Scholarships", "Beasiswa"), ("Postgraduate and scholarship preparation", "Persiapan S2 dan beasiswa"), [
        ("Scholars 4 Dev", "http://www.scholars4dev.com"),
        ("Motivational Letter", "http://www.motivationalletter.com"),
        ("Top Universities", "http://www.topuniversities.com"),
        ("Best Masters Degrees", "http://www.bestmastersdegrees.com"),
        ("Master Studies", "http://www.masterstudies.com"),
        ("Masters Portal", "http://www.mastersportal.eu"),
        ("Find A Masters", "http://www.findamasters.com"),
    ]),
    ("ebooks", ("eBooks", "eBook"), ("Free eBooks", "eBook gratis"), [
        ("Basic English", "https://drive.google.com/drive/folders/1ZBW50jq5NX2IyKmHaXFKMlbBCdFZvtlr?usp=share_link"),
        ("TOEFL", "https://drive.google.com/drive/folders/1XhrgklnDDXMpkD8SDDvGzk_VfVsjKhFU?usp=sharing"),
        ("IELTS", "https://drive.google.com/drive/folders/1yLP6C8OKhDsY8ML3WhR3Ihpkx4fmhadA?usp=share_link"),
    ]),
]


def host(url):
    h = urlparse(url).netloc
    if h == "drive.google.com":
        return "Google Drive"
    return h[4:] if h.startswith("www.") else h


def english(L):
    T = lambda e, i: tr(L, e, i)
    k = 0 if L == "en" else 1
    filters = [f'<button class="filter" type="button" data-filter="all" aria-pressed="false">{T("All", "Semua")}</button>']
    for gid, short, _, _ in RES:
        filters.append(f'<button class="filter" type="button" data-filter="{gid}" aria-pressed="false">{short[k]}</button>')
    groups = []
    for gid, _, long_, links in RES:
        items = "\n            ".join(
            f'<li><a href="{escape(u)}" target="_blank" rel="noopener noreferrer"><span class="res-name">{escape(n)}<span class="sr"> ({T("opens in a new tab", "terbuka di tab baru")})</span></span><span class="res-host">{escape(host(u))}</span></a></li>'
            for n, u in links
        )
        groups.append(f'''      <section class="res-group" id="{gid}" aria-labelledby="{gid}-h">
        <h2 id="{gid}-h">{escape(long_[k])}</h2>
        <ul class="res-list">
            {items}
        </ul>
      </section>''')
    main = head(T("English resources", "Sumber belajar English"),
                T("Links for grammar, test practice, scholarship preparation and free eBooks.",
                  "Tautan untuk grammar, latihan tes, persiapan beasiswa, dan eBook gratis.")) + f"""
      <div class="filters" role="group" aria-label="{T('Category', 'Kategori')}">
        {chr(10).join(filters)}
      </div>

{chr(10).join(groups)}"""
    return dict(
        slug="english", title=T("English", "English"),
        desc=T("English learning links: grammar, sentence structure, free TOEFL and IELTS practice tests, scholarship preparation and eBooks.",
               "Tautan belajar bahasa Inggris: grammar, struktur kalimat, latihan TOEFL dan IELTS gratis, persiapan beasiswa, dan eBook."),
        main=main, scripts=("english.js",),
    )


PAGES_A = [home, about, contact, download, english]
