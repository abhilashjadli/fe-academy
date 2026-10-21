# CLAUDE.md — FE Library

Read `docs/charter.md` before doing anything. It is locked; do not re-open product decisions already made there.

Hard rules:
- No overall game/progress system. Chapters are standalone, any order, no gating.
- The illustration technique is chosen per chapter during research, with a stated reason. Sliders are one option, not the default. "Illustrated text" is a legitimate choice.
- Research before build. A chapter has `research/<id>.md` with a storyboard approved by the sponsor before any code.
- No LLM arithmetic in the product. Engines are tested against a Python answer key and reference values from the books.
- Assume only the baseline in the charter §2. Teach everything else.
- Keep knowledge in this repo and the Project docs, never only in chat.
