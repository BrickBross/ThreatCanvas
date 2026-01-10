# Contributing to ThreatCanvas

Thanks for helping improve ThreatCanvas.

## Development
```bash
npm install
npm run dev
```

## Pull requests
Please keep PRs:
- focused (one improvement per PR where possible)
- performant (avoid heavy libraries; prefer memoization/virtualization)
- browser-only (no backend dependencies unless clearly optional)

## Code style
- TypeScript + React
- Prefer small, readable components
- Avoid large re-render cascades (use store selectors + memoization)

## Security
If you believe you've found a security issue, see [SECURITY.md](SECURITY.md).
