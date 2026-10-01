import fs from 'node:fs';
import { createDoc, toBuffer, table, pageFooters, contentWidth, txt, LOGO, MAROON } from './common.js';
import { label } from '../lib/applications.js';
import * as S from '../lib/summaries.js';

const d = (s) => (s ? String(s).slice(0, 10) : '');

function reportHeader(doc, title, subtitle) {
  const x = doc.page.margins.left;
  const y = doc.page.margins.top;
  if (fs.existsSync(LOGO)) doc.image(LOGO, x, y, { width: 40 });
  doc.font('Helvetica-Bold').fontSize(13).fillColor(MAROON).text('UNIVERSITY OF PERADENIYA', x + 50, y + 2);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#000').text(txt(title), x + 50, doc.y + 1);
  if (subtitle) doc.font('Helvetica').fontSize(9).text(txt(subtitle), x + 50, doc.y + 1);
  doc.font('Helvetica').fontSize(8).fillColor('#4b5563').text(`Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC`, x, y + 2, { width: contentWidth(doc), align: 'right' });
  doc.fillColor('#000');
  doc.y = Math.max(doc.y, y + 46) + 6;
  doc.x = x;
}

/** Vacancy/department candidate report (Requirements §23) – landscape. */
export async function generateCandidateReportPdf(apps, ctx, { title = 'Candidate Report', subtitle = '' } = {}) {
  const doc = createDoc({ layout: 'landscape', size: 'A4', margin: 28, title });
  reportHeader(doc, title, subtitle);
  table(
    doc,
    [
      { header: 'Reference', width: 0.08 },
      { header: 'Applicant Name', width: 0.1 },
      { header: 'Mobile', width: 0.06 },
      { header: 'Email', width: 0.09 },
      { header: 'Address', width: 0.09 },
      { header: 'University Education', width: 0.13 },
      { header: 'Postgraduate Qualifications', width: 0.12 },
      { header: 'Previous Employments', width: 0.11 },
      { header: 'Books', width: 34, align: 'center' },
      { header: 'Abstracts', width: 44, align: 'center' },
      { header: 'Journals', width: 40, align: 'center' },
      { header: 'Referees', width: 0.11 },
    ],
    apps.map((a) => [
      [a.reference_no, a.decision_code ? `${label(a.decision_code)}${a.category_code ? ' - ' + label(a.category_code) : ''}` : ''].filter(Boolean).join('\n'),
      a.name_in_full,
      a.mobile,
      a.email,
      S.addressText(a),
      S.educationSummary(a.sections),
      S.postgraduateSummary(a.sections),
      S.previousEmploymentSummary(a.sections),
      String(a.counts.books),
      String(a.counts.abstracts),
      String(a.counts.journals),
      S.refereesSummary(a.sections),
    ]),
    { fontSize: 7, emptyText: 'No candidates' },
  );
  doc.font('Helvetica').fontSize(8).text(`Total candidates: ${apps.length}`);
  pageFooters(doc, `${title}${subtitle ? ' - ' + subtitle : ''}`);
  return toBuffer(doc);
}

const POST_SHORT = { LP: 'Lect (Prob)', LU: 'Lect (Unconf)', SL2: 'SL (II)', SL1: 'SL (I)', AL: 'AL', SAL2: 'SAL (II)', SAL1: 'SAL (I)' };

function schedCell(v) {
  if (v === 'TICK') return { text: '4', font: 'ZapfDingbats', align: 'center' }; // check mark glyph
  if (v === 'NO') return { text: 'X', align: 'center' };
  if (v === 'PENDING') return { text: 'Pend.', align: 'center' };
  if (v === 'PARTIAL') return { text: '1/2', align: 'center' };
  return { text: '', align: 'center' };
}

/**
 * Official University schedule (Requirements §24) reproducing the supplied
 * format: one block per post with Name/Address/DOB, Post, Qualifications,
 * Medals/Prizes/Scholarships & Publications, Extra-curricular, Experience,
 * PC/RR/TR and Remarks, with the Deputy Registrar / HOD / Dean signature line.
 */
export async function generateSchedulePdf(groups, ctx, { departmentName }) {
  const doc = createDoc({ layout: 'landscape', size: 'A3', margin: 30, title: `Schedule - ${departmentName}` });
  const x = doc.page.margins.left;
  const w = contentWidth(doc);
  const allPosts = [...new Set(groups.map((g) => g.vacancy.position_title))];

  doc.font('Helvetica-Bold').fontSize(14).text('University Of Peradeniya', x, doc.y, { width: w, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(12).text(`Post of ${allPosts.join(' / ') || 'Lecturer (Probationary) / Lecturer (Unconfirmed) / Senior Lecturer Gr. I/II'}`, { width: w, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(12).text(txt(departmentName), { width: w, align: 'center' });
  doc.moveDown(0.4);
  const advertised = [...new Set(groups.map((g) => d(g.vacancy.advertised_on)))].join(', ');
  const closed = [...new Set(groups.map((g) => g.vacancy.closing_date_local))].join(', ');
  const yy = doc.y;
  doc.font('Helvetica').fontSize(10).text(`Advertised on : ${advertised || '-'}`, x, yy, { width: w / 2 });
  doc.text(`Application closed on : ${closed || '-'}`, x + w / 2, yy, { width: w / 2, align: 'right' });
  doc.moveDown(0.6);
  const ly = doc.y;
  doc.font('Helvetica-Bold').fontSize(9).text('PC: Sent through proper channel', x, ly, { width: w / 3 });
  doc.text('RR: Referees Report', x + w / 3, ly, { width: w / 3, align: 'center' });
  doc.text('TR: Transcript', x + (2 * w) / 3, ly, { width: w / 3, align: 'right' });
  doc.moveDown(0.8);

  const columns = [
    { header: 'No', width: 26, align: 'center' },
    { header: 'Name, Address & DOB', width: 0.16 },
    { header: 'Post Applied', width: 0.055, align: 'center' },
    { header: 'Qualifications', width: 0.2 },
    { header: 'Medals/Prizes, Scholarship & Publications', width: 0.13 },
    { header: 'Extra Curricular activities', width: 0.1 },
    { header: 'Experience', width: 0.16 },
    { header: 'PC', width: 26 },
    { header: 'RR', width: 26 },
    { header: 'TR', width: 26 },
    { header: 'Remarks', width: 0.09 },
  ];

  let serial = 0;
  for (const g of groups) {
    doc.font('Helvetica-Bold').fontSize(11).fillColor(MAROON)
      .text(txt(`${g.vacancy.position_title}${g.vacancy.discipline ? ' - ' + g.vacancy.discipline : ''}`), x, doc.y, { width: w, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor('#374151')
      .text(`Advertised on ${d(g.vacancy.advertised_on)}  |  Closed on ${g.vacancy.closing_date_local}${g.vacancy.advert_reference ? '  |  Advert Ref: ' + g.vacancy.advert_reference : ''}`, { width: w, align: 'center' });
    doc.fillColor('#000').moveDown(0.3);
    table(
      doc,
      columns,
      g.apps.map((a) => {
        serial += 1;
        const s = a.sections;
        const medals = S.distinctionsOfType(s, ['MEDAL', 'PRIZE', 'DISTINCTION', 'OTHER']);
        const scholarships = S.distinctionsOfType(s, ['SCHOLARSHIP']);
        return [
          String(serial).padStart(2, '0'),
          `Name\n${a.title ? a.title + '. ' : ''}${a.name_in_full || ''}\n\nAddress\n${S.addressText(a)}\n\nDOB - ${d(a.date_of_birth)}\nAge - ${a.age ?? ''}\nTel: ${[a.mobile, a.phone_residence].filter(Boolean).join(' / ')}`,
          `${POST_SHORT[a.position_code] || a.position_code}${a.category_code ? '\n' + label(a.category_code) : ''}`,
          `1st Degree:\n${S.educationSummary(s) || '-'}\n\nPostgraduate Qualifications:\n${S.postgraduateSummary(s) || '-'}\n\nOther Qualifications:\n${S.otherQualifications(a) || '-'}`,
          `${medals ? 'Medals/Prizes: ' + medals + '\n\n' : ''}${scholarships ? 'Scholarships: ' + scholarships + '\n\n' : ''}Books - ${a.counts.books}\nJournals - ${a.counts.journals}\nAbstracts - ${a.counts.abstracts}`,
          a.extra_curricular || '-',
          `At Present:\n${S.currentEmploymentSummary(s) || '-'}\n\nPrevious experience:\n${S.previousEmploymentSummary(s) || '-'}`,
          schedCell(a.sched_pc),
          schedCell(S.rrStatus(a)),
          schedCell(a.sched_tr),
          a.sched_remarks || '',
        ];
      }),
      { fontSize: 7.5, emptyText: 'No candidates' },
    );
    doc.moveDown(0.5);
  }

  // Signature line on every page, plus page numbers.
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - bottom + 4;
    doc.font('Helvetica').fontSize(9).fillColor('#000');
    doc.text('Deputy Registrar: .................................', x, y, { width: w / 3, lineBreak: false });
    doc.text('Head Of The Department: .................................', x + w / 3, y, { width: w / 3, align: 'center', lineBreak: false });
    doc.text(`Dean: .................................     ${i + 1}`, x + (2 * w) / 3, y, { width: w / 3, align: 'right', lineBreak: false });
    doc.page.margins.bottom = bottom;
  }
  return toBuffer(doc);
}
