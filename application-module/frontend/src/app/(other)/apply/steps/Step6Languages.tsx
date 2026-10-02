// src/app/(other)/apply/steps/Step6Languages.tsx
import React from "react";
import { Languages } from "lucide-react";
import { useDropdowns } from "../../../../context/DropdownContext";
import { newId } from "../normalize";
import type { LanguageProficiency } from "../types";
import { AddButton, EmptyState, Field, Grid, Notice, RepeatCard, Select, StepHeader, TextInput, listOps } from "../ui";
import type { StepProps } from "./stepProps";

const Step6Languages: React.FC<StepProps> = ({ data, update }) => {
  const { options } = useDropdowns();
  const langs = listOps(data.languageProficiency, (l) => update("languageProficiency", l));
  const used = new Set(data.languageProficiency.map((l) => l.language));

  return (
    <div className="space-y-4">
      <StepHeader
        step="languages"
        optional
        icon={<Languages size={22} />}
        subtitle="Indicate your proficiency in Sinhala, Tamil, English and any other language."
        action={
          <AddButton
            onClick={() =>
              langs.add({ id: newId(), language: "", readingLevel: "", writingLevel: "", speakingLevel: "", examPassed: "" } as LanguageProficiency)
            }
          >
            Add Language
          </AddButton>
        }
      />
      {data.languageProficiency.length === 0 && <EmptyState icon={<Languages size={36} />} text="No languages added." />}
      {data.languageProficiency.map((l, i) => (
        <RepeatCard key={l.id} index={i} label="Language" onRemove={() => langs.remove(l.id)}>
          <Grid>
            <Field label="Language" required>
              <Select
                value={l.language}
                onValue={(v) => langs.update(l.id, "language", v)}
                options={options.languages.filter((o) => o === l.language || !used.has(o))}
              />
            </Field>
            <Field label="Highest Examination Passed">
              <TextInput value={l.examPassed} onValue={(v) => langs.update(l.id, "examPassed", v)} placeholder="e.g. G.C.E. O/L, A/L, Degree" />
            </Field>
            <Field label="Reading">
              <Select value={l.readingLevel} onValue={(v) => langs.update(l.id, "readingLevel", v)} options={options.proficiencyLevels} />
            </Field>
            <Field label="Writing">
              <Select value={l.writingLevel} onValue={(v) => langs.update(l.id, "writingLevel", v)} options={options.proficiencyLevels} />
            </Field>
            <Field label="Speaking">
              <Select value={l.speakingLevel} onValue={(v) => langs.update(l.id, "speakingLevel", v)} options={options.proficiencyLevels} />
            </Field>
          </Grid>
        </RepeatCard>
      ))}
      <Notice>Language certificates (if any) can be attached in the Supporting Documents step.</Notice>
    </div>
  );
};

export default Step6Languages;
