import React from "react";
import type { EdgeProps } from "reactflow";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "reactflow";

export default function EdgeView(props: EdgeProps<any>) {
  const [edgePath, labelX, labelY] = getBezierPath(props);
  const label = props.data?.label || "";
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={props.markerEnd} style={props.style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: "white",
            padding: "2px 6px",
            border: "1px solid #e5e5e5",
            borderRadius: 999,
            fontSize: 12
          }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
