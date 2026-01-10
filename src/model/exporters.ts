import type { TMModel } from "./types";
import MarkdownIt from "markdown-it";
import { toPng, toSvg } from "html-to-image";

function download(filename: string, content: Blob) {
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMarkdown(model: TMModel) {
  const lines: string[] = [];
  lines.push(`# ${model.name}`);
  lines.push(``);
  lines.push(`Updated: ${model.updatedAt}`);
  lines.push(``);
  lines.push(`## Diagram`);
  lines.push(`- Nodes: ${(model.nodes || []).length}`);
  lines.push(`- Flows: ${(model.edges || []).length}`);
  lines.push(``);

  lines.push(`## Threat Register`);
  for (const t of model.threats || []) {
    lines.push(`- **[${t.stride}] ${t.title}** — _${t.status}_`);
    if (t.description) lines.push(`  - ${t.description}`);
    if (t.mitigation) lines.push(`  - Mitigation: ${t.mitigation}`);
    if ((t.commentary || []).length) lines.push(`  - Evidence: ${(t.commentary || []).length} entry/entries`);
    const linked = (model.findings || []).filter((f) => (f.relatedThreatIds || []).includes(t.id));
    if (linked.length) lines.push(`  - Linked findings: ${linked.length}`);
  }

  lines.push(``);
  lines.push(`## Findings`);
  for (const f of model.findings || []) {
    lines.push(`- **${f.title}** — _${f.status}_`);
    if (f.description) lines.push(`  - ${f.description}`);
    if ((f.evidence || []).length) lines.push(`  - Evidence: ${(f.evidence || []).length} entry/entries`);
    if ((f.relatedThreatIds || []).length) lines.push(`  - Related threats: ${(f.relatedThreatIds || []).length}`);
  }

  download(`${model.name.replace(/\s+/g, "_")}.md`, new Blob([lines.join("\n")], { type: "text/markdown" }));
}

export function exportHtmlReport(model: TMModel) {
  const md = new MarkdownIt();
  const mdText =
    `# ${model.name}\n\nUpdated: ${model.updatedAt}\n\n` +
    `## Threat Register\n` +
    (model.threats || [])
      .map(
        (t) =>
          `- **[${t.stride}] ${t.title}** — _${t.status}_\n  - ${t.description || ""}\n  - Mitigation: ${t.mitigation || ""}`
      )
      .join("\n") +
    `\n\n## Findings\n` +
    (model.findings || []).map((f) => `- **${f.title}** — _${f.status}_\n  - ${f.description || ""}`).join("\n");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${model.name}</title></head><body>${md.render(
    mdText
  )}</body></html>`;
  download(`${model.name.replace(/\s+/g, "_")}.html`, new Blob([html], { type: "text/html" }));
}

export function exportEvidencePackHtml(model: TMModel) {
  const esc = (s: string) =>
    String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

  const evidenceItem = (e: any) => {
    const links = (e.links || []).length ? (e.links || []).map((l: string) => `<a href="${esc(l)}">${esc(l)}</a>`).join(" • ") : "";
    return `<li><b>${esc(e.createdAt)}</b> <small>(${esc(e.status || "draft")})</small> ${e.author ? "• " + esc(e.author) : ""}<br/>${esc(e.note || "")}${
      links ? `<br/><small>${links}</small>` : ""
    }</li>`;
  };

  const threatBlocks = (model.threats || [])
    .map((t) => {
      const ev = (t.commentary || []).map(evidenceItem).join("");
      return `<section><h3>[${t.stride}] ${esc(t.title)} <small>(${esc(t.status)})</small></h3>
        <p>${esc(t.description || "")}</p>
        <p><b>Mitigation:</b> ${esc(t.mitigation || "")}</p>
        <h4>Evidence</h4>
        <ul>${ev || "<li><i>No evidence yet</i></li>"}</ul>
      </section>`;
    })
    .join("<hr/>");

  const findingBlocks = (model.findings || [])
    .map((f) => {
      const ev = (f.evidence || []).map(evidenceItem).join("");
      return `<section><h3>${esc(f.title)} <small>(${esc(f.status)})</small></h3>
        <p>${esc(f.description || "")}</p>
        <h4>Evidence</h4>
        <ul>${ev || "<li><i>No evidence yet</i></li>"}</ul>
      </section>`;
    })
    .join("<hr/>");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(model.name)} Evidence Pack</title>
  <style>
    body{font-family:system-ui;margin:24px} h1,h2{margin-top:24px}
    section{padding:12px;border:1px solid #eee;border-radius:12px}
    ul{margin-top:8px} li{margin:8px 0}
    hr{border:none;border-top:1px solid #eee;margin:24px 0}
    small{color:#666}
  </style>
  </head><body>
  <h1>${esc(model.name)} — Evidence Pack</h1>
  <p>Exported: ${esc(new Date().toISOString())}</p>
  <h2>Threat Evidence</h2>
  ${threatBlocks || "<p><i>No threats</i></p>"}
  <h2>Finding Evidence</h2>
  ${findingBlocks || "<p><i>No findings</i></p>"}
  </body></html>`;

  download(`${model.name.replace(/\s+/g, "_")}_evidence.html`, new Blob([html], { type: "text/html" }));
}

export async function exportDiagramPng(el: HTMLElement, filenameBase: string) {
  const dataUrl = await toPng(el, { cacheBust: true });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  download(`${filenameBase}.png`, blob);
}

export async function exportDiagramSvg(el: HTMLElement, filenameBase: string) {
  const dataUrl = await toSvg(el, { cacheBust: true });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  download(`${filenameBase}.svg`, blob);
}

export function exportCsv(model: TMModel) {
  const esc = (s: any) => `"${String(s ?? "").replace(/"/g, '""')}"`;

  const threatRows = [
    ["id", "stride", "title", "status", "likelihood", "impact", "owner", "mitigation", "evidence_count", "linked_finding_count"]
      .map(esc)
      .join(","),
    ...(model.threats || []).map((t) =>
      [
        t.id,
        t.stride,
        t.title,
        t.status,
        t.likelihood,
        t.impact,
        t.owner || "",
        t.mitigation || "",
        (t.commentary || []).length,
        (model.findings || []).filter((f) => (f.relatedThreatIds || []).includes(t.id)).length
      ]
        .map(esc)
        .join(",")
    )
  ].join("\n");
  download(`${model.name.replace(/\s+/g, "_")}_threats.csv`, new Blob([threatRows], { type: "text/csv" }));

  const findingRows = [
    ["id", "title", "status", "owner", "createdAt", "evidence_count", "related_threats"].map(esc).join(","),
    ...(model.findings || []).map((f: any) =>
      [f.id, f.title, f.status, f.owner || "", f.createdAt || "", (f.evidence || []).length, (f.relatedThreatIds || []).join(";")]
        .map(esc)
        .join(",")
    )
  ].join("\n");
  download(`${model.name.replace(/\s+/g, "_")}_findings.csv`, new Blob([findingRows], { type: "text/csv" }));
}

export async function exportPngDataUrl(opts?: { redacted?: boolean }) {
  const el = document.getElementById("tm-canvas");
  if (!el) throw new Error("Canvas not found");

  const labelEls = Array.from(el.querySelectorAll("[data-tm-label]")) as HTMLElement[];
  const originals: string[] = [];

  if (opts?.redacted) {
    labelEls.forEach((n) => {
      originals.push(n.textContent || "");
      n.textContent = "REDACTED";
    });
  }

  try {
    return await toPng(el as HTMLElement, { cacheBust: true });
  } finally {
    if (opts?.redacted) {
      labelEls.forEach((n, idx) => (n.textContent = originals[idx] || ""));
    }
  }
}
