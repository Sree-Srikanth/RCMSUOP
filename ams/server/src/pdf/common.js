import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';
import { SERVER_ROOT } from '../config.js';

export const LOGO = path.join(SERVER_ROOT, 'assets', 'logo.png');
export const MAROON = '#7a1416';
const GRID = '#9ca3af';

export function createDoc({ layout = 'portrait', size = 'A4', margin = 40, title = 'Document' } = {}) {
  return new PDFDocument({
    size,
    layout,
    bufferPages: true,
    margins: { top: margin, bottom: margin + 20, left: margin, right: margin },
    info: { Title: title, Author: 'University of Peradeniya', Creator: 'UoP Application Management System' },
  });
}

export function toBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export const contentWidth = (doc) => doc.page.width - doc.page.margins.left - doc.page.margins.right;
export const bottomLimit = (doc) => doc.page.height - doc.page.margins.bottom;

/** Standard PDF fonts are Latin-1 only; replace anything else so output never garbles. */
export const txt = (v) =>
  v === null || v === undefined || v === ''
    ? ''
    : String(v)
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[–—]/g, '-')
        .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '?');

export function ensureSpace(doc, height) {
  if (doc.y + height > bottomLimit(doc)) doc.addPage();
}

export function logoHeader(doc, lines, { logoSize = 56 } = {}) {
  const w = doc.page.width;
  const top = doc.page.margins.top;
  if (fs.existsSync(LOGO)) doc.image(LOGO, (w - logoSize) / 2, top, { width: logoSize });
  doc.y = top + logoSize + 6;
  doc.font('Helvetica-Bold').fontSize(14).fillColor(MAROON).text('UNIVERSITY OF PERADENIYA', doc.page.margins.left, doc.y, { align: 'center', width: contentWidth(doc) });
  doc.font('Helvetica').fontSize(9).fillColor('#000').text('SRI LANKA', { align: 'center', width: contentWidth(doc) });
  doc.moveDown(0.4);
  for (const l of lines) {
    doc.font(l.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(l.size || 10).fillColor('#000').text(txt(l.text), doc.page.margins.left, doc.y, { align: 'center', width: contentWidth(doc) });
  }
  doc.moveDown(0.6);
}

export function sectionHeading(doc, text) {
  ensureSpace(doc, 40);
  doc.moveDown(0.5);
  const x = doc.page.margins.left;
  const y = doc.y;
  doc.rect(x, y, contentWidth(doc), 16).fill('#f3e8e8');
  doc.fillColor(MAROON).font('Helvetica-Bold').fontSize(10).text(txt(text), x + 5, y + 4, { width: contentWidth(doc) - 10 });
  doc.fillColor('#000');
  doc.y = y + 20;
}

/** Two-column label/value rows. */
export function keyValues(doc, pairs, { labelWidth = 170, fontSize = 9 } = {}) {
  const x = doc.page.margins.left;
  const valueWidth = contentWidth(doc) - labelWidth;
  for (const [k, v] of pairs) {
    const value = txt(v) || '-';
    doc.font('Helvetica').fontSize(fontSize);
    const hgt = Math.max(doc.heightOfString(value, { width: valueWidth - 6 }), doc.heightOfString(txt(k), { width: labelWidth - 6 })) + 4;
    ensureSpace(doc, hgt);
    const y = doc.y;
    doc.font('Helvetica-Bold').fillColor('#374151').text(txt(k), x, y + 2, { width: labelWidth - 6 });
    doc.font('Helvetica').fillColor('#000').text(value, x + labelWidth, y + 2, { width: valueWidth - 6 });
    doc.y = y + hgt;
  }
}

export function paragraph(doc, text, { fontSize = 9, italic = false } = {}) {
  const t = txt(text) || '-';
  doc.font(italic ? 'Helvetica-Oblique' : 'Helvetica').fontSize(fontSize);
  ensureSpace(doc, doc.heightOfString(t, { width: contentWidth(doc) }) + 4);
  doc.text(t, doc.page.margins.left, doc.y, { width: contentWidth(doc) });
  doc.moveDown(0.3);
}

/**
 * Bordered table with wrapping cells and repeated header on page breaks.
 * columns: [{ header, width (fraction or points), align }]
 * rows: array of arrays (cell values may be strings or { text, bold }).
 */
export function table(doc, columns, rows, { fontSize = 8, headerFill = '#e5e7eb', emptyText = 'None', padding = 3 } = {}) {
  const x0 = doc.page.margins.left;
  const total = contentWidth(doc);
  const fixed = columns.reduce((s, c) => s + (c.width > 1 ? c.width : 0), 0);
  const fracSum = columns.reduce((s, c) => s + (c.width <= 1 ? c.width || 0 : 0), 0) || 1;
  const widths = columns.map((c) => (c.width > 1 ? c.width : ((c.width || 0) / fracSum) * (total - fixed)));

  const cellText = (v) => (v && typeof v === 'object' ? txt(v.text) : txt(v));
  const rowHeight = (cells, bold) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
    return Math.max(...cells.map((c, i) => doc.heightOfString(cellText(c) || ' ', { width: widths[i] - padding * 2 }))) + padding * 2;
  };
  const drawRow = (cells, { bold = false, fill = null } = {}) => {
    const hgt = rowHeight(cells, bold);
    let x = x0;
    const y = doc.y;
    cells.forEach((c, i) => {
      if (fill) doc.rect(x, y, widths[i], hgt).fill(fill);
      doc.lineWidth(0.5).strokeColor(GRID).rect(x, y, widths[i], hgt).stroke();
      const isObj = c && typeof c === 'object';
      const font = isObj && c.font ? c.font : bold || (isObj && c.bold) ? 'Helvetica-Bold' : 'Helvetica';
      doc.fillColor('#000').font(font).fontSize(fontSize)
        .text(cellText(c), x + padding, y + padding, { width: widths[i] - padding * 2, align: (isObj && c.align) || columns[i].align || 'left' });
      x += widths[i];
    });
    doc.y = y + hgt;
  };
  const header = columns.map((c) => c.header);
  const drawHeader = () => drawRow(header, { bold: true, fill: headerFill });

  ensureSpace(doc, rowHeight(header, true) + 18);
  drawHeader();
  if (!rows.length) {
    drawRow([emptyText, ...columns.slice(1).map(() => '')]);
  }
  for (const r of rows) {
    const hgt = rowHeight(r, false);
    if (doc.y + hgt > bottomLimit(doc)) {
      doc.addPage();
      drawHeader();
    }
    drawRow(r);
  }
  doc.x = x0;
  doc.moveDown(0.4);
}

export function pageFooters(doc, leftText) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // allow writing in the footer area without auto page breaks
    const y = doc.page.height - bottom + 8;
    doc.font('Helvetica').fontSize(7.5).fillColor('#4b5563');
    doc.text(txt(leftText), doc.page.margins.left, y, { width: contentWidth(doc) * 0.75, lineBreak: false });
    doc.text(`Page ${i + 1} of ${range.count}`, doc.page.margins.left, y, { width: contentWidth(doc), align: 'right', lineBreak: false });
    doc.page.margins.bottom = bottom;
  }
  doc.fillColor('#000');
}
