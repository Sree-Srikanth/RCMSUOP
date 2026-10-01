// src/app/(other)/apply/ApplicationPrintForm.tsx
// The official A4 application form. Rendered off-screen and converted to PDF
// on submit (emailed to the applicant and the referees), and used for
// "Download PDF" / "Print". Inline styles on purpose: html2canvas ignores
// most Tailwind utilities that depend on CSS variables.
import React from "react";
import { fileUrl } from "../../../services/applicationApi";
import { buildDocumentChecklist } from "./documents";
import { pruneBlankEntries } from "./normalize";
import { stepNumber } from "./steps";
import type { ApplicationData } from "./types";

const val = (v?: string | number | null | boolean) =>
  v === null || v === undefined || v === "" ? "—" : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);

const S = {
  page: {
    fontFamily: "'Times New Roman', Times, serif",
    color: "#111",
    background: "#fff",
    width: "194mm",
    margin: "0 auto",
    fontSize: "9.5pt",
    lineHeight: 1.35,
  } as React.CSSProperties,
  banner: {
    background: "#7a0000",
    color: "#fff",
    fontWeight: 700,
    fontSize: "9pt",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "4px 10px",
    marginTop: "14px",
    pageBreakAfter: "avoid",
  } as React.CSSProperties,
  sub: {
    background: "#f5e8e8",
    color: "#7a0000",
    fontWeight: 700,
    fontSize: "8.5pt",
    padding: "3px 8px",
    marginTop: "8px",
    borderLeft: "3px solid #7a0000",
  } as React.CSSProperties,
  tbl: { width: "100%", borderCollapse: "collapse", fontSize: "9pt", marginTop: "1px" } as React.CSSProperties,
  th: {
    background: "#e8d5d5",
    border: "1px solid #b89090",
    padding: "3px 6px",
    textAlign: "left",
    fontWeight: 700,
    fontSize: "8.5pt",
  } as React.CSSProperties,
  td: { border: "1px solid #ccaaaa", padding: "3px 6px", verticalAlign: "top" } as React.CSSProperties,
  none: { padding: "4px 8px", fontStyle: "italic", fontSize: "8.5pt", color: "#888" } as React.CSSProperties,
};
const lbl: React.CSSProperties = { ...S.td, background: "#fdf5f5", fontWeight: 600, color: "#444", width: "24%" };
const zebra = (i: number) => (i % 2 ? { background: "#fdf5f5" } : undefined);

const Table: React.FC<{ head: string[]; rows: Array<Array<React.ReactNode>> }> = ({ head, rows }) =>
  rows.length ? (
    <table style={S.tbl}>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} style={S.th}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={zebra(i)}>
            {r.map((c, j) => (
              <td key={j} style={S.td}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p style={S.none}>None provided.</p>
  );

const PG_TYPE: Record<string, string> = {
  coursework: "Coursework",
  research: "Research",
  coursework_research: "Coursework & Research",
};

interface Props {
  data: ApplicationData;
  logoSrc?: string;
}

const ApplicationPrintForm = React.forwardRef<HTMLDivElement, Props>(({ data: raw, logoSrc = "/logo.png" }, ref) => {
  const data = pruneBlankEntries(raw);
  const p = data.personalInfo;
  const c = data.contactInfo;
  const d = data.declaration;
  const ed = d.employmentDeclarations;
  const photo = data.documents.profile_photo?.path;
  const n = stepNumber;
  const attached = buildDocumentChecklist(data).filter((r) => data.documents[r.key]);

  return (
    <div ref={ref} style={S.page}>
      {/* ── Letterhead ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "10px" }}>
        <img src={logoSrc} alt="" crossOrigin="anonymous" style={{ width: "70px", height: "70px", objectFit: "contain" }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "14pt", fontWeight: 900, color: "#7a0000", textTransform: "uppercase" }}>
            University of Peradeniya
          </h1>
          <p style={{ margin: "0 0 6px", fontSize: "11pt", fontWeight: 700, color: "#7a0000" }}>Sri Lanka</p>
          <p style={{ margin: 0, fontSize: "11pt", fontWeight: 700 }}>
            APPLICATION FOR THE POST OF: <span style={{ fontWeight: 400 }}>{val(data.vacancy_title)}</span>
          </p>
          {data.selectedJob && (
            <p style={{ margin: "2px 0 0", fontSize: "10.5pt", fontWeight: 700, color: "#7a0000" }}>
              POSITION APPLIED FOR: {data.selectedJob}
            </p>
          )}
          <p style={{ margin: "4px 0 0", fontSize: "9.5pt" }}>
            <b>Faculty:</b> {val(data.faculty)} &nbsp; <b>Department:</b> {val(data.department)}
            {data.discipline ? (
              <>
                {" "}
                &nbsp; <b>Discipline:</b> {data.discipline}
              </>
            ) : null}
          </p>
        </div>
        <div style={{ border: "1px solid #b89090", padding: "6px 8px", fontSize: "8.5pt", minWidth: "48mm" }}>
          <div>
            <b>Application Ref. No.</b>
          </div>
          <div style={{ fontSize: "11pt", fontWeight: 700, color: "#7a0000" }}>{val(data.reference_no)}</div>
          <div style={{ marginTop: "4px" }}>
            <b>Advertisement Ref.:</b> {val(data.vacancy_reference_no)}
          </div>
          {data.submitted_at && (
            <div>
              <b>Submitted:</b> {data.submitted_at}
            </div>
          )}
        </div>
      </div>
      <hr style={{ border: "none", borderTop: "1.5px solid #7a0000", margin: "0 0 6px" }} />

      {/* ── 1 Personal ── */}
      <div style={S.banner}>Section {n("personal")} — Personal Information</div>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <table style={{ ...S.tbl, flex: 1 }}>
          <tbody>
            <tr>
              <td style={lbl}>Title</td>
              <td style={S.td}>{val(p.title)}</td>
              <td style={lbl}>Name with Initials</td>
              <td style={S.td}>{val(p.nameWithInitials)}</td>
            </tr>
            <tr>
              <td style={lbl}>Full Name</td>
              <td style={{ ...S.td, textTransform: "uppercase", fontWeight: 700 }} colSpan={3}>
                {val(p.fullName)}
              </td>
            </tr>
            <tr>
              <td style={lbl}>Surname</td>
              <td style={S.td}>{val(p.surname)}</td>
              <td style={lbl}>Previous Name</td>
              <td style={S.td}>{val(p.previousName)}</td>
            </tr>
            <tr>
              <td style={lbl}>Date of Birth</td>
              <td style={S.td}>{val(p.dateOfBirth)}</td>
              <td style={lbl}>Age</td>
              <td style={S.td}>{val(p.age || "")}</td>
            </tr>
            <tr>
              <td style={lbl}>Gender</td>
              <td style={S.td}>{val(p.gender)}</td>
              <td style={lbl}>Civil Status</td>
              <td style={S.td}>{val(p.civilStatus)}</td>
            </tr>
            <tr>
              <td style={lbl}>Nationality</td>
              <td style={S.td}>{val(p.nationality === "Other" ? p.nationalityOther : p.nationality)}</td>
              <td style={lbl}>Citizenship</td>
              <td style={S.td}>
                {val(p.citizenshipType)}
                {p.citizenshipType === "By Registration" && p.citizenshipRegNo ? ` (${p.citizenshipRegNo}, ${val(p.citizenshipRegDate)})` : ""}
              </td>
            </tr>
            <tr>
              <td style={lbl}>NIC No.</td>
              <td style={S.td}>{val(p.nic)}</td>
              <td style={lbl}>Passport No.</td>
              <td style={S.td}>{val(p.passportNo)}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ border: "1px solid #b89090", width: "30mm", height: "38mm", flexShrink: 0, background: "#fdf5f5" }}>
          {photo ? (
            <img src={fileUrl(photo)} crossOrigin="anonymous" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <p style={{ fontSize: "7pt", color: "#999", textAlign: "center", marginTop: "14mm" }}>Photograph</p>
          )}
        </div>
      </div>

      {/* ── 2 Contact ── */}
      <div style={S.banner}>Section {n("contact")} — Contact Information</div>
      <table style={S.tbl}>
        <tbody>
          <tr>
            <td style={lbl}>Permanent Address</td>
            <td style={S.td} colSpan={3}>
              {[c.permanentAddress, c.permanentCity, c.permanentDistrict, c.permanentProvince, c.permanentPostalCode].filter(Boolean).join(", ") || "—"}
            </td>
          </tr>
          <tr>
            <td style={lbl}>Postal Address</td>
            <td style={S.td} colSpan={3}>
              {[c.address, c.city, c.district, c.province, c.postalCode].filter(Boolean).join(", ") || "—"}
            </td>
          </tr>
          <tr>
            <td style={lbl}>Mobile</td>
            <td style={S.td}>{val(c.phoneMobile)}</td>
            <td style={lbl}>Email</td>
            <td style={S.td}>{val(c.email)}</td>
          </tr>
          <tr>
            <td style={lbl}>Home Phone</td>
            <td style={S.td}>{val(c.phoneHome)}</td>
            <td style={lbl}>Office Phone</td>
            <td style={S.td}>{val(c.phoneOffice)}</td>
          </tr>
          <tr>
            <td style={lbl}>Emergency Contact</td>
            <td style={S.td} colSpan={3}>
              {[c.emergencyName, c.emergencyRelation, c.emergencyPhone].filter(Boolean).join(" · ") || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 3 Education ── */}
      <div style={S.banner}>Section {n("education")} — Educational Qualifications</div>
      <div style={S.sub}>{n("education")}.1 University Education</div>
      <Table
        head={["Degree / Diploma", "University", "Period", "Course", "Final Exam", "Class / Results", "GPA"]}
        rows={data.universityEducation.map((e) => [
          val(e.degreeName),
          val(e.university),
          `${e.fromYear || "—"} – ${e.toYear || "—"}`,
          val(e.courseFollowed),
          val(e.finalExamDate),
          val(e.classGrade || e.results),
          val(e.gpa),
        ])}
      />
      <div style={S.sub}>{n("education")}.2 Postgraduate Qualifications</div>
      <Table
        head={["Qualification", "University", "Type", "Duration", "SLQF", "Effective Date"]}
        rows={data.postgraduateQualifications.map((e) => [
          val(e.qualificationName),
          val(e.university),
          PG_TYPE[e.type] || val(e.type),
          val(e.duration),
          val(e.slqfLevel),
          val(e.effectiveDate),
        ])}
      />
      {data.boardCertifications.length > 0 && (
        <>
          <div style={S.sub}>{n("education")}.3 Board Certification</div>
          <Table
            head={["Board", "Certified", "Date"]}
            rows={data.boardCertifications.map((e) => [val(e.boardName), val(e.isCertified), val(e.certificationDate)])}
          />
        </>
      )}
      {data.academicDistinctions.length > 0 && (
        <>
          <div style={S.sub}>{n("education")}.4 Academic Distinctions, Scholarships, Medals, Prizes</div>
          <Table
            head={["Award", "Institution", "Year"]}
            rows={data.academicDistinctions.map((e) => [val(e.awardName), val(e.institution), val(e.yearReceived)])}
          />
        </>
      )}

      {/* ── 4 Professional ── */}
      <div style={S.banner}>Section {n("professional")} — Professional Qualifications & Memberships</div>
      <Table
        head={["Qualification", "Awarding Body", "Year", "Licence No.", "Expiry"]}
        rows={data.professionalQualifications.map((q) => [
          val(q.qualificationFullName || q.qualificationName),
          val(q.institution),
          val(q.year),
          val(q.licenseNumber),
          val(q.expiryDate),
        ])}
      />
      {data.professionalMemberships.length > 0 && (
        <>
          <div style={S.sub}>Memberships</div>
          <Table
            head={["Organisation", "Level", "Membership No.", "Since"]}
            rows={data.professionalMemberships.map((m) => [val(m.organization), val(m.membershipLevel), val(m.membershipNumber), val(m.yearJoined)])}
          />
        </>
      )}

      {/* ── 5 Research ── */}
      <div style={S.banner}>Section {n("research")} — Research & Publications</div>
      <div style={S.sub}>Journal Articles</div>
      <Table
        head={["Title", "Authors", "Journal", "Year", "Vol(Issue):Pages", "DOI"]}
        rows={data.researchPublications.journals.map((j) => [
          val(j.articleTitle),
          val(j.authors),
          val(j.journalName),
          val(j.year),
          `${j.volume || ""}${j.issue ? `(${j.issue})` : ""}${j.pages ? `:${j.pages}` : ""}` || "—",
          val(j.doi),
        ])}
      />
      <div style={S.sub}>Conference Abstracts</div>
      <Table
        head={["Title", "Authors", "Conference", "Date", "Location"]}
        rows={data.researchPublications.conferences.map((x) => [val(x.abstractTitle), val(x.authors), val(x.conferenceName), val(x.conferenceDate), val(x.location)])}
      />
      <div style={S.sub}>Books / Chapters</div>
      <Table
        head={["Title", "Authors", "Published", "ISBN"]}
        rows={data.researchPublications.books.map((b) => [val(b.bookName), val(b.authors), val(b.publicationDate), val(b.isbn)])}
      />

      {/* ── 6 Languages ── */}
      <div style={S.banner}>Section {n("languages")} — Language Proficiency</div>
      <Table
        head={["Language", "Reading", "Writing", "Speaking", "Highest Exam Passed"]}
        rows={data.languageProficiency.map((l) => [val(l.language), val(l.readingLevel), val(l.writingLevel), val(l.speakingLevel), val(l.examPassed)])}
      />

      {/* ── 7 Experience ── */}
      <div style={S.banner}>Section {n("experience")} — Professional Experience</div>
      <Table
        head={["Designation", "Institution", "From", "To", "Salary", "Duties / Reason for leaving"]}
        rows={[...data.professionalExperience]
          .sort((a, b) => Number(b.currentPosition) - Number(a.currentPosition))
          .map((x) => [
            <>
              {val(x.designation)}
              {x.currentPosition && <b> (Present)</b>}
            </>,
            val(x.institution),
            val(x.fromDate),
            x.currentPosition ? "To date" : val(x.toDate),
            val(x.salary),
            [x.responsibilities, x.reasonForLeaving && `Left: ${x.reasonForLeaving}`].filter(Boolean).join(" — ") || "—",
          ])}
      />

      {/* ── 8 Activities ── */}
      <div style={S.banner}>Section {n("activities")} — Extra-Curricular Activities & Other Particulars</div>
      <Table
        head={["Activity", "Level", "Year", "Description"]}
        rows={data.extraCurricular.map((a) => [val(a.activityName), val(a.level), val(a.year), val(a.description)])}
      />
      {data.additionalInfo && (
        <p style={{ ...S.td, border: "1px solid #ccaaaa", whiteSpace: "pre-wrap", marginTop: "4px" }}>
          <b>Other relevant particulars: </b>
          {data.additionalInfo}
        </p>
      )}

      {/* ── 9 Referees ── */}
      <div style={S.banner}>Section {n("referees")} — Referees</div>
      <Table
        head={["Name", "Designation", "Institution", "Address", "Telephone", "Email"]}
        rows={data.referees.map((r) => [val(r.name), val(r.designation), val(r.institution), val(r.address), val(r.phone), val(r.email)])}
      />

      {/* ── 10 Documents ── */}
      <div style={S.banner}>Section {n("documents")} — Supporting Documents Attached</div>
      {attached.length || data.otherDocuments.length ? (
        <ol style={{ margin: "4px 0 0 18px", padding: 0, fontSize: "9pt" }}>
          {attached.map((r) => (
            <li key={r.key}>{r.label}</li>
          ))}
          {data.otherDocuments.map((o, i) => (
            <li key={`o${i}`}>Other: {o.name}</li>
          ))}
        </ol>
      ) : (
        <p style={S.none}>None.</p>
      )}

      {/* ── 11 Declaration ── */}
      <div style={{ ...S.banner, pageBreakBefore: "auto" }}>Section {n("declaration")} — Declaration</div>
      <table style={S.tbl}>
        <tbody>
          {[
            ["Received commendations from any employer?", ed.hasCommendations, ed.commendationsDetails],
            ["Received punishments / disciplinary action?", ed.hasPunishments, ed.punishmentsDetails],
            [
              "Served a vacation-of-post notice?",
              ed.hasVacationNotice,
              [ed.vacationNoticeInstitution, ed.vacationNoticeDate, ed.vacationNoticeDetails].filter(Boolean).join(" — "),
            ],
            [
              "Treated as a bond violator?",
              ed.isBondViolator,
              [
                ed.bondViolationDetails.institution,
                ed.bondViolationDetails.bondValue && `LKR ${ed.bondViolationDetails.bondValue}`,
                ed.bondViolationDetails.violationDate,
                ed.bondViolationDetails.remarks,
              ]
                .filter(Boolean)
                .join(" — "),
            ],
            ["Willing to resign if not released from present post?", d.willingnessToResign, ""],
          ].map(([q, yes, details], i) => (
            <tr key={i}>
              <td style={{ ...lbl, width: "46%" }}>{q as string}</td>
              <td style={{ ...S.td, width: "8%", textAlign: "center", fontWeight: 700 }}>{yes ? "YES" : "NO"}</td>
              <td style={S.td}>{yes && details ? (details as string) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ border: "1px solid #b89090", background: "#fff9f9", padding: "10px 14px", marginTop: "8px", pageBreakInside: "avoid" }}>
        <p style={{ fontSize: "9pt", fontStyle: "italic", textAlign: "justify", margin: "0 0 8px" }}>
          I hereby certify that all the particulars submitted by me in this application are true and accurate. I am aware
          that if any of the information is found to be false or inaccurate, I am liable to be disqualified prior to
          selection or dismissed without compensation if the inaccuracy is discovered after appointment.
        </p>
        <p style={{ margin: "0 0 10px", fontWeight: 700 }}>
          Declaration agreed: <span style={{ color: d.agreed ? "#166534" : "#991b1b" }}>{d.agreed ? "YES" : "NO"}</span>
        </p>
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            [<span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#1a3080", fontSize: "12pt" }}>{d.signature}</span>, "Signature of Applicant"],
            [d.date, "Date"],
            [p.nameWithInitials, "Name"],
          ].map(([v, l], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderBottom: "1.5px solid #333", minHeight: "28px", paddingBottom: "2px", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                {v}
              </div>
              <p style={{ fontSize: "7.5pt", color: "#777", textTransform: "uppercase", marginTop: "3px" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Forwarding (official use) ── */}
      <div style={{ border: "1px solid #b89090", padding: "10px 14px", marginTop: "12px", background: "#f9f9f9", pageBreakInside: "avoid" }}>
        <p style={{ fontWeight: 900, textTransform: "uppercase", fontSize: "9pt", margin: "0 0 6px" }}>
          For applicants in service — to be forwarded through the Head of Institution
        </p>
        <p style={{ fontSize: "8.5pt", fontStyle: "italic", color: "#555", margin: "0 0 18px" }}>
          The application of the above named is forwarded. If selected, he/she <b>can / cannot</b> be released from
          present service.
        </p>
        <div style={{ display: "flex", gap: "16px" }}>
          {["Signature — Head of Department", "Date", "Signature — Head of Institution", "Date"].map((l, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ borderBottom: "1px solid #999", height: "30px" }} />
              <p style={{ fontSize: "7pt", color: "#999", textTransform: "uppercase", marginTop: "3px" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "8px", borderTop: "1px solid #ddd", paddingTop: "4px", display: "flex", justifyContent: "space-between", fontSize: "7.5pt", color: "#999" }}>
        <span>University of Peradeniya — Confidential</span>
        <span>Ref. No.: {val(data.reference_no)}</span>
      </div>
    </div>
  );
});

ApplicationPrintForm.displayName = "ApplicationPrintForm";
export default ApplicationPrintForm;
