import React from "react";

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="modalBackdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="row" style={{justifyContent:"space-between"}}>
          <div style={{fontWeight:700}}>{title}</div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="hr" />
        {children}
      </div>
    </div>
  );
}
