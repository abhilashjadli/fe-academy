# clips/ — rendered animation clips (Manim)

Manim Community Edition clips for chapters where a **scrubbable, narrated clip** is the chosen mode
(see `research/style/modes.md` and each chapter's `research/r1/<ID>.md` §4–5). Clips are rendered
here, checked into `apps/web/public/clips/` as `.mp4` + `.webm` with a `.png` poster, and played by
the web app's `Clip` component (to be built in the style sprint) with captions in sync with the
chapter's voice track.

Feasibility test: 2026-10-22 (`research/style/manim-feasibility.md`).

## Setup (Ubuntu 24.04 workspace; ~2 minutes)

```sh
sudo apt-get update
sudo apt-get install -y --no-install-recommends libpango1.0-dev libcairo2-dev pkg-config dvisvgm
# texlive (latex, pdflatex) and ffmpeg are already present on the workspace image.
python3 -m venv ~/.manim-venv
~/.manim-venv/bin/pip install --upgrade pip setuptools wheel   # system setuptools fails to build `srt`
~/.manim-venv/bin/pip install "manim==0.22.0"
```

Pinned at the test: manim 0.22.0, ManimPango 0.7.0, pycairo 1.29.2, av 19.0.2, numpy 2.5.4.

## Render

```sh
cd clips
~/.manim-venv/bin/manim render -qm --format mp4 taylor_tangent.py TaylorTangent     # 720p30, ~13 s
~/.manim-venv/bin/manim render -qh --format mp4 taylor_tangent.py TaylorTangent     # 1080p60 for final
ffmpeg -i media/videos/taylor_tangent/720p30/TaylorTangent.mp4 -c:v libvpx-vp9 -b:v 0 -crf 34 -an out.webm
ffmpeg -ss 0.5 -i out.mp4 -frames:v 1 poster.png
```

Output lands in `clips/media/` (git-ignored). Copy finished files to `apps/web/public/clips/<chapter>/`.

## House rules for clips

- Import the theme from `fe_theme.py` (same hex tokens as `apps/web/src/styles/tokens.css`): background
  `SURFACE`, ink `INK`, roles `TRUTH / APPROX / ERROR / GHOST`. Never use Manim's default black
  background or its default colours.
- Set `config.tex_template = FE_TEX` (minimal preamble: the default one needs `dsfont`, which the
  workspace's TeX Live lacks). Use `MathTex` for formulae and `Text` for words.
- Fonts: the workspace has no IBM Plex Sans / Newsreader installed system-wide, so `Text` falls back
  to DejaVu Sans. Either install the TTFs from `apps/web/node_modules/@fontsource*/files` with
  `fc-cache` before a final render, or accept the fallback for drafts.
- Dark theme: render each clip twice (`THEME=light|dark`) or design the clip so that it sits on the
  figure surface in both themes. Decide per clip; the feasibility note recommends rendering twice.
- Length: 8–40 seconds per clip. A clip is one idea. Anything longer belongs in a step-through.
- Every clip has a caption track (`.vtt`) written in the same voice as the chapter's narration, and
  a poster frame, so the page is readable before the video loads and with video disabled.
- No numbers in a clip that are not produced by the engine's answer key (CLAUDE.md: no LLM arithmetic).
  Clip scripts compute their own curves from the same formulas the engines use; add a line to the
  chapter's Python key when a clip shows a number.
