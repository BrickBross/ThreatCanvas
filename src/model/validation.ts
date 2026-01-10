import type { TMModel, ValidationIssue } from "./types";
import type { TMEdge, TMNode } from "./store";

function id() { return crypto.randomUUID(); }

export function validateModel(model: TMModel): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const nodes = model.nodes as TMNode[];
  const edges = model.edges as TMEdge[];

  for (const n of nodes) {
    const label = (n.data?.label || "").trim();
    if (!label) {
      issues.push({
        id: id(),
        severity: "error",
        title: "Component missing name",
        detail: "A component has an empty name. Give it a descriptive label.",
        target: { kind: "node", id: n.id }
      });
    }
    if (label.toLowerCase().startsWith("new ")) {
      issues.push({
        id: id(),
        severity: "warn",
        title: "Component uses default name",
        detail: `Component "${label}" looks like a default placeholder. Rename it.`,
        target: { kind: "node", id: n.id }
      });
    }

    const p = n.data?.props || {};
    if (p.internetExposed && !p.authRequired) {
      issues.push({
        id: id(),
        severity: "error",
        title: "Internet-exposed component without auth",
        detail: `Component "${label}" is marked Internet-exposed but Auth required is set to No.`,
        target: { kind: "node", id: n.id }
      });
    }
    if ((n.data?.kind === "datastore") && p.encryptionAtRest !== true) {
      issues.push({
        id: id(),
        severity: "warn",
        title: "Datastore missing encryption at rest",
        detail: `Data store "${label}" is not marked encrypted at rest.`,
        target: { kind: "node", id: n.id }
      });
    }
  }

  for (const e of edges) {
    const dp = e.data?.props || {};
    const name = (e.data?.label || "data flow").trim();
    if (!dp.protocol) {
      issues.push({
        id: id(),
        severity: "warn",
        title: "Flow missing protocol",
        detail: `Flow "${name}" has no protocol set (e.g., HTTPS, gRPC, SFTP).`,
        target: { kind: "edge", id: e.id }
      });
    }
    if (!dp.dataType) {
      issues.push({
        id: id(),
        severity: "info",
        title: "Flow missing data type",
        detail: `Flow "${name}" has no data type specified (e.g., PII, tokens, telemetry).`,
        target: { kind: "edge", id: e.id }
      });
    }
    if (dp.encryptionInTransit !== true) {
      issues.push({
        id: id(),
        severity: "warn",
        title: "Flow not encrypted in transit",
        detail: `Flow "${name}" is not marked as encrypted in transit.`,
        target: { kind: "edge", id: e.id }
      });
    }
  }

  for (const t of model.threats || []) {
    if ((t.status === "verified" || t.status === "mitigated") && (t.commentary || []).length === 0 && (t.findingIds || []).length === 0) {
      issues.push({
        id: id(),
        severity: "warn",
        title: "Threat marked mitigated/verified without evidence",
        detail: `Threat "${t.title}" is ${t.status} but has no evidence notes or linked findings.`,
        target: { kind: "threat", id: t.id }
      });
    }
  }

  for (const f of model.findings || []) {
    if ((f.status === "validated" || f.status === "resolved") && (f.evidence || []).length === 0) {
      issues.push({
        id: id(),
        severity: "warn",
        title: "Finding marked validated/resolved without evidence",
        detail: `Finding "${f.title}" is ${f.status} but has no evidence entries.`,
        target: { kind: "finding", id: f.id }
      });
    }
  }

                        // Finding verified requires at least one verified evidence note
  for (const f of (model.findings || [])) {
    if (f.status === "verified") {
      const ev = (f.evidence || []) as any[];
      if (!ev.some((e) => e.status === "verified")) {
        issues.push({
          id: `finding-${f.id}-no-verified-evidence`,
          severity: "warn",
          title: "Verified finding has no verified evidence",
          detail: "Mark at least one evidence note as verified before setting the finding to verified.",
          target: { kind: "finding", id: f.id }
        });
      }
    }
  }

  // Threat verified requires all linked findings verified (if any)
  for (const t of (model.threats || [])) {
    if (t.status === "verified") {
      const linked = (model.findings || []).filter((f) => (f.relatedThreatIds || []).includes(t.id));
      if (linked.length && !linked.every((f) => f.status === "verified")) {
        issues.push({
          id: `threat-${t.id}-linked-findings-not-verified`,
          severity: "warn",
          title: "Verified threat has non-verified linked findings",
          detail: "If you use linked findings as evidence of mitigation, verify those findings before setting the threat to verified.",
          target: { kind: "threat", id: t.id }
        });
      }
    }
  }

  return issues;
}

