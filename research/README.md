# Research

Phase R0 (illustration research) outputs:
- `3b1b/<year>.md` — catalogue of 3Blue1Brown animation techniques per year of videos, from the open-source repo `3b1b/videos`.
- `sites/<site>.md` — audits of explorable-explanation sites.
- `illustration-catalogue.md` — synthesis: technique → what it makes visible → which chapters could use it.

Phase R1 outputs: `<chapter-id>.md` — per-chapter research note + storyboard.

Catalogue entry format (use everywhere):

```
### <Technique name>
- Source: <repo path / URL>
- Topic illustrated there: <...>
- What moves / what the viewer does: <...>
- What it makes visible that text cannot: <...>
- Our chapters that could use it: <ids> — <how>
- Notes on execution (what makes it work, pitfalls): <...>
```

## Re-creating the source checkouts in a new session

The 3Blue1Brown scene paths cited throughout are relative to a shallow clone of the public repo:
`GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/3b1b/videos /home/claude/3b1b/videos`
(pinned at commit 306a1346 on 2026-10-21). Books are in the Project's files, not in this repo.
