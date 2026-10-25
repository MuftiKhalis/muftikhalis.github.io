#!/usr/bin/env python3
"""Generate the whole static site (English at the root, Indonesian in /id/) into the repo root.

Run from the repo root:  python tools/build.py
Blog posts: posts/*.md (English) and posts/id/*.md (Indonesian). See posts/_template.md.
Needs:  pip install markdown
"""
import datetime
import hashlib
import html as html_lib
import json
import os
import posixpath
import re
import sys
from html import escape

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from js_strings import S as JS_STRINGS, DYNAMIC as JS_DYNAMIC  # noqa: E402
from pages_a import (NAV, GROUP_LABELS, INLINE_SLUGS, PAGES_A, LANGS, tr, label, desc as nav_desc)  # noqa: E402
from pages_b import PAGES_B  # noqa: E402

ROOT = os.path.dirname(HERE)
OUT = ROOT

_cfg = {"site_url": "https://muftikhalis.github.io", "goatcounter": ""}
try:
    with open(os.path.join(HERE, "config.json"), encoding="utf-8") as _f:
        _cfg.update(json.load(_f))
except FileNotFoundError:
    pass
SITE_URL = str(_cfg["site_url"]).rstrip("/")
GOATCOUNTER = str(_cfg["goatcounter"]).strip()
if GOATCOUNTER and not re.fullmatch(r"[A-Za-z0-9-]+", GOATCOUNTER):
    raise SystemExit("tools/config.json: 'goatcounter' must be just the code, for example \"mufti\" (not a URL).")

YEAR_RANGE = f"2024\u2013{datetime.date.today().year}"
FONTS = ("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800"
         "&family=Instrument+Sans:wght@400..700&display=swap")

PALETTES = [("ocean", "Ocean", "#1d4e89", "#d6e4f2"), ("forest", "Forest", "#1f5c3a", "#d5e3cf"),
            ("stone", "Stone", "#2a2a2e", "#dddde0"), ("plum", "Plum", "#6b2d7c", "#e6d3ea")]


# ------------------------------------------------------------------ paths
def lpath(L, slug):
    return f"{slug}.html" if L == "en" else f"id/{slug}.html"


def rel(frm, to):
    """Relative link from page `frm` to site path `to` (absolute for the root 404 page)."""
    if frm == "404.html":
        return "/" + to
    return posixpath.relpath(to, posixpath.dirname(frm) or ".")


def canon(path):
    if path.endswith("index.html"):
        path = path[: -len("index.html")]
    return SITE_URL + "/" + path


ASSET_V = ""


def asset_version():
    """Short hash of all local JS/CSS, appended as ?v= so browsers (and the offline cache) fetch fresh files."""
    h = hashlib.sha1()
    base = os.path.join(OUT, "assets")
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames.sort()
        for fn in sorted(filenames):
            if fn.endswith((".js", ".css")):
                with open(os.path.join(dirpath, fn), "rb") as f:
                    h.update(fn.encode())
                    h.update(f.read())
    return h.hexdigest()[:8]


def write(path, text):
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


# ------------------------------------------------------------------ shell
def shell(L, path, page, alt=None):
    T = lambda e, i: tr(L, e, i)
    title = page["title"] if page.get("full_title") else page["title"] + " - Mufti Khalis"
    A = lambda p: rel(path, "assets/" + p) + ("?v=" + ASSET_V if p.endswith((".js", ".css")) and ASSET_V else "")
    cur_slug = page.get("nav_slug") or page["slug"]

    inline_items = []
    for s in INLINE_SLUGS:
        cur = ' aria-current="page"' if s == cur_slug else ""
        inline_items.append(f'<li><a href="{rel(path, lpath(L, s))}"{cur}>{escape(label(L, s))}</a></li>')
    inline = "\n          ".join(inline_items)

    groups = []
    for g in ("pages", "learn", "maps", "everyday", "files", "games"):
        lis = []
        for n in NAV:
            if n[0] != g:
                continue
            slug = n[1]
            cur = ' aria-current="page"' if slug == cur_slug else ""
            lis.append(f'<li><a href="{rel(path, lpath(L, slug))}"{cur} data-desc="{escape(nav_desc(L, slug), quote=True)}" data-k="{escape(n[6], quote=True)}">{escape(label(L, slug))}</a></li>')
        cls = ' class="cols big"' if g == "pages" else ' class="cols"'
        groups.append(f'<h2>{GROUP_LABELS[g][0 if L == "en" else 1]}</h2>\n          <ul{cls}>\n            ' + "\n            ".join(lis) + "\n          </ul>")
    swatches = "".join(
        f'<button class="swatch" type="button" data-palette-btn="{k}" aria-pressed="false" aria-label="{T(n + " palette", "Palet " + n)}"><span class="swatch-chip" style="--a:{a};--b:{tt}"></span>{n}</button>'
        for k, n, a, tt in PALETTES
    )
    modes = "".join(f'<button type="button" data-mode-btn="{k}" aria-pressed="false">{n}</button>'
                    for k, n in [("auto", T("Auto", "Otomatis")), ("light", T("Light", "Terang")), ("dark", T("Dark", "Gelap"))])
    groups.append(f'<h2>{T("Appearance", "Tampilan")}</h2>\n          <div class="theme-picker">\n            <div class="swatches" role="group" aria-label="{T("Color palette", "Palet warna")}">{swatches}</div>\n            <div class="seg" role="group" aria-label="{T("Light or dark mode", "Mode terang atau gelap")}">{modes}</div>\n          </div>')
    drawer = "\n          ".join(groups)

    other = "id" if L == "en" else "en"
    if alt is None:
        alt = {lang: lpath(lang, page["slug"]) for lang in LANGS} if path != "404.html" else {}
    switch = ""
    if path != "404.html":
        target = alt.get(other) or lpath(other, "blog")
        names = {"en": ("EN", "English"), "id": ("ID", "Bahasa Indonesia")}
        switch = f'<a class="lang-switch" href="{rel(path, target)}" hreflang="{other}" lang="{other}" title="{names[other][1]}" aria-label="{names[other][1]}">{names[other][0]}</a>'
    alternates = ""
    if len(alt) == 2:
        alternates = "".join(f'  <link rel="alternate" hreflang="{lang}" href="{canon(p)}">\n' for lang, p in alt.items())
        alternates += f'  <link rel="alternate" hreflang="x-default" href="{canon(alt["en"])}">\n'

    libs = list(page.get("libs", ()))
    ext = [u for u in libs if u.startswith("http")]
    loc = [A(u) for u in libs if not u.startswith("http")]
    scripts = ext + [A("i18n.js")] + loc + [A("site.js")] + [A(s) for s in page.get("scripts", ())]
    script_tags = "\n".join(f'  <script src="{u}" defer></script>' for u in scripts)
    if GOATCOUNTER:
        script_tags += f'\n  <script data-goatcounter="https://{GOATCOUNTER}.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>'
    css_tags = "".join(f'  <link rel="stylesheet" href="{u if u.startswith("http") else A(u)}">\n' for u in page.get("css", ()))

    t_, d_ = escape(title), escape(page["desc"])
    canon_url = canon(path)
    robots = '  <meta name="robots" content="noindex">\n' if page.get("noindex") else ""
    ld = ""
    jl = page.get("jsonld")
    if jl == "home":
        jl = {"@context": "https://schema.org", "@graph": [
            {"@type": "WebSite", "name": "Mufti Khalis", "url": canon(lpath(L, "index")), "inLanguage": L},
            {"@type": "Person", "name": "Mufti Khalis", "url": canon("index.html"),
             "alumniOf": {"@type": "CollegeOrUniversity", "name": "Universitas Syiah Kuala"}}]}
    if jl:
        ld = '  <script type="application/ld+json">' + json.dumps(jl, ensure_ascii=False).replace("</", "<\\/") + "</script>\n"
    locale, loc_alt = ("en_US", "id_ID") if L == "en" else ("id_ID", "en_US")

    return f"""<!DOCTYPE html>
<html lang="{L}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{t_}</title>
  <meta name="description" content="{d_}">
{robots}  <link rel="canonical" href="{canon_url}">
{alternates}  <meta property="og:site_name" content="Mufti Khalis">
  <meta property="og:type" content="{page.get("og_type", "website")}">
  <meta property="og:title" content="{t_}">
  <meta property="og:description" content="{d_}">
  <meta property="og:url" content="{canon_url}">
  <meta property="og:locale" content="{locale}">
  <meta property="og:locale:alternate" content="{loc_alt}">
  <meta property="og:image" content="{SITE_URL}/assets/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#f0f4f8" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0c1622" media="(prefers-color-scheme: dark)">
  <link rel="manifest" href="{rel(path, "manifest.webmanifest")}">
  <link rel="apple-touch-icon" href="{A("icon-192.png")}">
  <script src="{A("theme.js")}"></script>
  <link rel="icon" href="{rel(path, "favicon.ico")}" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="{FONTS}">
{css_tags}  <link rel="stylesheet" href="{A("style.css")}">
{ld}</head>
<body>
  <a class="skip" href="#main">{T("Skip to content", "Lewati ke konten")}</a>

  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="{rel(path, lpath(L, "index"))}">
        <span class="mark" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span>
        Mufti Khalis
      </a>
      <div class="header-end">
        <nav aria-label="{T("Primary", "Utama")}">
          <ul class="nav-inline">
          {inline}
          </ul>
        </nav>
        {switch}
        <button class="icon-btn" id="search-btn" type="button" aria-label="{T("Search pages and tools (Ctrl+K)", "Cari halaman dan alat (Ctrl+K)")}" title="{T("Search (Ctrl+K)", "Cari (Ctrl+K)")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></button>
        <button class="menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="menu-panel">Menu</button>
      </div>
    </div>
  </header>

  <div class="scrim" id="scrim"></div>
  <nav class="drawer" id="menu-panel" aria-label="{T("All pages", "Semua halaman")}">
    <div class="drawer-top">
      <button class="btn btn-quiet" id="install-btn" type="button" hidden>{T("Install app", "Pasang aplikasi")}</button>
      <button class="btn btn-quiet" id="menu-close" type="button">{T("Close", "Tutup")}</button>
    </div>
    {drawer}
  </nav>

  <main id="main">
    <div class="wrap">
{page["main"]}
    </div>
  </main>

  <footer class="site-footer">
    <div class="wrap">&copy; {YEAR_RANGE} Mufti Khalis</div>
  </footer>

{script_tags}
</body>
</html>
"""


# ------------------------------------------------------------------ blog
def parse_front(raw):
    meta, body = {}, raw
    m = re.match(r"^---[ \t]*\n(.*?)\n---[ \t]*\n?(.*)$", raw, re.S)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line and not line.lstrip().startswith("#"):
                k, v = line.split(":", 1)
                meta[k.strip().lower()] = v.strip().strip('"').strip("'")
        body = m.group(2)
    return meta, body


MONTHS = {
    "en": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "id": ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
}


def pretty_date(L, d):
    return f"{d.day} {MONTHS[L][d.month - 1]} {d.year}"


def load_posts(L):
    folder = os.path.join(ROOT, "posts") if L == "en" else os.path.join(ROOT, "posts", "id")
    posts, seen = [], set()
    if not os.path.isdir(folder):
        return posts
    names = [n for n in sorted(os.listdir(folder)) if n.endswith(".md") and not n.startswith("_")]
    if names:
        try:
            import markdown
        except ImportError:
            raise SystemExit("Blog posts found but the 'markdown' package is missing. Run: pip install markdown")
    rel_dir = "posts" if L == "en" else "posts/id"
    for fn in names:
        with open(os.path.join(folder, fn), encoding="utf-8-sig") as f:
            meta, body = parse_front(f.read().replace("\r\n", "\n"))
        if meta.get("draft", "").lower() in ("true", "yes", "1"):
            continue
        title = meta.get("title", "").strip()
        if not title:
            raise SystemExit(f"{rel_dir}/{fn}: add a 'title:' line in the front matter (between the --- lines).")
        try:
            date = datetime.date.fromisoformat(meta.get("date", ""))
        except ValueError:
            raise SystemExit(f"{rel_dir}/{fn}: 'date:' must look like 2026-10-21.")
        slug = re.sub(r"[^a-z0-9-]+", "-", fn[:-3].lower()).strip("-")
        if not slug or slug in seen:
            raise SystemExit(f"{rel_dir}/{fn}: file name gives an empty or duplicate address '{slug}'.")
        seen.add(slug)
        body_html = markdown.markdown(body, extensions=["fenced_code", "tables", "sane_lists"])
        summary = meta.get("summary", "").strip()
        if not summary:
            m = re.search(r"<p>(.*?)</p>", body_html, re.S)
            text = html_lib.unescape(re.sub(r"<[^>]+>", "", m.group(1))) if m else title
            text = " ".join(text.split())
            summary = text if len(text) <= 160 else text[:157].rsplit(" ", 1)[0] + "..."
        posts.append({"slug": slug, "title": title, "date": date, "summary": summary, "html": body_html})
    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)
    return posts


def post_path(L, slug):
    return f"posts/{slug}.html" if L == "en" else f"id/posts/{slug}.html"


def blog_page(L, posts):
    T = lambda e, i: tr(L, e, i)
    if posts:
        rows = "\n".join(
            f'          <li><a href="{rel(lpath(L, "blog"), post_path(L, p["slug"]))}"><span class="name">{escape(p["title"])}</span><span class="what"><time class="post-date" datetime="{p["date"].isoformat()}">{pretty_date(L, p["date"])}</time>{escape(p["summary"])}</span></a></li>'
            for p in posts)
        body = f'        <ul class="index posts">\n{rows}\n        </ul>'
    else:
        body = f"""        <div class="empty">
          <h2>{T("No posts yet", "Belum ada tulisan")}</h2>
          <p>{T("New posts will appear on this page.", "Tulisan baru akan muncul di halaman ini.")}</p>
        </div>"""
    main = f"""      <div class="page-head">
        <h1>Blog</h1>
        <p>{T("Notes and write-ups.", "Catatan dan tulisan.")}</p>
      </div>

{body}"""
    return dict(slug="blog", title="Blog", desc=T("Notes and write-ups by Mufti Khalis.", "Catatan dan tulisan oleh Mufti Khalis."), main=main)


# ------------------------------------------------------------------ main build
def check_js_keys():
    used = set()
    for fn in os.listdir(os.path.join(ROOT, "assets")):
        if fn.endswith(".js") and fn != "i18n.js":
            with open(os.path.join(ROOT, "assets", fn), encoding="utf-8") as f:
                src = f.read()
            used |= set(re.findall(r'\b[tT]\("([a-z0-9]+\.[A-Za-z0-9.]+)"', src))
            used |= set(re.findall(r'\b[tT]\([^")]*[?:] "([a-z0-9]+\.[a-z0-9.]+)"', src))
            used |= set(re.findall(r'done\("([a-z0-9]+\.[a-z0-9.]+)"\)', src))
    missing = sorted(k for k in used | set(JS_DYNAMIC) if k not in JS_STRINGS and not k.endswith("."))
    if missing:
        raise SystemExit("Missing translations in tools/js_strings.py: " + ", ".join(missing))


def build_i18n_js():
    d = {"en": {k: v[0] for k, v in JS_STRINGS.items()}, "id": {k: v[1] for k, v in JS_STRINGS.items()}}
    write("assets/i18n.js", "/* Generated by tools/build.py from tools/js_strings.py. Do not edit. */\n"
          "window.I18N = " + json.dumps(d, ensure_ascii=False) + ";\n"
          "window.t = function (key, vars) {\n"
          "  var lang = (document.documentElement.lang || \"en\").slice(0, 2);\n"
          "  var dict = window.I18N[lang] || window.I18N.en;\n"
          "  var s = dict[key] !== undefined ? dict[key] : window.I18N.en[key];\n"
          "  if (s === undefined) return key;\n"
          "  return s.replace(/\\{(\\w+)\\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });\n"
          "};\n")


def main():
    global ASSET_V
    check_js_keys()
    build_i18n_js()
    ASSET_V = asset_version()
    all_pages = PAGES_A + PAGES_B
    count = 0
    for L in LANGS:
        for fn in all_pages:
            page = fn(L)
            path = lpath(L, page["slug"])
            write(path, shell(L, path, page))
            count += 1

    posts = {L: load_posts(L) for L in LANGS}
    for L in LANGS:
        page = blog_page(L, posts[L])
        write(lpath(L, "blog"), shell(L, lpath(L, "blog"), page))
        count += 1
        other = "id" if L == "en" else "en"
        for p in posts[L]:
            alt = {L: post_path(L, p["slug"])}
            if any(q["slug"] == p["slug"] for q in posts[other]):
                alt[other] = post_path(other, p["slug"])
            back = rel(post_path(L, p["slug"]), lpath(L, "blog"))
            post_main = f"""      <article class="post">
        <header class="page-head">
          <h1>{escape(p["title"])}</h1>
          <p><time datetime="{p["date"].isoformat()}">{pretty_date(L, p["date"])}</time></p>
        </header>
        <div class="post-body">
{p["html"]}
        </div>
        <p class="post-back"><a href="{back}">{tr(L, "All posts", "Semua tulisan")}</a></p>
      </article>"""
            ppath = post_path(L, p["slug"])
            pg = dict(slug="blog", nav_slug="blog", title=p["title"], desc=p["summary"], main=post_main, og_type="article",
                      jsonld={"@context": "https://schema.org", "@type": "BlogPosting", "headline": p["title"],
                              "datePublished": p["date"].isoformat(), "description": p["summary"], "inLanguage": L,
                              "author": {"@type": "Person", "name": "Mufti Khalis"}, "mainEntityOfPage": canon(ppath)})
            write(ppath, shell(L, ppath, pg, alt=alt))
            count += 1

    nf = dict(slug="404", title="Page not found / Halaman tidak ditemukan", full_title=True, desc="This page does not exist.", noindex=True,
              main="""      <div class="page-head">
        <h1>Page not found</h1>
        <p>The page you tried to open does not exist or has moved.</p>
      </div>
      <p lang="id" class="note" style="margin-bottom: var(--s-3);">Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
      <p><a class="btn" href="/index.html">Home</a> <a class="btn btn-quiet" href="/id/index.html" lang="id">Beranda</a></p>""")
    write("404.html", shell("en", "404.html", nf))
    count += 1

    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    write_sitemap(all_pages, posts)
    write_manifest()
    write_sw()
    print(f"built {count} pages in {len(LANGS)} languages; posts: " + ", ".join(f"{L}={len(posts[L])}" for L in LANGS))


def write_sitemap(all_pages, posts):
    urls = []
    for fn in all_pages:
        slug = fn("en")["slug"]
        if slug == "download":
            continue
        en, idn = canon(lpath("en", slug)), canon(lpath("id", slug))
        links = (f'<xhtml:link rel="alternate" hreflang="en" href="{en}"/><xhtml:link rel="alternate" hreflang="id" href="{idn}"/>'
                 f'<xhtml:link rel="alternate" hreflang="x-default" href="{en}"/>')
        urls.append(f"  <url><loc>{en}</loc>{links}</url>")
        urls.append(f"  <url><loc>{idn}</loc>{links}</url>")
    for L in LANGS:
        urls.append(f"  <url><loc>{canon(lpath(L, 'blog'))}</loc></url>")
        for p in posts[L]:
            urls.append(f"  <url><loc>{canon(post_path(L, p['slug']))}</loc><lastmod>{p['date'].isoformat()}</lastmod></url>")
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + "\n".join(urls) + "\n</urlset>\n")


def write_manifest():
    m = {
        "name": "Mufti Khalis", "short_name": "Mufti", "description": "Small web tools, remote sensing basics and English study links.",
        "start_url": "./index.html", "scope": "./", "display": "standalone", "background_color": "#f0f4f8", "theme_color": "#1d4e89",
        "icons": [
            {"src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "assets/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    write("manifest.webmanifest", json.dumps(m, indent=2) + "\n")


def write_sw():
    files = []
    for dirpath, dirnames, filenames in os.walk(OUT):
        if dirpath == OUT:
            dirnames[:] = [d for d in dirnames if d in ("assets", "id")]
        else:
            dirnames[:] = [d for d in dirnames if d != "__pycache__"]
        for fn in filenames:
            relp = os.path.relpath(os.path.join(dirpath, fn), OUT).replace(os.sep, "/")
            if relp.endswith(".html") or relp.startswith("assets/") or relp in ("manifest.webmanifest", "favicon.ico"):
                if relp.endswith((".LICENSE", ".md")):
                    continue
                files.append(relp)
    files.sort()
    h = hashlib.sha1()
    for relp in files:
        h.update(relp.encode())
        with open(os.path.join(OUT, relp), "rb") as f:
            h.update(f.read())
    version = h.hexdigest()[:10]
    precache = json.dumps(["./" + f for f in files], indent=1)
    sw = """/* Generated by tools/build.py. Offline support: pages and assets are cached on first visit. */
const CACHE = "mk-%VERSION%";
const PRECACHE = %PRECACHE%;
const EXTERNAL = /^https:\\/\\/(cdnjs\\.cloudflare\\.com|cdn\\.jsdelivr\\.net|fonts\\.googleapis\\.com|fonts\\.gstatic\\.com)\\//;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin && !EXTERNAL.test(req.url)) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => {
          let path = url.pathname;
          if (path.endsWith("/")) path += "index.html";
          return caches
            .match(req, { ignoreSearch: true })
            .then((r) => r || caches.match("." + path, { ignoreSearch: true }))
            .then((r) => r || caches.match(url.pathname.indexOf("/id/") === 0 ? "./id/index.html" : "./index.html"));
        })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});
""".replace("%VERSION%", version).replace("%PRECACHE%", precache)
    write("sw.js", sw)


if __name__ == "__main__":
    main()
