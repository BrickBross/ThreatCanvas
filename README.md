# ThreatCanvas

**ThreatCanvas** is a fast, browser-native threat modeling platform with built-in frameworks, findings, evidence tracking, and reporting. **No backend required.**

Designed for security teams operating in restricted or high-sensitivity environments, ThreatCanvas runs entirely in the browser and can be hosted as a static website.

---

## Highlights

- Visual system modeling (nodes, flows, trust boundaries)
- Built-in threat libraries (STRIDE, plus additional frameworks/libraries in-app)
- Risk scoring (Likelihood × Impact) and an interactive **Risk Heatmap**
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

## Quick start (local)

### Requirements
- Node.js 20+ (recommended) and npm

### Run dev server
```bash
npm install
npm run dev
```

### Build and preview production
```bash
npm install
npm run build
npm run preview
```

---

## Deploy to GitHub Pages (free)

This project supports GitHub Pages by setting `BASE_PATH` during build.

1) Create a repo and push this code to `main`.

2) Add this workflow at `.github/workflows/deploy-pages.yml` (included in this repo ZIP):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install
        run: npm ci

      - name: Build (set BASE_PATH for Pages)
        run: |
          REPO_NAME="${{ github.event.repository.name }}"
          BASE_PATH="/${REPO_NAME}/" npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

3) In GitHub: **Settings → Pages → Build and deployment → GitHub Actions**

Your site will publish to:

`https://<username>.github.io/<repo-name>/`

---

## Keyboard shortcuts

- **Ctrl/Cmd + K**: Command palette
- **Ctrl/Cmd + /**: Global search
- **P**: Presentation mode
- **?**: Help tab
- **Esc**: Close dialogs / exit presentation mode

---

## License

MIT — see [LICENSE](LICENSE).
