# Lost Ark Gold-to-DMG% Efficiency Project

A tool to figure out where your next gold should go to maximize damage
output in Lost Ark — ranking every upgrade path (honing, accessories,
gems, engravings, astrogems, Ark Grid) on one common axis: **gold spent
per 1% damage gained**, pulled from live market prices and verified
damage-gain data instead of stale manual spreadsheet entries.

Repo: https://github.com/craftedswift/lostark-gold-to-damage-efficiency-

**Status: math/research phase — nothing built yet.** No code, no
dashboard, no Apps Script. All findings, data sources, formulas, and open
questions so far are in [RESEARCH.md](RESEARCH.md) — **read that first.**
It's the actual handoff document; this README is just pointers.

## Where to start

1. Read [RESEARCH.md](RESEARCH.md) in full — it covers the data sources
   (live market API, Maxroll honing calculator, Arsonistic DPS sheet,
   Shizukaziye's astrogem model), the math worked out so far per system,
   and a numbered list of open questions/decisions still blocking
   implementation.
2. Pick up one of the "Open questions / decisions for next session" items
   at the bottom of RESEARCH.md — each is scoped to something concrete
   and unresolved (e.g. confirming a material-name mapping, checking
   CORS behavior on an external API).
3. Nothing should get built (dashboard, scraper, calculator code) until
   the open math/unit-conversion questions in RESEARCH.md section 5 are
   resolved — that's the intentional gate before writing any code.

## Using Claude Code on this project

This repo works well with [Claude Code](https://claude.com/claude-code). A
few notes to get productive quickly:

1. **Install Claude Code** and run `claude` from inside this repo folder
   (or the parent `coding projects` folder, which has a shared
   `.claude/launch.json`).
2. **Read RESEARCH.md before doing anything else.** It exists specifically
   so a fresh Claude session doesn't re-derive settled math or re-fetch
   already-confirmed data sources — treat its "Open questions" section as
   the actual task list.
3. **No code yet, on purpose.** If Claude proposes writing a dashboard,
   calculator, or scraper before the open questions in RESEARCH.md §5
   (the gold-per-1%-damage unit conversion) are resolved, push back —
   that gate is intentional.
4. **External APIs**: the Lost Ark OpenAPI key and any Cloudflare Worker
   relay are per-person credentials — don't commit a JWT or API key to
   this repo.
5. **Scope**: keep changes to this folder. The parent directory also
   contains an unrelated `lostark-tracker` project — if Claude ever seems
   to be touching files outside `lost-ark-gold-optimizer/`, that's worth a
   second look before approving.
6. **Git**: this repo is already connected to `origin` → this GitHub repo,
   on branch `main`. Claude Code will ask for confirmation before pushing
   or force-pushing — normal commits and pushes to `main` are fine for
   this small project, but flag anything that looks like history
   rewriting.
