# muftikhalis.github.io

Situs pribadi Mufti Khalis dalam dua bahasa: Inggris (alamat utama) dan Indonesia (`/id/`). Isinya penjelasan NDVI yang mudah dipahami, banyak alat kecil, permainan, dan tautan belajar bahasa Inggris. Statis, gratis, jalan di GitHub Pages, dan bisa di-install seperti aplikasi (PWA).

## Isi

- **Peta dan lokasi:** peta (cari tempat atau koordinat, ukur jarak dan luas), konverter koordinat (desimal, DMS, UTM), konverter satuan.
- **Sehari-hari:** kalkulator (persen, kurung, pangkat, akar, memori, riwayat tersimpan), kalender, jam, Pomodoro, catatan dan tugas.
- **Berkas dan teks:** konverter PDF (gabung, ambil halaman, gambar ke PDF, Word ke PDF), kompres gambar, editor Markdown (bisa unduh .md, HTML, DOCX), **Ke Markdown** (PDF, Word, Excel, CSV jadi Markdown lalu Word), foto ke ASCII (hitam putih atau berwarna), kode QR (buat dan pindai lewat kamera atau gambar), pembuat kata sandi.
- **Belajar:** tautan English dan kuis grammar/kosakata.
- **Permainan:** Tic Tac Toe, 2048, Minesweeper, Tebak kata.
- Tekan **Ctrl+K** untuk mencari halaman atau alat. Tema (palet dan mode terang/gelap) ada di menu.

Semua alat jalan di browser. Tidak ada file atau data yang dikirim ke server. Library pihak ketiga (PDF.js, mammoth, SheetJS, jsQR, dan lain-lain) disimpan di `assets/vendor/` beserta lisensinya.

## Menulis blog

1. Tulisan Inggris: buat file di folder `posts/`. Tulisan Indonesia: folder `posts/id/`.
2. Beri nama, misalnya `hitung-ndvi.md`. Nama file jadi alamat tulisan.
3. Isi seperti `posts/_template.md`: blok `---` di atas (title, date, summary) lalu isi dengan Markdown.
4. Commit. Sekitar 1 menit kemudian tulisan muncul di halaman Blog.

Kalau dua tulisan (Inggris dan Indonesia) memakai nama file yang sama, tombol EN/ID menghubungkan keduanya. `draft: true` menyembunyikan tulisan. File berawalan `_` tidak dipublikasikan.

## Statistik pengunjung (GoatCounter)

1. Daftar gratis di goatcounter.com, pilih kode situs, misalnya `mufti`.
2. Buka `tools/config.json`, isi `"goatcounter": "mufti"`, commit.

## Cara kerja

`tools/build.py` membuat semua halaman (dua bahasa), daftar blog, `sitemap.xml`, `robots.txt`, `404.html`, `manifest.webmanifest`, dan `sw.js` (offline). GitHub Actions (`.github/workflows/static.yml`) menjalankannya setiap push, lalu deploy. Di Settings → Pages, **Source** harus **GitHub Actions**.

Jalankan lokal (opsional):

```bash
pip install markdown
python tools/build.py
```

## Menambah atau mengubah teks

- Teks halaman: `tools/pages_a.py` dan `tools/pages_b.py` (Inggris dan Indonesia berdampingan).
- Teks di dalam alat (pesan, tombol): `tools/js_strings.py`.
- Alamat situs: `tools/config.json`. Warna dan tema: `assets/style.css` dan `assets/theme.js`.
