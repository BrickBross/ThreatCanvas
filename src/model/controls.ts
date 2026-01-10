export type ControlCoverage = "partial" | "complete" | "unknown";

export type ControlCategoryId =
  | "EDR"
  | "NDR"
  | "CDR"
  | "SIEM"
  | "UEBA"
  | "SOAR"
  | "PAM"
  | "DLP"
  | "CASB"
  | "WAAP"
  | "WAF"
  | "ZTNA"
  | "SSE"
  | "CNAPP"
  | "CSPM"
  | "CIEM"
  | "CWP"
  | "ASM"
  | "EASM"
  | "SAST"
  | "DAST"
  | "SCA"
  | "KMS"
  | "SECRETS"
  | "EMAIL"
  | "IAM";

export type ControlVendor = {
  name: string;
  notes: string; // what the control provides
};

export type ControlCategory = {
  id: ControlCategoryId;
  name: string;
  description: string;
  vendors: ControlVendor[];
};

/**
 * Vendor lists are seeded from widely referenced market categories (e.g., Gartner Peer Insights markets).
 * Treat as a starting point, not a procurement shortlist.
 */
export const CONTROL_CATEGORIES: ControlCategory[] = [
  {
    id: "EDR",
    name: "EDR / Endpoint protection",
    description: "Endpoint detection & response and endpoint protection controls to prevent, detect, and respond on endpoints.",
    vendors: [
      { name: "CrowdStrike Falcon", notes: "Cloud-delivered EPP/EDR with strong detection and response workflows." },
      { name: "Microsoft Defender for Endpoint", notes: "Endpoint protection + EDR capabilities integrated with Microsoft security ecosystem." },
      { name: "SentinelOne Singularity", notes: "AI-driven endpoint protection + EDR with automated response." },
      { name: "Sophos Endpoint", notes: "Endpoint protection with EDR/XDR options and strong admin workflows." },
      { name: "Trend Vision One / Endpoint Security", notes: "Endpoint protection and response within broader XDR approach." },
      { name: "Palo Alto Cortex XDR (endpoint)", notes: "Endpoint + XDR detections with response orchestration integrations." },
      { name: "Broadcom Carbon Black", notes: "Endpoint security and response capabilities (vendor packaging varies)." },
      { name: "Bitdefender GravityZone", notes: "Endpoint security platform with EDR and control capabilities." }
    ]
  },
  {
    id: "NDR",
    name: "NDR / Network detection & response",
    description: "Network analytics and detections across east-west and north-south traffic to identify attacker behavior.",
    vendors: [
      { name: "Darktrace / NETWORK", notes: "AI-driven NDR with anomaly detection and response options." },
      { name: "Vectra AI Platform", notes: "Hybrid attack detection with prioritization and response integrations." },
      { name: "ExtraHop Reveal(x)", notes: "Network visibility + detections with response/integration options." },
      { name: "Corelight Open NDR Platform", notes: "Network telemetry/detections based on Zeek + enrichment workflows." },
      { name: "Arista NDR", notes: "Network visibility and detections (capabilities vary by deployment)." },
      { name: "Gigamon Deep Observability", notes: "Network telemetry enrichment often paired with NDR analytics." }
    ]
  },
  {
    id: "CDR",
    name: "CDR / Cloud detection & response",
    description: "Cloud runtime detections and response across cloud workloads and identities; often part of CNAPP/CSPM platforms.",
    vendors: [
      { name: "Microsoft Defender for Cloud", notes: "Cloud security posture + threat protection for cloud and some on-prem resources." },
      { name: "Palo Alto Prisma Cloud", notes: "Cloud security platform with runtime detections and response." },
      { name: "Wiz", notes: "Cloud security platform emphasizing broad visibility and risk prioritization." },
      { name: "Orca Security", notes: "Agentless cloud security platform with broad cloud coverage." },
      { name: "Lacework", notes: "Cloud security platform with detections and response capabilities." }
    ]
  },
  {
    id: "SIEM",
    name: "SIEM / Log management",
    description: "Centralize security telemetry, correlate events, and support investigations and compliance reporting.",
    vendors: [
      { name: "Microsoft Sentinel", notes: "Cloud-native SIEM with integrations across Microsoft ecosystem and beyond." },
      { name: "Splunk Enterprise Security", notes: "SIEM with powerful search/investigation and content ecosystem." },
      { name: "IBM Security QRadar SIEM", notes: "SIEM platform with correlation and investigation workflows (deployment varies)." },
      { name: "Google Chronicle (Security Operations)", notes: "Cloud-scale security analytics and detections (product naming varies)." },
      { name: "LogRhythm SIEM", notes: "SIEM platform with detections and investigation workflows." },
      { name: "Exabeam", notes: "SIEM + analytics focused on improved investigation and response workflows." },
      { name: "Sumo Logic (SIEM / Cloud SIEM)", notes: "Cloud logging/analytics with SIEM use cases." }
    ]
  },
  {
    id: "UEBA",
    name: "UEBA / Behavior analytics",
    description: "Behavior analytics for users/entities to detect anomalies and insider threats; often integrated with SIEM.",
    vendors: [
      { name: "Securonix", notes: "UEBA platform used for insider risk/anomaly detection use cases." },
      { name: "Exabeam UEBA", notes: "Behavior analytics commonly paired with SIEM workflows." },
      { name: "Gurucul", notes: "UEBA vendor used for behavior analytics and insider threat cases." },
      { name: "Splunk (behavior analytics)", notes: "Behavior analytics capabilities within Splunk ecosystem (offerings vary)." }
    ]
  },
  {
    id: "SOAR",
    name: "SOAR / Automation",
    description: "Security orchestration, automation and response for playbooks, case management and integrations.",
    vendors: [
      { name: "Palo Alto Cortex XSOAR", notes: "SOAR platform for playbooks, integrations, and case management." },
      { name: "Splunk SOAR", notes: "SOAR platform (formerly Phantom) with strong integration ecosystem." },
      { name: "IBM Security QRadar SOAR", notes: "SOAR platform for case mgmt and automation (capabilities vary)." },
      { name: "Swimlane Turbine", notes: "SOAR/automation platform emphasizing scale and orchestration." }
    ]
  },
  {
    id: "PAM",
    name: "PAM / Privileged access management",
    description: "Vault, manage and broker privileged credentials and sessions; reduce standing privileges.",
    vendors: [
      { name: "CyberArk", notes: "PAM suite for credential vaulting, session mgmt, and privileged controls." },
      { name: "BeyondTrust", notes: "PAM suite for access/session mgmt and privileged controls across environments." },
      { name: "Delinea", notes: "PAM tools for credential/session management and privilege control." },
      { name: "One Identity", notes: "PAM capabilities within broader IAM suite." }
    ]
  },
  {
    id: "DLP",
    name: "DLP / Data loss prevention",
    description: "Detect and prevent sensitive data exfiltration across endpoint, network, email and cloud channels.",
    vendors: [
      { name: "Microsoft Purview DLP", notes: "M365-integrated DLP for endpoints/email/cloud data locations." },
      { name: "Broadcom Symantec DLP", notes: "Enterprise DLP suite with policy-based controls." },
      { name: "Proofpoint Enterprise DLP", notes: "DLP with strength in messaging/email-centric data protection." },
      { name: "Forcepoint DLP", notes: "DLP suite with policy enforcement across channels." }
    ]
  },
  {
    id: "CASB",
    name: "CASB / SaaS security",
    description: "Visibility and policy enforcement for SaaS usage; can include shadow IT discovery and controls.",
    vendors: [
      { name: "Microsoft Defender for Cloud Apps", notes: "CASB capabilities integrated with Microsoft ecosystem." },
      { name: "Netskope", notes: "SaaS security controls often delivered as part of SSE platform." },
      { name: "Skyhigh Security", notes: "CASB/SSE vendor (formerly McAfee Enterprise CASB lineage)." }
    ]
  },
  {
    id: "SSE",
    name: "SSE / Security Service Edge",
    description: "Cloud-delivered security stack (often SWG/CASB/ZTNA) to protect users and data.",
    vendors: [
      { name: "Netskope One SSE", notes: "SSE platform covering web, SaaS and private app access controls." },
      { name: "Palo Alto Prisma Access", notes: "SSE capabilities for secure access and policy enforcement." },
      { name: "Zscaler", notes: "SSE platform for secure web and private access (offerings vary)." },
      { name: "Skyhigh Security Service Edge", notes: "SSE platform with web/SaaS controls." }
    ]
  },
  {
    id: "ZTNA",
    name: "ZTNA / Zero Trust Network Access",
    description: "Replace/augment VPN with application-level access and identity-aware controls.",
    vendors: [
      { name: "Zscaler ZPA", notes: "Private application access with identity-aware controls." },
      { name: "Palo Alto Prisma Access (ZTNA)", notes: "ZTNA options within Prisma Access/SSE bundle." },
      { name: "Cloudflare Zero Trust", notes: "ZTNA-style private access and security services." }
    ]
  },
  {
    id: "WAAP",
    name: "WAAP / Web app & API protection",
    description: "Cloud WAAP (WAF + API security + bot mgmt etc.) to protect web apps and APIs at runtime.",
    vendors: [
      { name: "Cloudflare Application Services", notes: "WAF/WAAP services with DDoS/bot/API protections." },
      { name: "Akamai App & API Protector", notes: "WAAP-style protections for apps/APIs with DDoS ecosystem." },
      { name: "F5 (WAAP)", notes: "WAF/WAAP capabilities across cloud and hybrid deployment models." },
      { name: "Imperva Application Security", notes: "WAF/WAAP and data security portfolio (offerings vary)." }
    ]
  },
  {
    id: "WAF",
    name: "WAF / Web application firewall",
    description: "Protect web apps from common exploits; often a subset of WAAP platforms.",
    vendors: [
      { name: "F5 Advanced WAF", notes: "WAF for application protection, can be deployed in several modes." },
      { name: "Azure Web Application Firewall", notes: "WAF capability integrated with Azure networking." },
      { name: "Cloudflare WAF", notes: "Cloud WAF with bot and DDoS ecosystem." },
      { name: "Imperva WAF", notes: "WAF product family for web app protection." }
    ]
  },
  {
    id: "CNAPP",
    name: "CNAPP / Cloud-native app protection",
    description: "Unified cloud security across posture, workload and identity risks (vendor scopes vary).",
    vendors: [
      { name: "Wiz CNAPP", notes: "Cloud security platform focusing on risk prioritization and coverage." },
      { name: "Palo Alto Prisma Cloud (CNAPP)", notes: "CNAPP platform covering posture, workload and pipeline security." },
      { name: "Microsoft Defender for Cloud (CNAPP)", notes: "Cloud security platform spanning posture and protections." },
      { name: "Orca Security (CNAPP)", notes: "Agentless CNAPP-style platform coverage." }
    ]
  },
  {
    id: "CSPM",
    name: "CSPM / Cloud security posture mgmt",
    description: "Configuration and posture monitoring to reduce cloud misconfiguration risk.",
    vendors: [
      { name: "Microsoft Defender for Cloud (CSPM)", notes: "Posture management for cloud and some hybrid resources." },
      { name: "Palo Alto Prisma Cloud (CSPM)", notes: "Posture management within broader CNAPP suite." },
      { name: "Wiz (CSPM)", notes: "Agentless posture and risk visibility." }
    ]
  },
  {
    id: "CIEM",
    name: "CIEM / Cloud infrastructure entitlement mgmt",
    description: "Manage and reduce cloud identity/permission sprawl; detect excessive entitlements.",
    vendors: [
      { name: "Microsoft Entra Permissions Management", notes: "CIEM capability for permissions governance." },
      { name: "Palo Alto Prisma Cloud (CIEM)", notes: "Entitlement visibility within cloud security platform." },
      { name: "Wiz (entitlements)", notes: "Cloud entitlement visibility features (packaging varies)." }
    ]
  },
  {
    id: "CWP",
    name: "CWP / Cloud workload protection",
    description: "Protect compute workloads (VM/container/serverless) with runtime protections/detections.",
    vendors: [
      { name: "Microsoft Defender for Cloud (CWP)", notes: "Workload protections and alerts for cloud workloads." },
      { name: "Palo Alto Prisma Cloud (CWP)", notes: "Runtime workload protections within CNAPP." },
      { name: "Trend Vision One (CWP)", notes: "Workload security (capabilities vary by product)." }
    ]
  },
  {
    id: "ASM",
    name: "ASM / Attack surface management",
    description: "Discover and monitor exposed assets and vulnerabilities; prioritize external exposure.",
    vendors: [
      { name: "Rapid7 Attack Surface Management", notes: "External exposure discovery and risk prioritization." },
      { name: "Palo Alto Cortex Xpanse", notes: "Attack surface discovery and exposure management." },
      { name: "Microsoft Defender EASM", notes: "External attack surface management within Microsoft security." }
    ]
  },
  {
    id: "EASM",
    name: "EASM / External attack surface mgmt",
    description: "External asset discovery, inventory and exposure tracking (subset of ASM).",
    vendors: [
      { name: "Microsoft Defender EASM", notes: "External attack surface management and exposure insights." },
      { name: "Palo Alto Cortex Xpanse", notes: "External attack surface management and discovery." },
      { name: "Rapid7 (EASM)", notes: "External exposure discovery and management." }
    ]
  },
  {
    id: "SAST",
    name: "SAST / Static app security testing",
    description: "Find insecure code patterns in source code to prevent vulnerabilities earlier.",
    vendors: [
      { name: "Checkmarx", notes: "SAST and application security platform tools." },
      { name: "Veracode", notes: "Application security platform with static analysis." },
      { name: "Synopsys", notes: "Static analysis and software integrity tools (offerings vary)." }
    ]
  },
  {
    id: "DAST",
    name: "DAST / Dynamic app security testing",
    description: "Test running apps for vulnerabilities (black-box style) to find runtime issues.",
    vendors: [
      { name: "Invicti (Acunetix/Netsparker)", notes: "DAST tooling for web app vulnerability discovery." },
      { name: "Rapid7 AppSpider", notes: "DAST tool for application scanning and testing." }
    ]
  },
  {
    id: "SCA",
    name: "SCA / Software composition analysis",
    description: "Track and reduce risk in OSS dependencies (licenses + vulnerabilities).",
    vendors: [
      { name: "Snyk", notes: "SCA/dependency risk management with developer workflows." },
      { name: "GitHub Advanced Security (dependency)", notes: "Dependency scanning and advisory workflows." },
      { name: "Sonatype Nexus", notes: "OSS governance and dependency risk controls." }
    ]
  },
  {
    id: "IAM",
    name: "IAM / Identity & access management",
    description: "Centralized identity, authentication, authorization and lifecycle management.",
    vendors: [
      { name: "Microsoft Entra ID", notes: "Enterprise identity and access management." },
      { name: "Okta", notes: "Identity platform for workforce/customer identity (capabilities vary)." },
      { name: "Ping Identity", notes: "Identity platform for authN/authZ and federation." }
    ]
  },
  {
    id: "KMS",
    name: "KMS / Key management",
    description: "Centralized cryptographic key management and lifecycle controls.",
    vendors: [
      { name: "AWS KMS", notes: "Managed key management integrated with AWS services." },
      { name: "Azure Key Vault (keys)", notes: "Managed keys and HSM options in Azure." },
      { name: "Google Cloud KMS", notes: "Managed key management integrated with GCP services." }
    ]
  },
  {
    id: "SECRETS",
    name: "Secrets management",
    description: "Secure storage and rotation of application secrets and credentials.",
    vendors: [
      { name: "HashiCorp Vault", notes: "Secrets management and dynamic credentials (deployment varies)." },
      { name: "AWS Secrets Manager", notes: "Managed secrets storage and rotation in AWS." },
      { name: "Azure Key Vault (secrets)", notes: "Secret storage, rotation patterns and integrations." }
    ]
  },
  {
    id: "EMAIL",
    name: "Email security",
    description: "Protect email channels from phishing, malware, BEC and data leakage.",
    vendors: [
      { name: "Proofpoint", notes: "Email security with strong phishing and BEC protections." },
      { name: "Microsoft Defender for Office 365", notes: "Email security protections integrated with M365." },
      { name: "Mimecast", notes: "Email security platform with threat protection and continuity options." }
    ]
  }
];
