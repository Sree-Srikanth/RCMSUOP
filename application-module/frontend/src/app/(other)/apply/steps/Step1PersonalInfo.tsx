// src/app/(other)/apply/steps/Step1PersonalInfo.tsx
import React from "react";
import { User } from "lucide-react";
import { useDropdowns } from "../../../../context/DropdownContext";
import { calculateAge } from "../normalize";
import type { PersonalInfo } from "../types";
import { Field, Grid, Notice, Select, StepHeader, TextInput } from "../ui";
import type { StepProps } from "./stepProps";

const TITLES = ["Prof.", "Dr.", "Mr.", "Mrs.", "Miss", "Rev."];

const Step1PersonalInfo: React.FC<StepProps> = ({ data, update }) => {
  const { options } = useDropdowns();
  const p = data.personalInfo;
  const set = <K extends keyof PersonalInfo>(field: K, value: PersonalInfo[K]) => {
    const next = { ...p, [field]: value };
    if (field === "dateOfBirth") next.age = calculateAge(String(value));
    update("personalInfo", next);
  };

  return (
    <div className="space-y-6">
      <StepHeader
        step="personal"
        icon={<User size={22} />}
        subtitle="Fill in all fields marked * exactly as they appear on your NIC."
      />

      <Grid>
        <Field label="Title" required htmlFor="title">
          <Select id="title" value={p.title} onValue={(v) => set("title", v)} options={TITLES} placeholder="Select title" />
        </Field>
        <Field label="Name with Initials" required htmlFor="nwi">
          <TextInput id="nwi" value={p.nameWithInitials} onValue={(v) => set("nameWithInitials", v)} placeholder="e.g. S. Sirikanth" />
        </Field>
        <Field label="Full Name" required full htmlFor="fullName" hint="As per NIC, in full.">
          <TextInput id="fullName" value={p.fullName} onValue={(v) => set("fullName", v)} autoComplete="name" />
        </Field>
        <Field label="Surname" required htmlFor="surname">
          <TextInput id="surname" value={p.surname} onValue={(v) => set("surname", v)} autoComplete="family-name" />
        </Field>
        <Field label="Previous Name (if any)" htmlFor="prevName">
          <TextInput id="prevName" value={p.previousName} onValue={(v) => set("previousName", v)} />
        </Field>
        <Field
          label="Date of Birth"
          required
          htmlFor="dob"
          hint={p.dateOfBirth && p.age ? `Age: ${p.age} years` : undefined}
        >
          <TextInput id="dob" type="date" value={p.dateOfBirth} onValue={(v) => set("dateOfBirth", v)} max={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Gender" required htmlFor="gender">
          <Select id="gender" value={p.gender} onValue={(v) => set("gender", v)} options={options.genders} />
        </Field>
        <Field label="Civil Status" required htmlFor="civil">
          <Select id="civil" value={p.civilStatus} onValue={(v) => set("civilStatus", v)} options={options.civilStatuses} />
        </Field>
        <Field label="Nationality" required htmlFor="nat">
          <Select id="nat" value={p.nationality} onValue={(v) => set("nationality", v)} options={options.nationalities} />
        </Field>
        {p.nationality === "Other" && (
          <Field label="Please specify nationality" required htmlFor="natOther">
            <TextInput id="natOther" value={p.nationalityOther} onValue={(v) => set("nationalityOther", v)} />
          </Field>
        )}
        <Field label="Citizenship" required htmlFor="cit">
          <Select
            id="cit"
            value={p.citizenshipType}
            onValue={(v) => set("citizenshipType", v)}
            options={["By Descent", "By Registration"]}
          />
        </Field>
        {p.citizenshipType === "By Registration" && (
          <>
            <Field label="Citizenship Registration No." htmlFor="citNo">
              <TextInput id="citNo" value={p.citizenshipRegNo} onValue={(v) => set("citizenshipRegNo", v)} />
            </Field>
            <Field label="Citizenship Registration Date" htmlFor="citDate">
              <TextInput id="citDate" type="date" value={p.citizenshipRegDate} onValue={(v) => set("citizenshipRegDate", v)} />
            </Field>
          </>
        )}
        <Field label="NIC Number" required htmlFor="nic" hint="9 digits + V/X, or 12 digits">
          <TextInput
            id="nic"
            value={p.nic}
            onValue={(v) => set("nic", v.toUpperCase().replace(/\s/g, ""))}
            placeholder="e.g. 923456987V or 200012345678"
            maxLength={12}
            autoCapitalize="characters"
          />
        </Field>
        <Field label="Passport Number" htmlFor="pp" hint="If available">
          <TextInput id="pp" value={p.passportNo} onValue={(v) => set("passportNo", v.toUpperCase())} />
        </Field>
      </Grid>

      <Notice>
        Your photograph, NIC copy, birth certificate and all other certificates are uploaded
        together in the <strong>Supporting Documents</strong> step.
      </Notice>
    </div>
  );
};

export default Step1PersonalInfo;
