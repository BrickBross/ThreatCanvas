import type { NodeKind } from "./types";

export type ServiceType =
  | "compute_vm"
  | "compute_serverless"
  | "database_relational"
  | "database_nosql"
  | "storage_object"
  | "network_edge"
  | "network_lb"
  | "iam"
  | "security"
  | "messaging"
  | "unknown";

export type ServiceCatalogEntry = {
  provider: string;
  category: string;
  name: string;
  id: string;
  kind: NodeKind;
  defaultProps?: any;
};

export function classifyService(entry: Pick<ServiceCatalogEntry, "provider" | "category" | "name" | "id" | "kind">): {
  nodeKind: NodeKind;
  serviceType: ServiceType;
  tag: string;
} {
  const provider = (entry.provider || "").toLowerCase();
  const name = (entry.name || "").toLowerCase();
  const cat = (entry.category || "").toLowerCase();

  // Strong name-based mappings (common across vendors)
  if (name.includes("functions") || name.includes("lambda") || name.includes("cloud functions") || name.includes("cloud run")) {
    return { nodeKind: "process", serviceType: "compute_serverless", tag: "serverless" };
  }
  if (name.includes("ec2") || name.includes("compute engine") || name.includes("virtual machine") || name.includes("vm")) {
    return { nodeKind: "process", serviceType: "compute_vm", tag: "vm" };
  }
  if (name.includes("rds") || name.includes("aurora") || name.includes("sql") || name.includes("postgres") || name.includes("mysql")) {
    return { nodeKind: "datastore", serviceType: "database_relational", tag: "rdbms" };
  }
  if (name.includes("dynamodb") || name.includes("cosmos") || name.includes("firestore") || name.includes("bigtable")) {
    return { nodeKind: "datastore", serviceType: "database_nosql", tag: "nosql" };
  }
  if (name.includes("s3") || name.includes("cloud storage") || name.includes("blob") || name.includes("object storage")) {
    return { nodeKind: "datastore", serviceType: "storage_object", tag: "object storage" };
  }
  if (name.includes("api gateway") || name.includes("cloudfront") || name.includes("cdn")) {
    return { nodeKind: "process", serviceType: "network_edge", tag: "edge" };
  }
  if (name.includes("alb") || name.includes("nlb") || name.includes("load balancer") || name.includes("application gateway")) {
    return { nodeKind: "process", serviceType: "network_lb", tag: "lb" };
  }
  if (name.includes("iam") || name.includes("entra") || name.includes("active directory") || cat.includes("identity")) {
    return { nodeKind: provider === "saas" ? "external" : "process", serviceType: "iam", tag: "iam" };
  }
  if (cat.includes("security") || name.includes("waf") || name.includes("guardduty") || name.includes("defender") || name.includes("sentinel")) {
    return { nodeKind: "process", serviceType: "security", tag: "security" };
  }
  if (cat.includes("messaging") || name.includes("sqs") || name.includes("sns") || name.includes("pub/sub") || name.includes("service bus")) {
    return { nodeKind: "process", serviceType: "messaging", tag: "messaging" };
  }

  // Fallback: keep catalog kind, add coarse type by category
  if (cat.includes("data") || cat.includes("storage") || cat.includes("database")) {
    return { nodeKind: entry.kind === "datastore" ? "datastore" : "datastore", serviceType: "unknown", tag: "data" };
  }
  return { nodeKind: entry.kind || "process", serviceType: "unknown", tag: entry.kind || "process" };
}
