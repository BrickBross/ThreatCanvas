import JSZip from "jszip";
import { validateModel } from "./validation";
import { exportAuditPdf, sha256Hex } from "./report";
import type { TMModel } from "./types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function filenameSafe(name: string) {
  const base = (name || "threat-model")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "threat-model";
}

export async function openModelFromFile(file: File): Promise<TMModel> {
  const text = await file.text();
  const json = JSON.parse(text);
  if (!json || typeof json !== "object" || !Array.isArray(json.nodes) || !Array.isArray(json.edges)) {
    throw new Error("Invalid model file format");
  }
  return json as TMModel;
}

export function downloadModel(model: TMModel, filename?: string) {
  const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
  downloadBlob(blob, filename || `${filenameSafe(model.name)}.tm.json`);
}

function toCsv(rows: Record<string, any>[]) {
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => escape((r as any)[c])).join(",")).join("\n");
  return head + "\n" + body + "\n";
}

export async function exportEvidencePackZip(model: TMModel): Promise<Blob> {
  const zip = new JSZip();

  const jsonPretty = JSON.stringify(model, null, 2);
  zip.file(`${filenameSafe(model.name)}.tm.json`, jsonPretty);
  const hash = await sha256Hex(JSON.stringify(model));
  zip.file(`hash-sha256.txt`, hash + "\n");

  const threats = (model.threats || []).map((t) => ({
    id: t.id,
    stride: t.stride,
    title: t.title,
    status: t.status,
    likelihood: t.likelihood,
    impact: t.impact,
    owner: t.owner || "",
    affectedNodes: (t.affectedNodeIds || []).join(";"),
    affectedEdges: (t.affectedEdgeIds || []).join(";"),
    mitigation: t.mitigation || "",
    description: t.description || ""
  }));
  zip.file("threats.csv", toCsv(threats));

  const findings = (model.findings || []).map((f) => ({
    id: f.id,
    title: f.title,
    status: f.status,
    owner: f.owner || "",
    relatedThreatIds: (f.relatedThreatIds || []).join(";"),
    description: f.description || "",
    evidenceCount: (f.evidence || []).length
  }));
  zip.file("findings.csv", toCsv(findings));

  const issues = validateModel(model);
  zip.file("validation.json", JSON.stringify(issues, null, 2));

  const threatEvidence = (model.threats || []).flatMap((t) =>
    (t.commentary || []).map((ev) => ({
      threatId: t.id,
      threatTitle: t.title,
      evidenceId: ev.id,
      createdAt: ev.createdAt,
      author: ev.author || "",
      note: ev.note,
      links: (ev.links || []).join(" ")
    }))
  );
  zip.file("threat-evidence.csv", toCsv(threatEvidence));

  const findingEvidence = (model.findings || []).flatMap((f) =>
    (f.evidence || []).map((ev) => ({
      findingId: f.id,
      findingTitle: f.title,
      evidenceId: ev.id,
      createdAt: ev.createdAt,
      author: ev.author || "",
      note: ev.note,
      links: (ev.links || []).join(" ")
    }))
  );
  zip.file("finding-evidence.csv", toCsv(findingEvidence));

  try {
    const { doc } = await exportAuditPdf(model, { redacted: false });
    const pdfBlob = doc.output('blob');
    zip.file(`${filenameSafe(model.name)}-report.pdf`, pdfBlob);
  } catch {}

  return await zip.generateAsync({ type: "blob" });
}

export function downloadEvidencePack(model: TMModel) {
  exportEvidencePackZip(model).then((blob) => {
    downloadBlob(blob, `${filenameSafe(model.name)}-evidence-pack.zip`);
  });
}
