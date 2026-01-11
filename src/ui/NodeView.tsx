import React from "react";
import { Handle, NodeResizer, Position } from "reactflow";
import type { TMNodeData } from "../model/store";
import { ServiceIcon } from "./Icon";

export function NodeView({ data, selected }: { data: TMNodeData; selected: boolean }) {
  const props = data.props || {};
  const label = data.label || "(unnamed)";

  return (
    <div className="card nodeCard">
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={120}
        color="#0f4fe3"
        handleStyle={{ borderRadius: 6, width: 10, height: 10, border: "1px solid #0f4fe3" }}
      />

      <Handle type="target" position={Position.Left} />

      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ minWidth: 0 }}>
          {props.serviceId ? (
            <ServiceIcon provider={props.provider || "unknown"} category={props.serviceCategory || ""} name={label} />
          ) : null}
          <div className="nodeTitle" title={label}>
            {label}
          </div>
        </div>
        <span className="badge">{data.kind}</span>
      </div>

      <div className="small muted">
        {props.provider ? `${props.provider}${props.serviceCategory ? " › " + props.serviceCategory : ""}` : ""}
      </div>

      <div className="row" style={{ marginTop: 6, flexWrap: "wrap" }}>
        {props.internetExposed ? <span className="pill">Internet</span> : null}
        {props.authRequired ? <span className="pill">Auth</span> : null}
        {props.loggingEnabled ? <span className="pill">Logs</span> : null}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
