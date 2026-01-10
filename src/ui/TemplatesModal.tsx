import React from "react";
import { builtinTemplates, cloneTemplateThreats } from "../model/templates_builtin";
import { useTMStore } from "../model/store";

export function TemplatesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addThreat = useTMStore((s) => s.addThreat);
  const commitHistory = useTMStore((s) => s.commitHistory);

  if (!open) return null;

  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="cardTitle">Templates</div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="small muted">Adds starter threats to your Threat Register (client-side only).</div>

        <div className="list" style={{ marginTop: 10 }}>
          {builtinTemplates.map((t) => (
            <div key={t.id} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <b>{t.name}</b>
                <button
                  className="btnPrimary"
                  onClick={() => {
                    commitHistory();
                    for (const thr of cloneTemplateThreats(t)) addThreat(thr);
                    onClose();
                  }}
                >
                  Add
                </button>
              </div>
              <div className="small muted">{t.threats.length} threats</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
