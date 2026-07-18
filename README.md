# Lost Ark Gold-to-Damage Efficiency Calculator

A small static site that helps figure out where your next gold should go to
maximize damage output in Lost Ark. You enter a gold budget plus your current
progression (gem levels, engraving state, accessory quality, honing tier,
elixirs, transcendence), and it runs a greedy allocator that always spends on
whichever next upgrade gives the best damage % per gold, across every system,
until the budget runs out.

Live site: https://github.com/craftedswift/lostark-gold-to-damage-efficiency-

## Project structure

```
index.html   Page structure and content (intro, budget input, systems table, plan output)
style.css    Dark/light-aware styling
script.js    Calculator logic (greedy allocator) + localStorage persistence
```

No build step, no dependencies — it's plain HTML/CSS/JS.

## Running it locally

Any static file server works. For example, with Python:

```bash
python -m http.server 8123
```

Then open http://localhost:8123.

**Important:** don't just double-click `index.html` and open it as a
`file://` URL — some browsers block the JS from running correctly under
`file://`. Always serve it over `http://localhost`.

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
2. **Previewing changes**: the parent folder's `.claude/launch.json` already
   defines a `gold-optimizer` dev-server config (Python `http.server` on
   port 8123) that Claude Code's browser preview tools can launch directly —
   no need to ask it to start a server manually.
3. **No secrets/build step**: this is a static site, so there's nothing to
   configure — Claude can edit `index.html` / `style.css` / `script.js`
   directly and reload the preview to see changes.
4. **Scope**: keep changes to this folder. The parent directory also
   contains an unrelated `lostark-tracker` project — if Claude ever seems to
   be touching files outside `lost-ark-gold-optimizer/`, that's worth a
   second look before approving.
5. **Git**: this repo is already connected to
   `origin` → this GitHub repo, on branch `main`. Claude Code will ask for
   confirmation before pushing or force-pushing — normal commits and pushes
   to `main` are fine for this small project, but flag anything that looks
   like history rewriting.
