const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/root/.claude/skills/synced/4d1afcc2-25cc-43fe-b682-9d1d73e1887a_9ceb4728-9710-4aba-8cb0-950c840a9dac/pptx/scripts/apply_theme.js");

const OUT = process.argv[2] || "HTML_Tags_Training.pptx";

const THEME = {
  name: "HTML Course",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B1F3B", lt1: "FFFFFF", dk2: "5A6178", lt2: "F3F4F8",
    accent1: "E44D26", accent2: "1A9E92", accent3: "264DE4",
    accent4: "F2A900", accent5: "8E44AD", accent6: "15182B",
    hlink: "264DE4", folHlink: "8E44AD",
  },
};
const HEX = THEME.colors;
const CODE_FONT = "Courier New";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "HTML Essentials to Advanced";
pres.author = "HTML Training";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

// ---------- Layouts ----------
pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.1, w: 11.7, h: 1.5, fontSize: 48, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: "bottom", align: "left" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.75, w: 11.7, h: 1.2, fontSize: 20, color: "CADCFC", valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "SECTION_DARK",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.6, w: 7.2, h: 1.3, fontSize: 40, bold: true, color: C.background1, valign: "top", align: "left" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.0, w: 7.2, h: 2.4, fontSize: 18, color: "CADCFC", valign: "top" }, text: "" } },
  ],
  slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.35, fontSize: 11, color: "CADCFC", align: "right" },
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.3, w: 12.33, h: 0.75, fontSize: 34, bold: true, color: C.text1, valign: "middle", margin: 0, align: "left" }, text: "" } },
  ],
  slideNumber: { x: 12.3, y: 7.05, w: 0.6, h: 0.3, fontSize: 10, color: C.text2, align: "right" },
});

// ---------- Helpers ----------
let n = 0;
const oid = (p) => `${p}_${++n}`;

function sub(slide, text) {
  slide.addText(text, { x: 0.5, y: 1.08, w: 12.33, h: 0.45, fontSize: 16, italic: true, color: C.text2, margin: 0, isTextBox: true, objectName: oid("subtitle") });
}

function codePanel(slide, code, { x = 6.85, y = 1.75, w = 5.98, h = 4.0, label = "example.html", size = 12 } = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: C.accent6 }, line: { color: C.accent6 }, objectName: oid("codeBg"),
    shadow: { type: "outer", color: "000000", opacity: 0.25, blur: 6, offset: 2, angle: 90 } });
  // window dots
  ["FF5F57", "FEBC2E", "28C840"].forEach((col, i) => {
    slide.addShape(pres.shapes.OVAL, { x: x + 0.25 + i * 0.22, y: y + 0.18, w: 0.13, h: 0.13, fill: { color: col }, line: { color: col }, objectName: oid("dot") });
  });
  slide.addText(label, { x: x + 1.0, y: y + 0.1, w: w - 1.2, h: 0.3, fontSize: 11, color: "9AA3C0", fontFace: CODE_FONT, margin: 0, isTextBox: true, objectName: oid("codeLabel") });
  slide.addText(code, { x: x + 0.2, y: y + 0.5, w: w - 0.35, h: h - 0.6, fontSize: size, fontFace: CODE_FONT, color: "E8EAF2", valign: "top", margin: 0, isTextBox: true, objectName: oid("code"), lineSpacingMultiple: 1.05 });
}

function tagTable(slide, rows, { x = 0.5, y = 1.75, w = 6.05, rowH = 0.38 } = {}) {
  const head = [
    { text: "Tag / attribute", options: { bold: true, color: C.background1, fill: { color: C.text1 }, fontSize: 13 } },
    { text: "Purpose & usage", options: { bold: true, color: C.background1, fill: { color: C.text1 }, fontSize: 13 } },
  ];
  const body = rows.map(([t, d], i) => [
    { text: t, options: { fontFace: CODE_FONT, bold: true, color: C.accent1, fontSize: 12, fill: { color: i % 2 ? C.background1 : C.background2 } } },
    { text: d, options: { color: C.text1, fontSize: 14, fill: { color: i % 2 ? C.background1 : C.background2 } } },
  ]);
  slide.addTable([head, ...body], { x, y, w, colW: [2.45, w - 2.45], rowH, valign: "middle", border: { type: "solid", pt: 0.5, color: "E1E4EE" }, margin: [0.04, 0.1, 0.04, 0.1], objectName: oid("tagTable") });
}

function exercise(slide, text, { y = 5.98, h = 1.0 } = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 12.33, h, rectRadius: 0.12, fill: { color: "E6F6F4" }, line: { color: "BFE7E2", width: 0.75 }, objectName: oid("exBg") });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.72, y: y + (h - 0.42) / 2, w: 1.45, h: 0.42, rectRadius: 0.21, fill: { color: C.accent2 }, line: { color: C.accent2 }, objectName: oid("exChip") });
  slide.addText("EXERCISE", { x: 0.72, y: y + (h - 0.42) / 2, w: 1.45, h: 0.42, fontSize: 12, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true, charSpacing: 1, objectName: oid("exChipText") });
  slide.addText(text, { x: 2.4, y: y + 0.05, w: 10.25, h: h - 0.1, fontSize: 15, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: oid("exText") });
}

function topic({ section, title, subtitle, tags, code, label, ex, notes, rowH, codeSize }) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  sub(s, subtitle);
  tagTable(s, tags, { rowH: rowH || 0.38 });
  codePanel(s, code, { label, size: codeSize || 12 });
  exercise(s, ex);
  if (notes) s.addNotes(notes);
  return s;
}

function sectionSlide(section, num, title, body, chips) {
  const s = pres.addSlide({ masterName: "SECTION_DARK", sectionTitle: section });
  s.addText(num, { x: 0.8, y: 0.9, w: 3, h: 1.6, fontSize: 96, bold: true, color: C.accent1, fontFace: THEME.headFontFace, margin: 0, isTextBox: true, objectName: oid("secNum") });
  s.addText(title, { placeholder: "title" });
  s.addText(body, { placeholder: "body" });
  // tag chips on the right
  chips.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 8.5 + col * 2.2, y = 1.2 + row * 0.72;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.0, h: 0.5, rectRadius: 0.25, fill: { color: "2A2F55" }, line: { color: "3B4275", width: 0.75 }, objectName: oid("chip") });
    s.addText(c, { x, y, w: 2.0, h: 0.5, fontSize: 13, fontFace: CODE_FONT, bold: true, color: "FFB199", align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: oid("chipText") });
  });
  return s;
}

function projectGrid({ section, title, subtitle, items, notes, tint }) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  sub(s, subtitle);
  const cw = 3.91, ch = 2.35, gx = 0.3, gy = 0.3, x0 = 0.5, y0 = 1.8;
  items.forEach(([head, body], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = x0 + col * (cw + gx), y = y0 + row * (ch + gy);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: "E1E4EE", width: 0.75 }, objectName: oid("card") });
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.25, w: 0.6, h: 0.6, fill: { color: tint || C.accent1 }, line: { color: tint || C.accent1 }, objectName: oid("num") });
    s.addText(String(i + 1), { x: x + 0.25, y: y + 0.25, w: 0.6, h: 0.6, fontSize: 20, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: oid("numText") });
    s.addText(head, { x: x + 1.0, y: y + 0.25, w: cw - 1.2, h: 0.6, fontSize: 18, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true, objectName: oid("cardHead") });
    s.addText(body, { x: x + 0.25, y: y + 1.0, w: cw - 0.5, h: ch - 1.15, fontSize: 16, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: oid("cardBody") });
  });
  if (notes) s.addNotes(notes);
  return s;
}

// =====================================================================
// INTRO
// =====================================================================
const S0 = "Introduction";
pres.addSection({ title: S0 });
{
  const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: S0 });
  s.addText("<html>", { x: 0.8, y: 1.0, w: 6, h: 0.9, fontSize: 40, bold: true, fontFace: CODE_FONT, color: C.accent1, margin: 0, isTextBox: true, objectName: "titleTag" });
  s.addText("HTML: From Basic Tags to the Latest Features", { placeholder: "title" });
  s.addText("Basic tags with usage & exercises  ·  Advanced tags with examples & exercises  ·  Recent updates in HTML (2023 – 2026)", { placeholder: "body" });
  s.addText("</html>", { x: 0.8, y: 5.7, w: 6, h: 0.9, fontSize: 40, bold: true, fontFace: CODE_FONT, color: C.accent1, margin: 0, isTextBox: true, objectName: "titleTagEnd" });
  s.addNotes("Welcome. This deck goes from the HTML document skeleton all the way to features that shipped in browsers in 2024-2025. Every topic slide has: a table of tags, a runnable example, and an exercise. Solutions are in the speaker notes.");
}
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: S0 });
  s.addText("Course roadmap", { placeholder: "title" });
  sub(s, "Three parts, each topic slide follows the same pattern: tags → example → exercise");
  const parts = [
    ["01", "Basic HTML tags", "Document structure, text, links, images, lists, tables, forms and semantic layout", C.accent1, "9 topics + mini project"],
    ["02", "Advanced HTML tags", "Form validation, audio/video, SVG & canvas, iframes, dialog, responsive images, accessibility & SEO", C.accent3, "7 topics + mini project"],
    ["03", "Recent updates", "Living Standard, Popover API, invoker commands, exclusive accordions, <search>, customizable <select>", C.accent2, "4 topics + final challenge"],
  ];
  parts.forEach(([num, head, body, col, foot], i) => {
    const x = 0.5 + i * 4.21, y = 1.8, w = 3.91, h = 3.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.14, fill: { color: C.background2 }, line: { color: "E1E4EE", width: 0.75 }, objectName: oid("partCard") });
    s.addText(num, { x: x + 0.3, y: y + 0.25, w: 2, h: 0.9, fontSize: 54, bold: true, color: col, fontFace: THEME.headFontFace, margin: 0, isTextBox: true, objectName: oid("partNum") });
    s.addText(head, { x: x + 0.3, y: y + 1.2, w: w - 0.6, h: 0.5, fontSize: 22, bold: true, color: C.text1, margin: 0, isTextBox: true, objectName: oid("partHead") });
    s.addText(body, { x: x + 0.3, y: y + 1.8, w: w - 0.6, h: 1.2, fontSize: 15, color: C.text2, valign: "top", margin: 0, isTextBox: true, objectName: oid("partBody") });
    s.addText(foot, { x: x + 0.3, y: y + 3.05, w: w - 0.6, h: 0.35, fontSize: 13, bold: true, color: col, margin: 0, isTextBox: true, objectName: oid("partFoot") });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 5.75, w: 12.33, h: 1.05, rectRadius: 0.12, fill: { color: C.text1 }, line: { color: C.text1 }, objectName: "setupBox" });
  s.addText([
    { text: "Setup: ", options: { bold: true, color: "FFB199" } },
    { text: "any text editor (VS Code recommended) + a modern browser. Save files as ", options: { color: C.background1 } },
    { text: ".html", options: { fontFace: CODE_FONT, bold: true, color: "FFB199" } },
    { text: ", open them in the browser, and refresh after every change. Validate at validator.w3.org.", options: { color: C.background1 } },
  ], { x: 0.8, y: 5.8, w: 11.8, h: 0.95, fontSize: 16, valign: "middle", margin: 0, isTextBox: true, objectName: "setupText" });
}

// =====================================================================
// PART 1 - BASIC
// =====================================================================
const S1 = "Part 1 - Basic Tags";
pres.addSection({ title: S1 });
sectionSlide(S1, "01", "Basic HTML Tags", "The building blocks every web page is made of. Learn each tag, see it in use, then practise it.",
  ["<html>", "<head>", "<h1>-<h6>", "<p>", "<a>", "<img>", "<ul> <ol>", "<table>", "<form>", "<input>", "<header>", "<main>"]);

topic({
  section: S1, title: "HTML document structure",
  subtitle: "Every page starts with the same skeleton: a doctype, a <head> for metadata and a <body> for content",
  label: "index.html",
  tags: [
    ["<!DOCTYPE html>", "Tells the browser this is HTML5"],
    ["<html lang=\"en\">", "Root element; lang helps screen readers & SEO"],
    ["<head>", "Container for metadata (not shown on page)"],
    ["<meta charset>", "Character encoding, always UTF-8"],
    ["<meta viewport>", "Makes the page scale correctly on mobile"],
    ["<title>", "Text shown in the browser tab & search results"],
    ["<body>", "Everything visible on the page"],
    ["<!-- ... -->", "Comment, ignored by the browser"],
  ],
  code:
`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, initial-scale=1">
  <title>My First Page</title>
</head>
<body>
  <!-- visible content goes here -->
  <h1>Hello, World!</h1>
</body>
</html>`,
  ex: "Create index.html with the full skeleton. Set the <title> to your name, add an <h1> greeting and an HTML comment, then open the file in your browser and find the title in the tab.",
  notes: "Solution: copy the example skeleton, change <title> to your name, e.g. <title>Priya Kumar</title>, add <h1>Welcome to my page</h1> and <!-- my first comment -->. Point out that the comment does not appear on the page but is visible in View Source.",
});

topic({
  section: S1, title: "Headings & paragraphs",
  subtitle: "Headings give a page its outline; paragraphs hold the body text",
  label: "blog.html",
  tags: [
    ["<h1> ... <h6>", "Six heading levels; use one <h1> per page"],
    ["<p>", "A paragraph of text (block element)"],
    ["<br>", "Line break inside text (void tag, no closing)"],
    ["<hr>", "Thematic break between topics"],
    ["<address>", "Contact information for the author/owner"],
    ["Nesting rule", "Don't skip levels: h1 → h2 → h3"],
  ],
  rowH: 0.45,
  code:
`<h1>Travel Blog</h1>

<h2>Day 1: Chennai</h2>
<p>We reached Marina Beach at sunrise.
   The sky was bright orange.</p>
<p>Roses are red,<br>
   violets are blue.</p>

<hr>

<h2>Day 2: Mysuru</h2>
<p>Visited the palace in the evening.</p>
<address>Mail: travel@example.com</address>`,
  ex: "Write a short article with one <h1>, two <h2> sub-sections, at least three paragraphs, a short poem using <br> for line breaks, and an <hr> between the two sections.",
  notes: "Solution outline: <h1>My City</h1> <h2>Food</h2><p>..</p><p>..</p> <hr> <h2>Places</h2><p>Line one<br>Line two</p>. Explain that extra spaces/newlines in HTML collapse into one space, which is why <br> exists.",
});

topic({
  section: S1, title: "Text formatting tags",
  subtitle: "Prefer meaning-based tags (strong, em) over purely visual ones (b, i)",
  label: "format.html",
  tags: [
    ["<strong> / <b>", "Important text / bold for style only"],
    ["<em> / <i>", "Stressed emphasis / italic for style only"],
    ["<mark>", "Highlighted (relevant) text"],
    ["<sub> / <sup>", "Subscript (H₂O) / superscript (x²)"],
    ["<code> / <pre>", "Inline code / preformatted block"],
    ["<blockquote> / <q>", "Block quotation / inline quotation"],
    ["<abbr title>", "Abbreviation with full form on hover"],
    ["<del> / <ins>", "Removed text / inserted text"],
  ],
  code:
`<p><strong>Warning:</strong> do <em>not</em>
   skip this step.</p>
<p>Water is H<sub>2</sub>O, E = mc<sup>2</sup></p>
<p>Price: <del>Rs 999</del> <ins>Rs 499</ins></p>
<p>Use <code>console.log()</code> to debug.</p>
<p><mark>Exam on Friday!</mark></p>
<blockquote cite="https://example.com">
  Simplicity is the soul of efficiency.
</blockquote>
<abbr title="HyperText Markup Language">
  HTML</abbr>`,
  ex: "Write a recipe note that uses every tag in the table at least once: <strong> for a warning, a chemical formula with <sub>, a struck-through old price, a highlighted tip and a quote from a chef.",
  notes: "Solution hints: <p><strong>Caution:</strong> oil is hot</p>, <p>Add NaHCO<sub>3</sub> (baking soda)</p>, <del>Rs 300</del> <ins>Rs 250</ins>, <mark>Tip: soak overnight</mark>, <blockquote>Cooking is love made visible.</blockquote>, <abbr title=\"tablespoon\">tbsp</abbr>.",
});

topic({
  section: S1, title: "Links: the <a> tag",
  subtitle: "Hyperlinks connect pages, sections, files, email and phone numbers",
  label: "links.html",
  tags: [
    ["href=\"https://...\"", "Absolute URL to another website"],
    ["href=\"about.html\"", "Relative URL to a page in your site"],
    ["href=\"#contact\"", "Jump to the element with id=\"contact\""],
    ["target=\"_blank\"", "Open in a new tab"],
    ["rel=\"noopener\"", "Security: use together with _blank"],
    ["mailto: / tel:", "Open email client / phone dialer"],
    ["download", "Download the file instead of opening it"],
  ],
  rowH: 0.42,
  code:
`<a href="https://developer.mozilla.org">MDN</a>
<a href="about.html">About us</a>
<a href="#contact">Jump to contact</a>

<a href="https://example.com" target="_blank"
   rel="noopener noreferrer">New tab</a>

<a href="mailto:info@example.com">Email us</a>
<a href="tel:+919876543210">Call us</a>
<a href="report.pdf" download>Get PDF</a>

<h2 id="contact">Contact</h2>`,
  ex: "Build a navigation bar with links to Home, About (relative), an external site that opens in a new tab, an email link, and a \"Back to top\" link that jumps to an element with id=\"top\".",
  notes: "Solution: <nav><a href=\"index.html\">Home</a> | <a href=\"about.html\">About</a> | <a href=\"https://w3.org\" target=\"_blank\" rel=\"noopener\">W3C</a> | <a href=\"mailto:me@mail.com\">Mail</a></nav> ... <h1 id=\"top\">..</h1> ... <a href=\"#top\">Back to top</a>.",
});

topic({
  section: S1, title: "Images: <img> and <figure>",
  subtitle: "Always describe images with alt text and reserve their space with width/height",
  label: "gallery.html",
  tags: [
    ["<img>", "Embeds an image (void tag)"],
    ["src", "Path or URL of the image file"],
    ["alt", "Text alternative; required for accessibility"],
    ["width / height", "Reserve space, prevents layout jumping"],
    ["loading=\"lazy\"", "Load only when scrolled near"],
    ["<figure>", "Self-contained media block"],
    ["<figcaption>", "Visible caption for the figure"],
  ],
  rowH: 0.42,
  code:
`<img src="images/logo.png"
     alt="Company logo"
     width="200" height="80">

<figure>
  <img src="taj.jpg"
       alt="Taj Mahal at sunrise"
       width="600" height="400"
       loading="lazy">
  <figcaption>Taj Mahal, Agra</figcaption>
</figure>`,
  ex: "Create a 3-image photo gallery using <figure> + <figcaption>. Every image must have meaningful alt text, width/height attributes and loading=\"lazy\". Use one relative and one absolute src.",
  notes: "Solution: three <figure> blocks like the example. Discuss good vs bad alt text: alt=\"image1\" is bad; alt=\"Red tulips in a glass vase\" is good. Decorative images use alt=\"\".",
});

topic({
  section: S1, title: "Lists",
  subtitle: "Unordered for bullets, ordered for steps, description lists for term–definition pairs",
  label: "lists.html",
  tags: [
    ["<ul>", "Unordered (bulleted) list"],
    ["<ol>", "Ordered (numbered) list"],
    ["<li>", "One list item (inside ul or ol)"],
    ["type / start", "<ol type=\"A\" start=\"3\"> numbering style"],
    ["reversed", "Count down: 3, 2, 1"],
    ["<dl>", "Description list"],
    ["<dt> / <dd>", "Term / its description"],
    ["Nested list", "Put a new <ul> inside an <li>"],
  ],
  code:
`<ul>
  <li>HTML</li>
  <li>CSS
    <ul><li>Flexbox</li><li>Grid</li></ul>
  </li>
</ul>

<ol type="1" start="1">
  <li>Boil water</li>
  <li>Add tea leaves</li>
</ol>

<dl>
  <dt>HTML</dt><dd>Structure of a page</dd>
  <dt>CSS</dt><dd>Presentation</dd>
</dl>`,
  ex: "Make a shopping list (<ul>) with one nested sub-list, a recipe with numbered steps (<ol>), a \"Top 3\" list using reversed, and a mini glossary of three web terms using <dl>.",
  notes: "Solution: <ol reversed><li>Gold</li><li>Silver</li><li>Bronze</li></ol> shows 3,2,1. Common mistake: putting text directly inside <ul> without <li>, or nesting the inner <ul> outside the <li>.",
});

topic({
  section: S1, title: "Tables",
  subtitle: "Use tables for tabular data only, never for page layout",
  label: "marks.html",
  tags: [
    ["<table>", "Table container"],
    ["<caption>", "Title of the table"],
    ["<thead> <tbody> <tfoot>", "Header, body and footer groups"],
    ["<tr>", "Table row"],
    ["<th scope>", "Header cell (scope=\"col\"/\"row\")"],
    ["<td>", "Data cell"],
    ["colspan / rowspan", "Merge cells across columns / rows"],
  ],
  rowH: 0.42,
  code:
`<table>
  <caption>Marks Report</caption>
  <thead>
    <tr><th scope="col">Name</th>
        <th scope="col">Maths</th>
        <th scope="col">Science</th></tr>
  </thead>
  <tbody>
    <tr><td>Asha</td><td>92</td><td>88</td></tr>
    <tr><td>Ravi</td><td>85</td><td>90</td></tr>
  </tbody>
  <tfoot>
    <tr><td colspan="3">Average: 88.75</td></tr>
  </tfoot>
</table>`,
  ex: "Build a weekly class timetable: days as column headers (<th scope=\"col\">), periods as row headers, a <caption>, and one \"Lunch Break\" row that spans all columns using colspan.",
  notes: "Solution: <tr><th scope=\"row\">12:00</th><td colspan=\"5\">Lunch Break</td></tr>. Add border via CSS: table, th, td { border:1px solid #999; border-collapse:collapse; }.",
});

topic({
  section: S1, title: "Forms: collecting input",
  subtitle: "Every input needs a name (for the server) and a <label> (for people)",
  label: "register.html",
  tags: [
    ["<form action method>", "Where & how data is sent (GET/POST)"],
    ["<label for>", "Caption linked to an input's id"],
    ["<input type=\"text\">", "Single-line text (also password, email)"],
    ["type=\"radio\"", "Pick one (same name groups them)"],
    ["type=\"checkbox\"", "Pick any number"],
    ["<select> <option>", "Drop-down list"],
    ["<textarea>", "Multi-line text"],
    ["<button type>", "submit / reset / button"],
  ],
  code:
`<form action="/register" method="post">
  <label for="name">Name</label>
  <input id="name" name="name" type="text">
  <label for="pwd">Password</label>
  <input id="pwd" name="pwd" type="password">
  <label><input type="radio" name="g"> Male</label>
  <label><input type="checkbox"> I agree</label>
  <select name="city">
    <option>Chennai</option>
    <option>Pune</option>
  </select>
  <textarea name="bio" rows="3"></textarea>
  <button type="submit">Register</button>
</form>`,
  ex: "Create a student registration form: name, email, password, gender (radio), hobbies (checkboxes), course (select), address (textarea) and a submit button. Link every field to a <label>.",
  notes: "Check: clicking a label should focus its input (proves for/id match). Radios must share the same name to be mutually exclusive. Use method=\"get\" with action=\"\" to see submitted values in the URL.",
});

topic({
  section: S1, title: "Containers & semantic layout",
  subtitle: "Semantic tags describe what content IS, helping SEO, screen readers and teammates",
  label: "layout.html",
  tags: [
    ["<div>", "Generic block container (no meaning)"],
    ["<span>", "Generic inline container"],
    ["<header>", "Intro / banner of a page or section"],
    ["<nav>", "Main navigation links"],
    ["<main>", "Unique main content (once per page)"],
    ["<section>", "Thematic group, usually with a heading"],
    ["<article>", "Self-contained item (post, card, news)"],
    ["<aside>", "Related side content"],
    ["<footer>", "Footer: copyright, links, contact"],
  ],
  rowH: 0.36,
  code:
`<body>
  <header>
    <h1>My Blog</h1>
    <nav>
      <a href="/">Home</a> <a href="/about">About</a>
    </nav>
  </header>
  <main>
    <article>
      <h2>Learning HTML</h2>
      <p>Semantic tags help <span>SEO</span>.</p>
    </article>
    <aside>Popular posts</aside>
  </main>
  <footer>&copy; 2026 My Blog</footer>
</body>`,
  ex: "Take a page built only with <div>s (header, menu, two posts, sidebar, footer) and rewrite it with semantic tags: <header> + <nav>, <main> with two <article>s, an <aside> and a <footer>.",
  notes: "Rule of thumb: if a tag exists for the meaning, use it; fall back to div/span only for styling hooks. Show the accessibility tree in DevTools to see the landmarks appear.",
});

projectGrid({
  section: S1, title: "Mini project 1: personal portfolio page",
  subtitle: "Combine every basic tag into one page, then validate it at validator.w3.org",
  items: [
    ["Skeleton", "<!DOCTYPE>, <html lang>, charset, viewport meta and a meaningful <title>"],
    ["Header & nav", "Logo <img> with alt text + four in-page links (#about, #skills, #projects, #contact)"],
    ["About me", "<h2>, two paragraphs, <strong> and <em> for key phrases"],
    ["Skills & projects", "Nested <ul> of skills + a projects <table> with caption and header cells"],
    ["Contact form", "Name, email, message <textarea> and submit button, all with labels"],
    ["Footer", "Copyright with &copy;, a mailto: link and a \"Back to top\" link"],
  ],
  notes: "Grading checklist: zero validator errors, every img has alt, every input has a label, one h1, semantic landmarks used (header/nav/main/footer).",
});

// =====================================================================
// PART 2 - ADVANCED
// =====================================================================
const S2 = "Part 2 - Advanced Tags";
pres.addSection({ title: S2 });
sectionSlide(S2, "02", "Advanced HTML Tags", "Built-in validation, rich media, graphics, embedding, interactive widgets, responsive images and accessibility.",
  ["<datalist>", "<fieldset>", "<video>", "<track>", "<svg>", "<canvas>", "<iframe>", "<dialog>", "<details>", "<picture>", "<template>", "aria-*"]);

topic({
  section: S2, title: "Advanced forms & validation",
  subtitle: "HTML5 input types give you validation and mobile keyboards without JavaScript",
  label: "booking.html",
  tags: [
    ["type=\"email|url|tel\"", "Typed input + matching mobile keyboard"],
    ["type=\"number|range\"", "Numbers with min, max, step"],
    ["type=\"date|time|color\"", "Native pickers"],
    ["required, minlength", "Block submit if empty / too short"],
    ["pattern", "Regex the value must match"],
    ["autocomplete", "Browser autofill hints (email, tel...)"],
    ["<datalist>", "Suggestion list for an input"],
    ["<fieldset> <legend>", "Group related fields with a caption"],
    ["<output>", "Display a calculated result"],
  ],
  rowH: 0.36,
  code:
`<form>
  <fieldset>
    <legend>Book a slot</legend>
    <input type="email" required
           autocomplete="email">
    <input type="tel" pattern="[0-9]{10}"
           title="10-digit mobile number">
    <input type="date" min="2026-01-01">
    <input type="range" min="1" max="10">
    <input list="cities" name="city">
    <datalist id="cities">
      <option value="Chennai"><option value="Delhi">
    </datalist>
  </fieldset>
  <button>Book</button>
</form>`,
  ex: "Build an event booking form: required email, 10-digit phone (pattern), date that blocks past days (min), ticket count (number 1–5), a colour picker, and a city <datalist>. Submit invalid data and read the browser messages.",
  notes: "Solution keys: <input type=\"number\" min=\"1\" max=\"5\" value=\"1\">, <input type=\"color\">. Set min dynamically with JS if you want 'today': dateInput.min = new Date().toISOString().split('T')[0]. Remind: client-side validation is UX, always validate again on the server.",
});

topic({
  section: S2, title: "Audio & video",
  subtitle: "Native media players with multiple formats and captions, no plugins needed",
  label: "media.html",
  tags: [
    ["<video controls>", "Video player with built-in controls"],
    ["<audio controls>", "Audio player"],
    ["<source src type>", "Alternative formats; first supported wins"],
    ["<track kind>", "Captions / subtitles in WebVTT (.vtt)"],
    ["poster", "Image shown before the video plays"],
    ["autoplay muted", "Autoplay only works when muted"],
    ["loop / playsinline", "Repeat / don't force full-screen on iOS"],
    ["preload", "none | metadata | auto"],
  ],
  code:
`<video controls width="640"
       poster="thumb.jpg" preload="metadata">
  <source src="intro.webm" type="video/webm">
  <source src="intro.mp4"  type="video/mp4">
  <track kind="captions" src="intro.en.vtt"
         srclang="en" label="English" default>
  Sorry, your browser can't play this video.
</video>

<audio controls>
  <source src="song.mp3" type="audio/mpeg">
  Your browser does not support audio.
</audio>`,
  ex: "Embed a video with a poster image, two source formats and English captions from a .vtt file you write yourself. Add an audio player below it, and a muted, looping background clip.",
  notes: "Minimal .vtt file:\nWEBVTT\n\n00:00:00.000 --> 00:00:04.000\nWelcome to the HTML course!\n\nBackground clip: <video autoplay muted loop playsinline src=\"bg.mp4\"></video>.",
});

topic({
  section: S2, title: "Graphics: SVG & canvas",
  subtitle: "SVG = vector shapes written as markup; canvas = pixels drawn with JavaScript",
  label: "graphics.html",
  tags: [
    ["<svg viewBox>", "Scalable vector drawing area"],
    ["<rect> <circle> <line>", "Basic SVG shapes"],
    ["<path d>", "Any shape, using drawing commands"],
    ["<text>", "Text inside SVG"],
    ["<canvas>", "Bitmap drawing surface"],
    ["getContext(\"2d\")", "JS API to draw on the canvas"],
    ["When to use", "SVG: icons, logos · canvas: games, charts"],
  ],
  rowH: 0.42,
  code:
`<svg width="120" height="120" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="50" fill="#E44D26"/>
  <text x="60" y="67" text-anchor="middle"
        fill="white">HTML</text>
</svg>

<canvas id="c" width="200" height="100"></canvas>
<script>
  const ctx = document.getElementById("c")
                      .getContext("2d");
  ctx.fillStyle = "#1A9E92";
  ctx.fillRect(10, 10, 150, 80);
</script>`,
  ex: "Draw a traffic light twice: once in SVG (one <rect> + three <circle>s) and once on a <canvas> using JavaScript (arc()). Zoom the browser to 300% and compare which one stays sharp.",
  notes: "Canvas circle: ctx.beginPath(); ctx.arc(50, 40, 20, 0, Math.PI*2); ctx.fillStyle='red'; ctx.fill(); Repeat for yellow/green. The SVG stays crisp at any zoom; the canvas is pixel-based and blurs.",
});

topic({
  section: S2, title: "Embedding: <iframe>, <object>",
  subtitle: "Put other pages, maps, videos or PDFs inside your page, safely",
  label: "embed.html",
  tags: [
    ["<iframe src>", "Embeds another web page"],
    ["title", "Required for screen readers"],
    ["loading=\"lazy\"", "Defer off-screen iframes"],
    ["sandbox", "Restricts scripts, forms, popups..."],
    ["allow", "Grants features: fullscreen, camera..."],
    ["referrerpolicy", "Controls what referrer is sent"],
    ["<object data>", "Embed a PDF with fallback content"],
  ],
  rowH: 0.42,
  code:
`<iframe src="https://www.youtube.com/embed/ID"
        title="HTML tutorial video"
        width="560" height="315"
        loading="lazy"
        allow="fullscreen; picture-in-picture">
</iframe>

<iframe src="widget.html" title="Widget"
        sandbox="allow-scripts"></iframe>

<object data="brochure.pdf" type="application/pdf"
        width="600" height="400">
  <a href="brochure.pdf">Download brochure</a>
</object>`,
  ex: "Embed a Google Maps location and a YouTube video as lazy-loaded iframes with titles. Then embed a page containing a form inside sandbox=\"\" and note what stops working.",
  notes: "Get embed codes from Google Maps → Share → Embed a map, and YouTube → Share → Embed. With sandbox=\"\" scripts, forms and popups are all blocked; add allow-forms to re-enable form submission.",
});

topic({
  section: S2, title: "Interactive: <details> & <dialog>",
  subtitle: "Accordions and modal dialogs built into HTML, accessible by default",
  label: "widgets.html",
  tags: [
    ["<details>", "Collapsible disclosure widget"],
    ["<summary>", "Always-visible clickable label"],
    ["open", "Start expanded"],
    ["<dialog>", "Modal or non-modal dialog box"],
    ["showModal() / close()", "Open as modal (blocks page) / close"],
    ["<form method=\"dialog\">", "Submitting closes the dialog"],
    ["::backdrop", "CSS for the dimmed background"],
  ],
  rowH: 0.42,
  code:
`<details>
  <summary>What is HTML?</summary>
  <p>The markup language of the web.</p>
</details>

<button onclick="dlg.showModal()">Delete</button>

<dialog id="dlg">
  <p>Are you sure?</p>
  <form method="dialog">
    <button value="no">Cancel</button>
    <button value="yes">Yes, delete</button>
  </form>
</dialog>`,
  ex: "Build an FAQ with four <details> items (the first one open), and a \"Subscribe\" button that opens a modal <dialog> containing an email form with Cancel and Subscribe buttons. Style the ::backdrop.",
  notes: "Read the choice: dlg.addEventListener('close', () => console.log(dlg.returnValue)); CSS: dialog::backdrop { background: rgb(0 0 0 / .5); }. Esc closes a modal dialog automatically.",
});

topic({
  section: S2, title: "Responsive images & templates",
  subtitle: "Serve the right image to each screen; keep reusable HTML in <template>",
  label: "responsive.html",
  tags: [
    ["<picture>", "Wrapper for alternative image sources"],
    ["<source media>", "Different crop per screen size"],
    ["<source type>", "Modern format (AVIF/WebP) with fallback"],
    ["srcset + sizes", "Browser picks best resolution"],
    ["<template>", "Inert HTML, cloned with JavaScript"],
    ["<slot>", "Placeholder inside a web component"],
    ["Custom elements", "Your own tags, e.g. <user-card>"],
  ],
  rowH: 0.42,
  code:
`<picture>
  <source type="image/avif" srcset="hero.avif">
  <source media="(max-width: 600px)"
          srcset="hero-mobile.jpg">
  <img src="hero.jpg" alt="Mountain view"
       srcset="hero-800.jpg 800w,
               hero-1600.jpg 1600w"
       sizes="(max-width: 800px) 100vw, 800px">
</picture>

<template id="card">
  <div class="card"><h3></h3><p></p></div>
</template>`,
  ex: "Serve a banner as AVIF with a JPG fallback, a cropped mobile version under 600px, and two resolutions via srcset/sizes. Then use a <template> + JS to render three product cards from an array.",
  notes: "Cloning: const t = document.getElementById('card'); products.forEach(p => { const c = t.content.cloneNode(true); c.querySelector('h3').textContent = p.name; document.body.append(c); }); Check DevTools → Network to see which image file was downloaded.",
});

topic({
  section: S2, title: "Accessibility, SEO & metadata",
  subtitle: "Invisible tags that decide how people, search engines and social apps see your page",
  label: "head.html",
  tags: [
    ["<meta description>", "Summary shown in search results"],
    ["og:title / og:image", "Open Graph preview for social sharing"],
    ["<link rel=\"canonical\">", "Preferred URL of the page"],
    ["<link rel=\"icon\">", "Favicon"],
    ["aria-label", "Name for icon-only controls"],
    ["role / aria-live", "Announce dynamic updates"],
    ["tabindex", "Keyboard focus order (use 0 or -1)"],
    ["JSON-LD", "Structured data for rich results"],
  ],
  code:
`<head>
  <meta name="description"
        content="Learn HTML from basics to advanced.">
  <meta property="og:title" content="HTML Course">
  <meta property="og:image" content="cover.png">
  <link rel="canonical" href="https://site.com/html">
  <link rel="icon" href="favicon.svg">
</head>

<button aria-label="Close menu">X</button>
<div role="status" aria-live="polite">Saved!</div>
<nav aria-label="Breadcrumb">...</nav>`,
  ex: "Audit your portfolio page: add a meta description and Open Graph tags, give every icon-only button an aria-label, navigate it using only the keyboard, and run Lighthouse → Accessibility. Aim for 90+.",
  notes: "First rule of ARIA: prefer native elements (<button>, <nav>) before adding roles. Test the OG preview by pasting the URL into a social post composer or an OG debugger.",
});

projectGrid({
  section: S2, title: "Mini project 2: event landing page",
  subtitle: "Use the advanced tags together to build a fast, accessible, media-rich page",
  tint: C.accent3,
  items: [
    ["Hero banner", "<picture> with AVIF + JPG fallback and a mobile crop; fetch the hero first"],
    ["Video teaser", "<video> with poster, two sources and English captions (<track>)"],
    ["Schedule", "Accessible <table> with caption, scope attributes and a merged break row"],
    ["FAQ", "Four <details>/<summary> items, first one open"],
    ["Register", "Validated form inside a modal <dialog>: email, phone pattern, date min"],
    ["SEO & a11y", "Meta description, Open Graph tags, aria-labels, Lighthouse score 90+"],
  ],
  notes: "Stretch goal: an SVG logo inline in the header and a lazy-loaded Google Maps iframe for the venue.",
});

// =====================================================================
// PART 3 - RECENT UPDATES
// =====================================================================
const S3 = "Part 3 - Recent Updates";
pres.addSection({ title: S3 });
sectionSlide(S3, "03", "Recent Updates in HTML", "HTML is now a Living Standard: features ship continuously instead of in numbered versions. Here's what landed from 2022 to 2026.",
  ["popover", "commandfor", "<search>", "<details name>", "closedby", "inert", "base-select", "fetchpriority"]);

// Timeline slide
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: S3 });
  s.addText("HTML today: a Living Standard", { placeholder: "title" });
  sub(s, "There is no \"HTML6\". WHATWG updates the spec continuously; \"Baseline\" tells you when a feature works in all major browsers");
  const years = [
    ["2022", "<dialog> becomes Baseline in all major browsers", C.accent5],
    ["2023", "<search> element · inert attribute · lazy-loading iframes", C.accent3],
    ["2024", "Popover API · exclusive accordions <details name> · declarative shadow DOM · fetchpriority", C.accent1],
    ["2025", "Invoker commands (command / commandfor) · <dialog closedby> · customizable <select> · hidden=\"until-found\"", C.accent2],
    ["2026", "Wider cross-browser support for customizable <select>, closedby and interest invokers (check MDN)", C.accent4],
  ];
  const lineY = 2.95, x0 = 1.625, step = 2.52;
  s.addShape(pres.shapes.LINE, { x: x0, y: lineY, w: step * 4, h: 0, line: { color: "C9CEDD", width: 3 }, objectName: "timelineLine" });
  years.forEach(([yr, txt, col], i) => {
    const cx = x0 + i * step;
    s.addShape(pres.shapes.OVAL, { x: cx - 0.3, y: lineY - 0.3, w: 0.6, h: 0.6, fill: { color: col }, line: { color: C.background1, width: 3 }, objectName: oid("tlDot") });
    s.addText(yr, { x: cx - 1.0, y: 1.85, w: 2.0, h: 0.6, fontSize: 26, bold: true, color: col, align: "center", margin: 0, isTextBox: true, objectName: oid("tlYear") });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx - 1.125, y: 3.55, w: 2.25, h: 2.1, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: "E1E4EE", width: 0.75 }, objectName: oid("tlCard") });
    s.addText(txt, { x: cx - 1.0, y: 3.65, w: 2.0, h: 1.9, fontSize: 14, color: C.text1, valign: "top", margin: 0, isTextBox: true, objectName: oid("tlText") });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 5.95, w: 12.33, h: 1.0, rectRadius: 0.12, fill: { color: C.text1 }, line: { color: C.text1 }, objectName: "tlTip" });
  s.addText([
    { text: "How to check support: ", options: { bold: true, color: "FFB199" } },
    { text: "look for the Baseline badge on MDN (\"Widely available\" = safe everywhere, \"Newly available\" = all current browsers), or search caniuse.com.", options: { color: C.background1 } },
  ], { x: 0.8, y: 6.0, w: 11.8, h: 0.9, fontSize: 16, valign: "middle", margin: 0, isTextBox: true, objectName: "tlTipText" });
  s.addNotes("Years are when features reached broad browser support (approximate). Browser support changes monthly; always confirm on MDN / caniuse before relying on the newest items in production.");
}

topic({
  section: S3, title: "Popover API (Baseline 2024)",
  subtitle: "Menus, toasts and tooltips with zero JavaScript, rendered in the top layer",
  label: "popover.html",
  tags: [
    ["popover", "Turns any element into a popover"],
    ["popovertarget", "Button that toggles the popover by id"],
    ["popovertargetaction", "show | hide | toggle"],
    ["popover=\"auto\"", "Default: closes on Esc / outside click"],
    ["popover=\"manual\"", "Stays open until explicitly closed"],
    ["popover=\"hint\"", "Newer: tooltip-style, doesn't close autos"],
    [":popover-open", "CSS pseudo-class for the open state"],
  ],
  rowH: 0.42,
  code:
`<button popovertarget="menu">Open menu</button>

<div id="menu" popover>
  <a href="/profile">Profile</a>
  <a href="/logout">Logout</a>
</div>

<!-- manual: no light-dismiss -->
<div id="toast" popover="manual">Saved!</div>
<button popovertarget="toast"
        popovertargetaction="hide">Dismiss</button>

<!-- No JavaScript required -->`,
  ex: "Build a profile dropdown menu and a \"Saved!\" toast using only HTML popovers. Style the open state with :popover-open and fade it in with a CSS transition.",
  notes: "CSS idea: [popover] { opacity:0; transition: opacity .3s, display .3s allow-discrete; } [popover]:popover-open { opacity:1; } @starting-style { [popover]:popover-open { opacity:0; } }. Popovers sit in the top layer so no z-index fights.",
});

topic({
  section: S3, title: "Invoker commands & dialog upgrades",
  subtitle: "Declarative buttons control dialogs and popovers; accordions can now be exclusive",
  label: "commands.html",
  tags: [
    ["commandfor=\"id\"", "Which element the button controls"],
    ["command=\"show-modal\"", "Opens a <dialog> as a modal"],
    ["command=\"close\"", "Closes the dialog"],
    ["toggle-popover", "Also show-popover / hide-popover"],
    ["command=\"--custom\"", "Custom commands via JS 'command' event"],
    ["<dialog closedby>", "any | closerequest | none"],
    ["<details name=\"x\">", "Exclusive accordion: one open at a time"],
  ],
  rowH: 0.42,
  code:
`<button commandfor="dlg" command="show-modal">
  Open dialog
</button>

<dialog id="dlg" closedby="any">
  <p>Click outside or press Esc to close.</p>
  <button commandfor="dlg" command="close">
    Close
  </button>
</dialog>

<details name="faq"><summary>Q1</summary>A1</details>
<details name="faq"><summary>Q2</summary>A2</details>`,
  ex: "Rebuild the FAQ + subscribe dialog from Part 2 with no onclick JavaScript: open/close the dialog with command/commandfor, allow click-outside closing with closedby=\"any\", and make the FAQ an exclusive accordion.",
  notes: "Invoker commands shipped in Chromium 135 (2025) and reached the other major engines afterwards; closedby is newer, so treat it as progressive enhancement. Custom command: el.addEventListener('command', e => { if (e.command === '--rotate') ... }).",
});

topic({
  section: S3, title: "More new elements & attributes",
  subtitle: "Small additions that improve semantics, performance and styling",
  label: "new-features.html",
  tags: [
    ["<search>", "Landmark wrapping search/filter forms"],
    ["inert", "Makes a region unclickable & unfocusable"],
    ["hidden=\"until-found\"", "Hidden, but revealed by Ctrl+F search"],
    ["fetchpriority=\"high\"", "Load the hero image first (LCP)"],
    ["shadowrootmode", "Declarative shadow DOM in <template>"],
    ["base-select (CSS)", "Fully stylable <select> (Chromium)"],
    ["<selectedcontent>", "Mirrors the chosen option in the button"],
  ],
  rowH: 0.42,
  code:
`<search>
  <form action="/search">
    <input type="search" name="q">
  </form>
</search>
<img src="hero.jpg" alt="Hero" fetchpriority="high">
<div hidden="until-found">Full answer...</div>

<select class="fancy">
  <button><selectedcontent></selectedcontent></button>
  <option><img src="in.svg" alt=""> India</option>
</select>
<style>
  .fancy, .fancy::picker(select) {
    appearance: base-select; }
</style>`,
  ex: "Wrap your portfolio's search box in <search>, mark the hero image fetchpriority=\"high\", make a hidden-until-found FAQ answer, and (in Chrome/Edge) build a styled country <select> with flag images.",
  notes: "Customizable select degrades gracefully: browsers without support show a normal <select>. inert is ideal for the page behind a custom modal or an off-canvas menu.",
});

// Support table slide
{
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: S3 });
  s.addText("Can I use it today?", { placeholder: "title" });
  sub(s, "Approximate status as of 2026. Use progressive enhancement for anything not yet Baseline");
  const YES = "E6F6F4", PE = "FFF4D6";
  const rows = [
    ["<dialog>", "Baseline 2022", "Yes", YES],
    ["<search>, inert", "Baseline 2023", "Yes", YES],
    ["Popover API", "Baseline 2024", "Yes", YES],
    ["<details name> exclusive accordion", "Baseline 2024", "Yes", YES],
    ["fetchpriority, declarative shadow DOM", "Baseline 2024", "Yes", YES],
    ["Invoker commands (command / commandfor)", "All major engines since late 2025", "Yes, add a JS fallback for older browsers", YES],
    ["<dialog closedby>, hidden=\"until-found\"", "Chromium + Firefox", "Progressive enhancement", PE],
    ["Customizable <select> (base-select)", "Chromium 135+", "Progressive enhancement", PE],
  ];
  const hdr = ["Feature", "Support", "Use in production?"].map((t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 }, fontSize: 15 } }));
  const body = rows.map(([f, sup, use, col]) => [
    { text: f, options: { fontFace: CODE_FONT, bold: true, color: C.accent1, fontSize: 13, fill: { color: C.background1 } } },
    { text: sup, options: { color: C.text1, fontSize: 15, fill: { color: C.background1 } } },
    { text: use, options: { color: C.text1, bold: true, fontSize: 15, fill: { color: col } } },
  ]);
  s.addTable([hdr, ...body], { x: 0.5, y: 1.75, w: 12.33, colW: [5.0, 3.6, 3.73], rowH: 0.5, valign: "middle", border: { type: "solid", pt: 0.5, color: "E1E4EE" }, margin: [0.05, 0.12, 0.05, 0.12], objectName: "supportTable" });
  s.addText([
    { text: "Verify before shipping: ", options: { bold: true } },
    { text: "developer.mozilla.org (Baseline badge)  ·  caniuse.com  ·  web.dev/baseline", options: {} },
  ], { x: 0.5, y: 6.45, w: 12.33, h: 0.4, fontSize: 14, color: C.text2, margin: 0, isTextBox: true, objectName: "supportNote" });
  s.addNotes("Browser support moves fast. The 'Support' column is a snapshot; confirm on MDN or caniuse before the session, and update this slide if anything has changed.");
}

projectGrid({
  section: S3, title: "Final challenge: a zero-JavaScript UI",
  subtitle: "Rebuild common interface widgets using only the newest HTML features",
  tint: C.accent2,
  items: [
    ["Navigation menu", "Hamburger button + popover menu that closes on Esc or outside click"],
    ["Toast messages", "popover=\"manual\" toast shown by a button, dismissed by another"],
    ["Confirm dialog", "<dialog> opened with command=\"show-modal\", closedby=\"any\""],
    ["FAQ accordion", "Exclusive <details name=\"faq\"> group with hidden-until-found answers"],
    ["Search bar", "<search> landmark with a <datalist> of suggestions"],
    ["Styled dropdown", "Customizable <select> with icons, falling back to a normal select"],
  ],
  notes: "Rule for the challenge: no <script> tags and no onclick attributes. Test in Chrome, Firefox and Safari and note which parts fall back.",
});

// Closing
{
  const s = pres.addSlide({ masterName: "SECTION_DARK", sectionTitle: S3 });
  s.addText("Key takeaways", { placeholder: "title" });
  s.addText([
    { text: "Structure first: a valid skeleton and semantic tags", options: { bullet: true, breakLine: true } },
    { text: "Use native elements before JavaScript and ARIA", options: { bullet: true, breakLine: true } },
    { text: "Every image needs alt; every input needs a label", options: { bullet: true, breakLine: true } },
    { text: "HTML keeps evolving: check Baseline, then adopt", options: { bullet: true } },
  ], { placeholder: "body", paraSpaceAfter: 8 });
  const res = [
    ["MDN Web Docs", "developer.mozilla.org"],
    ["HTML Living Standard", "html.spec.whatwg.org"],
    ["Baseline status", "web.dev/baseline"],
    ["Browser support", "caniuse.com"],
    ["Validator", "validator.w3.org"],
  ];
  s.addText("Resources", { x: 8.6, y: 1.0, w: 4.2, h: 0.5, fontSize: 20, bold: true, color: "FFB199", margin: 0, isTextBox: true, objectName: "resHead" });
  res.forEach(([name, url], i) => {
    const y = 1.65 + i * 0.95;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.6, y, w: 4.2, h: 0.8, rectRadius: 0.12, fill: { color: "2A2F55" }, line: { color: "3B4275", width: 0.75 }, objectName: oid("resCard") });
    s.addText([
      { text: name, options: { bold: true, color: C.background1, fontSize: 15, breakLine: true } },
      { text: url, options: { color: "CADCFC", fontSize: 13, fontFace: CODE_FONT } },
    ], { x: 8.8, y, w: 3.9, h: 0.8, valign: "middle", margin: 0, isTextBox: true, objectName: oid("resText") });
  });
  s.addNotes("Wrap-up. Encourage learners to validate every page and to revisit the recent-updates section in a few months, since support for the 2025-2026 features keeps growing.");
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
