import React from "react";

export type MenuItem = { label: string; onClick: () => void; disabled?: boolean };

export function ContextMenu({
  x,
  y,
  items,
  onClose
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  return (
    <div className="ctxBackdrop" onMouseDown={onClose}>
      <div className="ctxMenu" style={{ left: x, top: y }} onMouseDown={(e) => e.stopPropagation()}>
        {items.map((it, idx) => (
          <button
            key={idx}
            className="ctxItem"
            disabled={!!it.disabled}
            onClick={() => {
              if (it.disabled) return;
              it.onClick();
              onClose();
            }}
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
