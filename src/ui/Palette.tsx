import React, { useMemo, useState } from "react";
import { SERVICE_CATALOG } from "../model/catalog";
import type { NodeKind } from "../model/types";
import { useTMStore } from "../model/store";
import { ServiceIcon } from "./Icon";

type DragPayload = { type: "basic" | "service"; kind: NodeKind; serviceId?: string };

function draggable(kind: NodeKind, payload: DragPayload, label: string, icon?: React.ReactNode) {
  return (
    <div
      className="item"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-tm", JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "copy";
      }}
    >
      <div className="row" style={{justifyContent:"space-between"}}>
        <div className="row">
          {icon}
          <div style={{fontWeight:650}}>{label}</div>
        </div>
        <span className="badge">{kind}</span>
      </div>
      {payload.type === "service" ? <div className="small muted">{SERVICE_CATALOG.find(s => s.id === payload.serviceId)?.category}</div> : null}
    </div>
  );
}

export function Palette() {
  const [q, setQ] = useState("");
  const [provider, setProvider] = useState<string>("all");

  const createProject = useTMStore((s) => s.createProject);
  const openProject = useTMStore((s) => s.openProject);
  const renameProject = useTMStore((s) => s.renameProject);
  const duplicateProject = useTMStore((s) => s.duplicateProject);
  const deleteProject = useTMStore((s) => s.deleteProject);
  const projects = useTMStore((s) => s.projects);
  const projectId = useTMStore((s) => s.projectId);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return SERVICE_CATALOG.filter((s) => {
      if (provider !== "all" && s.provider !== provider) return false;
      if (!qq) return true;
      return (s.name.toLowerCase().includes(qq) || s.category.toLowerCase().includes(qq));
    });
  }, [q, provider]);

  const cats = useMemo(() => {
    const map = new Map<string, typeof SERVICE_CATALOG>();
    for (const s of filtered) {
      const k = `${s.provider} • ${s.category}`;
      if (!map.has(k)) map.set(k, [] as any);
      (map.get(k) as any).push(s);
    }
    const arr = Array.from(map.entries());
const pin = (k: string) => {
  const lk = k.toLowerCase();
  if (lk.includes("security")) return 0;
  if (lk.includes("siem") || lk.includes("logging")) return 1;
  if (lk.includes("identity") || lk.includes("access")) return 2;
  return 3;
};
arr.sort((a,b) => {
  const pa = pin(a[0]); const pb = pin(b[0]);
  if (pa !== pb) return pa - pb;
  return a[0].localeCompare(b[0]);
});
return arr;
  }, [filtered]);

  return (
    <div className="col">
      <div className="brand">
        <div className="brandTitle">Threat Model Workspace</div>
        <div className="small muted">Friendly, enterprise-ready • browser-only</div>
      </div>
      <div className="card">
        <div className="cardTitle">Projects</div>
        <div className="row">
          <select className="select" value={projectId ?? ""} onChange={(e) => openProject(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="row">
          <button className="btn" onClick={() => createProject(prompt("Project name?") || "New project")}>New</button>
          <button className="btn" onClick={() => { const p = projects.find(x=>x.id===projectId); if(!p) return; renameProject(p.id, prompt("Rename project:", p.name) || p.name); }}>Rename</button>
          <button className="btn" onClick={() => projectId && duplicateProject(projectId)}>Duplicate</button>
          <button className="btn" onClick={() => projectId && confirm("Delete this project?") && deleteProject(projectId)}>Delete</button>
        </div>
        <div className="small muted">Projects are stored locally in your browser (no backend).</div>
      </div>

      <div className="card">
        <div className="cardTitle">Basic Shapes</div>
        <div className="list">
          {draggable("process", { type: "basic", kind: "process" }, "Process")}
          {draggable("datastore", { type: "basic", kind: "datastore" }, "Data Store")}
          {draggable("external", { type: "basic", kind: "external" }, "External Entity")}
          {draggable("trustBoundary", { type: "basic", kind: "trustBoundary" }, "Trust Boundary")}
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">Service Catalog</div>
        <input className="input" placeholder="Search services…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="row">
          <select className="select" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="all">All providers</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
            <option value="saas">SaaS</option>
            <option value="onprem">On-prem</option>
          </select>
        </div>

        <div className="small muted">Drag a service onto the canvas. Icons are generic (no trademarks).</div>
        <div className="hr" />
        <div className="list">
          {cats.slice(0, 40).map(([k, items]) => (
            <details key={k} open={k.includes("Security") || k.includes("SIEM")}>
              <summary className="small" style={{cursor:"pointer"}}>{k} <span className="muted">({items.length})</span></summary>
              <div className="list" style={{marginTop:6}}>
                {items.slice(0, 50).map((s) =>
                  draggable(
                    s.kind,
                    { type: "service", kind: s.kind, serviceId: s.id },
                    s.name,
                    <ServiceIcon provider={s.provider} category={s.category} name={s.name} />
                  )
                )}
              </div>
            </details>
          ))}
          {cats.length > 40 ? <div className="small muted">Showing first 40 categories; refine search to narrow.</div> : null}
        </div>
      </div>
    </div>
  );
}
