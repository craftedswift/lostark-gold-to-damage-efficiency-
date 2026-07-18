# Lost Ark Gold-to-Damage Efficiency Calculator

A tool to figure out where your next gold should go to maximize damage
output in Lost Ark. Given a gold budget plus current progression (gem
levels, engraving state, accessory quality, honing tier, elixirs,
transcendence), a greedy allocator works out which next upgrade gives the
best damage % per gold, across every system, repeating until the budget
runs out.

Repo: https://github.com/craftedswift/lostark-gold-to-damage-efficiency-

**Status: math-first.** The HTML/CSS front end has been stripped out for
now — we're iterating on `script.js`'s cost/damage model and allocator
logic before rebuilding the UI on top of it.

## Project structure

```
script.js   Calculator logic (greedy allocator) — pure JS, no DOM, runnable with Node
```

## Running it locally

```bash
node script.js 50000
```

The number is your gold budget (defaults to 50000). It prints the ranked
spend plan straight to the console. No build step, no dependencies.

## Editing the numbers

The default costs and damage-% values in `script.js` (`DEFAULT_SYSTEMS`) are
rough community-average estimates, not exact current-patch numbers — honing
costs, gem prices, and engraving book prices change every patch and vary by
server. If you're updating these to match a new patch, edit the `cost`,
`growth`, and `dmgPerLevel` fields per system — the UI lets users override
them too, but the defaults should stay reasonably current.

## Using Claude Code on this project

This repo works well with [Claude Code](https://claude.com/claude-code). A
few notes to get productive quickly:

1. **Install Claude Code** and run `claude` from inside this repo folder
   (or the parent `coding projects` folder, which has a shared
   `.claude/launch.json`).
2. **Checking changes**: there's no UI right now, so verify logic changes by
   running `node script.js <budget>` and reading the console output rather
   than using a browser preview. The parent folder's `.claude/launch.json`
   still has a `gold-optimizer` static-server config left over from before
   the UI was stripped — it won't serve anything useful until `index.html`
   comes back.
3. **No secrets/build step**: no dependencies to install — Claude can edit
   `script.js` directly and re-run it to see the new numbers.
4. **Scope**: keep changes to this folder. The parent directory also
   contains an unrelated `lostark-tracker` project — if Claude ever seems to
   be touching files outside `lost-ark-gold-optimizer/`, that's worth a
   second look before approving.
5. **Git**: this repo is already connected to
   `origin` → this GitHub repo, on branch `main`. Claude Code will ask for
   confirmation before pushing or force-pushing — normal commits and pushes
   to `main` are fine for this small project, but flag anything that looks
   like history rewriting.
