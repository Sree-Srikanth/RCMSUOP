// src/app/(other)/apply/steps/Step9Referees.tsx
import React, { useEffect } from "react";
import { Users, Mail } from "lucide-react";
import { newId } from "../normalize";
import type { Referee } from "../types";
import { AddButton, Field, Grid, Notice, RepeatCard, StepHeader, TextArea, TextInput, listOps } from "../ui";
import type { StepProps } from "./stepProps";

const MIN = 2;
const MAX = 3;

const blankReferee = (): Referee => ({
  id: newId(),
  name: "",
  designation: "",
  institution: "",
  address: "",
  phone: "",
  email: "",
});

const Step9Referees: React.FC<StepProps> = ({ data, update, readOnly }) => {
  const ops = listOps(data.referees, (l) => update("referees", l));

  // Always show the two mandatory referee slots.
  useEffect(() => {
    if (!readOnly && data.referees.length < MIN) {
      update("referees", (prev) => [
        ...prev,
        ...Array.from({ length: MIN - prev.length }, blankReferee),
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.referees.length, readOnly]);

  return (
    <div className="space-y-4">
      <StepHeader
        step="referees"
        icon={<Users size={22} />}
        subtitle={`Names and contact details of ${MIN} non-related referees (maximum ${MAX}).`}
        action={
          data.referees.length < MAX && (
            <AddButton variant="outline" onClick={() => ops.add(blankReferee())}>
              Add Referee ({data.referees.length}/{MAX})
            </AddButton>
          )
        }
      />

      <Notice>
        <span className="inline-flex items-start gap-1">
          <Mail size={16} className="shrink-0 mt-0.5" />
          When you submit, each referee is emailed a notification with your details and a copy of
          your application. Please make sure their email addresses are correct.
        </span>
      </Notice>

      {data.referees.map((r, i) => (
        <RepeatCard
          key={r.id}
          index={i}
          label="Referee"
          onRemove={data.referees.length > MIN ? () => ops.remove(r.id) : undefined}
        >
          <Grid>
            <Field label="Full Name" required full>
              <TextInput value={r.name} onValue={(v) => ops.update(r.id, "name", v)} placeholder="e.g. Prof. A. B. Perera" />
            </Field>
            <Field label="Designation" required>
              <TextInput value={r.designation} onValue={(v) => ops.update(r.id, "designation", v)} />
            </Field>
            <Field label="Institution / Department" required>
              <TextInput value={r.institution} onValue={(v) => ops.update(r.id, "institution", v)} />
            </Field>
            <Field label="Postal Address" full>
              <TextArea rows={2} value={r.address} onValue={(v) => ops.update(r.id, "address", v)} />
            </Field>
            <Field label="Telephone" required>
              <TextInput type="tel" inputMode="tel" value={r.phone} onValue={(v) => ops.update(r.id, "phone", v)} />
            </Field>
            <Field label="Email" required>
              <TextInput type="email" inputMode="email" value={r.email} onValue={(v) => ops.update(r.id, "email", v.trim())} />
            </Field>
          </Grid>
        </RepeatCard>
      ))}
    </div>
  );
};

export default Step9Referees;
