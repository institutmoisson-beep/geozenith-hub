import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { SUPPORT_PHONE } from "./msn";

export type ReportMeta = {
  title: string;
  subtitle?: string;
  company?: string | null;
};

export function buildReport(
  meta: ReportMeta,
  head: string[],
  rows: (string | number)[][],
  summary?: string[],
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFillColor(30, 30, 24);
  doc.rect(0, 0, 595, 92, "F");
  doc.setTextColor(255, 142, 66);
  doc.setFontSize(20);
  doc.text("MSN Tracker", 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(230, 230, 225);
  doc.text("by Institut Moisson", 40, 56);
  doc.text(`Contact : ${SUPPORT_PHONE}`, 40, 70);
  doc.setFontSize(12);
  doc.setTextColor(244, 63, 94);
  doc.text(meta.title, 400, 45, { align: "right" });
  doc.setTextColor(200, 200, 195);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString("fr-FR"), 555, 62, { align: "right" });

  doc.setTextColor(30, 30, 24);
  let cursor = 120;
  if (meta.subtitle) {
    doc.setFontSize(11);
    doc.text(meta.subtitle, 40, cursor);
    cursor += 18;
  }
  if (meta.company) {
    doc.setFontSize(10);
    doc.text(`Client : ${meta.company}`, 40, cursor);
    cursor += 18;
  }
  (summary ?? []).forEach((line) => {
    doc.setFontSize(10);
    doc.text(line, 40, cursor);
    cursor += 15;
  });

  autoTable(doc, {
    startY: cursor + 8,
    head: [head],
    body: rows,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [255, 142, 66], textColor: 30 },
    alternateRowStyles: { fillColor: [245, 243, 238] },
  });

  return doc;
}

export function downloadReport(doc: jsPDF, filename: string) {
  doc.save(filename);
}