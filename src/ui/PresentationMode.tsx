import React, { useMemo } from "react";
import { useTMStore } from "../model/store";

export function PresentationMode({ onClose }: { onClose: () => void }) {
  const model = useTMStore((s) => s.model);
  const threats = model.threats || [];
  const findings = model.findings || [];

  const stats = useMemo(() => {
    const open = threats.filter((t:any)=> t.status==="open"||t.status==="in_analysis").length;
    const mitigated = threats.filter((t:any)=> t.status==="mitigated"||t.status==="verified").length;
    const accepted = threats.filter((t:any)=> t.status==="accepted").length;
    const noEvidence = threats.filter((t:any)=> !(t.commentary||[]).length).length;
    return { open, mitigated, accepted, noEvidence };
  }, [threats]);

  return (
    <div style={{ position:"fixed", inset:0, zIndex: 9999, background:"var(--bg)", color:"var(--text)" }}>
      <div style={{ padding: 18, display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid var(--border)" }}>
        <div>
          <b style={{ fontSize: 18 }}>Presentation mode</b>
          <div className="small muted">Executive walkthrough view (read-only). Press Esc to exit.</div>
        </div>
        <button className="btnPrimary" onClick={onClose}>Exit</button>
      </div>

      <div style={{ padding: 18, display:"grid", gridTemplateColumns:"1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="cardTitle">Summary</div>
          <div className="kv" style={{ marginTop: 10 }}>
            <div><label className="small muted">Threats</label><div><b>{threats.length}</b></div></div>
            <div><label className="small muted">Findings</label><div><b>{findings.length}</b></div></div>
          </div>
          <div className="hr" />
          <div className="kv">
            <div><label className="small muted">Open / In analysis</label><div><b>{stats.open}</b></div></div>
            <div><label className="small muted">Mitigated / Verified</label><div><b>{stats.mitigated}</b></div></div>
            <div><label className="small muted">Accepted</label><div><b>{stats.accepted}</b></div></div>
            <div><label className="small muted">No evidence</label><div><b>{stats.noEvidence}</b></div></div>
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Top risks (L×I)</div>
          <div className="small muted">Top 10 threats by risk score.</div>
          <div className="hr" />
          <div className="list">
            {threats
              .slice()
              .sort((a:any,b:any)=> (Number(b.likelihood)*Number(b.impact)) - (Number(a.likelihood)*Number(a.impact)))
              .slice(0,10)
              .map((t:any)=> (
                <div key={t.id} className="item">
                  <div className="row" style={{ justifyContent:"space-between" }}>
                    <b>{t.title}</b>
                    <span className="badge">L{t.likelihood}/I{t.impact}</span>
                  </div>
                  <div className="small muted">{t.status} • {t.frameworkRef || t.framework || "STRIDE"}</div>
                </div>
              ))}
          </div>
        </div>

        <div className="card" style={{ gridColumn:"1 / span 2" }}>
          <div className="cardTitle">Presenter tips</div>
          <ul>
            <li>Open <b>Dashboard</b> for interactive heatmap & control coverage.</li>
            <li>Use <b>Search (Ctrl/Cmd + /)</b> to jump to key threats/findings live.</li>
            <li>Export a report at the end of the walkthrough.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
