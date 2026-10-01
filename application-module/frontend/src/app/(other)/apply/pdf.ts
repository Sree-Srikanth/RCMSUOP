// src/app/(other)/apply/pdf.ts
import html2pdf from "html2pdf.js";

const options = (filename: string) => ({
  margin: [8, 8, 10, 8] as [number, number, number, number],
  filename,
  image: { type: "jpeg" as const, quality: 0.95 },
  html2canvas: { scale: 2, useCORS: true, logging: false },
  jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
  pagebreak: { mode: ["css", "legacy"] },
});

export const pdfFileName = (ref: string, name: string) =>
  `Application_${(ref || "draft").replace(/[^\w-]+/g, "-")}_${(name || "applicant").replace(/[^\w-]+/g, "_")}.pdf`;

/** Render an element to a PDF Blob (used on submit — uploaded to the server and emailed). */
export const renderPdfBlob = async (el: HTMLElement, filename: string): Promise<Blob> =>
  (html2pdf() as any).set(options(filename)).from(el).outputPdf("blob");

export const downloadPdf = async (el: HTMLElement, filename: string): Promise<void> =>
  (html2pdf() as any).set(options(filename)).from(el).save();
