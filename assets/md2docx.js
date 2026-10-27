/* Markdown -> .docx, built in the browser. Needs marked (lexer) and fflate (zip). Exposed as window.Md2Docx. */
(function (root) {
  var NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

  function xml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  /* marked escapes HTML in text tokens; undo that so we can escape for XML once. */
  function unhtml(s) {
    return String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  }

  function build(markdown, deps) {
    deps = deps || {};
    var lexer = deps.lexer || (root.marked && root.marked.lexer.bind(root.marked));
    var zipSync = deps.zipSync || (root.fflate && root.fflate.zipSync);
    var strToU8 = deps.strToU8 || (root.fflate && root.fflate.strToU8);
    if (!lexer || !zipSync) throw new Error("Md2Docx: marked or fflate is missing");

    var rels = []; // hyperlinks
    var numInstances = []; // one per ordered list so numbering restarts
    var tokens = lexer(String(markdown || ""));

    /* ---------- inline ---------- */
    function rPr(f) {
      var s = "";
      if (f.link) s += '<w:rStyle w:val="Hyperlink"/>';
      if (f.code) s += '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:shd w:val="clear" w:color="auto" w:fill="EEF0F2"/>';
      if (f.b) s += "<w:b/>";
      if (f.i) s += "<w:i/>";
      if (f.strike) s += "<w:strike/>";
      return s ? "<w:rPr>" + s + "</w:rPr>" : "";
    }
    function run(text, f) {
      if (text === "") return "";
      return "<w:r>" + rPr(f) + '<w:t xml:space="preserve">' + xml(text) + "</w:t></w:r>";
    }
    function inline(toks, f) {
      var out = "";
      (toks || []).forEach(function (t) {
        switch (t.type) {
          case "text":
          case "escape":
            out += t.tokens && t.tokens.length ? inline(t.tokens, f) : run(unhtml(t.text), f);
            break;
          case "strong": out += inline(t.tokens, Object.assign({}, f, { b: true })); break;
          case "em": out += inline(t.tokens, Object.assign({}, f, { i: true })); break;
          case "del": out += inline(t.tokens, Object.assign({}, f, { strike: true })); break;
          case "codespan": out += run(unhtml(t.text), Object.assign({}, f, { code: true })); break;
          case "br": out += "<w:r><w:br/></w:r>"; break;
          case "link": {
            var id = "rId" + (100 + rels.length);
            rels.push({ id: id, href: unhtml(t.href) });
            out += '<w:hyperlink r:id="' + id + '">' + inline(t.tokens && t.tokens.length ? t.tokens : [{ type: "text", text: t.text }], Object.assign({}, f, { link: true })) + "</w:hyperlink>";
            break;
          }
          case "image": out += run("[" + unhtml(t.text || "image") + "]", Object.assign({}, f, { i: true })); break;
          case "html": break;
          default: if (t.raw) out += run(unhtml(t.raw), f);
        }
      });
      return out;
    }

    /* ---------- blocks ---------- */
    function para(inner, o) {
      o = o || {};
      var ppr = "";
      if (o.style) ppr += '<w:pStyle w:val="' + o.style + '"/>';
      if (o.num) ppr += '<w:numPr><w:ilvl w:val="' + o.num.lvl + '"/><w:numId w:val="' + o.num.id + '"/></w:numPr>';
      if (o.indent) ppr += '<w:ind w:left="' + o.indent + '"/>';
      if (o.border) ppr += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="999999"/></w:pBdr>';
      if (o.keepNext) ppr += "<w:keepNext/>";
      return "<w:p>" + (ppr ? "<w:pPr>" + ppr + "</w:pPr>" : "") + inner + "</w:p>";
    }

    function blocks(toks, ctx) {
      var out = "";
      toks.forEach(function (t) {
        switch (t.type) {
          case "heading":
            out += para(inline(t.tokens, {}), { style: "Heading" + Math.min(6, t.depth) });
            break;
          case "paragraph":
          case "text":
            out += para(inline(t.tokens || [{ type: "text", text: t.text }], {}), { style: ctx.quote ? "Quote" : undefined });
            break;
          case "list": out += list(t, ctx.level === undefined ? 0 : ctx.level + 1, ctx); break;
          case "blockquote": out += blocks(t.tokens, Object.assign({}, ctx, { quote: true })); break;
          case "code":
            String(t.text).replace(/\n$/, "").split("\n").forEach(function (line) {
              out += para(line === "" ? "" : '<w:r><w:t xml:space="preserve">' + xml(line) + "</w:t></w:r>", { style: "Code" });
            });
            out += para("", {});
            break;
          case "table": out += table(t); break;
          case "hr": out += para("", { border: true }); break;
          default: break; // space, html, def
        }
      });
      return out;
    }

    var bulletId = 1;
    function list(t, level, ctx) {
      var numId = bulletId;
      if (t.ordered) {
        numId = 10 + numInstances.length;
        numInstances.push({ id: numId, start: t.start === "" || t.start === undefined ? 1 : t.start });
      }
      var out = "";
      t.items.forEach(function (item) {
        var first = true;
        var prefix = item.task ? (item.checked ? "\u2611 " : "\u2610 ") : "";
        (item.tokens || []).forEach(function (c) {
          if (c.type === "text" || c.type === "paragraph") {
            var inner = (first && prefix ? run(prefix, {}) : "") + inline(c.tokens || [{ type: "text", text: c.text }], {});
            out += para(inner, first ? { num: { id: numId, lvl: Math.min(level, 8) }, style: "ListParagraph" } : { indent: 720 * (level + 1), style: "ListParagraph" });
            first = false;
          } else if (c.type === "list") {
            out += list(c, level + 1, Object.assign({}, ctx, { level: level + 1 }));
          } else {
            out += blocks([c], Object.assign({}, ctx, { level: level }));
          }
        });
      });
      return out;
    }

    function table(t) {
      var cols = t.header.length;
      var width = Math.floor(9000 / cols);
      var grid = "<w:tblGrid>" + new Array(cols + 1).join('<w:gridCol w:w="' + width + '"/>') + "</w:tblGrid>";
      function cell(c, head, i) {
        var algn = t.align && t.align[i];
        var jc = algn === "center" ? '<w:jc w:val="center"/>' : algn === "right" ? '<w:jc w:val="right"/>' : "";
        var shd = head ? '<w:shd w:val="clear" w:color="auto" w:fill="E7ECF2"/>' : "";
        var inner = inline(c.tokens || [{ type: "text", text: c.text }], head ? { b: true } : {});
        return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/>' + shd + "</w:tcPr><w:p><w:pPr><w:spacing w:before=\"40\" w:after=\"40\"/>" + jc + "</w:pPr>" + inner + "</w:p></w:tc>";
      }
      var rows = '<w:tr><w:trPr><w:tblHeader/></w:trPr>' + t.header.map(function (c, i) { return cell(c, true, i); }).join("") + "</w:tr>";
      t.rows.forEach(function (r) {
        rows += "<w:tr>" + r.map(function (c, i) { return cell(c, false, i); }).join("") + "</w:tr>";
      });
      var b = ["top", "left", "bottom", "right", "insideH", "insideV"].map(function (s) {
        return '<w:' + s + ' w:val="single" w:sz="4" w:space="0" w:color="AAB4C0"/>';
      }).join("");
      return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>' + b + '</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>' + grid + rows + "</w:tbl>" + para("", {});
    }

    var body = blocks(tokens, {});
    if (!body) body = para("", {});
    var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ' + NS + "><w:body>" + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>';

    /* ---------- supporting parts ---------- */
    function heading(id, size, before) {
      return '<w:style w:type="paragraph" w:styleId="Heading' + id + '"><w:name w:val="heading ' + id + '"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="' + before + '" w:after="120"/><w:outlineLvl w:val="' + (id - 1) + '"/></w:pPr><w:rPr><w:b/><w:color w:val="1D3557"/><w:sz w:val="' + size + '"/></w:rPr></w:style>';
    }
    var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles ' + NS + ">" +
      '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
      heading(1, 40, 360) + heading(2, 32, 300) + heading(3, 28, 240) + heading(4, 24, 200) + heading(5, 22, 200) + heading(6, 22, 200) +
      '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="60"/></w:pPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="7A8CA3"/></w:pBdr><w:ind w:left="567"/></w:pPr><w:rPr><w:i/><w:color w:val="4A5E72"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="EEF0F2"/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:left="170"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:sz w:val="20"/></w:rPr></w:style>' +
      '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="1D4E89"/><w:u w:val="single"/></w:rPr></w:style>' +
      "</w:styles>";

    function levelDef(i, fmt, text, left) {
      return '<w:lvl w:ilvl="' + i + '"><w:start w:val="1"/><w:numFmt w:val="' + fmt + '"/><w:lvlText w:val="' + text + '"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="' + left + '" w:hanging="360"/></w:pPr>' +
        (fmt === "bullet" ? '<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr>' : "") + "</w:lvl>";
    }
    var bullets = "", decimals = "";
    for (var i = 0; i < 9; i++) {
      bullets += levelDef(i, "bullet", "\uf0b7", 720 * (i + 1));
      decimals += levelDef(i, i % 3 === 0 ? "decimal" : i % 3 === 1 ? "lowerLetter" : "lowerRoman", "%" + (i + 1) + ".", 720 * (i + 1));
    }
    var numbering = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:numbering ' + NS + ">" +
      '<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>' + bullets + "</w:abstractNum>" +
      '<w:abstractNum w:abstractNumId="2"><w:multiLevelType w:val="hybridMultilevel"/>' + decimals + "</w:abstractNum>" +
      '<w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>' +
      numInstances.map(function (n) {
        return '<w:num w:numId="' + n.id + '"><w:abstractNumId w:val="2"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="' + n.start + '"/></w:lvlOverride></w:num>';
      }).join("") + "</w:numbering>";

    var docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
      rels.map(function (r) {
        return '<Relationship Id="' + r.id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="' + xml(r.href) + '" TargetMode="External"/>';
      }).join("") + "</Relationships>";

    var files = {
      "[Content_Types].xml": strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>'),
      "_rels/.rels": strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
      "word/document.xml": strToU8(documentXml),
      "word/styles.xml": strToU8(styles),
      "word/numbering.xml": strToU8(numbering),
      "word/_rels/document.xml.rels": strToU8(docRels),
    };
    return zipSync(files, { level: 6 });
  }

  var api = { build: build };
  if (typeof module !== "undefined") module.exports = api;
  else root.Md2Docx = api;
})(typeof window !== "undefined" ? window : this);
