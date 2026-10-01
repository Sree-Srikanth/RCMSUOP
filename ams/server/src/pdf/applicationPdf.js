import { createDoc, toBuffer, logoHeader, sectionHeading, keyValues, table, paragraph, pageFooters, contentWidth, ensureSpace, txt, MAROON } from './common.js';
import { label, DOC_CATEGORIES } from '../lib/applications.js';
import { getSetting } from '../db.js';

const yesNo = (v) => (v === 1 ? 'Yes' : v === 0 ? 'No' : '-');
const d = (s) => (s ? String(s).slice(0, 10) : '');

function address(a, prefix) {
  return [a[`${prefix}_address_line1`], a[`${prefix}_address_line2`], a[`${prefix}_city`], a[`${prefix}_district`] && `${a[`${prefix}_district`]} District`, a[`${prefix}_province`] && `${a[`${prefix}_province`]} Province`, a[`${prefix}_postal_code`]]
    .filter(Boolean)
    .join(', ');
}

/** Name in full with the surname underlined, as required by the institutional form. */
function nameWithUnderlinedSurname(doc, a, x, width) {
  const full = txt(`${a.title ? a.title + '. ' : ''}${a.name_in_full || ''}`);
  const surname = txt(a.surname || '');
  const idx = surname ? full.toLowerCase().indexOf(surname.toLowerCase()) : -1;
  doc.font('Helvetica').fontSize(9);
  const y0 = doc.y;
  const height = doc.heightOfString(full || '-', { width });
  if (idx < 0) {
    doc.text(full || '-', x, y0, { width });
  } else {
    doc.text(full.slice(0, idx), x, y0, { width, continued: true })
      .text(full.slice(idx, idx + surname.length), { underline: true, continued: true })
      .text(full.slice(idx + surname.length) || ' ', { underline: false });
  }
  doc.x = x;
  doc.y = y0 + height + 2;
}

export async function generateApplicationPdf(a, ctx) {
  const doc = createDoc({ title: `Application ${a.reference_no || 'Draft'}` });
  const { db } = ctx;
  const s = a.sections;

  logoHeader(doc, [
    { text: `APPLICATION FOR THE POST OF ${a.position_title.toUpperCase()}`, bold: true, size: 11 },
    { text: `Faculty: ${a.faculty_name}`, size: 9 },
    { text: `Department: ${a.department_name}${a.discipline ? `   |   Discipline(s): ${a.discipline}` : ''}`, size: 9 },
  ]);

  // Reference box
  const x = doc.page.margins.left;
  const w = contentWidth(doc);
  const y = doc.y;
  doc.lineWidth(1).strokeColor(MAROON).rect(x, y, w, 30).stroke();
  doc.font('Helvetica-Bold').fontSize(10).fillColor(MAROON)
    .text(`Application Reference No: ${a.reference_no || 'DRAFT - NOT SUBMITTED'}`, x + 8, y + 5, { width: w / 2 });
  doc.font('Helvetica').fontSize(9).fillColor('#000')
    .text(`Submitted on: ${a.submitted_at ? d(a.submitted_at) : '-'}`, x + w / 2, y + 5, { width: w / 2 - 8, align: 'right' })
    .text(`Advertised on: ${d(a.advertised_on)}   Closing date: ${d(a.closing_date)}`, x + 8, y + 17, { width: w - 16 });
  doc.y = y + 38;

  if (a.status === 'DRAFT') {
    doc.save().rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] })
      .font('Helvetica-Bold').fontSize(90).fillColor('#dc2626').opacity(0.12)
      .text('DRAFT', 0, doc.page.height / 2 - 50, { width: doc.page.width, align: 'center' }).restore();
    doc.opacity(1).fillColor('#000');
  }

  sectionHeading(doc, '1. Name');
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#374151').text('Name in full (surname underlined)', x, doc.y);
  doc.fillColor('#000');
  nameWithUnderlinedSurname(doc, a, x, w);
  doc.moveDown(0.3);
  keyValues(doc, [
    ['Surname', a.surname],
    ['Name with initials', a.name_with_initials],
    ['Name registered under at a University (if different)', a.former_name],
  ]);

  sectionHeading(doc, '2. Address and Contact Details');
  keyValues(doc, [
    ['(a) Postal / current address', address(a, 'cur')],
    ['Permanent address', a.perm_same_as_current ? 'Same as current address' : address(a, 'perm')],
    ['(b) Mobile', a.mobile],
    ['Residence', a.phone_residence],
    ['Office', a.phone_office],
    ['(c) Email address', a.email],
  ]);

  sectionHeading(doc, '3-5. Date of Birth, Civil Status and Citizenship');
  keyValues(doc, [
    ['Date of birth', d(a.date_of_birth)],
    ['Age (at closing date)', a.age != null ? `${a.age} years` : ''],
    ['Civil status', a.civil_status ? a.civil_status.charAt(0) + a.civil_status.slice(1).toLowerCase() : ''],
    ['Citizen of Sri Lanka', label(a.citizenship_type)],
    ...(a.citizenship_type === 'REGISTRATION' ? [['Citizenship certificate', `Ref. ${a.citizenship_cert_no || '-'} dated ${d(a.citizenship_cert_date) || '-'}`]] : []),
    ['National Identity Card No', a.nic],
    ['Passport No', a.passport_no],
  ]);

  sectionHeading(doc, '6. University Education');
  table(
    doc,
    [{ header: 'Degree / Diploma', width: 0.2 }, { header: 'University', width: 0.18 }, { header: 'From', width: 0.1 }, { header: 'To', width: 0.1 }, { header: 'Course followed', width: 0.17 }, { header: 'Date of final exam', width: 0.1 }, { header: 'Result (Class / GPA)', width: 0.15 }],
    s.education.map((e) => [e.qualification, e.university, d(e.period_from), d(e.period_to), e.course_followed, d(e.final_exam_date), [label(e.result_class), e.gpa && `GPA ${e.gpa}`].filter(Boolean).join(' / ')]),
  );

  sectionHeading(doc, '7. Postgraduate Qualifications');
  table(
    doc,
    [{ header: 'Qualification', width: 0.25 }, { header: 'Institution', width: 0.23 }, { header: 'Type', width: 0.14 }, { header: 'SLQF Level', width: 0.12 }, { header: 'Duration', width: 0.12 }, { header: 'Effective date', width: 0.14 }],
    s.postgraduate.map((p) => [p.qualification, p.institution, label(p.pg_type), label(p.slqf_level), p.duration, d(p.effective_date)]),
  );
  if (a.board_certified !== null && a.board_certified !== undefined) {
    keyValues(doc, [['Board Certification (MBBS/BDS only)', a.board_certified ? `Yes - ${d(a.board_certification_date)}` : 'No']]);
  }

  sectionHeading(doc, '8. Academic Distinctions, Scholarships, Medals, Prizes etc.');
  table(
    doc,
    [{ header: 'Type', width: 0.14 }, { header: 'Distinction / Award', width: 0.44 }, { header: 'Institution', width: 0.32 }, { header: 'Year', width: 0.1 }],
    s.distinctions.map((x2) => [label(x2.award_type), x2.award, x2.institution, x2.year]),
  );

  sectionHeading(doc, '9. Research Publications');
  doc.font('Helvetica-Bold').fontSize(9).text('(I) Books', x, doc.y);
  table(
    doc,
    [{ header: 'No.', width: 24 }, { header: 'Name of the Book', width: 0.38 }, { header: 'Date of Publication', width: 0.14 }, { header: 'Author', width: 0.28 }, { header: 'ISBN No', width: 0.2 }],
    s.books.map((b, i) => [roman(i + 1), b.title, d(b.publication_date), b.authors, b.isbn]),
  );
  doc.font('Helvetica-Bold').fontSize(9).text('(II) Abstracts', x, doc.y);
  table(
    doc,
    [{ header: 'No.', width: 24 }, { header: 'Title of Article', width: 0.38 }, { header: 'Author', width: 0.24 }, { header: 'Source', width: 0.24 }, { header: 'Date of Publication', width: 0.14 }],
    s.abstracts.map((b, i) => [roman(i + 1), b.title, b.authors, b.source, d(b.publication_date)]),
  );
  doc.font('Helvetica-Bold').fontSize(9).text('(III) Journals', x, doc.y);
  table(
    doc,
    [{ header: 'No.', width: 24 }, { header: 'Title of Article', width: 0.38 }, { header: 'Author', width: 0.24 }, { header: 'Source / DOI', width: 0.26 }, { header: 'Year', width: 0.08 }],
    s.journals.map((b, i) => [roman(i + 1), b.title, b.authors, b.source_doi, b.year]),
  );
  paragraph(doc, 'Note: First degree dissertations / postgraduate theses are not considered as publications.', { italic: true, fontSize: 8 });

  sectionHeading(doc, '10. Proficiency in Languages (highest examination passed)');
  keyValues(doc, [['Sinhala', a.lang_sinhala], ['Tamil', a.lang_tamil], ['English', a.lang_english]]);

  sectionHeading(doc, '11. Employment');
  doc.font('Helvetica-Bold').fontSize(9).text('(a) Present occupation & salary drawn', x, doc.y);
  table(
    doc,
    [{ header: 'Designation', width: 0.3 }, { header: 'Department / Institution', width: 0.4 }, { header: 'From', width: 0.13 }, { header: 'Salary drawn', width: 0.17 }],
    s.current_employment.map((c) => [c.designation, c.institution, d(c.date_from), c.salary]),
  );
  doc.font('Helvetica-Bold').fontSize(9).text('(b) Previous employment', x, doc.y);
  table(
    doc,
    [{ header: 'Designation', width: 0.22 }, { header: 'Department / Institution', width: 0.3 }, { header: 'From', width: 0.12 }, { header: 'To', width: 0.12 }, { header: 'Reasons for Leaving', width: 0.24 }],
    s.previous_employment.map((p) => [p.designation, p.institution, d(p.date_from), d(p.date_to), p.reason_for_leaving]),
  );

  sectionHeading(doc, '12. Commendations / Punishments');
  paragraph(doc, a.commendations_punishments || 'None');
  sectionHeading(doc, '13. Vacation of Post Notice');
  keyValues(doc, [['Served with a vacation of post notice?', yesNo(a.vacation_of_post)], ...(a.vacation_of_post ? [['Details', a.vacation_of_post_details]] : [])]);
  sectionHeading(doc, '14. Bond Violation');
  keyValues(doc, [
    ['Treated as a bond violator?', yesNo(a.bond_violator)],
    ...(a.bond_violator ? [['Bond value', a.bond_value], ['University / Institute', a.bond_institution], ['Details', a.bond_details]] : []),
  ]);
  sectionHeading(doc, '15. Extra Curricular Activities');
  paragraph(doc, a.extra_curricular || 'None');
  sectionHeading(doc, '16. Other Relevant Particulars');
  paragraph(doc, a.other_particulars || 'None');

  sectionHeading(doc, '17. Non-related Referees');
  table(
    doc,
    [{ header: 'No.', width: 24 }, { header: 'Name & Designation', width: 0.3 }, { header: 'Address', width: 0.4 }, { header: 'Telephone & Email', width: 0.3 }],
    s.referees.map((rf) => [String(rf.seq).padStart(2, '0'), [rf.name, rf.designation].filter(Boolean).join('\n'), rf.address, `${rf.telephone || ''}\n${rf.email || ''}`]),
  );

  sectionHeading(doc, 'Declaration');
  paragraph(
    doc,
    'I hereby certify that all the particulars submitted by me in this application are true and accurate. I am aware that if any of the information provided is found to be false or inaccurate, I am liable to be disqualified prior to selection or dismissed without compensation if the inaccuracy is discovered after appointment.',
  );
  keyValues(doc, [
    ['Declaration accepted', a.declaration_accepted ? 'Yes (electronically signed)' : 'No'],
    ['Signature (name of applicant)', a.declaration_name],
    ['Date', d(a.declaration_date || a.submitted_at) || '-'],
  ]);
  if (s.current_employment.length) {
    paragraph(doc, 'I hereby express my willingness to resign from the present position if I am not officially released to accept the post.');
    keyValues(doc, [['Willing to resign if not released', yesNo(a.willing_to_resign)]]);
  }

  sectionHeading(doc, 'Supporting Documents Uploaded');
  table(
    doc,
    [{ header: 'Category', width: 0.45 }, { header: 'File', width: 0.4 }, { header: 'Uploaded', width: 0.15 }],
    a.documents.map((doc2) => [DOC_CATEGORIES.find((c) => c.code === doc2.category)?.label || doc2.category, doc2.original_name, d(doc2.uploaded_at)]),
  );

  ensureSpace(doc, 120);
  sectionHeading(doc, 'To be completed by the Head of the Department (where applicable)');
  paragraph(doc, 'Vice Chancellor, University of Peradeniya. The application is hereby forwarded. Please note that if he/she is selected for the said post, he/she can be / cannot be released from service.');
  doc.moveDown(1.5);
  const sy = doc.y;
  doc.font('Helvetica').fontSize(9)
    .text('Date: ........................', x, sy)
    .text('Signature of Head of Department: ..................................', x + w / 3, sy);
  doc.moveDown(1.5);
  const sy2 = doc.y;
  doc.text('Date: ........................', x, sy2).text('Signature of Head of Institution: ..................................', x + w / 3, sy2);

  pageFooters(
    doc,
    `${a.reference_no ? `Ref: ${a.reference_no}  |  ` : ''}${getSetting(db, 'form_reference', '')}  |  ${getSetting(db, 'institution_email', '')}  |  ${getSetting(db, 'institution_phone', '')}`,
  );
  return toBuffer(doc);
}

function roman(n) {
  const map = [[100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
  let out = '';
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}
