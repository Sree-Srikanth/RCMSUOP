// src/app/(other)/apply/steps/Step8ExtraCurricular.tsx
import React from "react";
import { Trophy, FilePlus } from "lucide-react";
import { useDropdowns } from "../../../../context/DropdownContext";
import { newId } from "../normalize";
import type { ExtraCurricular } from "../types";
import { AddButton, EmptyState, Field, Grid, RepeatCard, Select, StepHeader, SubHeader, TextArea, TextInput, listOps } from "../ui";
import type { StepProps } from "./stepProps";

const Step8ExtraCurricular: React.FC<StepProps> = ({ data, update }) => {
  const { options } = useDropdowns();
  const ops = listOps(data.extraCurricular, (l) => update("extraCurricular", l));

  return (
    <div className="space-y-8">
      <StepHeader
        step="activities"
        optional
        icon={<Trophy size={22} />}
        subtitle="Sports, cultural activities, leadership roles, community service, etc."
        action={
          <AddButton
            onClick={() => ops.add({ id: newId(), activityName: "", level: "", year: "", description: "" } as ExtraCurricular)}
          >
            Add Activity
          </AddButton>
        }
      />

      <section className="space-y-4">
        {data.extraCurricular.length === 0 && <EmptyState icon={<Trophy size={36} />} text="No activities added." />}
        {data.extraCurricular.map((a, i) => (
          <RepeatCard key={a.id} index={i} label="Activity" onRemove={() => ops.remove(a.id)}>
            <Grid>
              <Field label="Activity / Role" required full>
                <TextInput value={a.activityName} onValue={(v) => ops.update(a.id, "activityName", v)} placeholder="e.g. Captain, University Cricket Team" />
              </Field>
              <Field label="Level">
                <Select value={a.level} onValue={(v) => ops.update(a.id, "level", v)} options={options.extraCurricularLevels} />
              </Field>
              <Field label="Year">
                <TextInput inputMode="numeric" maxLength={4} value={a.year} onValue={(v) => ops.update(a.id, "year", v.replace(/\D/g, ""))} placeholder="YYYY" />
              </Field>
              <Field label="Description / Achievements" full>
                <TextArea rows={2} value={a.description} onValue={(v) => ops.update(a.id, "description", v)} />
              </Field>
            </Grid>
          </RepeatCard>
        ))}
      </section>

      <section className="pt-6 border-t border-gray-200">
        <SubHeader
          title="Any Other Relevant Particulars"
          icon={<FilePlus size={18} className="text-[#800000]" />}
          optional
          subtitle="Anything relevant to your application not covered in earlier sections."
        />
        <TextArea rows={5} value={data.additionalInfo} onValue={(v) => update("additionalInfo", v)} />
      </section>
    </div>
  );
};

export default Step8ExtraCurricular;
