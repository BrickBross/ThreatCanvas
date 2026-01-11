import { create } from "zustand";
import localforage from "localforage";
import { nanoid } from "nanoid";
import type { Edge, Node } from "reactflow";
import type { Finding, TMEdgeProps, TMModel, TMNodeProps, Threat, ThreatTemplate, Evidence, ProjectMeta, Snapshot } from "./types";
import type { NodeKind } from "./types";
import { STORAGE } from "./storage";

export type TMNodeData = {
  kind: NodeKind;
  label: string;
  props: TMNodeProps;
};

export type TMEdgeData = {
  label: string;
  props: TMEdgeProps;
};

export type TMNode = Node<TMNodeData>;
export type TMEdge = Edge<TMEdgeData>;

type Store = {
  projectId: string | null;
  projects: ProjectMeta[];

  model: TMModel;

  // Undo/Redo
  past: TMModel[];
  future: TMModel[];
  canUndo: () => boolean;
  canRedo: () => boolean;
  undo: () => void;
  redo: () => void;
  commitHistory: () => void;

  // selections
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  uiTab: "properties" | "threats" | "findings" | "validation" | "help";
  setUiTab: (t: any) => void;
  frameworkSelections: string[];
  setFrameworkSelections: (ids: string[]) => void;
  frameworkWeights: Record<string, { likelihood: number; impact: number }>;
  setFrameworkWeight: (id: string, patch: { likelihood?: number; impact?: number }) => void;
  generateGapsOnly: boolean;
  generateScope: any;
  setGenerateGapsOnly: (v: boolean) => void;
  setGenerateScope: (v: any) => void;
  hasOnboarded: boolean;
  setHasOnboarded: (v: boolean) => void;
  uiThreatGroupBy: any;
  setUiThreatGroupBy: (v: any) => void;
  threatFrameworkFilter: string[];
  setThreatFrameworkFilter: (ids: string[]) => void;
  setThreatStatusFilter: (ids: string[]) => void;
  setThreatEvidenceFilter: (v: any) => void;
  setThreatRiskCell: (v: any) => void;
  setPresentationMode: (v: boolean) => void;
  saveView: (name: string) => void;
  applyView: (id: string) => void;
  deleteView: (id: string) => void;
  saveThreatFilter: (name: string) => void;
  applyThreatFilter: (id: string) => void;
  deleteThreatFilter: (id: string) => void;
  isDirty: boolean;
  lastFileName: string | null;
  markClean: () => void;
  setLastFileName: (n: string | null) => void;
  loadModel: (m: any) => void;
  duplicateNode: (id: string) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  toggleEdgeFlag: (edgeId: string, flag: "encryptionInTransit" | "authOnFlow") => void;
  createBoundaryCrossingThreat: (edgeId: string) => void;
  updateThreatEvidence: (threatId: string, evidenceId: string, patch: any) => void;
  updateFindingEvidence: (findingId: string, evidenceId: string, patch: any) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  autoStrideEnabled: boolean;
  setAutoStrideEnabled: (v: boolean) => void;

  // project ops
  loadWorkspace: () => Promise<void>;
  createProject: (name: string) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;

  // snapshots
  listSnapshots: () => Promise<Snapshot[]>;
  createSnapshot: (name: string, note?: string) => Promise<void>;
  restoreSnapshot: (snapshotId: string) => Promise<void>;

  // model ops
  setName: (name: string) => void;
  setNodes: (nodes: TMNode[]) => void;
  setEdges: (edges: TMEdge[]) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  updateNodeData: (id: string, patch: Partial<TMNodeData>) => void;
  updateEdgeData: (id: string, patch: Partial<TMEdgeData>) => void;

  setThreats: (threats: Threat[]) => void;
  addThreat: (t: Omit<Threat, "id">) => void;
  updateThreat: (id: string, patch: Partial<Threat>) => void;
  deleteThreat: (id: string) => void;

  addFinding: (f: Omit<Finding, "id" | "createdAt" | "evidence"> & { evidence?: Evidence[] }) => string;
  updateFinding: (id: string, patch: Partial<Finding>) => void;
  addFindingControl: (findingId: string, c: any) => void;
  updateFindingControl: (findingId: string, controlId: string, patch: any) => void;
  removeFindingControl: (findingId: string, controlId: string) => void;
  deleteFinding: (id: string) => void;

  addEvidenceToThreat: (threatId: string, ev: Omit<Evidence, "id" | "createdAt">) => void;
  addEvidenceToFinding: (findingId: string, ev: Omit<Evidence, "id" | "createdAt">) => void;

  linkFindingToThreat: (findingId: string, threatId: string) => void;
  unlinkFindingFromThreat: (findingId: string, threatId: string) => void;

  // persist
  saveProject: () => Promise<void>;

  exportJson: () => void;
  importJsonFile: (file: File) => Promise<void>;
};

function emptyModel(name = "New threat model"): TMModel {
  const modelId = nanoid();
  return {
    id: modelId,
    name,
    updatedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
    threats: [],
    findings: [],
    threatLibrary: [
      {
        id: nanoid(),
        stride: "I",
        title: "Sensitive data exposure",
        description: "Sensitive data may be disclosed via logs, transit, storage, or misconfiguration.",
        defaultImpact: 4,
        defaultLikelihood: 3,
        suggestedMitigation: "Encrypt, least privilege, minimize logging, secrets management."
      },
      {
        id: nanoid(),
        stride: "S",
        title: "Spoofing / weak auth",
        description: "Entity may be impersonated or authentication may be weak/misused.",
        defaultImpact: 4,
        defaultLikelihood: 3,
        suggestedMitigation: "mTLS/OAuth best practices, token hardening, strong identity verification."
      },
      {
        id: nanoid(),
        stride: "D",
        title: "Denial of Service",
        description: "Service may be exhausted by excessive requests or expensive operations.",
        defaultImpact: 4,
        defaultLikelihood: 3,
        suggestedMitigation: "Rate limits, quotas, timeouts, caching, WAF/DDoS protection."
      }
    ]
  };
}

function logAudit(model: TMModel, ev: any): TMModel {
  const audit = [...(model.audit || []), ev];
  // Cap audit to keep browser memory safe
  const capped = audit.length > 5000 ? audit.slice(audit.length - 5000) : audit;
  return { ...model, audit: capped };
}

function cloneModel(m: TMModel): TMModel {
  return JSON.parse(JSON.stringify(m)) as TMModel;
}

function download(filename: string, content: Blob) {
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadProjectsIndex(): Promise<ProjectMeta[]> {
  const idx = await localforage.getItem<ProjectMeta[]>(STORAGE.projectsIndex);
  return idx || [];
}

async function saveProjectsIndex(projects: ProjectMeta[]) {
  await localforage.setItem(STORAGE.projectsIndex, projects);
}

export const useTMStore = create<Store>((set, get) => ({
  projectId: null,
  projects: [],
  model: emptyModel(),
  past: [],
  future: [],

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  commitHistory: () => {
    const { model, past } = get();
    set({ past: [...past, cloneModel(model)].slice(-50), future: [] });
  },

  undo: () => {
    const { past, model, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({ model: prev, past: past.slice(0, -1), future: [cloneModel(model), ...future] });
  },

  redo: () => {
    const { future, model, past } = get();
    if (!future.length) return;
    const next = future[0];
    set({ model: next, future: future.slice(1), past: [...past, cloneModel(model)].slice(-50) });
  },

  selectedNodeId: null,
  selectedEdgeId: null,
  uiTab: (localStorage.getItem("tm_ui_tab") as any) || "properties",
  setUiTab: (t) => set(() => { localStorage.setItem("tm_ui_tab", t); return { uiTab: t }; }),
  uiThreatGroupBy: (localStorage.getItem("tm_threat_group_by") as any) || "framework",
  setUiThreatGroupBy: (v) => set(() => { localStorage.setItem("tm_threat_group_by", v); return { uiThreatGroupBy: v }; }),
  frameworkSelections: JSON.parse(localStorage.getItem("tm_frameworks") || "[\"STRIDE\"]"),
  frameworkWeights: JSON.parse(localStorage.getItem("tm_framework_weights") || "{}"),
  setFrameworkWeight: (id, patch) => set((s) => {
    const next = { ...(s.frameworkWeights || {}) };
    const cur = next[id] || { likelihood: 3, impact: 3 };
    next[id] = { ...cur, ...patch };
    localStorage.setItem("tm_framework_weights", JSON.stringify(next));
    return { frameworkWeights: next };
  }),
  generateGapsOnly: JSON.parse(localStorage.getItem("tm_generate_gaps_only") || "true"),
  generateScope: (JSON.parse(localStorage.getItem("tm_generate_scope") || "\"selection\"") as any) || "selection",
  hasOnboarded: JSON.parse(localStorage.getItem("tm_onboarded") || "false"),
  setGenerateGapsOnly: (v) => set(() => { localStorage.setItem("tm_generate_gaps_only", JSON.stringify(v)); return { generateGapsOnly: v }; }),
  setGenerateScope: (v) => set(() => { localStorage.setItem("tm_generate_scope", JSON.stringify(v)); return { generateScope: v }; }),
  setHasOnboarded: (v) => set(() => { localStorage.setItem("tm_onboarded", JSON.stringify(v)); return { hasOnboarded: v }; }),
  threatFrameworkFilter: JSON.parse(localStorage.getItem("tm_threat_framework_filter") || "[]"),
  threatStatusFilter: JSON.parse(localStorage.getItem("tm_threat_status_filter") || "[]"),
  threatEvidenceFilter: (JSON.parse(localStorage.getItem("tm_threat_evidence_filter") || "\"any\"") as any) || "any",
  threatRiskCell: JSON.parse(localStorage.getItem("tm_threat_risk_cell") || "null"),
  savedViews: JSON.parse(localStorage.getItem("tm_saved_views") || "[]"),
  presentationMode: JSON.parse(localStorage.getItem("tm_presentation_mode") || "false"),
  savedThreatFilters: JSON.parse(localStorage.getItem("tm_saved_threat_filters") || "[]"),
  setThreatFrameworkFilter: (ids) => set(() => { localStorage.setItem("tm_threat_framework_filter", JSON.stringify(ids)); return { threatFrameworkFilter: ids }; }),
  setThreatStatusFilter: (ids) => set(() => { localStorage.setItem("tm_threat_status_filter", JSON.stringify(ids)); return { threatStatusFilter: ids }; }),
  setThreatEvidenceFilter: (v) => set(() => { localStorage.setItem("tm_threat_evidence_filter", JSON.stringify(v)); return { threatEvidenceFilter: v }; }),
  setThreatRiskCell: (v) => set(() => { localStorage.setItem("tm_threat_risk_cell", JSON.stringify(v)); return { threatRiskCell: v }; }),
  setPresentationMode: (v) => set(() => { localStorage.setItem("tm_presentation_mode", JSON.stringify(v)); return { presentationMode: v }; }),
  saveView: (name) => {
    const s = get() as any;
    const view = {
      id: nanoid(),
      name,
      tab: s.uiTab || "threats",
      groupBy: s.uiThreatGroupBy,
      frameworks: s.threatFrameworkFilter || [],
      statuses: s.threatStatusFilter || [],
      evidence: s.threatEvidenceFilter || "any",
      risk: s.threatRiskCell || null,
    };
    const next = [...(s.savedViews || []), view];
    localStorage.setItem("tm_saved_views", JSON.stringify(next));
    set({ savedViews: next });
  },
  applyView: (id) => {
    const s = get() as any;
    const v = (s.savedViews || []).find((x:any)=> x.id === id);
    if (!v) return;
    if (v.frameworks) s.setThreatFrameworkFilter(v.frameworks);
    if (v.statuses) s.setThreatStatusFilter(v.statuses);
    if (v.evidence) s.setThreatEvidenceFilter(v.evidence);
    s.setThreatRiskCell(v.risk || null);
    if (v.groupBy) s.setUiThreatGroupBy(v.groupBy);
    if (v.tab) s.setUiTab(v.tab);
  },
  deleteView: (id) => {
    const s = get() as any;
    const next = (s.savedViews || []).filter((x:any)=> x.id !== id);
    localStorage.setItem("tm_saved_views", JSON.stringify(next));
    set({ savedViews: next });
  },
  saveThreatFilter: (name) => set((s) => {
    const id = `flt_${Date.now().toString(36)}`;
    const entry = { id, name, frameworks: s.threatFrameworkFilter || [], statuses: (s as any).threatStatusFilter || [], evidence: (s as any).threatEvidenceFilter || "any" };
    const next = [...((s as any).savedThreatFilters || []), entry];
    localStorage.setItem("tm_saved_threat_filters", JSON.stringify(next));
    return { savedThreatFilters: next } as any;
  }),
  applyThreatFilter: (id) => set((s) => {
    const e = ((s as any).savedThreatFilters || []).find((x:any)=> x.id === id);
    if (!e) return {} as any;
    localStorage.setItem("tm_threat_framework_filter", JSON.stringify(e.frameworks || []));
    localStorage.setItem("tm_threat_status_filter", JSON.stringify(e.statuses || []));
    localStorage.setItem("tm_threat_evidence_filter", JSON.stringify(e.evidence || "any"));
    return { threatFrameworkFilter: e.frameworks || [], threatStatusFilter: e.statuses || [], threatEvidenceFilter: e.evidence || "any" } as any;
  }),
  deleteThreatFilter: (id) => set((s) => {
    const next = ((s as any).savedThreatFilters || []).filter((x:any)=> x.id !== id);
    localStorage.setItem("tm_saved_threat_filters", JSON.stringify(next));
    return { savedThreatFilters: next } as any;
  }),
  setFrameworkSelections: (ids) => set(() => { localStorage.setItem("tm_frameworks", JSON.stringify(ids)); return { frameworkSelections: ids }; }),
  isDirty: false,
  lastFileName: null,
  markClean: () => set(() => ({ isDirty: false })),
  setLastFileName: (n) => set(() => ({ lastFileName: n })),
  loadModel: (m) => set(() => ({ model: m, isDirty: false })),
  theme: ((localStorage.getItem("tm_theme") as any) || "light"),
  setTheme: (t) => set(() => { localStorage.setItem("tm_theme", t); return { theme: t }; }),
  autoStrideEnabled: JSON.parse(localStorage.getItem("tm_auto_stride") || "false"),
  setAutoStrideEnabled: (v) => set(() => { localStorage.setItem("tm_auto_stride", JSON.stringify(v)); return { autoStrideEnabled: v } as any; }),
duplicateNode: (id) => set((s) => {
  const n: any = s.model.nodes.find((x: any) => x.id === id);
  if (!n) return s as any;
  const copy = { ...n, id: nanoid(), position: { x: n.position.x + 30, y: n.position.y + 30 } };
  return { model: { ...s.model, nodes: [...s.model.nodes, copy] }, isDirty: true } as any;
}),

deleteNode: (id) => set((s) => {
  const nodes = (s.model.nodes || []).filter((n: any) => n.id !== id);
  const edges = (s.model.edges || []).filter((e: any) => e.source !== id && e.target !== id);
  return { model: { ...s.model, nodes, edges }, selectedNodeId: null, isDirty: true } as any;
}),

deleteEdge: (id) => set((s) => {
  const edges = (s.model.edges || []).filter((e: any) => e.id !== id);
  return { model: { ...s.model, edges }, selectedEdgeId: null, isDirty: true } as any;
}),

toggleEdgeFlag: (edgeId, flag) => set((s) => {
  const edges = (s.model.edges || []).map((e: any) => {
    if (e.id !== edgeId) return e;
    const data = { ...(e.data || {}) };
    data[flag] = !data[flag];
    return { ...e, data };
  });
  return { model: { ...s.model, edges }, isDirty: true } as any;
}),

createBoundaryCrossingThreat: (edgeId) => {
  const st = get();
  const e: any = st.model.edges.find((x: any) => x.id === edgeId);
  if (!e) return;
  const nodes: any[] = st.model.nodes as any[];
  const boundaries = nodes.filter((n) => n.type === "trustBoundary");
  const boundaryForNode = (node: any) => {
    const pt = { x: node.position.x + (node.width || node.measured?.width || 0) / 2, y: node.position.y + (node.height || node.measured?.height || 0) / 2 };
    const inside = boundaries.filter((b: any) => {
      const w = b.width ?? b.measured?.width ?? 280;
      const h = b.height ?? b.measured?.height ?? 200;
      return pt.x >= b.position.x && pt.x <= b.position.x + w && pt.y >= b.position.y && pt.y <= b.position.y + h;
    });
    inside.sort((a: any, b: any) => ((a.width ?? 0) * (a.height ?? 0)) - ((b.width ?? 0) * (b.height ?? 0)));
    return inside[0] || null;
  };
  const sNode = nodes.find((n) => n.id === e.source);
  const tNode = nodes.find((n) => n.id === e.target);
  const sb = sNode ? boundaryForNode(sNode) : null;
  const tb = tNode ? boundaryForNode(tNode) : null;
  if ((sb?.id || null) === (tb?.id || null)) {
    alert("This flow does not cross a trust boundary (source and target are in the same boundary).");
    return;
  }
  st.addThreat({
    stride: "T",
    title: `Trust boundary crossing on ${e.data?.label || "flow"}`,
    description: `Flow crosses a trust boundary (source: ${sb?.data?.label || "none"}, target: ${tb?.data?.label || "none"}).`,
    affectedNodeIds: [e.source, e.target],
    affectedEdgeIds: [e.id],
    likelihood: 3,
    impact: 4,
    status: "open",
    mitigation: "Validate boundary controls: network policy, authn/z, mTLS, input validation, logging, rate limits.",
    owner: "",
    commentary: [],
    findingIds: []
  });
},


  loadWorkspace: async () => {
    const projects = await loadProjectsIndex();
    if (!projects.length) {
      const id = nanoid();
      const m = emptyModel("Default project");
      const meta: ProjectMeta = { id, name: m.name, updatedAt: m.updatedAt };
      await localforage.setItem(STORAGE.projectKey(id), m);
      await saveProjectsIndex([meta]);
      set({ projects: [meta], projectId: id, model: m, past: [], future: [] });
      return;
    }
    const openId = projects[0].id;
    const m = await localforage.getItem<TMModel>(STORAGE.projectKey(openId));
    set({ projects, projectId: openId, model: m || emptyModel(projects[0].name), past: [], future: [] });
  },

  createProject: async (name) => {
    const id = nanoid();
    const m = emptyModel(name);
    const meta: ProjectMeta = { id, name, updatedAt: m.updatedAt };
    const projects = [...get().projects, meta];
    await localforage.setItem(STORAGE.projectKey(id), m);
    await saveProjectsIndex(projects);
    set({ projects, projectId: id, model: m, past: [], future: [] });
  },

  openProject: async (id) => {
    const m = await localforage.getItem<TMModel>(STORAGE.projectKey(id));
    const meta = get().projects.find((p) => p.id === id);
    set({ projectId: id, model: m || emptyModel(meta?.name || "Project"), past: [], future: [] });
  },

  renameProject: async (id, name) => {
    const projects = get().projects.map((p) => (p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p));
    await saveProjectsIndex(projects);
    set({ projects });
    if (get().projectId === id) {
      set((s) => ({ model: { ...s.model, name, updatedAt: new Date().toISOString() } }));
      await get().saveProject();
    }
  },

  deleteProject: async (id) => {
    const projects = get().projects.filter((p) => p.id !== id);
    await localforage.removeItem(STORAGE.projectKey(id));
    await localforage.removeItem(STORAGE.snapshotsKey(id));
    await saveProjectsIndex(projects);

    if (!projects.length) {
      await get().createProject("Default project");
      return;
    }
    set({ projects });
    if (get().projectId === id) {
      await get().openProject(projects[0].id);
    }
  },

  duplicateProject: async (id) => {
    const src = await localforage.getItem<TMModel>(STORAGE.projectKey(id));
    const meta = get().projects.find((p) => p.id === id);
    const name = `${meta?.name || "Project"} (copy)`;
    const newId = nanoid();
    const copied = src ? { ...cloneModel(src), id, name, updatedAt: new Date().toISOString() } : emptyModel(name);
    const newMeta: ProjectMeta = { id: newId, name, updatedAt: copied.updatedAt };
    const projects = [...get().projects, newMeta];
    await localforage.setItem(STORAGE.projectKey(newId), copied);
    await saveProjectsIndex(projects);
    set({ projects, projectId: newId, model: copied, past: [], future: [] });
  },

  listSnapshots: async () => {
    const pid = get().projectId;
    if (!pid) return [];
    return (await localforage.getItem<any[]>(STORAGE.snapshotsKey(pid))) || [];
  },

  createSnapshot: async (name, note) => {
    const pid = get().projectId;
    if (!pid) return;
    const snaps = (await localforage.getItem<any[]>(STORAGE.snapshotsKey(pid))) || [];
    const snap: Snapshot = {
      id,
      createdAt: new Date().toISOString(),
      name,
      note,
      model: cloneModel(get().model)
    };
    await localforage.setItem(STORAGE.snapshotsKey(pid), [snap, ...snaps].slice(0, 50));
  },

  restoreSnapshot: async (snapshotId) => {
    const pid = get().projectId;
    if (!pid) return;
    const snaps = (await localforage.getItem<Snapshot[]>(STORAGE.snapshotsKey(pid))) || [];
    const snap = snaps.find((s) => s.id === snapshotId);
    if (!snap) return;
    set({ model: cloneModel(snap.model), past: [], future: [] });
    await get().saveProject();
  },

  setName: (name) => {
    get().commitHistory();
    set((s) => ({ model: { ...s.model, name, updatedAt: new Date().toISOString() } }));
  },

  setNodes: (nodes) => set((s) => ({ model: { ...s.model, nodes, updatedAt: new Date().toISOString() } })),
  setEdges: (edges) => set((s) => ({ model: { ...s.model, edges, updatedAt: new Date().toISOString() } })),

  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  updateNodeData: (id, patch) => {
    get().commitHistory();
    const m = get().model;
    const nodes = (m.nodes as TMNode[]).map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n));
    set({ model: { ...m, nodes, updatedAt: new Date().toISOString() } });
  },

  updateEdgeData: (id, patch) => {
    get().commitHistory();
    const m = get().model;
    const edges = (m.edges as TMEdge[]).map((e) => (e.id === id ? { ...e, data: { ...e.data, ...patch } } : e));
    set({ model: { ...m, edges, updatedAt: new Date().toISOString() } });
  },

  setThreats: (threats) => {
    get().commitHistory();
    set((s) => ({ model: { ...s.model, threats, updatedAt: new Date().toISOString() } }));
  },

  addThreat: (t) => {
    get().commitHistory();
    const id = nanoid();
    const at = new Date().toISOString();
    set((s) => ({
      model: logAudit(
        { ...s.model, threats: [...s.model.threats, { ...t, id }], updatedAt: at },
        { id: nanoid(), at, type: "threat_created", entity: { kind: "threat", id }, summary: `Threat created: ${t.title}`, details: { framework: (t as any).framework } }
      )
    }));
  },

  updateThreat: (id, patch) => {
    get().commitHistory();
    const at = new Date().toISOString();
    set((s) => {
      const before = s.model.threats.find((t) => t.id === id);
      const nextThreats = s.model.threats.map((t) => (t.id === id ? { ...t, ...patch } : t));
      const after = nextThreats.find((t) => t.id === id);
      const evType =
        before && after && patch.status && before.status !== after.status ? "threat_status_changed" : "threat_updated";
      const summary =
        evType === "threat_status_changed"
          ? `Threat status changed: ${(before as any)?.title || id} → ${patch.status}`
          : `Threat updated: ${(before as any)?.title || id}`;
      return {
        model: logAudit({ ...s.model, threats: nextThreats, updatedAt: at }, { id: nanoid(), at, type: evType, entity: { kind: "threat", id }, summary, details: patch })
      };
    });
  },

  deleteThreat: (id) => {
    get().commitHistory();
    set((s) => ({ model: { ...s.model, threats: s.model.threats.filter((t) => t.id !== id), updatedAt: new Date().toISOString() } }));
  },

  addFinding: (f) => {
    const id = nanoid();
    set((s) => {
      get().commitHistory();
      const createdAt = new Date().toISOString();
      const finding: Finding = {
        id,
        createdAt,
        title: f.title,
        description: f.description,
        status: f.status,
        owner: f.owner,
        evidence: f.evidence ?? [],
        relatedThreatIds: f.relatedThreatIds ?? []
      };
      const threats = s.model.threats.map((t) =>
        (finding.relatedThreatIds || []).includes(t.id)
          ? { ...t, findingIds: Array.from(new Set([...(t.findingIds || []), finding.id])) }
          : t
      );
      return { model: { ...s.model, findings: [...(s.model.findings || []), finding], threats, updatedAt: new Date().toISOString() , isDirty: true } };
    });
    return id;
  },

  addFindingControl: (findingId: string, c: any) => {
    const st = get();
    st.commitHistory();
    const at = new Date().toISOString();
    const f = (st.model.findings || []).find((x: any) => x.id === findingId);
    if (!f) return;
    const next = { ...f, compensatingControls: [...(f.compensatingControls || []), c] };
    set({
      model: logAudit(
        { ...st.model, findings: (st.model.findings || []).map((x: any) => (x.id === findingId ? next : x)), updatedAt: at },
        { id: nanoid(), at, type: "finding_control_added", entity: { kind: "finding", id: findingId }, summary: `Control added to finding: ${f.title}`, details: { category: c.category, vendor: c.vendor, coverage: c.coverage } }
      )
    });
  },

  updateFindingControl: (findingId: string, controlId: string, patch: any) => {
    const st = get();
    const f = (st.model.findings || []).find((x:any)=> x.id === findingId);
    if (!f) return;
    const next = { ...f, compensatingControls: (f.compensatingControls || []).map((c:any)=> c.id === controlId ? { ...c, ...patch } : c) };
    set({ model: { ...st.model, findings: (st.model.findings || []).map((x:any)=> x.id === findingId ? next : x) } });
  },
  removeFindingControl: (findingId: string, controlId: string) => {
    const st = get();
    const f = (st.model.findings || []).find((x:any)=> x.id === findingId);
    if (!f) return;
    const next = { ...f, compensatingControls: (f.compensatingControls || []).filter((c:any)=> c.id !== controlId) };
    set({ model: { ...st.model, findings: (st.model.findings || []).map((x:any)=> x.id === findingId ? next : x) } });
  },

  updateFinding: (id, patch) => {
    get().commitHistory();
    set((s) => ({ model: { ...s.model, findings: (s.model.findings || []).map((f) => (f.id === id ? { ...f, ...patch } : f)), updatedAt: new Date().toISOString() } }));
  },

  deleteFinding: (id) => {
    get().commitHistory();
    set((s) => ({
      model: {
        ...s.model,
        findings: (s.model.findings || []).filter((f) => f.id !== id),
        threats: (s.model.threats || []).map((t) => ({ ...t, findingIds: (t.findingIds || []).filter((fid) => fid !== id) })),
        updatedAt: new Date().toISOString()
      }
    }));
  },

  updateThreatEvidence: (threatId, evidenceId, patch) => {
    get().commitHistory();
    set((s) => ({
      model: {
        ...s.model,
        threats: (s.model.threats || []).map((t) =>
          t.id === threatId
            ? { ...t, commentary: (t.commentary || []).map((c: any) => (c.id === evidenceId ? { ...c, ...patch } : c)) }
            : t
        ),
        updatedAt: new Date().toISOString()
      }
    }));
  },

  updateFindingEvidence: (findingId, evidenceId, patch) => {
    get().commitHistory();
    set((s) => ({
      model: {
        ...s.model,
        findings: (s.model.findings || []).map((f) =>
          f.id === findingId
            ? { ...f, evidence: (f.evidence || []).map((e: any) => (e.id === evidenceId ? { ...e, ...patch } : e)) }
            : f
        ),
        updatedAt: new Date().toISOString()
      }
    }));
  },

  addEvidenceToThreat: (threatId, ev) => {
    get().commitHistory();
    set((s) => ({
      model: {
        ...s.model,
        threats: s.model.threats.map((t) =>
          t.id === threatId
            ? { ...t, commentary: [...(t.commentary || []), { id, createdAt: new Date().toISOString(), author: ev.author, note: ev.note, links: ev.links, status: (ev as any).status || "draft" }] }
            : t
        ),
        updatedAt: new Date().toISOString()
      }
    }));
  },

  addEvidenceToFinding: (findingId, ev) => {
    get().commitHistory();
    set((s) => ({
      model: {
        ...s.model,
        findings: (s.model.findings || []).map((f) =>
          f.id === findingId
            ? { ...f, evidence: [...(f.evidence || []), { id, createdAt: new Date().toISOString(), author: ev.author, note: ev.note, links: ev.links, status: (ev as any).status || "draft" }] }
            : f
        ),
        updatedAt: new Date().toISOString()
      }
    }));
  },

  linkFindingToThreat: (findingId, threatId) => {
    get().commitHistory();
    set((s) => {
      const findings = (s.model.findings || []).map((f) =>
        f.id === findingId ? { ...f, relatedThreatIds: Array.from(new Set([...(f.relatedThreatIds || []), threatId])) } : f
      );
      const threats = (s.model.threats || []).map((t) =>
        t.id === threatId ? { ...t, findingIds: Array.from(new Set([...(t.findingIds || []), findingId])) } : t
      );
      return { model: { ...s.model, findings, threats, updatedAt: new Date().toISOString() , isDirty: true } };
    });
  },

  unlinkFindingFromThreat: (findingId, threatId) => {
    get().commitHistory();
    set((s) => {
      const findings = (s.model.findings || []).map((f) =>
        f.id === findingId ? { ...f, relatedThreatIds: (f.relatedThreatIds || []).filter((id) => id !== threatId) } : f
      );
      const threats = (s.model.threats || []).map((t) =>
        t.id === threatId ? { ...t, findingIds: (t.findingIds || []).filter((id) => id !== findingId) } : t
      );
      return { model: { ...s.model, findings, threats, updatedAt: new Date().toISOString() , isDirty: true } };
    });
  },

  saveProject: async () => {
    const pid = get().projectId;
    if (!pid) return;
    const m = get().model;
    await localforage.setItem(STORAGE.projectKey(pid), m);
    const projects = get().projects.map((p) => (p.id === pid ? { ...p, name: m.name, updatedAt: m.updatedAt } : p));
    await saveProjectsIndex(projects);
    set({ projects });
  },

  exportJson: () => {
    const m = get().model;
    const blob = new Blob([JSON.stringify(m, null, 2)], { type: "application/json" });
    download(`${m.name.replace(/\s+/g, "_")}.tm.json`, blob);
  },

  importJsonFile: async (file) => {
    get().commitHistory();
    const text = await file.text();
    const parsed = JSON.parse(text) as TMModel;
    parsed.findings = parsed.findings || [];
    parsed.threatLibrary = parsed.threatLibrary || [];
    parsed.threats = (parsed.threats || []).map((t: any) => ({ ...t, commentary: t.commentary || [], findingIds: t.findingIds || [] }));
    set({ model: parsed, selectedNodeId: null, selectedEdgeId: null });
    await get().saveProject();
  }
}));
