// src/app/(other)/apply/steps/Step4ProfessionalQuals.tsx
// Every card is always expanded — the old accordion hid fields until the
// chevron was clicked, which looked like "fields not enabled".
import React from "react";
import { Award, Users } from "lucide-react";
import { newId } from "../normalize";
import type { ProfessionalMembership, ProfessionalQual } from "../types";
import {
  AddButton,
  EmptyState,
  Field,
  Grid,
  RepeatCard,
  Select,
  StepHeader,
  SubHeader,
  TextArea,
  TextInput,
  YEARS,
  listOps,
} from "../ui";
import type { StepProps } from "./stepProps";

const QUAL_TYPES = [
  "Professional Certification",
  "Professional Diploma",
  "Professional Degree",
  "Fellowship",
  "Training Program",
  "Workshop / Seminar",
  "Other",
];

const Step4ProfessionalQuals: React.FC<StepProps> = ({ data, update }) => {
  const quals = listOps(data.professionalQualifications, (l) => update("professionalQualifications", l));
  const mems = listOps(data.professionalMemberships, (l) => update("professionalMemberships", l));

  return (
    <div className="space-y-8">
      <StepHeader
        step="professional"
        optional
        icon={<Award size={22} />}
        subtitle="Professional certifications, licences, specialised training and memberships of professional bodies."
      />

      <section className="space-y-4">
        <SubHeader
          title="Professional Qualifications"
          action={
            <AddButton
              onClick={() =>
                quals.add({
                  id: newId(),
                  qualificationName: "",
                  qualificationFullName: "",
                  institution: "",
                  year: "",
                  licenseNumber: "",
                  expiryDate: "",
                  additionalNotes: "",
                } as ProfessionalQual)
              }
            >
              Add Qualification
            </AddButton>
          }
        />
        {data.professionalQualifications.length === 0 && (
          <EmptyState icon={<Award size={40} />} text="No professional qualifications added." sub="Optional." />
        )}
        {data.professionalQualifications.map((q, i) => (
          <RepeatCard key={q.id} index={i} label="Qualification" onRemove={() => quals.remove(q.id)}>
            <Grid>
              <Field label="Type">
                <Select value={q.qualificationName} onValue={(v) => quals.update(q.id, "qualificationName", v)} options={QUAL_TYPES} placeholder="Select type" />
              </Field>
              <Field label="Year Obtained">
                <Select value={q.year} onValue={(v) => quals.update(q.id, "year", v)} options={YEARS} placeholder="Select year" />
              </Field>
              <Field label="Full Name of Qualification" required full>
                <TextInput value={q.qualificationFullName} onValue={(v) => quals.update(q.id, "qualificationFullName", v)} placeholder="e.g. Chartered Accountant (CA Sri Lanka)" />
              </Field>
              <Field label="Awarding Institution / Body" required full>
                <TextInput value={q.institution} onValue={(v) => quals.update(q.id, "institution", v)} />
              </Field>
              <Field label="Licence / Registration No.">
                <TextInput value={q.licenseNumber} onValue={(v) => quals.update(q.id, "licenseNumber", v)} />
              </Field>
              <Field label="Expiry (if any)">
                <TextInput type="month" value={q.expiryDate} onValue={(v) => quals.update(q.id, "expiryDate", v)} />
              </Field>
              <Field label="Notes" full>
                <TextArea rows={2} value={q.additionalNotes} onValue={(v) => quals.update(q.id, "additionalNotes", v)} />
              </Field>
            </Grid>
          </RepeatCard>
        ))}
      </section>

      <section className="pt-6 space-y-4 border-t border-gray-200">
        <SubHeader
          title="Professional Memberships"
          icon={<Users size={18} className="text-[#800000]" />}
          subtitle="e.g. SLMA, IESL, BCS, IEEE"
          action={
            <AddButton
              variant="outline"
              onClick={() =>
                mems.add({
                  id: newId(),
                  organization: "",
                  membershipLevel: "",
                  membershipNumber: "",
                  yearJoined: "",
                  expiryDate: "",
                } as ProfessionalMembership)
              }
            >
              Add Membership
            </AddButton>
          }
        />
        {data.professionalMemberships.length === 0 && (
          <EmptyState icon={<Users size={36} />} text="No memberships added." sub="Optional." />
        )}
        {data.professionalMemberships.map((m, i) => (
          <RepeatCard key={m.id} index={i} label="Membership" onRemove={() => mems.remove(m.id)}>
            <Grid>
              <Field label="Organisation" required full>
                <TextInput value={m.organization} onValue={(v) => mems.update(m.id, "organization", v)} />
              </Field>
              <Field label="Membership Level">
                <TextInput value={m.membershipLevel} onValue={(v) => mems.update(m.id, "membershipLevel", v)} placeholder="e.g. Fellow, Member" />
              </Field>
              <Field label="Membership No.">
                <TextInput value={m.membershipNumber} onValue={(v) => mems.update(m.id, "membershipNumber", v)} />
              </Field>
              <Field label="Year Joined">
                <Select value={m.yearJoined} onValue={(v) => mems.update(m.id, "yearJoined", v)} options={YEARS} placeholder="Select year" />
              </Field>
              <Field label="Valid Until">
                <TextInput type="month" value={m.expiryDate} onValue={(v) => mems.update(m.id, "expiryDate", v)} />
              </Field>
            </Grid>
          </RepeatCard>
        ))}
      </section>
    </div>
  );
};

export default Step4ProfessionalQuals;
