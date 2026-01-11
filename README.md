<p align="center">
  <img src="public/logo.svg" alt="ThreatCanvas" width="640" />
</p>

<p align="center">
  <a href="https://brickbross.github.io/ThreatCanvas/"><img alt="GitHub Pages" src="https://img.shields.io/badge/GitHub%20Pages-live-0ea5e9?logo=github&logoColor=white"></a>
  <a href="https://github.com/BrickBross/ThreatCanvas/actions/workflows/deploy-pages.yml"><img alt="Deploy to GitHub Pages" src="https://github.com/BrickBross/ThreatCanvas/actions/workflows/deploy-pages.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/github/license/BrickBross/ThreatCanvas"></a>
  <a href="https://attack.mitre.org/"><img alt="MITRE ATT&CK (reference)" src="https://img.shields.io/badge/MITRE-ATT%26CK-111827"></a>
  <a href="https://learn.microsoft.com/en-us/security/engineering/threat-modeling"><img alt="Threat modeling" src="https://img.shields.io/badge/Threat%20Modeling-browser--native-14b8a6"></a>
</p>

<h1 align="center">ThreatCanvas</h1>

**ThreatCanvas** is a fast, browser-native threat modeling platform with built-in frameworks, findings, evidence tracking, and reporting. **No backend required.**

Designed for security teams operating in restricted or high-sensitivity environments, ThreatCanvas runs entirely in the browser and can be hosted as a static website.

---

## Highlights

- Visual system modeling (nodes, flows, trust boundaries)
- Built-in threat libraries (STRIDE, plus additional frameworks/libraries in-app)
- Risk scoring (Likelihood A- Impact) and an interactive **Risk Heatmap**
- Findings with **evidence** and **compensating controls** (EDR/NDR/SIEM/UEBA/etc.)
- Control coverage dashboard and audit **Timeline**
- Global search (Ctrl/Cmd + `/`) and command palette (Ctrl/Cmd + `K`)
- Presentation mode (`P`) for executive walkthroughs
- Import/export for sharing and review
- Dark mode
- 100% browser-side processing

---

## Privacy & Security

ThreatCanvas is intentionally designed as a **browser-only** application.

- No server-side storage
- No user accounts
- No telemetry by default
- Model data is kept in browser memory and browser storage unless you export it

See [SECURITY.md](SECURITY.md) for details and validation steps.

---

## License

MIT - see [LICENSE](LICENSE).

---
