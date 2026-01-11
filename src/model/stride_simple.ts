import type { TMModel, Threat } from "./types";
import type { TMEdge, TMNode } from "./store";
import { nanoid } from "nanoid";

function push(out: Threat[], t: Omit<Threat,"id">) {
  out.push({ ...t, id: nanoid() });
}

type Rect = { id: string; x: number; y: number; w: number; h: number; area: number };

function getRect(n: any): Rect | null {
  const w = (n.width ?? n.measured?.width ?? n.style?.width);
  const h = (n.height ?? n.measured?.height ?? n.style?.height);
  if (!w || !h) return null;
  return { id: n.id, x: n.position.x, y: n.position.y, w: Number(w), h: Number(h), area: Number(w) * Number(h) };
}

function contains(outer: Rect, inner: Rect) {
  return inner.x >= outer.x && inner.y >= outer.y &&
    (inner.x + inner.w) <= (outer.x + outer.w) &&
    (inner.y + inner.h) <= (outer.y + outer.h);
}

function boundaryForNode(node: any, boundaries: Rect[]): string | null {
  const r = getRect(node);
  if (!r) return null;
  const candidates = boundaries.filter(b => contains(b, r)).sort((a,b)=>a.area-b.area);
  return candidates.length ? candidates[0].id : null;
}

export function generateStride(model: TMModel): Threat[] {
  const nodes = model.nodes as TMNode[];
  const edges = model.edges as TMEdge[];
  const threats: Threat[] = [];

  const boundaryNodes = nodes.filter(n => n.data?.kind === "trustBoundary");
  const boundaries = boundaryNodes.map(getRect).filter(Boolean) as Rect[];

  const boundaryOf = new Map<string, string | null>();
  for (const n of nodes) {
    if (n.data?.kind === "trustBoundary") continue;
    boundaryOf.set(n.id, boundaryForNode(n, boundaries));
  }

  for (const n of nodes) {
    if (n.data?.kind === "trustBoundary") continue;
    const label = n.data?.label || "component";
    const p = n.data?.props || {};

    if (p.internetExposed && !p.authRequired) {
      push(threats, {
        stride: "S",
        title: `Unauthenticated access to ${label}`,
        description: `${label} is Internet-exposed but not marked as requiring auth.`,
        affectedNodeIds: [n.id],
        affectedEdgeIds: [],
        likelihood: 4,
        impact: 4,
        status: "open",
        mitigation: "Require strong authentication/authorization; consider WAF and rate limits.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }

    if (p.dataClassification === "Restricted" && !p.loggingEnabled) {
      push(threats, {
        stride: "R",
        title: `Insufficient logging for ${label}`,
        description: `${label} handles restricted data but logging is not enabled (may hinder investigations).`,
        affectedNodeIds: [n.id],
        affectedEdgeIds: [],
        likelihood: 3,
        impact: 3,
        status: "open",
        mitigation: "Enable audit logs and forward to SIEM; define retention and alerting.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }

    if (n.data?.kind === "datastore" && p.encryptionAtRest !== true) {
      push(threats, {
        stride: "I",
        title: `Unencrypted data at rest in ${label}`,
        description: `Datastore "${label}" is not marked encrypted at rest.`,
        affectedNodeIds: [n.id],
        affectedEdgeIds: [],
        likelihood: 3,
        impact: 4,
        status: "open",
        mitigation: "Enable encryption at rest (KMS/Key Vault), rotate keys, restrict access.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }
  }

  for (const e of edges) {
    const dp = e.data?.props || {};
    const name = e.data?.label || "flow";

    if (dp.encryptionInTransit !== true) {
      push(threats, {
        stride: "I",
        title: `Unencrypted data in transit on ${name}`,
        description: `The data flow "${name}" is not marked as encrypted in transit.`,
        affectedNodeIds: [],
        affectedEdgeIds: [e.id],
        likelihood: 4,
        impact: 4,
        status: "open",
        mitigation: "Use TLS/mTLS; enforce HTTPS-only; validate certs; consider private connectivity.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }
    if (dp.authOnFlow !== true) {
      push(threats, {
        stride: "S",
        title: `Flow spoofing risk on ${name}`,
        description: `The data flow "${name}" is not marked as authenticated (mTLS, signed tokens, etc.).`,
        affectedNodeIds: [],
        affectedEdgeIds: [e.id],
        likelihood: 3,
        impact: 3,
        status: "open",
        mitigation: "Authenticate producers/consumers; use mTLS or signed tokens; lock down network paths.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }

    const sb = boundaryOf.get(e.source) || null;
    const tb = boundaryOf.get(e.target) || null;
    if (sb !== tb) {
      push(threats, {
        stride: "T",
        title: `Trust boundary crossing on ${name}`,
        description: `Data flow "${name}" crosses a trust boundary (source boundary: ${sb || "none"}, target boundary: ${tb || "none"}).`,
        affectedNodeIds: [e.source, e.target].filter(Boolean) as any,
        affectedEdgeIds: [e.id],
        likelihood: 3,
        impact: 4,
        status: "open",
        mitigation: "Validate boundary controls: network policy, authn/z, mTLS, input validation, logging, rate limits.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }
  }

  return threats;
}

const STRIDE_AUTO_PREFIX = "STRIDE_AUTO";

function pushAuto(out: Threat[], ref: string, t: Omit<Threat, "id">) {
  out.push({
    ...t,
    id: `${STRIDE_AUTO_PREFIX}:${ref}`,
    framework: "STRIDE",
    frameworkCategory: "Auto",
    frameworkRef: `${STRIDE_AUTO_PREFIX}:${ref}`
  });
}

export function generateStrideAuto(model: TMModel): Threat[] {
  const nodes = model.nodes as TMNode[];
  const edges = model.edges as TMEdge[];
  const threats: Threat[] = [];

  const boundaryNodes = nodes.filter((n) => n.data?.kind === "trustBoundary");
  const boundaries = boundaryNodes.map(getRect).filter(Boolean) as Rect[];

  const boundaryOf = new Map<string, string | null>();
  for (const n of nodes) {
    if (n.data?.kind === "trustBoundary") continue;
    boundaryOf.set(n.id, boundaryForNode(n, boundaries));
  }

  for (const n of nodes) {
    if (n.data?.kind === "trustBoundary") continue;
    const label = n.data?.label || "component";
    const p = n.data?.props || {};
    const serviceType = String((p as any).serviceType || "");

    if (p.internetExposed && !p.authRequired) {
      pushAuto(threats, `S:unauth:${n.id}`, {
        stride: "S",
        title: `Unauthenticated access to ${label}`,
        description: `${label} is Internet-exposed but not marked as requiring auth.`,
        affectedNodeIds: [n.id],
        affectedEdgeIds: [],
        likelihood: 4,
        impact: 4,
        status: "open",
        mitigation: "Require strong authentication/authorization; consider WAF and rate limits.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }

    if (serviceType === "compute_vm" || serviceType === "compute_serverless") {
      pushAuto(threats, `E:privesc:${n.id}`, {
        stride: "E",
        title: `Privilege escalation on ${label}`,
        description: `${label} is a compute resource (${serviceType}). Misconfiguration or weak IAM can lead to privilege escalation.`,
        affectedNodeIds: [n.id],
        affectedEdgeIds: [],
        likelihood: 3,
        impact: 5,
        status: "open",
        mitigation: "Apply least privilege IAM, harden runtime, patch regularly, and monitor for privilege escalation behavior.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }

    if (serviceType === "database_relational") {
      pushAuto(threats, `T:sqli:${n.id}`, {
        stride: "T",
        title: `SQL injection risk impacting ${label}`,
        description: `${label} is a relational datastore. Upstream inputs may lead to SQL injection or unsafe query construction.`,
        affectedNodeIds: [n.id],
        affectedEdgeIds: [],
        likelihood: 3,
        impact: 4,
        status: "open",
        mitigation: "Use parameterized queries/ORM, validate inputs, least privilege DB users, and monitor for anomalous queries.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }

    if (serviceType === "storage_object") {
      pushAuto(threats, `I:publicData:${n.id}`, {
        stride: "I",
        title: `Unauthorized data exposure from ${label}`,
        description: `${label} is object storage. Misconfigured access policies can expose sensitive data.`,
        affectedNodeIds: [n.id],
        affectedEdgeIds: [],
        likelihood: 3,
        impact: 4,
        status: "open",
        mitigation: "Enforce private buckets/containers, least privilege policies, encryption, and access logging.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }

    if (p.dataClassification === "Restricted" && !p.loggingEnabled) {
      pushAuto(threats, `R:logging:${n.id}`, {
        stride: "R",
        title: `Insufficient logging for ${label}`,
        description: `${label} handles restricted data but logging is not enabled (may hinder investigations).`,
        affectedNodeIds: [n.id],
        affectedEdgeIds: [],
        likelihood: 3,
        impact: 3,
        status: "open",
        mitigation: "Enable audit logs and forward to SIEM; define retention and alerting.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }

    if (n.data?.kind === "datastore" && p.encryptionAtRest !== true) {
      pushAuto(threats, `I:encAtRest:${n.id}`, {
        stride: "I",
        title: `Unencrypted data at rest in ${label}`,
        description: `Datastore "${label}" is not marked encrypted at rest.`,
        affectedNodeIds: [n.id],
        affectedEdgeIds: [],
        likelihood: 3,
        impact: 4,
        status: "open",
        mitigation: "Enable encryption at rest (KMS/Key Vault), rotate keys, restrict access.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }
  }

  for (const e of edges) {
    const dp = e.data?.props || {};
    const name = e.data?.label || "flow";

    if (dp.encryptionInTransit !== true) {
      pushAuto(threats, `I:tls:${e.id}`, {
        stride: "I",
        title: `Unencrypted data in transit on ${name}`,
        description: `The data flow "${name}" is not marked as encrypted in transit.`,
        affectedNodeIds: [],
        affectedEdgeIds: [e.id],
        likelihood: 4,
        impact: 4,
        status: "open",
        mitigation: "Use TLS/mTLS; enforce HTTPS-only; validate certs; consider private connectivity.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }
    if (dp.authOnFlow !== true) {
      pushAuto(threats, `S:authOnFlow:${e.id}`, {
        stride: "S",
        title: `Flow spoofing risk on ${name}`,
        description: `The data flow "${name}" is not marked as authenticated (mTLS, signed tokens, etc.).`,
        affectedNodeIds: [],
        affectedEdgeIds: [e.id],
        likelihood: 3,
        impact: 3,
        status: "open",
        mitigation: "Authenticate producers/consumers; use mTLS or signed tokens; lock down network paths.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }

    const sb = boundaryOf.get(e.source) || null;
    const tb = boundaryOf.get(e.target) || null;
    if (sb !== tb) {
      pushAuto(threats, `T:boundary:${e.id}`, {
        stride: "T",
        title: `Trust boundary crossing on ${name}`,
        description: `Data flow "${name}" crosses a trust boundary (source boundary: ${sb || "none"}, target boundary: ${tb || "none"}).`,
        affectedNodeIds: [e.source, e.target].filter(Boolean) as any,
        affectedEdgeIds: [e.id],
        likelihood: 3,
        impact: 4,
        status: "open",
        mitigation: "Validate boundary controls: network policy, authn/z, mTLS, input validation, logging, rate limits.",
        owner: "",
        commentary: [],
        findingIds: []
      });
    }
  }

  return threats;
}
