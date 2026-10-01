// src/app/(other)/apply/steps/Step7Experience.tsx
import React from "react";
import { Briefcase, Star } from "lucide-react";
import { newId } from "../normalize";
import type { Experience } from "../types";
import { AddButton, EmptyState, Field, Grid, RepeatCard, StepHeader, SubHeader, TextArea, TextInput, listOps } from "../ui";
import type { StepProps } from "./stepProps";

const blankExperience = (current: boolean): Experience => ({
  id: newId(),
  designation: "",
  institution: "",
  fromDate: "",
  toDate: "",
  currentPosition: current,
  responsibilities: "",
  salary: "",
  reasonForLeaving: "",
});

const Step7Experience: React.FC<StepProps> = ({ data, update }) => {
  const list = data.professionalExperience;
  const ops = listOps(list, (l) => update("professionalExperience", l));
  const present = list.find((x) => x.currentPosition);
  const previous = list.filter((x) => !x.currentPosition);

  const form = (x: Experience, isPresent: boolean) => (
    <Grid>
      <Field label="Designation / Post" required>
        <TextInput value={x.designation} onValue={(v) => ops.update(x.id, "designation", v)} placeholder="e.g. Senior Lecturer" />
      </Field>
      <Field label="Institution / Organisation" required>
        <TextInput value={x.institution} onValue={(v) => ops.update(x.id, "institution", v)} />
      </Field>
      <Field label="From" required>
        <TextInput type="month" value={x.fromDate} onValue={(v) => ops.update(x.id, "fromDate", v)} />
      </Field>
      {isPresent ? (
        <Field label="To">
          <div className="flex items-center min-h-[44px] px-3 text-sm text-gray-600 rounded-lg bg-gray-50">To date (present)</div>
        </Field>
      ) : (
        <Field label="To" required>
          <TextInput type="month" value={x.toDate} onValue={(v) => ops.update(x.id, "toDate", v)} min={x.fromDate || undefined} />
        </Field>
      )}
      <Field label="Duties & Responsibilities" full>
        <TextArea rows={3} value={x.responsibilities} onValue={(v) => ops.update(x.id, "responsibilities", v)} />
      </Field>
      <Field label="Monthly Salary (optional)">
        <TextInput value={x.salary} onValue={(v) => ops.update(x.id, "salary", v)} placeholder="e.g. LKR 120,000" />
      </Field>
      {!isPresent && (
        <Field label="Reason for Leaving">
          <TextInput value={x.reasonForLeaving} onValue={(v) => ops.update(x.id, "reasonForLeaving", v)} />
        </Field>
      )}
    </Grid>
  );

  return (
    <div className="space-y-8">
      <StepHeader
        step="experience"
        optional
        icon={<Briefcase size={22} />}
        subtitle="Your present occupation first, then previous employment (most recent first)."
      />

      <section className="space-y-4">
        <SubHeader
          title="Present Occupation"
          icon={<Star size={18} className="text-[#800000]" />}
          action={!present && <AddButton onClick={() => ops.add(blankExperience(true))}>Add Present Occupation</AddButton>}
        />
        {present ? (
          <RepeatCard index={0} label="Present Occupation" highlight onRemove={() => ops.remove(present.id)}>
            {form(present, true)}
          </RepeatCard>
        ) : (
          <EmptyState icon={<Star size={32} />} text="No present occupation." sub="Leave empty if you are not currently employed." />
        )}
      </section>

      <section className="space-y-4">
        <SubHeader
          title="Previous Employment"
          icon={<Briefcase size={18} className="text-gray-600" />}
          action={
            <AddButton variant="outline" onClick={() => ops.add(blankExperience(false))}>
              Add Previous Employment
            </AddButton>
          }
        />
        {previous.length === 0 && <EmptyState icon={<Briefcase size={32} />} text="No previous employment added." />}
        {previous.map((x, i) => (
          <RepeatCard key={x.id} index={i} label="Previous Employment" onRemove={() => ops.remove(x.id)}>
            {form(x, false)}
          </RepeatCard>
        ))}
      </section>
    </div>
  );
};

export default Step7Experience;
