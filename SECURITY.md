# Security Policy (ThreatCanvas)

## Browser-only design

ThreatCanvas is built to operate as a **static** web application:

- All modelling, threat generation, and editing occurs in the user's browser.
- No backend service is required.
- No user accounts are required.
- Model data is stored in browser memory and browser storage unless explicitly exported.

## Outbound traffic

ThreatCanvas does **not** intentionally transmit model data to third-party services.

Expected network activity should be limited to:
- loading static site assets (HTML/CSS/JS/icons) from the host you deploy to (e.g., GitHub Pages or an internal web server).

### Validate "no outbound data"

1. Open **Developer Tools → Network** and use the app.
   - You should see only requests for static assets from your hosting origin.
2. Enable **Offline** in DevTools after initial load.
   - The app should remain functional (import/export is file-based).
3. For high assurance:
   - host on an internal static web server,
   - block outbound egress by policy,
   - avoid adding third-party scripts or remote fonts,
   - consider enforcing a strict Content Security Policy (CSP).

## Reporting vulnerabilities

If you discover a security issue:
- Please open a GitHub Issue with a clear description, reproduction steps, and impact.
- If you prefer private disclosure, create a draft security advisory in GitHub (Security tab) if enabled.

## Supply chain

Recommended controls:
- pin dependencies via lockfile
- enable Dependabot
- run npm audit / SCA in CI
- use code review for changes
