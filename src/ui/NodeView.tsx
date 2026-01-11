import React from "react";
import { Handle, Position, NodeResizer } from "reactflow";
import type { TMNodeData } from "../model/store";
import { ServiceIcon } from "./Icon";

export function NodeView({ data }: { data: TMNodeData }) {
  const p = data.props || {};
  return (
    <div className="card" style={{minWidth:170, position:"relative"}}>
      <NodeResizer minWidth={140} minHeight={120} color="#0f4fe3" handleStyle={{ borderRadius: 6, width: 10, height: 10, border: "1px solid #0f4fe3" }} />
      <Handle type="target" position={Position.Left} />
      <div className="row" style={{justifyContent:"space-between"}}>
        <div className="row">
          {p.serviceId ? <ServiceIcon provider={p.provider || "unknown"} category={p.serviceCategory || ""} name=<span data-tm-label>{data.label}</span> /> : null}
          <div style={{fontWeight:650}}>{data.label || "(unnamed)"}</div>
        </div>
        <span className="badge">{data.kind}</span>
      </div>
      <div className="small muted">{p.provider ? `${p.provider}${p.serviceCategory ? " • " + p.serviceCategory : ""}` : ""}</div>
      <div className="row" style={{marginTop:6}}>
        {p.internetExposed ? <span className="pill">Internet</span> : null}
        {p.authRequired ? <span className="pill">Auth</span> : null}
        {p.loggingEnabled ? <span className="pill">Logs</span> : null}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
