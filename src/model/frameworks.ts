import type { TMModel, Threat } from "./types";
import { generateStride } from "./stride_simple";

export type FrameworkWeights = Record<FrameworkId, { likelihood: number; impact: number }>;

export type FrameworkId = "STRIDE" | "OWASP_WEB" | "OWASP_API" | "MITRE_TACTICS" | "CIA";

export const DEFAULT_WEIGHTS: FrameworkWeights = {
  STRIDE: { likelihood: 3, impact: 3 },
  OWASP_WEB: { likelihood: 3, impact: 4 },
  OWASP_API: { likelihood: 3, impact: 4 },
  MITRE_TACTICS: { likelihood: 3, impact: 4 },
  CIA: { likelihood: 3, impact: 3 }
};

export const FRAMEWORKS: { id: FrameworkId; name: string; description: string }[] = [
  { id: "STRIDE", name: "STRIDE", description: "Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege." },
  { id: "OWASP_WEB", name: "OWASP Top 10 (Web)", description: "High-level web application risks (OWASP Top 10 style)." },
  { id: "OWASP_API", name: "OWASP API Top 10 (API)", description: "High-level API risks (OWASP API Top 10 style)." },
  { id: "MITRE_TACTICS", name: "MITRE ATT&CK (Tactics)", description: "Tactic-level adversary objectives (high level)." },
  { id: "CIA", name: "CIA Triad", description: "Confidentiality, Integrity, Availability lens." }
];

function baseThreat(partial: Omit<Threat,"id">): Omit<Threat,"id"> {
  return {
    stride: "T",
    title: partial.title,
    description: partial.description || "",
    affectedNodeIds: partial.affectedNodeIds || [],
    affectedEdgeIds: partial.affectedEdgeIds || [],
    likelihood: partial.likelihood ?? 3,
    impact: partial.impact ?? 3,
    status: partial.status ?? "open",
    mitigation: partial.mitigation || "",
    owner: partial.owner || "",
    commentary: partial.commentary || [],
    findingIds: partial.findingIds || [],
    framework: partial.framework,
    frameworkRef: partial.frameworkRef,
    frameworkCategory: partial.frameworkCategory
  };
}

export function generateFromFrameworks(model: TMModel, frameworks: FrameworkId[], selection?: { nodeId?: string | null; edgeId?: string | null }, opts?: { weights?: Partial<FrameworkWeights>; gapsOnly?: boolean }) {
  const nodeIds = selection?.nodeId ? [selection.nodeId] : [];
  const edgeIds = selection?.edgeId ? [selection.edgeId] : [];

  const out: Omit<Threat,"id">[] = [];

  const existingKeys = new Set<string>();
  for (const t of model.threats || []) {
    const k = `${(t as any).framework || ""}|${(t as any).frameworkRef || ""}|${t.title}`;
    existingKeys.add(k);
  }

  const weights = { ...DEFAULT_WEIGHTS, ...(opts?.weights || {}) } as any;

  if (frameworks.includes("STRIDE")) {
    const stride = generateStride(model).map((t: any) => ({ ...t, framework: "STRIDE", likelihood: t.likelihood ?? weights.STRIDE.likelihood, impact: t.impact ?? weights.STRIDE.impact }));
    // If selection exists, scope to it; otherwise keep as-is.
    out.push(
      ...stride.map((t) =>
        baseThreat({
          ...t,
          affectedNodeIds: nodeIds.length ? nodeIds : (t as any).affectedNodeIds || [],
          affectedEdgeIds: edgeIds.length ? edgeIds : (t as any).affectedEdgeIds || []
        } as any)
      )
    );
  }

  if (frameworks.includes("OWASP_WEB")) {
    const items = [
      { ref: "A01", title: "Broken access control", desc: "Users can access resources/actions beyond intended permissions.", mit: "Enforce server-side authorization, least privilege, deny by default, add tests." },
      { ref: "A02", title: "Cryptographic failures", desc: "Sensitive data exposed due to weak/missing crypto or poor key handling.", mit: "Use modern TLS, encrypt sensitive data, rotate keys, avoid custom crypto." },
      { ref: "A03", title: "Injection", desc: "Untrusted input reaches interpreters (SQL/NoSQL/OS/LDAP/etc).", mit: "Use parameterized queries, input validation, escaping, safe APIs." },
      { ref: "A04", title: "Insecure design", desc: "Design gaps create systemic exposure (missing threat modeling, misuse cases).", mit: "Add secure design reviews, abuse-case testing, and security requirements." },
      { ref: "A05", title: "Security misconfiguration", desc: "Default/weak configuration, overly permissive settings, exposed admin surfaces.", mit: "Harden configs, use IaC baselines, continuous config scanning." },
      { ref: "A06", title: "Vulnerable and outdated components", desc: "Libraries/platforms with known vulnerabilities are in use.", mit: "SBOM, patching SLAs, dependency scanning, remove unused dependencies." },
      { ref: "A07", title: "Identification and authentication failures", desc: "Weak auth, session handling, or token validation.", mit: "Use strong auth (OIDC), MFA, secure session handling, rotate keys." },
      { ref: "A08", title: "Software and data integrity failures", desc: "Supply chain or integrity failures (CI/CD, updates, serialization).", mit: "Sign builds, protect pipelines, verify integrity, restrict deserialization." },
      { ref: "A09", title: "Security logging and monitoring failures", desc: "Insufficient logging/alerting prevents detection and response.", mit: "Centralize logs, alert on anomalies, ensure retention and coverage." },
      { ref: "A10", title: "Server-side request forgery (SSRF)", desc: "App can be tricked into making unintended outbound requests.", mit: "Egress controls, allow-lists, metadata protection, input validation." }
    ];
    out.push(
      ...items.map((i) =>
        baseThreat({
          framework: "OWASP Top 10 (Web)",
          frameworkRef: i.ref,
          frameworkCategory: i.title,
          stride: "T",
          title: `${i.ref}: ${i.title}`,
          description: i.desc,
          mitigation: i.mit,
          affectedNodeIds: nodeIds,
          affectedEdgeIds: edgeIds,
          likelihood: weights.OWASP_WEB.likelihood,
          impact: weights.OWASP_WEB.impact,
          status: "open"
        } as any)
      )
    );
  }

  if (frameworks.includes("OWASP_API")) {
    const items = [
      { ref: "API1", title: "Broken object level authorization", desc: "Object-level access checks missing or inconsistent.", mit: "Enforce object-level authorization server-side; deny by default." },
      { ref: "API2", title: "Broken authentication", desc: "Weak auth, token/session issues, missing validation.", mit: "Use OIDC, validate tokens, rotate keys, protect refresh tokens." },
      { ref: "API3", title: "Broken object property level authorization", desc: "Mass assignment or exposure of sensitive object properties.", mit: "Use allow-lists, DTOs, field-level authz, response filtering." },
      { ref: "API4", title: "Unrestricted resource consumption", desc: "No rate limits/quotas; DoS via heavy requests.", mit: "Rate limits, quotas, pagination, timeouts, circuit breakers." },
      { ref: "API5", title: "Broken function level authorization", desc: "Users can invoke privileged functions/operations.", mit: "Enforce function-level authz, RBAC/ABAC, least privilege." },
      { ref: "API6", title: "Unrestricted access to sensitive business flows", desc: "Abuse of business logic flows (fraud, scraping).", mit: "Detect abuse patterns, add friction, anomaly monitoring, rules." },
      { ref: "API7", title: "Server-side request forgery (SSRF)", desc: "API triggers unintended outbound requests.", mit: "Egress controls, allow-lists, metadata protection." },
      { ref: "API8", title: "Security misconfiguration", desc: "Default/weak configurations expose APIs.", mit: "Harden gateways, disable unused endpoints, secure headers." },
      { ref: "API9", title: "Improper inventory management", desc: "Unknown/old API versions exposed.", mit: "Maintain inventory, deprecate old versions, gateway policy." },
      { ref: "API10", title: "Unsafe consumption of APIs", desc: "Trusting third-party API responses without validation.", mit: "Validate responses, timeouts, circuit breakers, retries, schema checks." }
    ];
    out.push(
      ...items.map((i) =>
        baseThreat({
          framework: "OWASP API Top 10 (high level)",
          frameworkRef: i.ref,
          frameworkCategory: i.title,
          stride: "T",
          title: `${i.ref}: ${i.title}`,
          description: i.desc,
          mitigation: i.mit,
          affectedNodeIds: nodeIds,
          affectedEdgeIds: edgeIds,
          likelihood: weights.OWASP_WEB.likelihood,
          impact: weights.OWASP_WEB.impact,
          status: "open"
        } as any)
      )
    );
  }

  if (frameworks.includes("MITRE_TACTICS")) {
    const tactics = [
      { name: "Initial Access", desc: "How an adversary could gain entry (phishing, exposed services, supply chain)." },
      { name: "Execution", desc: "Running malicious code in your environment (scripts, binaries, abuse of tooling)." },
      { name: "Persistence", desc: "Maintaining access (tokens, backdoors, scheduled tasks, IAM changes)." },
      { name: "Privilege Escalation", desc: "Gaining higher privileges (misconfig, IAM abuse, vulnerable components)." },
      { name: "Defense Evasion", desc: "Avoiding detection (log tampering, disabling controls, obfuscation)." },
      { name: "Credential Access", desc: "Stealing credentials/secrets (dumping, token theft, secrets exposure)." },
      { name: "Lateral Movement", desc: "Moving between systems (pivoting, remote services, identity misuse)." },
      { name: "Exfiltration", desc: "Stealing data out of the environment (egress paths, APIs, storage)." },
      { name: "Impact", desc: "Disruption or destruction (DoS, ransomware, data manipulation)." }
    ];
    out.push(
      ...tactics.map((t) =>
        baseThreat({
          framework: "MITRE ATT&CK (Tactic)",
          frameworkRef: t.name,
          frameworkCategory: t.name,
          stride: "T",
          title: `MITRE Tactic: ${t.name}`,
          description: t.desc,
          mitigation: "Validate control coverage for this tactic (identity hardening, segmentation, monitoring, least privilege).",
          affectedNodeIds: nodeIds,
          affectedEdgeIds: edgeIds,
          likelihood: weights.OWASP_WEB.likelihood,
          impact: weights.OWASP_WEB.impact,
          status: "open"
        } as any)
      )
    );
  }

  if (frameworks.includes("CIA")) {
    const items = [
      { k: "Confidentiality", desc: "Sensitive data is exposed to unauthorized parties.", mit: "Access control, encryption, segmentation, secrets management." },
      { k: "Integrity", desc: "Data or transactions are modified without authorization.", mit: "Strong authz, signing, validation, tamper-evident logs." },
      { k: "Availability", desc: "Systems/services become unavailable or degraded.", mit: "Redundancy, rate limits, autoscaling, DDoS protection, runbooks." }
    ];
    out.push(
      ...items.map((i) =>
        baseThreat({
          framework: "CIA Triad",
          frameworkRef: i.k,
          frameworkCategory: i.k,
          stride: "T",
          title: `CIA: ${i.k}`,
          description: i.desc,
          mitigation: i.mit,
          affectedNodeIds: nodeIds,
          affectedEdgeIds: edgeIds,
          likelihood: weights.OWASP_WEB.likelihood,
          impact: weights.OWASP_WEB.impact,
          status: "open"
        } as any)
      )
    );
  }

  // De-dupe by (frameworkRef/title)
  const seen = new Set<string>();
  const filtered = out.filter((t) => {
    const k = `${t.framework || ""}|${t.frameworkRef || ""}|${t.title}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const gapsOnly = opts?.gapsOnly ?? true;
  if (!gapsOnly) return filtered;
  return filtered.filter((t) => {
    const k = `${t.framework || ""}|${t.frameworkRef || ""}|${t.title}`;
    return !existingKeys.has(k);
  });
}

