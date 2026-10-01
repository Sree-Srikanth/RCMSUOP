// src/app/(other)/apply/steps/Step3Education.tsx
import React, { useState } from "react";
import { GraduationCap, BookOpen, Stethoscope, Medal } from "lucide-react";
import { useDropdowns } from "../../../../context/DropdownContext";
import { newId } from "../normalize";
import type {
  AcademicDistinction,
  BoardCertification,
  PostgraduateQualification,
  UniversityEducation,
} from "../types";
import {
  AddButton,
  Checkbox,
  EmptyState,
  Field,
  Grid,
  Notice,
  RepeatCard,
  Select,
  StepHeader,
  SubHeader,
  Tabs,
  TextInput,
  listOps,
} from "../ui";
import type { StepProps } from "./stepProps";

const PG_TYPES = [
  { value: "coursework", label: "Coursework" },
  { value: "research", label: "Research" },
  { value: "coursework_research", label: "Coursework & Research" },
];

const Step3Education: React.FC<StepProps> = ({ data, update }) => {
  const { options } = useDropdowns();
  const [tab, setTab] = useState("university");

  const uni = listOps(data.universityEducation, (l) => update("universityEducation", l));
  const pg = listOps(data.postgraduateQualifications, (l) => update("postgraduateQualifications", l));
  const board = listOps(data.boardCertifications, (l) => update("boardCertifications", l));
  const dist = listOps(data.academicDistinctions, (l) => update("academicDistinctions", l));

  return (
    <div>
      <StepHeader
        step="education"
        icon={<GraduationCap size={22} />}
        subtitle="University education is required. Postgraduate, board certification and distinctions are optional."
      />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "university", label: "University", count: data.universityEducation.length, icon: <GraduationCap size={16} /> },
          { id: "postgraduate", label: "Postgraduate", count: data.postgraduateQualifications.length, icon: <BookOpen size={16} /> },
          { id: "board", label: "Board Certification", count: data.boardCertifications.length, icon: <Stethoscope size={16} /> },
          { id: "distinctions", label: "Distinctions", count: data.academicDistinctions.length, icon: <Medal size={16} /> },
        ]}
      />

      {tab === "university" && (
        <section className="space-y-4">
          <SubHeader
            title="University Education"
            subtitle="Degrees, diplomas etc."
            action={
              <AddButton
                onClick={() =>
                  uni.add({
                    id: newId(),
                    degreeName: "",
                    university: "",
                    fromYear: "",
                    toYear: "",
                    courseFollowed: "",
                    finalExamDate: "",
                    results: "",
                    classGrade: "",
                    gpa: "",
                  } as UniversityEducation)
                }
              >
                Add Degree / Diploma
              </AddButton>
            }
          />
          {data.universityEducation.length === 0 && (
            <EmptyState icon={<GraduationCap size={40} />} text="No degree added yet." sub="At least one is required." />
          )}
          {data.universityEducation.map((e, i) => (
            <RepeatCard key={e.id} index={i} label="Degree / Diploma" onRemove={() => uni.remove(e.id)}>
              <Grid>
                <Field label="Degree / Diploma Name" required full>
                  <TextInput value={e.degreeName} onValue={(v) => uni.update(e.id, "degreeName", v)} placeholder="e.g. MBBS, BSc (Hons) in Computer Science" />
                </Field>
                <Field label="University / Institution" required full>
                  <TextInput value={e.university} onValue={(v) => uni.update(e.id, "university", v)} />
                </Field>
                <Field label="From (Year)">
                  <TextInput inputMode="numeric" maxLength={4} value={e.fromYear} onValue={(v) => uni.update(e.id, "fromYear", v.replace(/\D/g, ""))} placeholder="YYYY" />
                </Field>
                <Field label="To (Year)">
                  <TextInput inputMode="numeric" maxLength={4} value={e.toYear} onValue={(v) => uni.update(e.id, "toYear", v.replace(/\D/g, ""))} placeholder="YYYY" />
                </Field>
                <Field label="Course Followed / Subjects" full>
                  <TextInput value={e.courseFollowed} onValue={(v) => uni.update(e.id, "courseFollowed", v)} />
                </Field>
                <Field label="Final Examination Date">
                  <TextInput type="date" value={e.finalExamDate} onValue={(v) => uni.update(e.id, "finalExamDate", v)} />
                </Field>
                <Field label="Class / Grade">
                  <Select value={e.classGrade} onValue={(v) => uni.update(e.id, "classGrade", v)} options={options.classGrades} />
                </Field>
                <Field label="Results">
                  <TextInput value={e.results} onValue={(v) => uni.update(e.id, "results", v)} placeholder="e.g. Second Class (Upper)" />
                </Field>
                <Field label="GPA (if applicable)">
                  <TextInput value={e.gpa} onValue={(v) => uni.update(e.id, "gpa", v)} placeholder="e.g. 3.70 / 4.00" />
                </Field>
              </Grid>
            </RepeatCard>
          ))}
        </section>
      )}

      {tab === "postgraduate" && (
        <section className="space-y-4">
          <SubHeader
            title="Postgraduate Qualifications"
            optional
            subtitle="Skip this if you have none — you can continue to the next step."
            action={
              <AddButton
                onClick={() =>
                  pg.add({
                    id: newId(),
                    qualificationName: "",
                    university: "",
                    type: "coursework",
                    duration: "",
                    effectiveDate: "",
                    slqfLevel: "",
                  } as PostgraduateQualification)
                }
              >
                Add Postgraduate Qualification
              </AddButton>
            }
          />
          {data.postgraduateQualifications.length === 0 && (
            <EmptyState icon={<BookOpen size={40} />} text="No postgraduate qualifications." sub="Optional — leave empty if not applicable." />
          )}
          {data.postgraduateQualifications.map((e, i) => (
            <RepeatCard key={e.id} index={i} label="Postgraduate" onRemove={() => pg.remove(e.id)}>
              <Grid>
                <Field label="Qualification Name" required full>
                  <TextInput value={e.qualificationName} onValue={(v) => pg.update(e.id, "qualificationName", v)} placeholder="e.g. MPhil, PhD, MSc" />
                </Field>
                <Field label="University / Institution" required full>
                  <TextInput value={e.university} onValue={(v) => pg.update(e.id, "university", v)} />
                </Field>
                <Field label="Type">
                  <Select value={e.type} onValue={(v) => pg.update(e.id, "type", (v || "coursework") as PostgraduateQualification["type"])} options={PG_TYPES} placeholder="Select type" />
                </Field>
                <Field label="Duration">
                  <TextInput value={e.duration} onValue={(v) => pg.update(e.id, "duration", v)} placeholder="e.g. 2 years" />
                </Field>
                <Field label="SLQF Level" hint="Sri Lanka Qualifications Framework">
                  <Select value={e.slqfLevel} onValue={(v) => pg.update(e.id, "slqfLevel", v)} options={options.slqfLevels} />
                </Field>
                <Field label="Effective Date">
                  <TextInput type="date" value={e.effectiveDate} onValue={(v) => pg.update(e.id, "effectiveDate", v)} />
                </Field>
              </Grid>
            </RepeatCard>
          ))}
        </section>
      )}

      {tab === "board" && (
        <section className="space-y-4">
          <SubHeader
            title="Board Certification"
            optional
            subtitle="MBBS / BDS graduates only."
            action={
              <AddButton
                onClick={() =>
                  board.add({ id: newId(), isCertified: true, boardName: "", certificationDate: "" } as BoardCertification)
                }
              >
                Add Board Certification
              </AddButton>
            }
          />
          {data.boardCertifications.length === 0 && (
            <EmptyState icon={<Stethoscope size={40} />} text="No board certification added." sub="Optional." />
          )}
          {data.boardCertifications.map((e, i) => (
            <RepeatCard key={e.id} index={i} label="Board Certification" onRemove={() => board.remove(e.id)}>
              <div className="mb-3">
                <Checkbox checked={e.isCertified} onChange={(v) => board.update(e.id, "isCertified", v)} label="I am board certified" />
              </div>
              {e.isCertified && (
                <Grid>
                  <Field label="Board Name">
                    <TextInput value={e.boardName} onValue={(v) => board.update(e.id, "boardName", v)} placeholder="e.g. PGIM Board of Study in Surgery" />
                  </Field>
                  <Field label="Certification Date">
                    <TextInput type="date" value={e.certificationDate} onValue={(v) => board.update(e.id, "certificationDate", v)} />
                  </Field>
                </Grid>
              )}
            </RepeatCard>
          ))}
        </section>
      )}

      {tab === "distinctions" && (
        <section className="space-y-4">
          <SubHeader
            title="Academic Distinctions, Scholarships, Medals, Prizes"
            optional
            action={
              <AddButton
                onClick={() =>
                  dist.add({ id: newId(), awardName: "", institution: "", yearReceived: "" } as AcademicDistinction)
                }
              >
                Add Distinction
              </AddButton>
            }
          />
          {data.academicDistinctions.length === 0 && (
            <EmptyState icon={<Medal size={40} />} text="No distinctions added." sub="Optional." />
          )}
          {data.academicDistinctions.map((e, i) => (
            <RepeatCard key={e.id} index={i} label="Distinction" onRemove={() => dist.remove(e.id)}>
              <Grid>
                <Field label="Award / Distinction" required full>
                  <TextInput value={e.awardName} onValue={(v) => dist.update(e.id, "awardName", v)} placeholder="e.g. University Gold Medal" />
                </Field>
                <Field label="Awarding Institution">
                  <TextInput value={e.institution} onValue={(v) => dist.update(e.id, "institution", v)} />
                </Field>
                <Field label="Year">
                  <TextInput inputMode="numeric" maxLength={4} value={e.yearReceived} onValue={(v) => dist.update(e.id, "yearReceived", v.replace(/\D/g, ""))} placeholder="YYYY" />
                </Field>
              </Grid>
            </RepeatCard>
          ))}
        </section>
      )}

      <div className="mt-6">
        <Notice>Certificates for each qualification are uploaded in the Supporting Documents step.</Notice>
      </div>
    </div>
  );
};

export default Step3Education;
