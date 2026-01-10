import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { VirtualList } from "./VirtualList";
import { useTMStore } from "../model/store";

type Item =
  | { kind: "threat"; id: string; title: string; detail: string }
  | { kind: "finding"; id: string; title: string; detail: string }
  | { kind: "control"; id: string; title: string; detail: string }
  | { kind: "evidence"; id: string; title: string; detail: string };

export function GlobalSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const model = useTMStore((s) => s.model);
  const selectThreat = useTMStore((s) => s.selectThreat);
  const selectFinding = useTMStore((s) => s.selectFinding);
  const setTab = useTMStore((s) => s.setUiTab);

  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setTimeout(() => (document.getElementById("globalSearchInput") as any)?.focus?.(), 10);
    if (!open) setQ("");
  }, [open]);

  const index = useMemo(() => {
    const items: Item[] = [];
    for (const t of model.threats || []) {
      items.push({ kind: "threat", id: t.id, title: t.title, detail: `${t.status} • ${(t.frameworkRef || t.framework || "STRIDE")} • L${t.likelihood}/I${t.impact}` });
      for (const ev of t.commentary || []) {
        items.push({ kind: "evidence", id: `${t.id}:${ev.id}`, title: `Evidence: ${t.title}`, detail: ev.note || "" });
      }
    }
    for (const f of model.findings || []) {
      items.push({ kind: "finding", id: f.id, title: f.title, detail: `${f.status} • ${(f.severity || "medium")}` });
      for (const c of (f as any).compensatingControls || []) {
        items.push({ kind: "control", id: `${f.id}:${c.id}`, title: `${c.category}: ${c.vendor}`, detail: `Finding: ${f.title} • coverage: ${c.coverage}` });
      }
      for (const ev of f.evidence || []) {
        items.push({ kind: "evidence", id: `${f.id}:${ev.id}`, title: `Evidence: ${f.title}`, detail: ev.note || "" });
      }
    }
    return items;
  }, [model]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return index.slice(0, 100);
    const out = index.filter((it) => (it.title + " " + it.detail).toLowerCase().includes(s));
    return out.slice(0, 300);
  }, [index, q]);

  const run = (it: Item) => {
    if (it.kind === "threat") {
      setTab("threats");
      selectThreat(it.id);
    } else if (it.kind === "finding" || it.kind === "control") {
      setTab("findings");
      const fid = it.kind === "finding" ? it.id : it.id.split(":")[0];
      selectFinding(fid);
    } else {
      // evidence: best effort jump to owning entity
      const parts = it.id.split(":");
      if (parts.length) {
        // try threat first
        const tid = parts[0];
        if ((model.threats || []).some((t) => t.id === tid)) {
          setTab("threats");
          selectThreat(tid);
        } else if ((model.findings || []).some((f) => f.id === tid)) {
          setTab("findings");
          selectFinding(tid);
        }
      }
    }
    onClose();
  };

  if (!open) return null;

  return (
    <Modal title="Search" onClose={onClose}>
      <div className="small muted">Search threats, findings, controls, vendors, and evidence. Shortcut: Ctrl/Cmd + /</div>
      <div style={{ marginTop: 10 }}>
        <input
          id="globalSearchInput"
          className="input"
          placeholder="Type to search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div style={{ height: 520, marginTop: 12 }}>
        <VirtualList
          items={filtered}
          rowHeight={64}
          overscan={8}
          renderRow={(it) => (
            <button
              className="item"
              style={{ width: "100%", textAlign: "left" }}
              onClick={() => run(it)}
              title="Open"
            >
              <div className="row" style={{ justifyContent: "space-between" }}>
                <b>{it.title}</b>
                <span className="badge">{it.kind}</span>
              </div>
              <div className="small muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {it.detail}
              </div>
            </button>
          )}
        />
      </div>
    </Modal>
  );
}
