# Pricing & Scoping Wizard (MVP)

A minimal Vite + React + Tailwind app that implements a 3‑step pricing & scoping workflow with a simple pricing engine.

## Quick start

1. Ensure you have Node.js 18+.
2. Unzip this folder, then run:

```bash
npm install
npm run dev
```

Open the local URL shown in your terminal.

## Build for production

```bash
npm run build
npm run preview
```

## Notes
- Rates, tier markups, and approval thresholds are sample values—adjust in `src/PricingScopeWizard.jsx`.
- Export button downloads your current proposal JSON (inputs + computed totals).
- Tailwind is preconfigured (see `tailwind.config.js`, `postcss.config.js`).

Enjoy!
