export type Theme = "light" | "dark";

export type Provider = "aws" | "azure" | "gcp" | "saas" | "onprem" | "hybrid" | "unknown";

export type NodeKind = "process" | "datastore" | "external" | "trustBoundary";

export type DataClassification = "Public" | "Internal" | "Confidential" | "Restricted";

export type TMNodeProps = {
  provider: Provider;
  serviceId?: string;
  serviceName?: string;
  category?: string;
  dataClassification: DataClassification;
  internetExposed?: boolean;
  authRequired?: boolean;
  loggingEnabled?: boolean;
  encryptionAtRest?: boolean;
};

export type TMEdgeProps = {
  protocol?: string;
  dataType?: string;
  encryptionInTransit?: boolean;
  authOnFlow?: boolean;
};

export type EvidenceStatus =
  | "draft"
  | "submitted"
  | "reviewed"
  | "verified"
  | "superseded"
  | "rejected";

export type Evidence = {
  id: string;
  createdAt: string;
  author?: string;
  note: string;
  links?: string[];
  status: EvidenceStatus;
};

export type ThreatStatus =
  | "open"
  | "in_analysis"
  | "mitigated"
  | "accepted"
  | "verified"
  | "rejected";

export type Threat = {
  framework?: string;
  frameworkRef?: string;
  frameworkCategory?: string;
  id: string;
  stride: "S" | "T" | "R" | "I" | "D" | "E";
  title: string;
  description: string;
  affectedNodeIds?: string[];
  affectedEdgeIds?: string[];
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  status: ThreatStatus;
  mitigation?: string;
  owner?: string;
  commentary?: Evidence[];
  findingIds?: string[];
};

export type FindingStatus =
  | "proposed"
  | "in_review"
  | "accepted"
  | "remediation_planned"
  | "remediated"
  | "verified"
  | "rejected";

import type { ControlCategoryId, ControlCoverage } from "./controls";

export type FindingControl = {
  id: string;
  category: ControlCategoryId;
  vendor: string;
  providedControl: string; // what it provides / how it compensates
  coverage: ControlCoverage;
  notes?: string;
};

export type Finding = {
  id: string;
  title: string;
  description?: string;
  status: FindingStatus;
  compensatingControls?: FindingControl[];
  owner?: string;
  evidence?: Evidence[];
  relatedThreatIds?: string[];
};

export type ThreatTemplate = {
  id: string;
  name: string;
  threats: Omit<Threat, "id">[];
};

export type ProjectMeta = {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
};


export type AuditEventType =
  | "threat_created"
  | "threat_updated"
  | "threat_status_changed"
  | "threat_evidence_added"
  | "finding_created"
  | "finding_updated"
  | "finding_control_added"
  | "finding_control_updated"
  | "finding_evidence_added";

export type AuditEvent = {
  id: string;
  at: string; // ISO timestamp
  type: AuditEventType;
  entity: { kind: "threat" | "finding" | "node" | "edge"; id: string };
  summary: string;
  details?: any;
};

export type Snapshot = {
  id: string;
  name: string;
  createdAt: string;
  model: TMModel;
};

export type TMModel = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  nodes: any[];
  edges: any[];
  threats: Threat[];
  findings: Finding[];
  templates?: ThreatTemplate[];
  audit?: AuditEvent[];
};

export type ValidationTarget = { kind: "node" | "edge" | "threat" | "finding"; id: string };

export type ValidationIssue = {
  id: string;
  severity: "info" | "warn" | "error";
  title: string;
  detail: string;
  target: ValidationTarget;
};
