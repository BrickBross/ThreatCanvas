import React from "react";

export function iconGroup(provider: string, category: string) {
  const p = (provider || "").toLowerCase();
  const c = (category || "").toLowerCase();
  if (p === "aws") return "aws";
  if (p === "azure") return "azure";
  if (p === "gcp") return "gcp";
  if (p === "saas") return "saas";
  if (p === "onprem") return "onprem";

  if (c.includes("siem") || c.includes("logging")) return "logs";
  if (c.includes("identity") || c.includes("iam") || c.includes("auth")) return "key";
  if (c.includes("network") || c.includes("gateway") || c.includes("cdn")) return "net";
  if (c.includes("database") || c.includes("storage") || c.includes("data")) return "db";
  if (c.includes("compute") || c.includes("container") || c.includes("server")) return "cpu";
  if (c.includes("security") || c.includes("waf") || c.includes("casb")) return "shield";
  return "box";
}

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function IconSvg({ g }: { g: string }) {
  switch (g) {
    case "shield":
      return <Svg><path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z" /></Svg>;
    case "logs":
      return <Svg><path d="M5 7h14" /><path d="M5 12h14" /><path d="M5 17h14" /><circle cx="7" cy="7" r="1" /><circle cx="7" cy="12" r="1" /><circle cx="7" cy="17" r="1" /></Svg>;
    case "key":
      return <Svg><circle cx="8" cy="12" r="3" /><path d="M11 12h10" /><path d="M17 12v3" /><path d="M14 12v2" /></Svg>;
    case "db":
      return <Svg><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></Svg>;
    case "net":
      return <Svg><path d="M4 12h16" /><path d="M12 4v16" /><circle cx="12" cy="12" r="3" /></Svg>;
    case "cpu":
      return <Svg><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M9 1v4" /><path d="M15 1v4" /><path d="M9 19v4" /><path d="M15 19v4" /><path d="M1 9h4" /><path d="M1 15h4" /><path d="M19 9h4" /><path d="M19 15h4" /></Svg>;
    case "aws":
      return <Svg><path d="M7 17c2 2 8 2 10 0" /><path d="M8 7h8" /><path d="M9 7v8" /><path d="M15 7v8" /><path d="M8 15h8" /></Svg>;
    case "azure":
      return <Svg><path d="M6 20l6-16 6 16" /><path d="M9 14h6" /></Svg>;
    case "gcp":
      return <Svg><path d="M7 17a5 5 0 0 1 0-10" /><path d="M17 7a5 5 0 0 1 0 10" /><path d="M7 7h10" /></Svg>;
    case "saas":
      return <Svg><path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 10 1 3 3 0 0 1-1 7H7z" /></Svg>;
    case "onprem":
      return <Svg><path d="M4 10l8-6 8 6" /><path d="M6 10v10h12V10" /></Svg>;
    default:
      return <Svg><rect x="6" y="6" width="12" height="12" rx="2" /></Svg>;
  }
}

export function ServiceIcon({ provider, category, name }: { provider: string; category: string; name: string }) {
  const g = iconGroup(provider, category);
  return (
    <span className="serviceIcon" title={`${provider}${category ? " • " + category : ""}`}>
      <IconSvg g={g} />
      <span className="serviceName" data-tm-label>{name}</span>
    </span>
  );
}
