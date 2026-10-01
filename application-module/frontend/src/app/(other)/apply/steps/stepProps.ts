// src/app/(other)/apply/steps/stepProps.ts
import type { ApplicationData, SectionKey } from "../types";

export type SectionUpdater = <K extends SectionKey>(
  key: K,
  value: ApplicationData[K] | ((prev: ApplicationData[K]) => ApplicationData[K]),
) => void;

export interface StepProps {
  data: ApplicationData;
  update: SectionUpdater;
  readOnly?: boolean;
}
