# FE Library — web app

- `npm install` · `npm run dev` (local) · `npm test` (engine vs Python answer key) · `npm run build`
- `src/engine/` pure maths (TypeScript), tested against `tests/answer-key/*.py` fixtures in `src/engine/__fixtures__/`.
- `src/ui/` shared chapter components: `Figure`, `StepThrough`, `Plot` primitives, controls, `M` (KaTeX with `\tok{role}{…}` colour-locking).
- `src/chapters/<id>/` one folder per chapter: `Chapter.tsx` + `figures/`.
- Deployed to GitHub Pages by `.github/workflows/deploy.yml` on push to `main`.
