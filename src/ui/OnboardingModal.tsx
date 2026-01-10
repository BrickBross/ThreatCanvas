import React, { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { useTMStore } from "../model/store";

const STEPS = [
  { title: "Welcome", body: "This is a browser-only threat modelling workspace. Nothing to install. You can export/import files at any time." },
  { title: "Build the model", body: "Add nodes and data flows on the canvas. Select a node/flow to see properties on the right." },
  { title: "Generate threats", body: "Open the Threats tab, pick libraries (STRIDE/OWASP/MITRE/etc), set scope, then Generate." },
  { title: "Capture findings", body: "Use Findings to track issues, evidence, and compensating controls." },
  { title: "Export", body: "Export a report or evidence ZIP when you’re ready to share with others." }
];

export function OnboardingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setHasOnboarded = useTMStore((s) => (s as any).setHasOnboarded) as (v: boolean) => void;
  const [step, setStep] = useState(0);

  const s = useMemo(() => STEPS[Math.min(step, STEPS.length - 1)], [step]);

  if (!open) return null;

  return (
    <Modal title="Getting started" onClose={onClose}>
      <div className="badge">Step {step + 1} of {STEPS.length}</div>
      <h3 style={{ marginTop: 10 }}>{s.title}</h3>
      <div style={{ marginTop: 8 }}>{s.body}</div>

      <div className="row" style={{ justifyContent: "space-between", marginTop: 18 }}>
        <button className="btn" onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step === 0}>
          Back
        </button>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn" onClick={() => { setHasOnboarded(true); onClose(); }}>
            Skip
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btnPrimary" onClick={() => setStep((n) => Math.min(STEPS.length - 1, n + 1))}>
              Next
            </button>
          ) : (
            <button className="btnPrimary" onClick={() => { setHasOnboarded(true); onClose(); }}>
              Done
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
