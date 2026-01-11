import React, { useMemo, useState } from "react";
import { SERVICE_CATALOG } from "../model/catalog";
import { useTMStore } from "../model/store";
import type { NodeKind } from "../model/types";
import { ServiceIcon } from "./Icon";

type DragPayload = { type: "basic" | "service"; kind: NodeKind; serviceId?: string };

function DraggableItem({ kind, payload, label, icon }: { kind: NodeKind; payload: DragPayload; label: string; icon?: React.ReactNode }) {
  return (
    <div
      className="item"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-tm", JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "copy";
      }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ minWidth: 0 }}>
          {icon}
          <div style={{ fontWeight: 650 }}>{label}</div>
        </div>
        <span className="badge">{kind}</span>
      </div>
      {payload.type === "service" ? (
        <div className="small muted">{SERVICE_CATALOG.find((s) => s.id === payload.serviceId)?.category}</div>
      ) : null}
    </div>
  );
}

export function Palette() {
  const [q, setQ] = useState("");
  const theme = useTMStore((s) => (s as any).theme) as "light" | "dark";
  const setTheme = useTMStore((s) => (s as any).setTheme) as (t: "light" | "dark") => void;

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
      if (!qq) return true;
      return s.name.toLowerCase().includes(qq) || s.category.toLowerCase().includes(qq);
    });
  }, [q]);

  const servicesByProvider = useMemo(() => {
    const providers = ["aws", "azure", "gcp", "saas", "onprem"] as const;
    const out = new Map<string, typeof SERVICE_CATALOG>();
    for (const p of providers) out.set(p, [] as any);
    for (const s of filtered) (out.get(s.provider) as any)?.push(s);
    for (const [p, list] of out.entries()) {
      list.sort((a: any, b: any) => (a.category + a.name).localeCompare(b.category + b.name));
    }
    return out;
  }, [filtered]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({ aws: true });

  return (
    <div className="tech-palette">
      <div className="palette-header">
        <h2>Technologies</h2>
        <input className="search-input" placeholder="Search services..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
          <button className="btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            Theme: {theme === "dark" ? "Dark" : "Light"}
          </button>
          <span className="small muted">{projects.length} projects</span>
        </div>
      </div>

      <div className="palette-content">
        <div className="card paletteSection" style={{ marginBottom: 12 }}>
          <div className="cardTitle">Projects</div>
          <div className="row">
            <select className="select" value={projectId ?? ""} onChange={(e) => openProject(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn" onClick={() => createProject(prompt("Project name?") || "New project")}>New</button>
            <button className="btn" onClick={() => { const p = projects.find((x) => x.id === projectId); if (!p) return; renameProject(p.id, prompt("Rename project:", p.name) || p.name); }}>Rename</button>
            <button className="btn" onClick={() => projectId && duplicateProject(projectId)}>Duplicate</button>
            <button className="btn" onClick={() => projectId && confirm("Delete this project?") && deleteProject(projectId)}>Delete</button>
          </div>
        </div>

        <div className="card paletteSection" style={{ marginBottom: 12 }}>
          <div className="cardTitle">Shapes</div>
          <div className="list">
            <DraggableItem kind="process" payload={{ type: "basic", kind: "process" }} label="Process" />
            <DraggableItem kind="datastore" payload={{ type: "basic", kind: "datastore" }} label="Data store" />
            <DraggableItem kind="external" payload={{ type: "basic", kind: "external" }} label="External entity" />
            <DraggableItem kind="trustBoundary" payload={{ type: "basic", kind: "trustBoundary" }} label="Trust boundary" />
          </div>
        </div>

        {Array.from(servicesByProvider.entries()).map(([prov, list]) => {
          if (!list.length) return null;
          const isOpen = !!expanded[prov] || q.trim().length > 0;
          return (
            <div key={prov} className="provider-section">
              <button
                className={`provider-header provider-${prov}`}
                onClick={() => setExpanded((s) => ({ ...s, [prov]: !s[prov] }))}
              >
                <span className="provider-name">{prov.toUpperCase()}</span>
                <span className="provider-count">{list.length}</span>
                <span className={`chevron ${isOpen ? "expanded" : ""}`}>▶</span>
              </button>
              {isOpen ? (
                <div className="tech-list">
                  {list.slice(0, 200).map((s: any) => (
                    <div
                      key={s.id}
                      className="tech-item"
                      draggable
                      onDragStart={(e) => {
                        const payload: DragPayload = { type: "service", kind: s.kind, serviceId: s.id };
                        e.dataTransfer.setData("application/x-tm", JSON.stringify(payload));
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      title="Drag to canvas"
                    >
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <div className="row" style={{ minWidth: 0 }}>
                          <ServiceIcon provider={s.provider} category={s.category} name={s.name} />
                          <div className="tech-item-name">{s.name}</div>
                        </div>
                        <span className="badge">{s.kind}</span>
                      </div>
                      <div className="tech-item-category">{s.category}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
