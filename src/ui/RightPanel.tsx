import React, { useMemo, useState } from "react";
import { VirtualList } from "./VirtualList";
import { useTMStore } from "../model/store";
import type { EvidenceStatus, FindingStatus, ThreatStatus } from "../model/types";
import { validateModel } from "../model/validation";
import { FRAMEWORKS, DEFAULT_WEIGHTS, generateFromFrameworks, type FrameworkId } from "../model/frameworks";
import { CONTROL_CATEGORIES } from "../model/controls";

function Pill({ text }: { text: string }) {
  return <span className="badge">{text}</span>;
}

const THREAT_STATUSES: ThreatStatus[] = ["open", "in_analysis", "mitigated", "accepted", "verified", "rejected"];
const FINDING_STATUSES: FindingStatus[] = [
  "proposed",
  "in_review",
  "accepted",
  "remediation_planned",
  "remediated",
  "verified",
  "rejected"
];
const EVIDENCE_STATUSES: EvidenceStatus[] = ["draft", "submitted", "reviewed", "verified", "superseded", "rejected"];

function isTextEditing() {
  const active = document.activeElement as HTMLElement | null;
  return !!(active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable));
}

function getFrameworkId(t: any): string {
  const fw = (t.framework || "").toString();
  if (fw === "STRIDE") return "STRIDE";
  if (fw.startsWith("OWASP Top 10")) return "OWASP_WEB";
  if (fw.startsWith("OWASP API Top 10")) return "OWASP_API";
  if (fw.startsWith("MITRE ATT&CK")) return "MITRE_TACTICS";
  if (fw.startsWith("CIA")) return "CIA";
  return fw || "STRIDE";
}

export function RightPanel({ onOpenSnapshots }: { onOpenSnapshots: () => void }) {
  const model = useTMStore((s) => s.model);
  const selectedNodeId = useTMStore((s) => s.selectedNodeId);
  const selectedEdgeId = useTMStore((s) => s.selectedEdgeId);

  const updateNodeData = useTMStore((s) => s.updateNodeData);
  const updateEdgeData = useTMStore((s) => s.updateEdgeData);

  const addThreat = useTMStore((s) => s.addThreat);
  const updateThreat = useTMStore((s) => s.updateThreat);
  const deleteThreat = useTMStore((s) => s.deleteThreat);

  const addFinding = useTMStore((s) => s.addFinding);
  const updateFinding = useTMStore((s) => s.updateFinding);
  const addFindingControl = useTMStore((s) => (s as any).addFindingControl) as (findingId: string, c: any) => void;
  const updateFindingControl = useTMStore((s) => (s as any).updateFindingControl) as (findingId: string, controlId: string, patch: any) => void;
  const removeFindingControl = useTMStore((s) => (s as any).removeFindingControl) as (findingId: string, controlId: string) => void;
  const deleteFinding = useTMStore((s) => s.deleteFinding);

  const addEvidenceToThreat = useTMStore((s) => s.addEvidenceToThreat);
  const addEvidenceToFinding = useTMStore((s) => s.addEvidenceToFinding);

  const updateThreatEvidence = useTMStore((s) => (s as any).updateThreatEvidence) as (
    threatId: string,
    evidenceId: string,
    patch: any
  ) => void;
  const updateFindingEvidence = useTMStore((s) => (s as any).updateFindingEvidence) as (
    findingId: string,
    evidenceId: string,
    patch: any
  ) => void;

  const linkFindingToThreat = useTMStore((s) => s.linkFindingToThreat);
  const unlinkFindingFromThreat = useTMStore((s) => s.unlinkFindingFromThreat);

  const threatFrameworkFilter = useTMStore((s) => (s as any).threatFrameworkFilter) as string[];
  const setThreatFrameworkFilter = useTMStore((s) => (s as any).setThreatFrameworkFilter) as (ids: string[]) => void;
  const threatStatusFilter = useTMStore((s) => (s as any).threatStatusFilter) as string[];
  const setThreatStatusFilter = useTMStore((s) => (s as any).setThreatStatusFilter) as (ids: string[]) => void;
  const threatEvidenceFilter = useTMStore((s) => (s as any).threatEvidenceFilter) as "any" | "no_evidence" | "has_verified";
  const setThreatEvidenceFilter = useTMStore((s) => (s as any).setThreatEvidenceFilter) as (v: any) => void;
  const threatRiskCell = useTMStore((s) => (s as any).threatRiskCell) as ({ likelihood: number; impact: number } | null);
  const setThreatRiskCell = useTMStore((s) => (s as any).setThreatRiskCell) as (v: { likelihood: number; impact: number } | null) => void;

  const frameworkSelections = useTMStore((s) => s.frameworkSelections) as FrameworkId[];
  const setFrameworkSelections = useTMStore((s) => s.setFrameworkSelections) as (ids: FrameworkId[]) => void;
  const frameworkWeights = useTMStore((s) => (s as any).frameworkWeights) as Record<string, { likelihood: number; impact: number }>;
  const setFrameworkWeight = useTMStore((s) => (s as any).setFrameworkWeight) as (
    id: string,
    patch: { likelihood?: number; impact?: number }
  ) => void;
  const generateGapsOnly = useTMStore((s) => (s as any).generateGapsOnly) as boolean;
  const setGenerateGapsOnly = useTMStore((s) => (s as any).setGenerateGapsOnly) as (v: boolean) => void;
  const generateScope = useTMStore((s) => (s as any).generateScope) as "selection" | "model";
  const setGenerateScope = useTMStore((s) => (s as any).setGenerateScope) as (v: "selection" | "model") => void;

  const savedThreatFilters = useTMStore((s) => (s as any).savedThreatFilters) as any[];
  const savedViews = useTMStore((s) => (s as any).savedViews) as any[];
  const saveView = useTMStore((s) => (s as any).saveView) as (name: string) => void;
  const applyView = useTMStore((s) => (s as any).applyView) as (id: string) => void;
  const deleteView = useTMStore((s) => (s as any).deleteView) as (id: string) => void;
  const saveThreatFilter = useTMStore((s) => (s as any).saveThreatFilter) as (name: string) => void;
  const applyThreatFilter = useTMStore((s) => (s as any).applyThreatFilter) as (id: string) => void;
  const deleteThreatFilter = useTMStore((s) => (s as any).deleteThreatFilter) as (id: string) => void;

  const groupBy = useTMStore((s) => (s as any).uiThreatGroupBy) as "none" | "framework" | "status" | "owner";
  const setGroupBy = useTMStore((s) => (s as any).setUiThreatGroupBy) as (v: any) => void;
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [collapsedThreatItems, setCollapsedThreatItems] = useState<Record<string, boolean>>({});
  const toggleThreatItem = (id: string) =>
    setCollapsedThreatItems((s) => ({ ...s, [id]: !(s[id] ?? true) }));

  const nodes = model.nodes as any[];
  const edges = model.edges as any[];
  const node = nodes.find((n) => n.id === selectedNodeId);
  const edge = edges.find((e) => e.id === selectedEdgeId);

  const tab = useTMStore((s) => s.uiTab);
  const setTab = useTMStore((s) => s.setUiTab);
  const addThreatFromSelection = () => {
    const st = useTMStore.getState();
    const nid = st.selectedNodeId;
    const eid = st.selectedEdgeId;
    addThreat({
      stride: "T",
      title: nid ? "Threat affecting selected node" : eid ? "Threat affecting selected flow" : "New threat",
      description: "",
      status: "open",
      affectedNodeIds: nid ? [nid] : [],
      affectedEdgeIds: eid ? [eid] : [],
      owner: "",
      likelihood: 3 as any,
      impact: 3 as any,
      mitigation: "",
      commentary: [],
      findingIds: []
    });
  };

  const addFindingFromSelection = () => {
    const st = useTMStore.getState();
    const nid = st.selectedNodeId;
    const eid = st.selectedEdgeId;
    const title = nid ? "Finding for selected node" : eid ? "Finding for selected flow" : "New finding";

    addFinding({
      title,
      description: "",
      status: "proposed",
      owner: "",
      evidence: [],
      relatedThreatIds: []
    });
  };

  const addFindingForThreat = (threatId: string, opts?: { addControl?: boolean }) => {
    const st = useTMStore.getState() as any;
    const t = (st.model.threats || []).find((x: any) => x.id === threatId);
    const title = t ? `Finding for threat: ${t.title}` : "Finding for threat";

    let controls: any[] = [];
    if (opts?.addControl) {
      const catId = (prompt(`Control category: ${CONTROL_CATEGORIES.map((c) => c.id).join(" | ")}`) || "").trim();
      const cat = CONTROL_CATEGORIES.find((c) => c.id === catId) || CONTROL_CATEGORIES[0];
      const vendor = (prompt(`Vendor (optional). Examples: ${(cat.vendors || []).slice(0, 5).map((v) => v.name).join(", ")}`) || "").trim();
      controls = [
        {
          id: crypto.randomUUID(),
          category: cat.id,
          vendor,
          providedControl: "",
          coverage: "partial",
          notes: ""
        }
      ];
    }

    const fid = addFinding({
      title,
      description: "",
      status: "proposed",
      owner: "",
      evidence: [],
      relatedThreatIds: [threatId],
      compensatingControls: controls
    } as any);

    const nextIds = Array.from(new Set([...(t?.findingIds || []), fid]));
    updateThreat(threatId, { findingIds: nextIds } as any);
    setTab("findings");
  };

  const threatsAll = model.threats || [];
  const threatSummary = useMemo(() => {
    const total = threatsAll.length;
    const open = threatsAll.filter((t: any) => t.status === "open" || t.status === "in_analysis").length;
    const noEvidence = threatsAll.filter((t: any) => !(t.commentary || []).length).length;
    const noFindings = threatsAll.filter((t: any) => !(t.findingIds || []).length).length;
    const verifiedEvidence = threatsAll.filter((t: any) => (t.commentary || []).some((e: any) => e.status === "verified")).length;
    return { total, open, noEvidence, noFindings, verifiedEvidence };
  }, [threatsAll]);

  const autoStrideThreats = useMemo(() => {
    return (threatsAll as any[]).filter((t) => String(t.frameworkRef || "").startsWith("STRIDE_AUTO"));
  }, [threatsAll]);

  const filteredThreats = useMemo(() => {
    return (threatsAll as any[]).filter((t: any) => {
      const fwId = getFrameworkId(t);
      if (threatFrameworkFilter.length && !threatFrameworkFilter.includes(fwId)) return false;
      if (threatStatusFilter.length && !threatStatusFilter.includes(t.status || "open")) return false;
      if (threatEvidenceFilter === "no_evidence" && (t.commentary || []).length) return false;
      if (threatEvidenceFilter === "has_verified" && !(t.commentary || []).some((e: any) => e.status === "verified")) return false;
      if (threatRiskCell && !(Number(t.likelihood) === threatRiskCell.likelihood && Number(t.impact) === threatRiskCell.impact)) return false;
      return true;
    });
  }, [threatsAll, threatFrameworkFilter, threatStatusFilter, threatEvidenceFilter, threatRiskCell]);

  const groupedThreats = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const keyFor = (t: any) => {
      if (groupBy === "none") return "All";
      if (groupBy === "framework") return getFrameworkId(t);
      if (groupBy === "status") return t.status || "open";
      if (groupBy === "owner") return t.owner || "(unassigned)";
      return "All";
    };
    for (const t of filteredThreats) {
      const k = keyFor(t);
      (groups[k] ||= []).push(t);
    }
    // Move STRIDE auto-generated threats to the top within each group.
    for (const k of Object.keys(groups)) {
      groups[k].sort((a: any, b: any) => {
        const aa = String(a.frameworkRef || "").startsWith("STRIDE_AUTO") ? 0 : 1;
        const bb = String(b.frameworkRef || "").startsWith("STRIDE_AUTO") ? 0 : 1;
        if (aa !== bb) return aa - bb;
        return String(a.title || "").localeCompare(String(b.title || ""));
      });
    }
    return groups;
  }, [filteredThreats, groupBy]);

  const findings = model.findings || [];
  const issues = useMemo(() => validateModel(model), [model]);
  return (
    <div className="col">
      <div className="tabs">
        <button className={tab === "properties" ? "tab tabActive" : "tab"} onClick={() => setTab("properties")}>
          Properties
        </button>
        <button className={tab === "threats" ? "tab tabActive" : "tab"} onClick={() => setTab("threats")}>
          Threats ({filteredThreats.length})
        </button>
        <button className={tab === "findings" ? "tab tabActive" : "tab"} onClick={() => setTab("findings")}>
          Findings ({findings.length})
        </button>
        <button className={tab === "dashboard" ? "tab tabActive" : "tab"} onClick={() => setTab("dashboard")}>
          Dashboard
        </button>
        <button className={tab === "timeline" ? "tab tabActive" : "tab"} onClick={() => setTab("timeline")}>
          Timeline
        </button>
        <button className={tab === "validation" ? "tab tabActive" : "tab"} onClick={() => setTab("validation")}>
          Validation ({issues.length})
        </button>
        <button className={tab === "help" ? "tab tabActive" : "tab"} onClick={() => setTab("help")}>
          Help
        </button>
      </div>

      {tab === "properties" && (
        <>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="cardTitle">Model</div>
              <button className="btn" onClick={onOpenSnapshots}>
                Snapshots
              </button>
            </div>

            <div className="kv">
              <div>
                <label className="small muted">Name</label>
                <input
                  className="input"
                  value={model.name}
                  onChange={(e) => useTMStore.getState().setName(e.target.value)}
                />
              </div>
              <div>
                <label className="small muted">Updated</label>
                <input className="input" value={model.updatedAt} readOnly />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Selection</div>
            <div className="small muted">Select a node or a flow in the diagram to edit properties here.</div>

            {node ? (
              <div className="col" style={{ gap: 10, marginTop: 10 }}>
                <div className="kv">
                  <div>
                    <label className="small muted">Label</label>
                    <input
                      className="input"
                      value={node.data?.label || ""}
                      onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="small muted">Kind</label>
                    <input className="input" value={node.data?.kind || ""} readOnly />
                  </div>
                </div>

                <div className="kv">
                  <div>
                    <label className="small muted">Provider</label>
                    <select
                      className="select"
                      value={node.data?.props?.provider || "unknown"}
                      onChange={(e) =>
                        updateNodeData(node.id, { props: { ...(node.data.props || {}), provider: e.target.value as any } })
                      }
                    >
                      <option value="unknown">unknown</option>
                      <option value="aws">aws</option>
                      <option value="azure">azure</option>
                      <option value="gcp">gcp</option>
                      <option value="saas">saas</option>
                      <option value="onprem">onprem</option>
                      <option value="hybrid">hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="small muted">Data classification</label>
                    <select
                      className="select"
                      value={node.data?.props?.dataClassification || "Internal"}
                      onChange={(e) =>
                        updateNodeData(node.id, {
                          props: { ...(node.data.props || {}), dataClassification: e.target.value as any }
                        })
                      }
                    >
                      <option>Public</option>
                      <option>Internal</option>
                      <option>Confidential</option>
                      <option>Restricted</option>
                    </select>
                  </div>
                </div>

                <div className="kv">
                  <div>
                    <label className="small muted">Internet exposed</label>
                    <select
                      className="select"
                      value={String(!!node.data?.props?.internetExposed)}
                      onChange={(e) =>
                        updateNodeData(node.id, {
                          props: { ...(node.data.props || {}), internetExposed: e.target.value === "true" }
                        })
                      }
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="small muted">Auth required</label>
                    <select
                      className="select"
                      value={String(!!node.data?.props?.authRequired)}
                      onChange={(e) =>
                        updateNodeData(node.id, { props: { ...(node.data.props || {}), authRequired: e.target.value === "true" } })
                      }
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>

                <div className="kv">
                  <div>
                    <label className="small muted">Logging enabled</label>
                    <select
                      className="select"
                      value={String(!!node.data?.props?.loggingEnabled)}
                      onChange={(e) =>
                        updateNodeData(node.id, {
                          props: { ...(node.data.props || {}), loggingEnabled: e.target.value === "true" }
                        })
                      }
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="small muted">Encryption at rest</label>
                    <select
                      className="select"
                      value={String(!!node.data?.props?.encryptionAtRest)}
                      onChange={(e) =>
                        updateNodeData(node.id, {
                          props: { ...(node.data.props || {}), encryptionAtRest: e.target.value === "true" }
                        })
                      }
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : edge ? (
              <div className="col" style={{ gap: 10, marginTop: 10 }}>
                <div className="kv">
                  <div>
                    <label className="small muted">Protocol</label>
                    <input
                      className="input"
                      value={edge.data?.props?.protocol || ""}
                      onChange={(e) => updateEdgeData(edge.id, { props: { ...(edge.data.props || {}), protocol: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="small muted">Data type</label>
                    <input
                      className="input"
                      value={edge.data?.props?.dataType || ""}
                      onChange={(e) => updateEdgeData(edge.id, { props: { ...(edge.data.props || {}), dataType: e.target.value } })}
                    />
                  </div>
                </div>

                <div className="kv">
                  <div>
                    <label className="small muted">Encrypted in transit</label>
                    <select
                      className="select"
                      value={String(!!edge.data?.props?.encryptionInTransit)}
                      onChange={(e) =>
                        updateEdgeData(edge.id, {
                          props: { ...(edge.data.props || {}), encryptionInTransit: e.target.value === "true" }
                        })
                      }
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="small muted">Auth on flow</label>
                    <select
                      className="select"
                      value={String(!!edge.data?.props?.authOnFlow)}
                      onChange={(e) => updateEdgeData(edge.id, { props: { ...(edge.data.props || {}), authOnFlow: e.target.value === "true" } })}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="small muted" style={{ marginTop: 10 }}>
                Nothing selected.
              </div>
            )}
          </div>
        </>
      )}
      {tab === "threats" && (
        <>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div className="cardTitle">STRIDE (auto)</div>
              <span className="badge">{autoStrideThreats.length}</span>
            </div>
            <div className="small muted">
              Auto-generated STRIDE findings based on node type, flows, and basic properties. These appear in the Threat list under the STRIDE group.
            </div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <button
                className="btn"
                onClick={() => {
                  setThreatFrameworkFilter(["STRIDE"]);
                  setGroupBy("framework");
                  setCollapsedGroups({});
                  setTab("threats");
                }}
              >
                Focus STRIDE
              </button>
              <button className="btn" onClick={() => setThreatFrameworkFilter([])}>Clear framework filter</button>
            </div>
            {!autoStrideThreats.length ? (
              <div className="small muted" style={{ marginTop: 10 }}>
                No auto STRIDE findings yet. Enable Auto STRIDE in Actions and add services/flows.
              </div>
            ) : null}
          </div>

          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="cardTitle">Threats</div>
              <button className="btn" onClick={addThreatFromSelection} disabled={isTextEditing()}>
                Add
              </button>
            </div>
            <div className="small muted">Track threats, link findings, and record evidence.</div>
            <div className="row" style={{ gap: 12, flexWrap: "wrap", marginTop: 8 }}>
              <div className="small">Total: {threatSummary.total}</div>
              <div className="small">Open/In analysis: {threatSummary.open}</div>
              <div className="small">No evidence: {threatSummary.noEvidence}</div>
              <div className="small">No findings: {threatSummary.noFindings}</div>
              <div className="small">Has verified evidence: {threatSummary.verifiedEvidence}</div>
            </div>
            <div className="hr" />
            <details className="details">
              <summary className="small muted"><b>Generate threats from libraries</b></summary>
              <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <select
                className="select"
                multiple
                size={Math.min(6, FRAMEWORKS.length)}
                value={frameworkSelections as any}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions).map((o) => o.value as FrameworkId);
                  setFrameworkSelections(opts);
                }}
              >
                {FRAMEWORKS.map((fw) => (
                  <option key={fw.id} value={fw.id}>
                    {fw.name}
                  </option>
                ))}
              </select>
              <div className="col" style={{ gap: 6 }}>
                <label className="small muted">Weights (likelihood/impact)</label>
                {FRAMEWORKS.map((fw) => (
                  <div key={"wt-" + fw.id} className="row" style={{ gap: 6, alignItems: "center" }}>
                    <span className="tiny muted" style={{ width: 60 }}>{fw.id}</span>
                    <label className="small muted">
                      L
                      <input
                        className="input"
                        style={{ width: 70, marginLeft: 6 }}
                        type="number"
                        min={1}
                        max={5}
                        value={frameworkWeights[fw.id]?.likelihood ?? DEFAULT_WEIGHTS[fw.id].likelihood}
                        onChange={(e) => setFrameworkWeight(fw.id, { likelihood: Math.max(1, Math.min(5, Number(e.target.value))) })}
                      />
                    </label>
                    <label className="small muted">
                      I
                      <input
                        className="input"
                        style={{ width: 70, marginLeft: 6 }}
                        type="number"
                        min={1}
                        max={5}
                        value={frameworkWeights[fw.id]?.impact ?? DEFAULT_WEIGHTS[fw.id].impact}
                        onChange={(e) => setFrameworkWeight(fw.id, { impact: Math.max(1, Math.min(5, Number(e.target.value))) })}
                      />
                    </label>
                  </div>
                ))}
              </div>
              <div className="col" style={{ gap: 6 }}>
                <label className="row" style={{ gap: 6, alignItems: "center" }}>
                  <input type="checkbox" checked={generateGapsOnly} onChange={(e) => setGenerateGapsOnly(e.target.checked)} />
                  <span className="small muted">Generate gaps only</span>
                </label>
                <div className="row" style={{ gap: 6, alignItems: "center" }}>
                  <label className="small muted">Scope:</label>
                  <label className="row" style={{ gap: 4, alignItems: "center" }}>
                    <input type="radio" name="genScope" checked={generateScope === "selection"} onChange={() => setGenerateScope("selection")} />
                    <span className="small muted">Selection</span>
                  </label>
                  <label className="row" style={{ gap: 4, alignItems: "center" }}>
                    <input type="radio" name="genScope" checked={generateScope === "model"} onChange={() => setGenerateScope("model")} />
                    <span className="small muted">Whole model</span>
                  </label>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button
                    className="btnPrimary"
                    onClick={() => {
                      const st = useTMStore.getState();
                      const selection =
                        generateScope === "selection"
                          ? { nodeId: st.selectedNodeId, edgeId: st.selectedEdgeId }
                          : { nodeId: null, edgeId: null };
                      const generated = generateFromFrameworks(
                        st.model as any,
                        frameworkSelections as any,
                        selection,
                        { weights: { ...DEFAULT_WEIGHTS, ...(frameworkWeights || {}) } as any, gapsOnly: generateGapsOnly }
                      );
                      st.commitHistory();
                      for (const t of generated) st.addThreat(t as any);
                      setTab("threats");
                    }}
                    disabled={!frameworkSelections.length}
                  >
                    Generate from selected libraries
                  </button>
                  <button className="btn" onClick={() => setFrameworkSelections(["STRIDE"] as any)}>Reset</button>
                </div>
              </div>
            </div>
            </details>
          </div>

          <div className="card">
            <details className="details">
              <summary className="small muted"><b>Saved views & filters</b></summary>
              <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
                <span className="small muted">Saved views:</span>
                <select
                  className="select"
                  style={{ maxWidth: 240 }}
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) applyView(v);
                  }}
                >
                  <option value="">Apply.</option>
                  {(savedViews || []).map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn"
                  onClick={() => {
                    const name = (prompt("Name this view (captures current Threat filters + grouping + risk cell):") || "").trim();
                    if (name) saveView(name);
                  }}
                >
                  Save view
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    const name = (prompt("Delete view by name (exact):") || "").trim();
                    const v = (savedViews || []).find((x: any) => x.name === name);
                    if (v) deleteView(v.id);
                  }}
                >
                  Delete view
                </button>

                <span className="small muted" style={{ marginLeft: 10 }}>Saved filters:</span>
                <select
                  className="select"
                  style={{ maxWidth: 240 }}
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) applyThreatFilter(v);
                  }}
                >
                  <option value="">Apply.</option>
                  {(savedThreatFilters || []).map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button className="btn" onClick={() => { const name = prompt("Name this saved filter:") || ""; if (name.trim()) saveThreatFilter(name.trim()); }}>
                  Save current
                </button>
                <button className="btn" onClick={() => { const name = prompt("Delete saved filter by name (exact):") || ""; const f = (savedThreatFilters || []).find((x: any) => x.name === name.trim()); if (f) deleteThreatFilter(f.id); }}>
                  Delete filter
                </button>
              </div>
            </details>

            <div className="hr" />
            <div className="small muted"><b>Status filter</b></div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {THREAT_STATUSES.map((s) => (
                <label key={s} className="row" style={{ gap: 6, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={(threatStatusFilter || []).includes(s)}
                    onChange={() => {
                      const on = (threatStatusFilter || []).includes(s);
                      const next = on ? (threatStatusFilter || []).filter((x) => x !== s) : [...(threatStatusFilter || []), s];
                      setThreatStatusFilter(next);
                    }}
                  />
                  <span className="small muted">{s}</span>
                </label>
              ))}
              <button className="btn" onClick={() => setThreatStatusFilter([])}>Clear status</button>
            </div>

            <div className="hr" />
            <div className="small muted"><b>Evidence filter</b></div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
              <label className="row" style={{ gap: 6, alignItems: "center" }}>
                <input type="radio" name="evf" checked={threatEvidenceFilter === "any"} onChange={() => setThreatEvidenceFilter("any")} />
                <span className="small muted">Any</span>
              </label>
              <label className="row" style={{ gap: 6, alignItems: "center" }}>
                <input type="radio" name="evf" checked={threatEvidenceFilter === "no_evidence"} onChange={() => setThreatEvidenceFilter("no_evidence")} />
                <span className="small muted">No evidence</span>
              </label>
              <label className="row" style={{ gap: 6, alignItems: "center" }}>
                <input type="radio" name="evf" checked={threatEvidenceFilter === "has_verified"} onChange={() => setThreatEvidenceFilter("has_verified")} />
                <span className="small muted">Has verified evidence</span>
              </label>
            </div>

            <div className="hr" />
            <div className="small muted"><b>Framework filter</b></div>
            <div className="list" style={{ marginTop: 8 }}>
              {FRAMEWORKS.map((fw) => (
                <label key={fw.id} className="item" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={threatFrameworkFilter.includes(fw.id)}
                    onChange={() => {
                      const on = threatFrameworkFilter.includes(fw.id);
                      const next = on ? threatFrameworkFilter.filter((x) => x !== fw.id) : [...threatFrameworkFilter, fw.id];
                      setThreatFrameworkFilter(next);
                    }}
                  />
                  <div className="small muted">{fw.name}</div>
                </label>
              ))}
              <button className="btn" onClick={() => setThreatFrameworkFilter([])}>Clear filter</button>
              <button className="btn" onClick={() => setThreatRiskCell(null)}>Clear risk</button>
            </div>

            <div className="hr" />
            <div className="small muted"><b>Bulk actions</b></div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <button className="btn" onClick={() => {
                const v = prompt("Set status for filtered threats (open, in_analysis, mitigated, accepted, verified, rejected):") || "";
                if (!v.trim()) return;
                const st = useTMStore.getState();
                st.commitHistory();
                for (const t of filteredThreats) st.updateThreat(t.id, { status: v.trim() as any });
              }}>Set status</button>
              <button className="btn" onClick={() => {
                const v = prompt("Set owner for filtered threats:") || "";
                const st = useTMStore.getState();
                st.commitHistory();
                for (const t of filteredThreats) st.updateThreat(t.id, { owner: v });
              }}>Set owner</button>
              <button className="btn" onClick={() => {
                const l = Number(prompt("Set likelihood (1-5):") || "");
                const i = Number(prompt("Set impact (1-5):") || "");
                if (!l && !i) return;
                const st = useTMStore.getState();
                st.commitHistory();
                for (const t of filteredThreats) st.updateThreat(t.id, { ...(l ? { likelihood: l } : {}), ...(i ? { impact: i } : {}) } as any);
              }}>Set L/I</button>
              <button className="btn" onClick={() => {
                if (!confirm(`Delete ${filteredThreats.length} filtered threats?`)) return;
                const st = useTMStore.getState();
                st.commitHistory();
                for (const t of filteredThreats) st.deleteThreat(t.id);
              }}>Delete</button>
            </div>

            <div className="hr" />
            <div className="small muted"><b>Group by</b></div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <select className="select" value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}>
                <option value="none">none</option>
                <option value="framework">framework</option>
                <option value="status">status</option>
                <option value="owner">owner</option>
              </select>
              <button className="btn" onClick={() => setCollapsedGroups({})}>Expand all</button>
            </div>
          </div>

          <div className="list" style={{ marginTop: 10 }}>
            {Object.entries(groupedThreats)
              .sort(([a], [b]) => {
                if (groupBy === "framework") {
                  if (a === "STRIDE" && b !== "STRIDE") return -1;
                  if (b === "STRIDE" && a !== "STRIDE") return 1;
                }
                return String(a).localeCompare(String(b));
              })
              .map(([gk, items]) => {
              const title = groupBy === "framework" ? (FRAMEWORKS.find((f) => f.id === gk)?.name || gk) : gk;
              const isCollapsed = !!collapsedGroups[gk];
              return (
                <div key={gk} className="card" style={{ marginBottom: 10 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <button className="btn" onClick={() => setCollapsedGroups((s) => ({ ...s, [gk]: !s[gk] }))} title={isCollapsed ? "Expand" : "Collapse"}>
                        {isCollapsed ? "+" : ">"}
                      </button>
                      <b>{title}</b>
                      <span className="badge">{items.length}</span>
                    </div>
                  </div>
                  {!isCollapsed ? (
                    <div className="list" style={{ marginTop: 10 }}>
                      {items.slice(0, 200).map((t: any) => {
                        const isThreatCollapsed = collapsedThreatItems[t.id] ?? true;
                        return (
                          <div key={t.id} className="card">
                            <div className="row" style={{ justifyContent: "space-between" }}>
                              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                                <button className="btn" onClick={() => toggleThreatItem(t.id)} title={isThreatCollapsed ? "Expand" : "Collapse"}>
                                  {isThreatCollapsed ? "+" : "-"}
                                </button>
                                <Pill text={t.status} />
                                <span className="badge">{t.stride}</span>
                                {t.framework ? <span className="badge">{t.frameworkRef ? `${t.frameworkRef}` : t.framework}</span> : null}
                                <b>{t.title}</b>
                              </div>
                              <button className="btn" onClick={() => deleteThreat(t.id)}>Delete</button>
                            </div>

                            {isThreatCollapsed ? (
                              <div className="small muted" style={{ marginTop: 6 }}>
                                {String(t.description || "").slice(0, 180)}
                                {String(t.description || "").length > 180 ? "..." : ""}
                              </div>
                            ) : (
                              <>
                                <div className="kv">
                                  <div>
                                    <label className="small muted">Status</label>
                                    <select className="select" value={t.status} onChange={(e) => updateThreat(t.id, { status: e.target.value as ThreatStatus })}>
                                      {THREAT_STATUSES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="small muted">Owner</label>
                                    <input className="input" value={t.owner || ""} onChange={(e) => updateThreat(t.id, { owner: e.target.value })} />
                                  </div>
                                </div>

                                <div>
                                  <label className="small muted">Title</label>
                                  <input className="input" value={t.title} onChange={(e) => updateThreat(t.id, { title: e.target.value })} />
                                </div>
                                <div>
                                  <label className="small muted">Description</label>
                                  <textarea className="input" rows={3} value={t.description || ""} onChange={(e) => updateThreat(t.id, { description: e.target.value })} />
                                </div>
                                <div>
                                  <label className="small muted">Mitigation</label>
                                  <textarea className="input" rows={2} value={t.mitigation || ""} onChange={(e) => updateThreat(t.id, { mitigation: e.target.value })} />
                                </div>

                                <div className="hr" />
                                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                                  <b>Compensating controls</b>
                                  <div className="row" style={{ gap: 8 }}>
                                    <button className="btn" onClick={() => addFindingForThreat(t.id)}>Add finding</button>
                                    <button className="btn" onClick={() => addFindingForThreat(t.id, { addControl: true })}>Add control</button>
                                  </div>
                                </div>
                                <div className="small muted">
                                  Controls are recorded on Findings. Use "Add control" to create a linked finding pre-seeded with a control category (EDR/NDR/SIEM/etc).
                                </div>
                                {(t.findingIds || []).length ? (
                                  <div className="small muted" style={{ marginTop: 6 }}>
                                    Linked findings: {(t.findingIds || []).slice(0, 6).join(", ")}{(t.findingIds || []).length > 6 ? "..." : ""}
                                  </div>
                                ) : (
                                  <div className="small muted" style={{ marginTop: 6 }}>No linked findings yet.</div>
                                )}

                                <div className="hr" />
                                <div className="row" style={{ justifyContent: "space-between" }}>
                                  <b>Evidence</b>
                                  <button className="btn" onClick={() => addEvidenceToThreat(t.id, { author: "", note: prompt("Evidence note:") || "", links: [], status: "draft" as any } as any)}>Add note</button>
                                </div>

                                {(t.commentary || []).length ? (
                                  <div className="list">
                                    {(t.commentary || []).map((ev: any) => (
                                      <div key={ev.id} className="item">
                                        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                                          <div className="small muted">{ev.createdAt} {ev.author ? "- " + ev.author : ""}</div>
                                          <select className="select" style={{ maxWidth: 160 }} value={(ev.status || "draft") as any} onChange={(e) => updateThreatEvidence(t.id, ev.id, { status: e.target.value as any })}>
                                            {EVIDENCE_STATUSES.map((s) => (
                                              <option key={s} value={s}>{s}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>{ev.note}</div>
                                        {(ev.links || []).length ? <div className="small muted">{(ev.links || []).join(" | ")}</div> : null}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="small muted">No evidence yet.</div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                      {items.length > 200 ? <div className="small muted">Showing first 200.</div> : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
      {tab === "findings" && (
        <>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="cardTitle">Findings</div>
              <button className="btn" onClick={addFindingFromSelection} disabled={isTextEditing()}>
                Add
              </button>
            </div>
            <div className="small muted">Track issues to fix or formally accept, and attach evidence.</div>
          </div>

          <div className="list" style={{ marginTop: 10 }}>
            {findings.length > 60 ? (
              <div style={{ height: 700 }}>
                <VirtualList
                  items={findings}
                  rowHeight={260}
                  overscan={6}
                  renderRow={(f: any) => (
                    <div className="card">
                      <FindingCard
                        f={f}
                        deleteFinding={deleteFinding}
                        updateFinding={updateFinding}
                        addEvidenceToFinding={addEvidenceToFinding}
                        updateFindingEvidence={updateFindingEvidence}
                        addFindingControl={addFindingControl}
                        updateFindingControl={updateFindingControl}
                        removeFindingControl={removeFindingControl}
                        linkFindingToThreat={linkFindingToThreat}
                        unlinkFindingFromThreat={unlinkFindingFromThreat}
                      />
                    </div>
                  )}
                />
              </div>
            ) : (
              findings.map((f: any) => (
                <div key={f.id} className="card">
                  <FindingCard
                    f={f}
                    deleteFinding={deleteFinding}
                    updateFinding={updateFinding}
                    addEvidenceToFinding={addEvidenceToFinding}
                    updateFindingEvidence={updateFindingEvidence}
                    addFindingControl={addFindingControl}
                    updateFindingControl={updateFindingControl}
                    removeFindingControl={removeFindingControl}
                    linkFindingToThreat={linkFindingToThreat}
                    unlinkFindingFromThreat={unlinkFindingFromThreat}
                  />
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === "dashboard" && (
        <Dashboard
          threatsAll={threatsAll}
          threatRiskCell={threatRiskCell}
          setThreatRiskCell={setThreatRiskCell}
          findings={findings}
        />
      )}

      {tab === "timeline" && (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div className="cardTitle">Timeline</div>
            <span className="badge">{(model.audit || []).length}</span>
          </div>
          <div className="small muted">Recent model activity (stored locally).</div>
          <div className="hr" />
          {(model.audit || []).length ? (
            <div className="list">
              {(model.audit || []).slice().reverse().slice(0, 150).map((ev: any) => (
                <div key={ev.id} className="item">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <b>{ev.summary || ev.type}</b>
                    <span className="badge">{ev.type}</span>
                  </div>
                  <div className="small muted">{ev.at}</div>
                  {ev.entity ? <div className="tiny muted">{ev.entity.kind}:{ev.entity.id}</div> : null}
                </div>
              ))}
              {(model.audit || []).length > 150 ? <div className="small muted">Showing latest 150 events.</div> : null}
            </div>
          ) : (
            <div className="small muted">No activity yet.</div>
          )}
        </div>
      )}

      {tab === "validation" && (
        <div className="card">
          <div className="cardTitle">Validation</div>
          <div className="small muted">Tips and checks to keep the model audit-friendly. These are warnings, not blockers.</div>
          <div className="hr" />
          {(issues || []).length ? (
            <div className="list">
              {issues.map((i) => (
                <div key={i.id} className="item">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <b>{i.title}</b>
                    <span className="badge">{i.severity}</span>
                  </div>
                  <div className="small muted">{i.detail}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="small muted">No issues detected.</div>
          )}
        </div>
      )}

      {tab === "help" && <HelpCard />}
    </div>
  );
}
function FindingCard({
  f,
  deleteFinding,
  updateFinding,
  addEvidenceToFinding,
  updateFindingEvidence,
  addFindingControl,
  updateFindingControl,
  removeFindingControl,
  linkFindingToThreat,
  unlinkFindingFromThreat
}: any) {
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          <Pill text={f.status} />
          <b>{f.title}</b>
        </div>
        <button className="btn" onClick={() => deleteFinding(f.id)}>
          Delete
        </button>
      </div>

      <div className="kv">
        <div>
          <label className="small muted">Status</label>
          <select className="select" value={f.status} onChange={(e) => updateFinding(f.id, { status: e.target.value as FindingStatus })}>
            {FINDING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="small muted">Owner</label>
          <input className="input" value={f.owner || ""} onChange={(e) => updateFinding(f.id, { owner: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="small muted">Title</label>
        <input className="input" value={f.title} onChange={(e) => updateFinding(f.id, { title: e.target.value })} />
      </div>
      <div>
        <label className="small muted">Description</label>
        <textarea
          className="input"
          rows={3}
          value={f.description || ""}
          onChange={(e) => updateFinding(f.id, { description: e.target.value })}
        />
      </div>

      <div className="hr" />

      <div className="row" style={{ justifyContent: "space-between" }}>
        <b>Evidence</b>
        <button
          className="btn"
          onClick={() =>
            addEvidenceToFinding(f.id, {
              author: "",
              note: prompt("Evidence note:") || "",
              links: [],
              status: "draft" as EvidenceStatus
            } as any)
          }
        >
          Add note
        </button>
      </div>

      {(f.evidence || []).length ? (
        <div className="list">
          {(f.evidence || []).map((ev: any) => (
            <div key={ev.id} className="item">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div className="small muted">
                  {ev.createdAt} {ev.author ? "- " + ev.author : ""}
                </div>
                <select
                  className="select"
                  style={{ maxWidth: 160 }}
                  value={(ev.status || "draft") as EvidenceStatus}
                  onChange={(e) => updateFindingEvidence(f.id, ev.id, { status: e.target.value as EvidenceStatus })}
                >
                  {EVIDENCE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>{ev.note}</div>
              {(ev.links || []).length ? <div className="small muted">{(ev.links || []).join(" | ")}</div> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="small muted">No evidence yet.</div>
      )}

      <div className="hr" />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b>Compensating controls</b>
        <button
          className="btn"
          onClick={() => {
            const cat = CONTROL_CATEGORIES[0];
            const vendor = cat.vendors[0];
            addFindingControl(f.id, {
              id: crypto.randomUUID(),
              category: cat.id,
              vendor: vendor?.name || "",
              providedControl: vendor?.notes || "",
              coverage: "partial",
              notes: ""
            });
          }}
        >
          Add control
        </button>
      </div>

      {(f.compensatingControls || []).length ? (
        <div className="list" style={{ marginTop: 8 }}>
          {(f.compensatingControls || []).map((c: any) => {
            const cat = CONTROL_CATEGORIES.find((x) => x.id === c.category) || CONTROL_CATEGORIES[0];
            const vendors = cat.vendors || [];
            return (
              <div key={c.id} className="card">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="row" style={{ gap: 8, alignItems: "center" }}>
                    <span className="badge">{cat.id}</span>
                    <b>{c.vendor}</b>
                  </div>
                  <button className="btn" onClick={() => removeFindingControl(f.id, c.id)}>Remove</button>
                </div>

                <div className="kv">
                  <div>
                    <label className="small muted">Category</label>
                    <select
                      className="select"
                      value={c.category}
                      onChange={(e) => {
                        const nextCat = e.target.value;
                        const cat2 = CONTROL_CATEGORIES.find((x) => x.id === nextCat) || CONTROL_CATEGORIES[0];
                        const v0 = cat2.vendors[0];
                        updateFindingControl(f.id, c.id, {
                          category: cat2.id,
                          vendor: v0 ? v0.name : "",
                          providedControl: v0 ? v0.notes : ""
                        });
                      }}
                    >
                      {CONTROL_CATEGORIES.map((cc) => (
                        <option key={cc.id} value={cc.id}>
                          {cc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="small muted">Vendor</label>
                    <select
                      className="select"
                      value={c.vendor}
                      onChange={(e) => {
                        const v = e.target.value;
                        const vend = vendors.find((vv) => vv.name === v);
                        updateFindingControl(f.id, c.id, { vendor: v, providedControl: vend ? vend.notes : c.providedControl });
                      }}
                    >
                      {vendors.map((vv) => (
                        <option key={vv.name} value={vv.name}>
                          {vv.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="small muted">Coverage</label>
                    <select className="select" value={c.coverage || "partial"} onChange={(e) => updateFindingControl(f.id, c.id, { coverage: e.target.value })}>
                      <option value="partial">partial</option>
                      <option value="complete">complete</option>
                      <option value="unknown">unknown</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="small muted">What it provides</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={c.providedControl || ""}
                    onChange={(e) => updateFindingControl(f.id, c.id, { providedControl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="small muted">Commentary</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={c.notes || ""}
                    onChange={(e) => updateFindingControl(f.id, c.id, { notes: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="small muted">No compensating controls recorded yet.</div>
      )}

      <div className="hr" />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b>Related threats</b>
        <button
          className="btn"
          onClick={() => {
            const id = prompt("Threat ID to link (or open Threats tab and copy an ID):") || "";
            if (id.trim()) linkFindingToThreat(f.id, id.trim());
          }}
        >
          Link by ID
        </button>
      </div>

      {(f.relatedThreatIds || []).length ? (
        <div className="list">
          {(f.relatedThreatIds || []).map((tid: string) => (
            <div key={tid} className="item">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="small muted">{tid}</div>
                <button className="btn" onClick={() => unlinkFindingFromThreat(f.id, tid)}>Unlink</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="small muted">No related threats linked yet.</div>
      )}
    </>
  );
}
function Dashboard({ threatsAll, threatRiskCell, setThreatRiskCell, findings }: any) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="cardTitle">Dashboard</div>
      <div className="small muted">Risk heatmap and control coverage.</div>

      <div className="card" style={{ marginTop: 8 }}>
        <div className="cardTitle">Risk heatmap</div>
        <div className="small muted">Click a cell to filter threats by likelihood and impact.</div>
        <div style={{ marginTop: 12 }}>
          <div className="heatmap">
            {Array.from({ length: 5 }).map((_, iRow) => {
              const impact = 5 - iRow;
              return (
                <div key={"r" + impact} className="heatmapRow">
                  {Array.from({ length: 5 }).map((__, iCol) => {
                    const likelihood = iCol + 1;
                    const count = threatsAll.filter((t: any) => Number(t.likelihood) === likelihood && Number(t.impact) === impact).length;
                    const selected = threatRiskCell && threatRiskCell.likelihood === likelihood && threatRiskCell.impact === impact;
                    const score = likelihood * impact;
                    const cls = score >= 20 ? "h5" : score >= 16 ? "h4" : score >= 12 ? "h3" : score >= 8 ? "h2" : "h1";
                    return (
                      <button
                        key={"c" + likelihood}
                        className={"heatCell " + cls + (selected ? " heatSel" : "")}
                        onClick={() => setThreatRiskCell(selected ? null : { likelihood, impact })}
                        title={`L${likelihood} / I${impact} (${count} threats)`}
                      >
                        <div className="small">
                          <b>{count}</b>
                        </div>
                        <div className="tiny muted">L{likelihood}/I{impact}</div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
            <div className="small muted">Selected: {threatRiskCell ? `L${threatRiskCell.likelihood}/I${threatRiskCell.impact}` : "None"}</div>
            <button className="btn" onClick={() => setThreatRiskCell(null)}>Clear</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">Control coverage</div>
        <div className="small muted">Shows how compensating controls on findings cover linked threats.</div>

        {(() => {
          const byCat: Record<string, { threats: Set<string>; partial: number; complete: number; unknown: number }> = {};
          for (const f of findings as any[]) {
            const controls = (f.compensatingControls || []) as any[];
            const linkedThreats = new Set<string>(
              ((f.relatedThreatIds || f.threatIds || f.linkedThreatIds || []) as any[]).filter(Boolean)
            );
            for (const t of threatsAll as any[]) {
              if ((t.findingIds || []).includes(f.id)) linkedThreats.add(t.id);
            }
            for (const c of controls) {
              const cat = c.category || "OTHER";
              if (!byCat[cat]) byCat[cat] = { threats: new Set(), partial: 0, complete: 0, unknown: 0 };
              for (const tid of linkedThreats) byCat[cat].threats.add(tid);
              const cov = c.coverage || "partial";
              if (cov === "complete") byCat[cat].complete += 1;
              else if (cov === "unknown") byCat[cat].unknown += 1;
              else byCat[cat].partial += 1;
            }
          }

          const rows = Object.entries(byCat).sort((a, b) => b[1].threats.size - a[1].threats.size);
          if (!rows.length) {
            return <div className="small muted">No controls recorded yet. Add compensating controls to findings to populate this view.</div>;
          }

          return (
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Control</th>
                  <th>Threats covered</th>
                  <th>Partial</th>
                  <th>Complete</th>
                  <th>Unknown</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([cat, v]) => (
                  <tr key={cat}>
                    <td>
                      <b>{cat}</b>
                    </td>
                    <td>{v.threats.size}</td>
                    <td>{v.partial}</td>
                    <td>{v.complete}</td>
                    <td>{v.unknown}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>
    </div>
  );
}

function HelpCard() {
  return (
    <div className="card">
      <div className="cardTitle">How to use</div>
      <div className="small muted">Everything runs locally in your browser. No backend required.</div>

      <div className="hr" />
      <div className="col" style={{ gap: 10 }}>
        <div>
          <b>1) Build your diagram</b>
          <div className="small muted">Drag nodes from the left palette. Connect them with flows. Add trust boundaries to show security zones.</div>
        </div>
        <div>
          <b>2) Add threats</b>
          <div className="small muted">Use Generate STRIDE, Templates, or right-click a node/flow to create a threat linked to what it affects.</div>
        </div>
        <div>
          <b>3) Record findings + evidence</b>
          <div className="small muted">Findings capture issues to fix or formally accept. Evidence notes capture proof and can be verified for audit.</div>
        </div>
        <div>
          <b>4) Export for review</b>
          <div className="small muted">Use Open/Save As to move files. Use Evidence ZIP and Report PDF for reviews and audits.</div>
        </div>

        <div className="hr" />

        <div>
          <b>Status guidance</b>
          <div className="small muted">
            Threats: open &gt; in_analysis &gt; mitigated/accepted &gt; verified (or rejected)
            <br />
            Findings: proposed &gt; in_review &gt; remediation_planned &gt; remediated &gt; verified (or accepted/rejected)
            <br />
            Evidence: draft &gt; submitted &gt; reviewed &gt; verified (or superseded/rejected)
          </div>
        </div>

        <div className="hr" />

        <div>
          <b>Keyboard shortcuts</b>
          <div className="small muted">
            - Ctrl/Cmd + K: Command palette
            <br />
            - Ctrl/Cmd + /: Global search
            <br />
            - P: Presentation mode
            <br />
            - ?: Open Help tab
            <br />
            - Esc: Close dialogs
          </div>
        </div>

        <div className="hr" />

        <div>
          <b>Example screenshots</b>
          <div className="small muted">Sample views to help onboard new users.</div>
          <img src="/example-screens.png" style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)" }} />
        </div>
      </div>
    </div>
  );
}
