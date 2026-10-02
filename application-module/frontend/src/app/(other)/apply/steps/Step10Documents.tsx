// src/app/(other)/apply/steps/Step10Documents.tsx
// ALL uploads happen here. The list is generated from earlier steps
// (documents.ts) — one slot per degree, job, qualification, etc.
// Academic transcripts are not requested.
import React, { useMemo, useRef, useState } from "react";
import { FileCheck, Upload, CheckCircle2, Eye, Trash2, Loader2, FilePlus, RefreshCw } from "lucide-react";
import { fileUrl, uploadDocument } from "../../../../services/applicationApi";
import { buildDocumentChecklist, type DocGroup, type DocRequirement } from "../documents";
import { pruneBlankEntries } from "../normalize";
import type { UploadedDocument } from "../types";
import { Notice, StepHeader, SubHeader } from "../ui";
import type { StepProps } from "./stepProps";

const GROUP_ORDER: DocGroup[] = ["Personal", "Education", "Professional", "Experience", "Research", "Other"];
const OTHER_ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx";

const extOk = (file: File, accept: string) => {
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  return accept.split(",").includes(ext);
};

const Step10Documents: React.FC<StepProps> = ({ data, update, readOnly }) => {
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const otherInput = useRef<HTMLInputElement>(null);

  const checklist = useMemo(() => buildDocumentChecklist(pruneBlankEntries(data)), [data]);
  const required = checklist.filter((d) => d.required);
  const requiredDone = required.filter((d) => data.documents[d.key]).length;

  const doUpload = async (key: string, file: File, accept: string, maxMB: number) => {
    setErrors((e) => ({ ...e, [key]: "" }));
    if (!extOk(file, accept)) {
      setErrors((e) => ({ ...e, [key]: `Allowed types: ${accept.replace(/\./g, "").toUpperCase()}` }));
      return null;
    }
    if (file.size > maxMB * 1024 * 1024) {
      setErrors((e) => ({ ...e, [key]: `File must be smaller than ${maxMB} MB.` }));
      return null;
    }
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      const res = await uploadDocument(data.vacancy_id, key, file);
      const path = res.data?.path ?? res.path;
      if (!res.success || !path) {
        setErrors((e) => ({ ...e, [key]: res.error || "Upload failed. Please try again." }));
        return null;
      }
      return { path, name: res.data?.name ?? file.name, uploadedAt: new Date().toISOString() } as UploadedDocument;
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  };

  const uploadFor = async (req: DocRequirement, file: File) => {
    const doc = await doUpload(req.key, file, req.accept, req.maxMB);
    if (doc) update("documents", (prev) => ({ ...prev, [req.key]: doc }));
  };

  const removeDoc = (key: string) =>
    update("documents", (prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const uploadOther = async (file: File) => {
    const doc = await doUpload("other", file, OTHER_ACCEPT, 5);
    if (doc) update("otherDocuments", (prev) => [...prev, doc]);
  };

  const grouped = GROUP_ORDER.map((g) => ({ group: g, items: checklist.filter((d) => d.group === g) })).filter(
    (g) => g.items.length,
  );

  return (
    <div className="space-y-6">
      <StepHeader
        step="documents"
        icon={<FileCheck size={22} />}
        subtitle="Upload clear scans or photos. Required items are marked *."
      />

      <div
        className={`flex items-center justify-between gap-3 p-4 rounded-xl border ${
          requiredDone === required.length ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
        }`}
      >
        <div className="text-sm">
          <p className="font-semibold text-gray-800">
            {requiredDone} of {required.length} required documents uploaded
          </p>
          <p className="text-gray-600">Optional documents strengthen your application.</p>
        </div>
        <div className="w-24 h-2 overflow-hidden bg-white rounded-full shrink-0">
          <div
            className="h-full bg-green-600 transition-all"
            style={{ width: `${required.length ? (requiredDone / required.length) * 100 : 100}%` }}
          />
        </div>
      </div>

      {grouped.map(({ group, items }) => (
        <section key={group}>
          <SubHeader title={group} />
          <ul className="space-y-3">
            {items.map((req) => {
              const doc = data.documents[req.key];
              const isBusy = busy[req.key];
              const inputId = `doc-${req.key.replace(/[^a-z0-9]/gi, "-")}`;
              const isPhoto = req.key === "profile_photo";
              return (
                <li key={req.key} className={`p-4 border rounded-xl ${doc ? "border-green-200 bg-green-50/40" : "border-gray-200"}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start min-w-0 gap-3">
                      {isPhoto && doc ? (
                        <img src={fileUrl(doc.path)} alt="Applicant" className="object-cover w-12 h-14 border rounded shrink-0" />
                      ) : doc ? (
                        <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <Upload size={22} className="text-gray-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 break-words">
                          {req.label} {req.required && <span className="text-red-500">*</span>}
                        </p>
                        {req.hint && <p className="text-xs text-gray-500">{req.hint}</p>}
                        {doc ? (
                          <p className="text-xs text-green-700 truncate">{doc.name}</p>
                        ) : (
                          <p className="text-xs text-gray-500">
                            {req.accept.replace(/\./g, "").toUpperCase()} · max {req.maxMB} MB
                          </p>
                        )}
                        {errors[req.key] && <p className="mt-1 text-xs text-red-600">{errors[req.key]}</p>}
                      </div>
                    </div>

                    {!readOnly && (
                      <div className="flex gap-2 shrink-0">
                        <input
                          id={inputId}
                          type="file"
                          accept={req.accept}
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (f) uploadFor(req, f);
                          }}
                        />
                        <label
                          htmlFor={inputId}
                          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer min-h-[44px] ${
                            doc ? "border border-gray-300 text-gray-700 hover:bg-gray-50" : "bg-[#800000] text-white hover:bg-[#a01010]"
                          }`}
                        >
                          {isBusy ? <Loader2 size={16} className="animate-spin" /> : doc ? <RefreshCw size={16} /> : <Upload size={16} />}
                          {isBusy ? "Uploading…" : doc ? "Replace" : "Upload"}
                        </label>
                        {doc && (
                          <>
                            <a
                              href={fileUrl(doc.path)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center w-11 h-11 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                              aria-label="View"
                            >
                              <Eye size={16} />
                            </a>
                            <button
                              type="button"
                              onClick={() => removeDoc(req.key)}
                              className="inline-flex items-center justify-center text-red-600 border border-gray-300 rounded-lg w-11 h-11 hover:bg-red-50"
                              aria-label="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section>
        <SubHeader title="Other Supporting Documents" optional subtitle="Anything else you wish to attach." />
        <div className="space-y-2">
          {data.otherDocuments.map((d, i) => (
            <div key={`${d.path}-${i}`} className="flex items-center justify-between gap-2 p-3 border rounded-lg">
              <span className="flex items-center min-w-0 gap-2 text-sm text-gray-700">
                <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="flex gap-1 shrink-0">
                <a href={fileUrl(d.path)} target="_blank" rel="noreferrer" className="p-2 text-gray-600 rounded hover:bg-gray-100" aria-label="View">
                  <Eye size={16} />
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => update("otherDocuments", (prev) => prev.filter((_, j) => j !== i))}
                    className="p-2 text-red-600 rounded hover:bg-red-50"
                    aria-label="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </span>
            </div>
          ))}
          {!readOnly && (
            <>
              <input
                ref={otherInput}
                type="file"
                accept={OTHER_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) uploadOther(f);
                }}
              />
              <button
                type="button"
                onClick={() => otherInput.current?.click()}
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-gray-700 border-2 border-gray-300 border-dashed rounded-xl hover:border-[#800000] hover:text-[#800000]"
              >
                {busy.other ? <Loader2 size={16} className="animate-spin" /> : <FilePlus size={16} />}
                {busy.other ? "Uploading…" : "Add another document"}
              </button>
              {errors.other && <p className="text-xs text-red-600">{errors.other}</p>}
            </>
          )}
        </div>
      </section>

      <Notice tone="warn">
        Applications without the required supporting documents will not be considered. Originals
        must be produced at the interview.
      </Notice>
    </div>
  );
};

export default Step10Documents;
