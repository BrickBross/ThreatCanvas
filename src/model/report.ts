import { jsPDF } from "jspdf";
import type { TMModel } from "./types";
import { validateModel } from "./validation";
import { exportPngDataUrl } from "./exporters";

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const lines = doc.splitTextToSize(text || "", maxWidth);
  lines.forEach((ln: string, i: number) => doc.text(ln, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

export async function sha256Hex(text: string) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  const bytes = Array.from(new Uint8Array(buf));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function exportAuditPdf(model: TMModel, opts?: { redacted?: boolean }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pad = 36;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = pad;

  const jsonText = JSON.stringify(model);
  const hash = await sha256Hex(jsonText);

  doc.setFontSize(16);
  doc.text("Threat Model Report", pad, y);
  y += 22;

  doc.setFontSize(10);
  doc.text(`Model: ${model.name}`, pad, y);
  y += 14;
  doc.text(`Generated: ${new Date().toISOString()}`, pad, y);
  y += 14;
  doc.text(`SHA-256(model JSON): ${hash}`, pad, y);
  y += 18;

  doc.setDrawColor(200);
  doc.line(pad, y, pageW - pad, y);
  y += 16;

  doc.setFontSize(12);
  doc.text("Diagram", pad, y);
  y += 10;

  try {
    const png = await exportPngDataUrl({ redacted: !!opts?.redacted });
    const imgProps = doc.getImageProperties(png);
    const maxW = pageW - pad * 2;
    const maxH = 320;
    const scale = Math.min(maxW / imgProps.width, maxH / imgProps.height);
    const w = imgProps.width * scale;
    const h = imgProps.height * scale;
    doc.addImage(png, "PNG", pad, y, w, h);
    y += h + 18;
  } catch {
    doc.setFontSize(10);
    doc.text("(Diagram export unavailable)", pad, y);
    y += 16;
  }

  if (y > pageH - 180) {
    doc.addPage();
    y = pad;
  }

  doc.setFontSize(12);
  doc.text("Threat Register", pad, y);
  y += 12;
  doc.setFontSize(9);

  const threats = model.threats || [];
  for (const t of threats) {
    const fw = t.framework ? `${t.framework}${t.frameworkRef ? `:${t.frameworkRef}` : ""}` : "";
    const header = `[${t.stride}] ${t.title}  •  ${t.status}  •  L${t.likelihood} I${t.impact}${fw ? `  •  ${fw}` : ""}`;
    y = wrapText(doc, header, pad, y, pageW - pad * 2, 12);
    if (t.description) y = wrapText(doc, `Desc: ${t.description}`, pad + 10, y, pageW - pad * 2 - 10, 12);
    if (t.mitigation) y = wrapText(doc, `Mitigation: ${t.mitigation}`, pad + 10, y, pageW - pad * 2 - 10, 12);
    y += 8;
    if (y > pageH - 90) {
      doc.addPage();
      y = pad;
    }
  }
  if (!threats.length) {
    doc.text("(No threats)", pad, y);
    y += 14;
  }

  doc.addPage();
  y = pad;
  doc.setFontSize(12);
  doc.text("Findings", pad, y);
  y += 12;
  doc.setFontSize(9);

  const findings = model.findings || [];
  for (const f of findings) {
    const header = `${f.title}  •  ${f.status}`;
    y = wrapText(doc, header, pad, y, pageW - pad * 2, 12);
    if (f.description) y = wrapText(doc, `Desc: ${f.description}`, pad + 10, y, pageW - pad * 2 - 10, 12);
    if ((f.evidence || []).length) y = wrapText(doc, `Evidence: ${(f.evidence || []).length} notes`, pad + 10, y, pageW - pad * 2 - 10, 12);
    y += 8;
    if (y > pageH - 90) {
      doc.addPage();
      y = pad;
    }
  }
  if (!findings.length) {
    doc.text("(No findings)", pad, y);
    y += 14;
  }

  doc.addPage();
  y = pad;
  doc.setFontSize(12);
  doc.text("Validation", pad, y);
  y += 12;
  doc.setFontSize(9);

  const issues = validateModel(model);
  for (const i of issues) {
    const line = `${i.severity.toUpperCase()}: ${i.title} — ${i.detail}`;
    y = wrapText(doc, line, pad, y, pageW - pad * 2, 12);
    y += 4;
    if (y > pageH - 80) {
      doc.addPage();
      y = pad;
    }
  }
  if (!issues.length) {
    doc.text("(No validation issues)", pad, y);
  }

  return { doc, hash };
}
