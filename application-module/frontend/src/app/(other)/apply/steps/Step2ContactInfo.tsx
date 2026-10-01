// src/app/(other)/apply/steps/Step2ContactInfo.tsx
import React from "react";
import { MapPin, Home, Building, Phone, Users } from "lucide-react";
import { useDropdowns } from "../../../../context/DropdownContext";
import type { ContactInfo } from "../types";
import { Checkbox, Field, Grid, Notice, Select, StepHeader, SubHeader, TextArea, TextInput } from "../ui";
import type { StepProps } from "./stepProps";

const COPY_FIELDS: Array<[keyof ContactInfo, keyof ContactInfo]> = [
  ["permanentAddress", "address"],
  ["permanentCity", "city"],
  ["permanentDistrict", "district"],
  ["permanentProvince", "province"],
  ["permanentPostalCode", "postalCode"],
];

/** When "same as permanent" is ticked, keep the postal address in sync. */
const syncPostal = (c: ContactInfo): ContactInfo => {
  if (!c.sameAsPermanent) return c;
  const next = { ...c };
  COPY_FIELDS.forEach(([from, to]) => ((next as any)[to] = c[from]));
  return next;
};

const Step2ContactInfo: React.FC<StepProps> = ({ data, update }) => {
  const { options } = useDropdowns();
  const c = data.contactInfo;
  const set = <K extends keyof ContactInfo>(field: K, value: ContactInfo[K]) =>
    update("contactInfo", syncPostal({ ...c, [field]: value }));

  const same = c.sameAsPermanent;

  return (
    <div className="space-y-8">
      <StepHeader step="contact" icon={<MapPin size={22} />} subtitle="All official communication will be sent to these details." />

      <section className="p-4 border sm:p-5 rounded-xl border-[#800000]/20 bg-gray-50/60">
        <SubHeader title="Permanent Address" icon={<Home size={18} className="text-[#800000]" />} />
        <Grid>
          <Field label="Address" required full htmlFor="pAddr">
            <TextArea id="pAddr" rows={2} value={c.permanentAddress} onValue={(v) => set("permanentAddress", v)} autoComplete="street-address" />
          </Field>
          <Field label="City / Town" required htmlFor="pCity">
            <TextInput id="pCity" value={c.permanentCity} onValue={(v) => set("permanentCity", v)} />
          </Field>
          <Field label="District" required htmlFor="pDist">
            <Select id="pDist" value={c.permanentDistrict} onValue={(v) => set("permanentDistrict", v)} options={options.districts} />
          </Field>
          <Field label="Province" htmlFor="pProv">
            <Select id="pProv" value={c.permanentProvince} onValue={(v) => set("permanentProvince", v)} options={options.provinces} />
          </Field>
          <Field label="Postal Code" htmlFor="pZip">
            <TextInput id="pZip" inputMode="numeric" value={c.permanentPostalCode} onValue={(v) => set("permanentPostalCode", v)} />
          </Field>
        </Grid>
      </section>

      <section className="p-4 border border-gray-200 sm:p-5 rounded-xl">
        <SubHeader title="Postal / Current Address" icon={<Building size={18} className="text-[#800000]" />} />
        <div className="mb-4">
          <Checkbox
            id="samePerm"
            checked={same}
            onChange={(v) => set("sameAsPermanent", v)}
            label="My postal address is the same as my permanent address"
          />
        </div>
        {same ? (
          <p className="p-3 text-sm text-gray-600 rounded-lg bg-gray-50">
            Postal address will follow your permanent address automatically.
          </p>
        ) : (
          <Grid>
            <Field label="Address" required full htmlFor="cAddr">
              <TextArea id="cAddr" rows={2} value={c.address} onValue={(v) => set("address", v)} />
            </Field>
            <Field label="City / Town" required htmlFor="cCity">
              <TextInput id="cCity" value={c.city} onValue={(v) => set("city", v)} />
            </Field>
            <Field label="District" required htmlFor="cDist">
              <Select id="cDist" value={c.district} onValue={(v) => set("district", v)} options={options.districts} />
            </Field>
            <Field label="Province" htmlFor="cProv">
              <Select id="cProv" value={c.province} onValue={(v) => set("province", v)} options={options.provinces} />
            </Field>
            <Field label="Postal Code" htmlFor="cZip">
              <TextInput id="cZip" inputMode="numeric" value={c.postalCode} onValue={(v) => set("postalCode", v)} />
            </Field>
          </Grid>
        )}
      </section>

      <section>
        <SubHeader title="Phone & Email" icon={<Phone size={18} className="text-[#800000]" />} />
        <Grid cols={3}>
          <Field label="Mobile" required htmlFor="mob">
            <TextInput id="mob" type="tel" inputMode="tel" value={c.phoneMobile} onValue={(v) => set("phoneMobile", v)} placeholder="+94 7X XXX XXXX" autoComplete="tel" />
          </Field>
          <Field label="Home" htmlFor="homeP">
            <TextInput id="homeP" type="tel" inputMode="tel" value={c.phoneHome} onValue={(v) => set("phoneHome", v)} />
          </Field>
          <Field label="Office" htmlFor="offP">
            <TextInput id="offP" type="tel" inputMode="tel" value={c.phoneOffice} onValue={(v) => set("phoneOffice", v)} />
          </Field>
          <Field label="Email Address" required full htmlFor="email" hint="Your submitted application (PDF) will be emailed here.">
            <TextInput id="email" type="email" inputMode="email" value={c.email} onValue={(v) => set("email", v.trim())} autoComplete="email" />
          </Field>
        </Grid>
      </section>

      <section>
        <SubHeader title="Emergency Contact" icon={<Users size={18} className="text-[#800000]" />} optional />
        <Grid cols={3}>
          <Field label="Name" htmlFor="emName">
            <TextInput id="emName" value={c.emergencyName} onValue={(v) => set("emergencyName", v)} />
          </Field>
          <Field label="Phone" htmlFor="emPhone">
            <TextInput id="emPhone" type="tel" inputMode="tel" value={c.emergencyPhone} onValue={(v) => set("emergencyPhone", v)} />
          </Field>
          <Field label="Relationship" htmlFor="emRel">
            <TextInput id="emRel" value={c.emergencyRelation} onValue={(v) => set("emergencyRelation", v)} placeholder="e.g. Spouse" />
          </Field>
        </Grid>
      </section>

      <Notice>Any later change of address must be communicated to the University immediately.</Notice>
    </div>
  );
};

export default Step2ContactInfo;
