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

export type ReportSection = {
  title: string;
  head: string[];
  rows: (string | number)[][];
  note?: string;
};

/**
 * Rapport complet multi-sections (flotte + trajets + alertes + analyse IA
 * en une seule fois), avec en-tête de marque sur chaque page et pied de
 * page numéroté. Pensé pour un document professionnel prêt à partager.
 */
export function buildFullReport(
  meta: ReportMeta,
  kpis: { label: string; value: string }[],
  sections: ReportSection[],
  aiSummary?: string | null,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  function drawHeader(title: string) {
    doc.setFillColor(30, 30, 24);
    doc.rect(0, 0, pageWidth, 92, "F");
    doc.setTextColor(255, 142, 66);
    doc.setFontSize(20);
    doc.text("MSN Tracker", 40, 40);
    doc.setFontSize(9);
    doc.setTextColor(230, 230, 225);
    doc.text("by Institut Moisson", 40, 56);
    doc.text(`Contact : ${SUPPORT_PHONE}`, 40, 70);
    doc.setFontSize(12);
    doc.setTextColor(244, 63, 94);
    doc.text(title, pageWidth - 40, 45, { align: "right" });
    doc.setTextColor(200, 200, 195);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleString("fr-FR"), pageWidth - 40, 62, { align: "right" });
  }

  drawHeader(meta.title);
  let cursor = 120;
  doc.setTextColor(30, 30, 24);
  if (meta.subtitle) {
    doc.setFontSize(11);
    doc.text(meta.subtitle, 40, cursor);
    cursor += 18;
  }
  if (meta.company) {
    doc.setFontSize(10);
    doc.text(`Client : ${meta.company}`, 40, cursor);
    cursor += 22;
  }

  // ---- Bandeau d'indicateurs clés (KPI) ----
  if (kpis.length > 0) {
    const boxWidth = (pageWidth - 80) / kpis.length;
    kpis.forEach((kpi, i) => {
      const x = 40 + i * boxWidth;
      doc.setFillColor(245, 243, 238);
      doc.roundedRect(x, cursor, boxWidth - 8, 48, 4, 4, "F");
      doc.setTextColor(255, 142, 66);
      doc.setFontSize(14);
      doc.text(kpi.value, x + 10, cursor + 22);
      doc.setTextColor(90, 90, 85);
      doc.setFontSize(8);
      doc.text(kpi.label, x + 10, cursor + 38, { maxWidth: boxWidth - 20 });
    });
    cursor += 66;
  }

  // ---- Analyse IA (si générée) ----
  if (aiSummary) {
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 24);
    doc.text("Analyse IA de la flotte", 40, cursor);
    cursor += 14;
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 65);
    const lines = doc.splitTextToSize(aiSummary, pageWidth - 80);
    doc.text(lines, 40, cursor);
    cursor += lines.length * 11 + 16;
  }

  // ---- Sections tabulaires ----
  sections.forEach((section, index) => {
    if (index > 0 || aiSummary || kpis.length > 0) {
      // saute une page si trop proche du bas
      if (cursor > 680) {
        doc.addPage();
        drawHeader(meta.title);
        cursor = 120;
      }
    }
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 24);
    doc.text(section.title, 40, cursor);
    cursor += 6;

    autoTable(doc, {
      startY: cursor + 6,
      head: [section.head],
      body: section.rows,
      styles: { fontSize: 8.5, cellPadding: 5 },
      headStyles: { fillColor: [255, 142, 66], textColor: 30 },
      alternateRowStyles: { fillColor: [245, 243, 238] },
      margin: { left: 40, right: 40 },
      didDrawPage: () => {
        // @ts-expect-error getCurrentPageInfo existe à l'exécution mais n'est pas typé par jspdf
        if (doc.internal.getCurrentPageInfo().pageNumber > 1) drawHeader(meta.title);
      },
    });

    // @ts-expect-error jspdf-autotable attaches lastAutoTable at runtime
    cursor = (doc.lastAutoTable?.finalY ?? cursor + 40) + 26;

    if (section.note) {
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 85);
      doc.text(section.note, 40, cursor - 12);
    }
  });

  // ---- Pied de page numéroté sur toutes les pages ----
  // @ts-expect-error getNumberOfPages existe à l'exécution mais n'est pas typé par jspdf
  const totalPages = doc.internal.getNumberOfPages() as number;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 145);
    doc.text(`MSN Tracker — Institut Moisson · Page ${i}/${totalPages}`, pageWidth / 2, 820, {
      align: "center",
    });
  }

  return doc;
}
