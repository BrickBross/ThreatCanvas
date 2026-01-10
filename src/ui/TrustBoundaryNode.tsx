import React from "react";
import { NodeResizer } from "reactflow";
import type { TMNodeData } from "../model/store";

export function TrustBoundaryNode({ data, selected }: { data: TMNodeData; selected: boolean }) {
  const label = data.label || "Trust boundary";
  return (
    <div style={{
      width: "100%",
      height: "100%",
      border: "2px dashed #999",
      borderRadius: 16,
      background: "rgba(0,0,0,0.03)",
      padding: 10
    }}>
      <NodeResizer
        color="#111"
        isVisible={selected}
        minWidth={240}
        minHeight={160}
        keepAspectRatio={false}
      />
      <div style={{fontWeight:700}}>{label}</div>
      <div className="small muted">{data.props?.provider ? `${data.props.provider}` : "boundary"}</div>
    </div>
  );
}
