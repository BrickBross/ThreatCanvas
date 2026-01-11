import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  MarkerType,
  Connection,
  NodeChange,
  EdgeChange
} from "reactflow";
import "reactflow/dist/style.css";

import { Palette } from "./ui/Palette";
import { RightPanel } from "./ui/RightPanel";
import { TemplatesModal } from "./ui/TemplatesModal";
import { GlobalSearchModal } from "./ui/GlobalSearchModal";
import { OnboardingModal } from "./ui/OnboardingModal";
import { PresentationMode } from "./ui/PresentationMode";
import { ContextMenu } from "./ui/ContextMenu";
import { exportAuditPdf } from "./model/report";
import { NodeView } from "./ui/NodeView";
import { TrustBoundaryNode } from "./ui/TrustBoundaryNode";
import EdgeView from "./ui/EdgeView";
import { useTMStore, TMNode, TMEdge } from "./model/store";
import { Modal } from "./ui/Modal";
import { generateStride } from "./model/stride_simple";
import { exportCsv, exportDiagramPng, exportDiagramSvg, exportEvidencePackHtml, exportHtmlReport, exportMarkdown } from "./model/exporters";
import { SERVICE_CATALOG } from "./model/catalog";
import type { NodeKind } from "./model/types";
import { nanoid } from "nanoid";

const nodeTypes = { tmNode: NodeView, tmBoundary: TrustBoundaryNode };
const edgeTypes = { tmEdge: EdgeView };

function defaultNode(kind: NodeKind): TMNode {
  return {
    id: nanoid(),
    type: kind === "trustBoundary" ? "tmBoundary" : "tmNode",
    position: { x: 100, y: 100 },
    style: kind === "trustBoundary" ? { width: 520, height: 320, zIndex: -1 } : undefined,
    data: {
      kind,
      label: kind === "process" ? "New process" : kind === "datastore" ? "New data store" : kind === "external" ? "New external" : "Trust boundary",
      props: {
        provider: "unknown",
        dataClassification: "Internal",
        internetExposed: false,
        authRequired: kind === "process",
        loggingEnabled: kind !== "external",
        encryptionAtRest: kind === "datastore"
      }
    }
  };
}


function addNodeAtCenter(kind: NodeKind) {
  const st = useTMStore.getState();
  const nodes = st.model.nodes as any[];
  const wrap = document.getElementById("tm-canvas");
  const rect = wrap ? wrap.getBoundingClientRect() : { left: 0, top: 0, width: 900, height: 600 };
  const position = { x: rect.width / 2 - rect.left, y: rect.height / 2 - rect.top };
  const n = defaultNode(kind);
  n.position = { x: position.x - 80, y: position.y - 30 };
  st.commitHistory();
  st.setNodes([...(nodes || []), n] as any);
  st.selectNode(n.id);
}

export default function App() {
  const loadWorkspace = useTMStore((s) => s.loadWorkspace);
  const model = useTMStore((s) => s.model);
  const theme = useTMStore((s) => (s as any).theme);
  const setTheme = useTMStore((s) => (s as any).setTheme);
  const isDirty = useTMStore((s) => (s as any).isDirty);
  const lastFileName = useTMStore((s) => (s as any).lastFileName);
  const loadModel = useTMStore((s) => (s as any).loadModel);
  const setLastFileName = useTMStore((s) => (s as any).setLastFileName);
  const markClean = useTMStore((s) => (s as any).markClean);
  const setNodes = useTMStore((s) => s.setNodes);
  const setEdges = useTMStore((s) => s.setEdges);
  const selectNode = useTMStore((s) => s.selectNode);
  const selectEdge = useTMStore((s) => s.selectEdge);
  const commitHistory = useTMStore((s) => s.commitHistory);
  const undo = useTMStore((s) => s.undo);
  const redo = useTMStore((s) => s.redo);
  const canUndo = useTMStore((s) => s.canUndo);
  const canRedo = useTMStore((s) => s.canRedo);

  const saveProject = useTMStore((s) => s.saveProject);
  const exportJson = useTMStore((s) => s.exportJson);
  const importJsonFile = useTMStore((s) => s.importJsonFile);
  const setThreats = useTMStore((s) => s.setThreats);
  const hasOnboarded = useTMStore((s) => (s as any).hasOnboarded);
  const setHasOnboarded = useTMStore((s) => (s as any).setHasOnboarded);

  const [snapOpen, setSnapOpen] = useState(false);
  const [snaps, setSnaps] = useState<any[]>([]);
  const listSnapshots = useTMStore((s) => s.listSnapshots);
  const createSnapshot = useTMStore((s) => s.createSnapshot);
  const restoreSnapshot = useTMStore((s) => s.restoreSnapshot);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rfRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [redactExport, setRedactExport] = useState(false);
  const [ctx, setCtx] = useState<null | { x: number; y: number; items: any[] }>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const isMac = navigator.platform.toLowerCase().includes("mac");

  useEffect(() => {
    document.body.classList.remove("themeLight", "themeDark");
    document.body.classList.add(theme === "dark" ? "themeDark" : "themeLight");
  }, [theme]);

  const onOpenClick = () => fileInputRef.current?.click();
  const onFilePicked = async (f?: File | null) => {
    if (!f) return;
    try {
      const m = await openModelFromFile(f);
      loadModel(m);
      setLastFileName(f.name);
    } catch (err: any) {
      alert(err?.message || "Failed to open model");
    }
  };

  const onSaveAs = () => {
    const suggested = lastFileName || `${filenameSafe(model.name)}.tm.json`;
    const name = prompt("Save As filename:", suggested) || suggested;
    downloadModel(model as any, name);
    setLastFileName(name);
    markClean();
  };

  const onSave = () => {
    if (!lastFileName) return onSaveAs();
    downloadModel(model as any, lastFileName);
    markClean();
  };

  const onExportReport = async () => {
    try {
      const { doc } = await exportAuditPdf(model as any, { redacted: redactExport });
      doc.save(`${filenameSafe(model.name)}-report${redactExport ? '-redacted' : ''}.pdf`);
    } catch (e: any) {
      alert(e?.message || 'Failed to export report');
    }
  };

  const getPaletteItems = () => {
  const q = (searchQ || "").toLowerCase().trim();
  const items: { key: string; label: string; detail: string; hint?: string; run: () => void }[] = [];

  const push = (key: string, label: string, detail: string, hint: string | undefined, run: () => void) => {
    if (!q || (label + " " + detail).toLowerCase().includes(q)) items.push({ key, label, detail, hint, run });
  };

const buildThreatMatcherFromPrompts = () => {
  const fw = (prompt("Framework (optional): STRIDE | OWASP_WEB | OWASP_API | MITRE_TACTICS | CIA") || "").trim();
  const stOnly = (prompt("Statuses (optional, comma-separated): open,in_analysis,mitigated,accepted,verified,rejected") || "").trim();
  const ev = (prompt("Evidence (optional): any | no_evidence | has_verified") || "").trim();
  const ownerBlank = (prompt("Only where owner is blank? y/n (optional)") || "").trim().toLowerCase() === "y";

  const statuses = stOnly ? stOnly.split(",").map((x) => x.trim()).filter(Boolean) : [];

  const toFwId = (t: any) => {
    const fid = t.framework === "STRIDE" ? "STRIDE" : String(t.framework || "");
    if (fid.startsWith("OWASP Top 10")) return "OWASP_WEB";
    if (fid.startsWith("OWASP API Top 10")) return "OWASP_API";
    if (fid.startsWith("MITRE ATT&CK")) return "MITRE_TACTICS";
    if (fid.startsWith("CIA")) return "CIA";
    return fid || "STRIDE";
  };

  return (t: any) => {
    const fwId = toFwId(t);
    if (fw && fwId !== fw) return false;
    if (statuses.length && !statuses.includes(String(t.status || "open"))) return false;
    if (ev === "no_evidence" && (t.commentary || []).length) return false;
    if (ev === "has_verified" && !(t.commentary || []).some((e: any) => e.status === "verified")) return false;
    if (ownerBlank && String(t.owner || "").trim() !== "") return false;
    return true;
  };
};

  push("act-open", "Open model", "Load a .tm.json file", isMac ? "Cmd+O" : "Ctrl+O", () => onOpenClick());
  push("act-save", "Save", "Download to the last filename (or Save As)", isMac ? "Cmd+S" : "Ctrl+S", () => onSave());
  push("act-saveas", "Save As", "Download with a new filename", isMac ? "Cmd+Shift+S" : "Ctrl+Shift+S", () => onSaveAs());
  push("act-templates", "Templates", "Add starter threat packs", isMac ? "Cmd+T" : "Ctrl+T", () => setTemplatesOpen(true));
  push("act-evidence", "Evidence ZIP", "Download audit pack (hash, CSV, PDF)", isMac ? "Cmd+E" : "Ctrl+E", () => onEvidencePack());
  push("act-report", "Report PDF", "Download the PDF report", isMac ? "Cmd+P" : "Ctrl+P", () => onExportReport());
  push("act-theme", "Toggle dark mode", "Switch light/dark theme", "", () => setTheme(theme === "dark" ? "light" : "dark"));
  push("act-redact", "Toggle redaction", "Redact labels in exports", isMac ? "Cmd+Shift+R" : "Ctrl+Shift+R", () => setRedactExport(!redactExport));

    push("act-apply-filter", "Apply saved threat filter", "Select a saved filter preset (Threats tab filters)", "", () => {
      const st = useTMStore.getState() as any;
      const list = (st.savedThreatFilters || []) as any[];
      const names = list.map((f:any)=> f.name).join(", ");
      const name = (prompt(`Saved filters: ${names}\n\nType a filter name to apply:`) || "").trim();
      const f = list.find((x:any)=> x.name === name);
      if (f) st.applyThreatFilter(f.id);
      st.setUiTab("threats");
    });

    push("act-bulk-status", "Bulk: set threat status", "Target by filters (framework/status/evidence/owner blank) — prompts", "", () => {
  const fw = (prompt("Framework (optional): STRIDE | OWASP_WEB | OWASP_API | MITRE_TACTICS | CIA") || "").trim();
  const stOnly = (prompt("Statuses (optional, comma-separated): open,in_analysis,mitigated,accepted,verified,rejected") || "").trim();
  const ev = (prompt("Evidence (optional): any | no_evidence | has_verified") || "").trim();
  const ownerBlank = (prompt("Only where owner is blank? y/n (optional)") || "").trim().toLowerCase() === "y";
  const nextStatus = (prompt("New status: open, in_analysis, mitigated, accepted, verified, rejected") || "").trim();
  if (!nextStatus) return;

  const st = useTMStore.getState() as any;
  const statuses = stOnly ? stOnly.split(",").map((x:string)=>x.trim()).filter(Boolean) : [];
  const match = (t:any) => {
    const fid = (t.framework==="STRIDE") ? "STRIDE" : (t.framework||"");
    const fwId = fid.startsWith("OWASP Top 10") ? "OWASP_WEB" : fid.startsWith("OWASP API Top 10") ? "OWASP_API" : fid.startsWith("MITRE ATT&CK") ? "MITRE_TACTICS" : fid.startsWith("CIA") ? "CIA" : fid;
    if (fw && fwId !== fw) return false;
    if (statuses.length && !statuses.includes(String(t.status||"open"))) return false;
    if (ev === "no_evidence" && (t.commentary||[]).length) return false;
    if (ev === "has_verified" && !(t.commentary||[]).some((e:any)=> e.status==="verified")) return false;
    if (ownerBlank && String(t.owner||"").trim() !== "") return false;
    return true;
  };

  st.commitHistory();
  for (const t of (st.model.threats || [])) {
    if (match(t)) st.updateThreat(t.id, { status: nextStatus });
  }
  st.setUiTab("threats");
});

    push("act-bulk-status-fw", "Bulk: set threat status", "By framework — prompts", "", () => {
      const fw = (prompt("Framework to target: STRIDE | OWASP_WEB | OWASP_API | MITRE_TACTICS | CIA") || "").trim();
      const stt = (prompt("New status: open, in_analysis, mitigated, accepted, verified, rejected") || "").trim();
      if (!fw || !stt) return;

      const st = useTMStore.getState();
      st.commitHistory();

      for (const t of (st.model.threats || []) as any[]) {
        const f = (t.framework === "STRIDE") ? "STRIDE" : (t.framework || "");
        const id =
          f.startsWith("OWASP Top 10") ? "OWASP_WEB"
          : f.startsWith("OWASP API Top 10") ? "OWASP_API"
          : f.startsWith("MITRE ATT&CK") ? "MITRE_TACTICS"
          : f.startsWith("CIA") ? "CIA"
          : f;

        if (id === fw) st.updateThreat(t.id, { status: stt as any });
      }
    });
    push("act-bulk-li", "Bulk: set likelihood/impact", "By framework — prompts", "", () => {
      const fw = (prompt("Framework to target: STRIDE | OWASP_WEB | OWASP_API | MITRE_TACTICS | CIA") || "").trim();
      const l = Number(prompt("Likelihood (1-5, blank to skip):") || "");
      const i = Number(prompt("Impact (1-5, blank to skip):") || "");
      if (!fw || (!l && !i)) return;
      const st = useTMStore.getState();
      st.commitHistory();
      for (const t of (st.model.threats || []) as any[]) {
        const f = (t.framework === "STRIDE") ? "STRIDE" : (t.framework || "");
        const id = f.startsWith("OWASP Top 10") ? "OWASP_WEB" : f.startsWith("OWASP API Top 10") ? "OWASP_API" : f.startsWith("MITRE ATT&CK") ? "MITRE_TACTICS" : f.startsWith("CIA") ? "CIA" : f;
        if (id === fw) st.updateThreat(t.id, { ...(l?{likelihood:l}:{}), ...(i?{impact:i}:{}) } as any);
      }
    });

  // Nodes
  for (const n of (model.nodes as any[])) {
    const label = n.data?.label || n.id;
    push(`node-${n.id}`, `Node: ${label}`, "Jump to this node", "Node", () => {
      useTMStore.getState().selectNode(n.id);
      useTMStore.getState().selectEdge(null);
      useTMStore.getState().setUiTab("properties");
    });
  }
  // Threats
  for (const t of (model.threats || [])) {
    push(`th-${t.id}`, `Threat: ${t.title}`, `Status: ${t.status}${t.framework ? ` • ${t.framework}` : ""}`, "Threat", () => {
      useTMStore.getState().setUiTab("threats");
    });
  }
  // Findings
  for (const f of (model.findings || [])) {
    push(`fi-${f.id}`, `Finding: ${f.title}`, `Status: ${f.status}`, "Finding", () => {
      useTMStore.getState().setUiTab("findings");
    });
  }

  return items.slice(0, 30);
};
const onEvidencePack = () => {
    downloadEvidencePack(model as any);
  };
/* docflow-beforeunload */
useEffect(() => {
  if (!hasOnboarded) setShowOnboarding(true);

  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!isDirty) return;
    e.preventDefault();
    e.returnValue = "";
  };
  window.addEventListener("beforeunload", onBeforeUnload);
  return () => window.removeEventListener("beforeunload", onBeforeUnload);
}, [isDirty, hasOnboarded]);



  useEffect(() => {

    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {

    const t = setTimeout(() => { saveProject(); }, 600);
    return () => clearTimeout(t);
  }, [model, saveProject]);

  // keyboard shortcuts
  useEffect(() => {

    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return;

      // shortcuts overlay
      if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          setPresentationMode(true);
          return;
        }
        if (e.key === "?") { e.preventDefault(); setShortcutsOpen(true); return; }
      if (e.key === "Escape") {
          if (presentationMode) { setPresentationMode(false); return; }
 setShortcutsOpen(false); setQuickAddOpen(false); setSearchOpen(false); setTemplatesOpen(false); setCtx(null); return; }

      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === "o") { e.preventDefault(); onOpenClick(); return; }
      if (mod && e.key.toLowerCase() === "s" && e.shiftKey) { e.preventDefault(); onSaveAs(); return; }
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); onSave(); return; }
      if (mod && e.key.toLowerCase() === "e") { e.preventDefault(); onEvidencePack(); return; }
      if (mod && e.key.toLowerCase() === "p") { e.preventDefault(); onExportReport(); return; }
      if (mod && e.key.toLowerCase() === "t") { e.preventDefault(); setTemplatesOpen(true); return; }
      if (mod && e.shiftKey && e.key.toLowerCase() === "r") { e.preventDefault(); setRedactExport((v) => !v); return; }
      if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); const st = useTMStore.getState(); if (st.selectedNodeId) st.duplicateNode(st.selectedNodeId); return; }

      if (!mod && !e.altKey) {
        if (e.key.toLowerCase() === "n") { e.preventDefault(); setQuickAddOpen(true); return; }
        if (e.key.toLowerCase() === "t") { e.preventDefault(); const st = useTMStore.getState(); const nid = st.selectedNodeId; const eid = st.selectedEdgeId; st.addThreat({ stride: "T", title: nid ? `Threat for ${(st.model.nodes as any[]).find(n=>n.id===nid)?.data?.label || "node"}` : (eid ? `Threat for flow` : "New threat"), description: "", affectedNodeIds: nid ? [nid] : [], affectedEdgeIds: eid ? [eid] : [], likelihood: 3, impact: 3, status: "open", mitigation: "", owner: "", commentary: [], findingIds: [] } as any); return; }
        if (e.key.toLowerCase() === "f") { e.preventDefault(); const st = useTMStore.getState(); st.addFinding({ title: "New finding", status: "proposed", description: "", owner: "", evidence: [], relatedThreatIds: st.selectedEdgeId || st.selectedNodeId ? [] : [] } as any); return; }
        if (e.key.toLowerCase() === "b") { e.preventDefault(); addNodeAtCenter("trustBoundary"); return; }
      }

      if (!mod) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);

    const onDel = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return;

      const st = useTMStore.getState();
      const nid = st.selectedNodeId;
      const eid = st.selectedEdgeId;
      if (nid) {
        if (!confirm("Delete selected node?")) return;
        st.commitHistory();
        st.setNodes((st.model.nodes as any[]).filter((n) => n.id !== nid) as any);
        st.setEdges((st.model.edges as any[]).filter((ed) => ed.source !== nid && ed.target !== nid) as any);
        st.selectNode(null);
      } else if (eid) {
        if (!confirm("Delete selected edge?")) return;
        st.commitHistory();
        st.setEdges((st.model.edges as any[]).filter((ed) => ed.id !== eid) as any);
        st.selectEdge(null);
      }
    };

    window.addEventListener("keydown", onDel);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", onDel);
    };
  }, [undo, redo, presentationMode, isMac]);

  const nodes = model.nodes as TMNode[];
  const edges = model.edges as TMEdge[];

  const onNodesChange = (changes: NodeChange[]) => {
    // don't commit on every drag tick; we'll commit on drag stop.
    const next = changes.reduce((acc, ch) => {
      // reactflow applyChanges requires helper; do minimal handling
      if (ch.type === "remove") return acc.filter(n => n.id !== ch.id);
      if (ch.type === "position" && ch.position) return acc.map(n => n.id === ch.id ? { ...n, position: ch.position } : n);
      if (ch.type === "select") return acc.map(n => n.id === ch.id ? { ...n, selected: ch.selected } : { ...n, selected: false });
      return acc;
    }, nodes);
    setNodes(next);
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    const next = changes.reduce((acc, ch) => {
      if (ch.type === "remove") return acc.filter(e => e.id !== ch.id);
      if (ch.type === "select") return acc.map(e => e.id === ch.id ? { ...e, selected: ch.selected } : { ...e, selected: false });
      return acc;
    }, edges);
    setEdges(next);
  };

  const onConnect = (connection: Connection) => {
    commitHistory();
    const edge: TMEdge = {
      id: nanoid(),
      type: "tmEdge",
      source: connection.source!,
      target: connection.target!,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: {
        label: "flow",
        props: { protocol: "HTTPS", encryptionInTransit: true, authOnFlow: true, dataType: "telemetry" }
      }
    };
    setEdges(addEdge(edge, edges) as any);
  };

  const openSnapshots = async () => {
    const s = await listSnapshots();
    setSnaps(s);
    setSnapOpen(true);
  };

  const createSnap = async () => {
    const name = prompt("Snapshot name?", `Snapshot ${new Date().toISOString().slice(0,10)}`) || "";
    if (!name.trim()) return;
    const note = prompt("Snapshot note (optional):") || "";
    await createSnapshot(name.trim(), note.trim() || undefined);
    setSnaps(await listSnapshots());
  };

  const restoreSnap = async (id: string) => {
    if (!confirm("Restore this snapshot? Current changes will remain in history only if you saved it as a snapshot.")) return;
    await restoreSnapshot(id);
    setSnaps(await listSnapshots());
    setSnapOpen(false);
  };

  return (
    <>
      <OnboardingModal open={showOnboarding} onClose={() => { setHasOnboarded(true); setShowOnboarding(false); }} />
      {presentationMode ? <PresentationMode onClose={() => setPresentationMode(false)} /> : null}
      <TemplatesModal open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className={`layout ${theme === "dark" ? "themeDark" : "themeLight"}`}>
      <div className="sidebar">
        <Palette />
      </div>

      <div id="tm-canvas" className="reactflowWrap" ref={wrapRef}>
        <div className="topToolbar">
          <button className="btn" disabled={!canUndo()} onClick={undo}>Undo</button>
          <button className="btn" disabled={!canRedo()} onClick={redo}>Redo</button>

<button className="btn" onClick={onOpenClick}>Open</button>
<button className="btn" onClick={onSave} disabled={!isDirty && !lastFileName}>Save</button>
<button className="btn" onClick={onSaveAs}>Save As</button>

<button className="btn" onClick={() => setTemplatesOpen(true)}>Templates</button>
<button className="btn" onClick={onExportReport}>Report PDF</button>
<button className="btn" title="Redact labels in exports" onClick={() => setRedactExport(!redactExport)}>
  Redact: {redactExport ? "on" : "off"}
</button>
<button className="btn" onClick={onEvidencePack}>Evidence ZIP</button>

          <button className="btn" onClick={() => setThreats(generateStride(model))}>Generate STRIDE</button>

          <button className="btn" onClick={() => exportMarkdown(model)}>Export MD</button>
          <button className="btn" onClick={() => exportHtmlReport(model)}>Export HTML</button>
          <button className="btn" onClick={() => exportEvidencePackHtml(model)}>Evidence Pack</button>
          <button className="btn" onClick={() => exportCsv(model)}>Export CSV</button>
          <button className="btn" onClick={() => wrapRef.current && exportDiagramPng(wrapRef.current.querySelector(".react-flow") as HTMLElement, model.name.replace(/\s+/g,"_"))}>PNG</button>
          <button className="btn" onClick={() => wrapRef.current && exportDiagramSvg(wrapRef.current.querySelector(".react-flow") as HTMLElement, model.name.replace(/\s+/g,"_"))}>SVG</button>

          <button className="btn" onClick={exportJson}>Export JSON</button>
          <label className="btn">
            Import JSON
            <input type="file" accept=".json" style={{display:"none"}} onChange={(e) => { const f = e.target.files?.[0]; if (f) importJsonFile(f); }} />
          </label>
        </div>

        <ReactFlow
          onPaneContextMenu={(ev) => {
            ev.preventDefault();
            const st = useTMStore.getState();
            setCtx({ x: ev.clientX, y: ev.clientY, items: [
              { label: 'Add process', onClick: () => st.addNode({ kind: 'process' }) },
              { label: 'Add datastore', onClick: () => st.addNode({ kind: 'datastore' }) },
              { label: 'Add external entity', onClick: () => st.addNode({ kind: 'external' }) },
              { label: 'Add trust boundary', onClick: () => st.addNode({ kind: 'trustBoundary' }) },
            ]});
          }}
          onNodeContextMenu={(_, n, ev) => {
            ev.preventDefault();
            const st = useTMStore.getState();
            st.selectNode(n.id);
            st.selectEdge(null);
            const label = (n as any).data?.label || "node";
            setCtx({
              x: ev.clientX,
              y: ev.clientY,
              items: [
                {
                  label: "Create threat for node",
                  onClick: () => {
                    st.addThreat({
                      stride: "T",
                      title: `Threat for ${label}`,
                      description: "",
                      affectedNodeIds: [n.id],
                      affectedEdgeIds: [],
                      likelihood: 3,
                      impact: 3,
                      status: "open",
                      mitigation: "",
                      owner: "",
                      commentary: [],
                      findingIds: []
                    });
                    st.selectNode(n.id);
                  }
                },
                {
                  label: "Create finding for node",
                  onClick: () => {
                    st.addFinding({
                      title: `Finding for ${label}`,
                      status: "proposed",
                      relatedThreatIds: [],
                      description: "",
                      owner: "",
                      evidence: []
                    } as any);
                  }
                },
                { label: "Duplicate node", onClick: () => st.duplicateNode(n.id) },
                { label: "Delete node", onClick: () => st.deleteNode(n.id) }
              ]
            });
          }}
          onEdgeContextMenu={(_, e, ev) => {
            ev.preventDefault();
            const st = useTMStore.getState();
            st.selectEdge(e.id); st.selectNode(null);
            setCtx({ x: ev.clientX, y: ev.clientY, items: [
              { label: 'Create boundary-crossing threat', onClick: () => st.createBoundaryCrossingThreat(e.id) },
              { label: 'Toggle encryption in transit', onClick: () => st.toggleEdgeFlag(e.id, 'encryptionInTransit') },
              { label: 'Toggle auth on flow', onClick: () => st.toggleEdgeFlag(e.id, 'authOnFlow') },
              { label: 'Delete edge', onClick: () => st.deleteEdge(e.id) },
            ]});
          }}
          onInit={(inst) => { rfRef.current = inst; }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => selectNode(n.id)}
          onEdgeClick={(_, e) => selectEdge(e.id)}
          onEdgeDoubleClick={(_, e) => {
            const cur = (e.data as any)?.label || "";
            const next = prompt("Edit flow label:", cur);
            if (next == null) return;
            useTMStore.getState().updateEdgeData(e.id, { label: next });
          }}
          onPaneClick={() => { selectNode(null); selectEdge(null); }}
          onNodeDragStart={() => commitHistory()}
          onNodeDragStop={() => {}}
          fitView
          onDrop={(e) => {
            e.preventDefault();
            const raw = e.dataTransfer.getData("application/x-tm");
            if (!raw) return;
            const payload = JSON.parse(raw) as any;
            const bounds = (e.target as HTMLElement).getBoundingClientRect();
            const position = { x: e.clientX - bounds.left - 80, y: e.clientY - bounds.top - 20 };

            commitHistory();
            if (payload.type === "basic") {
              const n = defaultNode(payload.kind);
              n.position = position;
              setNodes([...nodes, n]);
              return;
            }
            if (payload.type === "service") {
              const svc = SERVICE_CATALOG.find(s => s.id === payload.serviceId);
              if (!svc) return;
              const n = defaultNode(svc.kind);
              n.position = position;
              n.data.label = svc.name;
              n.data.props = { ...n.data.props, ...svc.defaultProps, provider: svc.provider as any, serviceCategory: svc.category, serviceId: svc.id };
              setNodes([...nodes, n]);
              return;
            }
          }}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>

        <Modal open={snapOpen} title="Snapshots" onClose={() => setSnapOpen(false)}>
          <div className="row" style={{justifyContent:"space-between"}}>
            <div className="small muted">Create named checkpoints (stored locally).</div>
            <button className="btnPrimary" onClick={createSnap}>Save snapshot</button>
          </div>
          <div className="hr" />
          <div className="list">
            {snaps.map((s) => (
              <div key={s.id} className="card">
                <div className="row" style={{justifyContent:"space-between"}}>
                  <b>{s.name}</b>
                  <button className="btn" onClick={() => restoreSnap(s.id)}>Restore</button>
                </div>
                <div className="small muted">{s.createdAt}</div>
                {s.note ? <div className="small">{s.note}</div> : null}
              </div>
            ))}
            {!snaps.length ? <div className="small muted">No snapshots yet.</div> : null}
          </div>
        </Modal>
      </div>

      <div className="rightbar">
        <RightPanel onOpenSnapshots={openSnapshots} onNavigate={(t) => {
        const st = useTMStore.getState();

        const nodes = st.model.nodes as any[];
        const edges = st.model.edges as any[];
        const byId = new Map(nodes.map((n) => [n.id, n]));
        const getCenter = (n: any) => {
          const w = (n.width ?? n.measured?.width ?? n.style?.width ?? 0);
          const h = (n.height ?? n.measured?.height ?? n.style?.height ?? 0);
          return { x: n.position.x + Number(w)/2, y: n.position.y + Number(h)/2 };
        };

        const centerNode = (id: string) => {
          const n = byId.get(id);
          if (!n || !rfRef.current) return;
          const c = getCenter(n);
          try { rfRef.current.setCenter(c.x, c.y, { zoom: 1.1, duration: 300 }); } catch {}
        };

        if (t.kind === "node") {
          st.selectNode(t.id); st.selectEdge(null);
          centerNode(t.id);
          return;
        }

        if (t.kind === "edge") {
          st.selectEdge(t.id); st.selectNode(null);
          const e = edges.find((x) => x.id === t.id);
          if (e) {
            const a = byId.get(e.source);
            const b = byId.get(e.target);
            if (a && b && rfRef.current) {
              const ca = getCenter(a); const cb = getCenter(b);
              try { rfRef.current.setCenter((ca.x+cb.x)/2, (ca.y+cb.y)/2, { zoom: 1.0, duration: 300 }); } catch {}
            }
          }
          return;
        }

        if (t.kind === "threat") {
          const thr = st.model.threats.find((x) => x.id === t.id);
          if (thr?.affectedNodeIds?.length) {
            st.selectNode(thr.affectedNodeIds[0]); st.selectEdge(null);
            centerNode(thr.affectedNodeIds[0]);
          } else if (thr?.affectedEdgeIds?.length) {
            st.selectEdge(thr.affectedEdgeIds[0]); st.selectNode(null);
          }
          return;
        }

        if (t.kind === "finding") {
          const f = st.model.findings.find((x) => x.id === t.id);
          const tid = f?.relatedThreatIds?.[0];
          if (tid) {
            const thr = st.model.threats.find((x) => x.id === tid);
            if (thr?.affectedNodeIds?.length) {
              st.selectNode(thr.affectedNodeIds[0]); st.selectEdge(null);
              centerNode(thr.affectedNodeIds[0]);
            } else if (thr?.affectedEdgeIds?.length) {
              st.selectEdge(thr.affectedEdgeIds[0]); st.selectNode(null);
            }
          }
          return;
        }
      }} />
      </div>
    </div>
    </>
  );
}
