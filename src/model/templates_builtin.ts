import type { ThreatTemplate, Threat } from "./types";

export const builtinTemplates: ThreatTemplate[] = [
  {
    id: "tmpl-owasp-api-top10-starter",
    name: "OWASP API Top 10 – Starter (high level)",
    threats: [
      {
        stride: "S",
        title: "Broken authentication / weak token validation",
        description: "API accepts weak/expired tokens or lacks robust authn.",
        affectedNodeIds: [],
        affectedEdgeIds: [],
        likelihood: 4,
        impact: 4,
        status: "open",
        mitigation: "Use strong authn (OIDC), validate tokens, rotate keys, protect refresh tokens.",
        owner: "",
        commentary: [],
        findingIds: []
      },
      {
        stride: "T",
        title: "Broken object level authorization (BOLA)",
        description: "Users can access objects they do not own by changing identifiers.",
        affectedNodeIds: [],
        affectedEdgeIds: [],
        likelihood: 4,
        impact: 5,
        status: "open",
        mitigation: "Enforce object-level access checks server-side; deny by default.",
        owner: "",
        commentary: [],
        findingIds: []
      },
      {
        stride: "I",
        title: "Sensitive data exposure in responses/logs",
        description: "PII/secrets returned to clients or logged in plaintext.",
        affectedNodeIds: [],
        affectedEdgeIds: [],
        likelihood: 3,
        impact: 5,
        status: "open",
        mitigation: "Minimize data, mask/redact logs, encrypt, apply DLP controls.",
        owner: "",
        commentary: [],
        findingIds: []
      }
    ]
  },
  {
    id: "tmpl-cloud-logging-siem",
    name: "Logging/SIEM – Controls",
    threats: [
      {
        stride: "R",
        title: "Insufficient audit logging for investigation",
        description: "Key events are not logged or not centrally searchable.",
        affectedNodeIds: [],
        affectedEdgeIds: [],
        likelihood: 4,
        impact: 4,
        status: "open",
        mitigation: "Enable audit logs, normalize and route via Cribl, correlate in SIEM, define retention.",
        owner: "",
        commentary: [],
        findingIds: []
      },
      {
        stride: "T",
        title: "Log pipeline tampering / suppression",
        description: "Attackers can disable collectors or alter log streams.",
        affectedNodeIds: [],
        affectedEdgeIds: [],
        likelihood: 3,
        impact: 4,
        status: "open",
        mitigation: "Harden agents, protect credentials, monitor pipeline health, use immutable storage, alert on gaps.",
        owner: "",
        commentary: [],
        findingIds: []
      }
    ]
  },
  {
    id: "tmpl-trust-boundary-review",
    name: "Trust Boundary Review – Checklist Threats",
    threats: [
      {
        stride: "T",
        title: "Boundary crossing lacks mTLS and strong authz",
        description: "Cross-boundary traffic is not mutually authenticated and authorized.",
        affectedNodeIds: [],
        affectedEdgeIds: [],
        likelihood: 3,
        impact: 4,
        status: "open",
        mitigation: "Enforce mTLS, least privilege, network policy, and rate limiting across boundary.",
        owner: "",
        commentary: [],
        findingIds: []
      },
      {
        stride: "D",
        title: "Rate limiting missing at boundary entrypoints",
        description: "Untrusted traffic can cause resource exhaustion.",
        affectedNodeIds: [],
        affectedEdgeIds: [],
        likelihood: 4,
        impact: 3,
        status: "open",
        mitigation: "Rate limit, quotas, circuit breakers, WAF, autoscaling and alarms.",
        owner: "",
        commentary: [],
        findingIds: []
      }
    ]
  }
];

export function cloneTemplateThreats(t: ThreatTemplate): Omit<Threat,"id">[] {
  return t.threats.map(x => ({...x}));
}
