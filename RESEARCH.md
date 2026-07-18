# Lost Ark Gold-to-DMG% Efficiency Project
Status: **math/research phase — nothing built yet.** This doc exists so a
collaborator (with their own Claude) can pick up exactly where this left off
without re-deriving anything already settled below.
## Goal
Rebuild and extend an old "gold efficiency" spreadsheet into something that:
1. Auto-pulls current NA East market prices instead of stale manual entries.
2. Adds Tier 4.5 ("Destined Tremor" / *The Shadows Rise*) honing, which the
   original sheet doesn't cover (it stops at T4).
3. Adds astrogem cut/fuse optimization that accounts for side-node stats
   (Attack Power, Additional Damage, Boss Damage, Ally Damage, Brand Power,
   Ally Attack) — most public astrogem calculators ignore these.
4. Ranks every upgrade path (honing, accessories, gems, engravings,
   astrogems, ark grid) on one common axis: **gold spent per 1% damage
   gained.**
Nothing has been built yet on purpose — the plan was to nail the math and
data sources first. Section-by-section status below.
---
## Data sources (all confirmed reachable/live as of this writing)
| Source | What it has | Link |
|---|---|---|
| Cracine/Skaitavia sheet | The original "Gold to DMG% DPS" ranking tab, T1–T4 honing, gems, accessories, Ark Grid (stale prices, T4 only) | https://docs.google.com/spreadsheets/d/1Cg9q8t4-MeUg-TQUJ_oeHqN-03z9l-RPlHfHp4gZuzs |
| Arsonistic DPS Calculator | Full class-DPS simulator; `Acc`/`Engr+Stone`/`Brace`/`ArkGrid` tabs derive **real, build-specific** damage-gain % by removing a bonus and diffing DPS | https://docs.google.com/spreadsheets/d/1_0J7liyM_yw16pyn6TKlF1YGaIt5n_A9hSoLnT3yTUc |
| Maxroll Honing Calculator | Live, current T4.5 per-level success chance + material quantities (screenshot captured — see below) | https://maxroll.gg/lost-ark/upgrade-calculator |
| Shizukaziye's astrogem-calculator | Open, documented, verified (JS/Python parity + DP-vs-Monte-Carlo gated) astrogem cut/fuse model, including side-node/support scoring | https://shizukaziye.github.io/astrogem-calculator/ · source: https://github.com/shizukaziye/astrogem-calculator · math: `METHODOLOGY.md` in that repo |
| Lost Ark OpenAPI | Official live market price endpoint (`POST /markets/items`), auth via personal JWT | https://developer-lostark.game.onstove.com |
---
## 1. Live market prices
**Mechanism:** `POST https://developer-lostark.game.onstove.com/markets/items`
with header `authorization: bearer <JWT>` and body `{"ItemName": "<material name>"}`.
Returns listings; use `CurrentMinPrice` (cheapest live listing), not
`AvgPrice`/`RecentPrice` (lags the market) — **open decision:** confirm this
is the right field for "what I'd actually pay right now" vs. smoothing
across the top N listings to avoid outlier lowballs.
**Known blocker:** the API likely doesn't send CORS headers for arbitrary
browser origins. Shizukaziye's project works around an equivalent problem
with a small Cloudflare Worker relay (see their `worker/` folder) — we
should do the same rather than assume direct browser `fetch()` will work.
**Getting a key:** sign in at the developer portal with your Steam/Stove
login → Create Client → copy the JWT from "My Clients." Free, instant,
personal (don't commit it to a public repo).
---
## 2. Honing — general math (applies to every tier)
For a per-attempt success chance `p`:
- Success within `n` attempts: `1 - (1-p)^n`
- If there's a hard guarantee at attempt `G`: expected attempts =
  `Σ(k=0 to G-1) (1-p)^k` (truncated geometric; → `1/p` as `G → ∞`)
- Expected gold = expected attempts × gold cost per attempt
- Cost per 1% damage = expected gold ÷ (% damage that level grants)
This is the same formula used for T1–T4 in the Cracine sheet and is not
tier-specific — only the inputs (`p`, material costs, `G`) change per tier.
### Breakthrough (T4.5, past +20)
Confirmed: **no separate gold/success-rate cost** — it only consumes
materials to unlock going past +20. Treat it as a flat one-time material
cost per gear piece, not a probabilistic event.
**Tension to resolve:** the per-level average-cost table below (+21 to
+25) shows smoothly scaling costs, continuous with +18 through +20, not a
one-time flat bump at the +20→+21 boundary. Either the breakthrough
material cost is small enough to not visibly break the curve, or it's
already baked into these per-level averages and "no separate cost" refers
to something narrower (e.g. no *extra RNG/success-rate* cost, but still a
real one-time gold/material cost). Don't treat "no separate cost" as "free"
until this is checked directly against Maxroll's breakthrough-specific
material list.
### Column identities — confirmed directly (not inferred)
Per-column meaning, left to right, as described directly off the live
Maxroll calculator:
- **Value** — total gold-equivalent cost for that level (equals the Gold
  column exactly whenever no market purchases are needed — confirmed
  empirically in the table below, e.g. weapon +18: Value 120,567 = Gold
  120,567).
- **Silver** — ignore for gold-cost purposes (not a market-priced material
  in this project's terms; resolves the earlier "should Silver be priced
  in" sub-question — no).
- **Gold** — fixed cost, doesn't fluctuate with the market.
- **Shards, Fusion Materials, Destruction Stones, Leapstones** — the four
  honing materials actually bought on the market; these are what the
  live-price API (§1) needs to price.
- **Juice** — optional material that increases success chance. Not a
  required per-attempt cost. This is what the earlier "Special Honing
  (qty/value, decreasing)" columns in the +24→+25 attempt-by-attempt table
  below actually are — an optional, account-inventory-depleting booster,
  not a mandatory spend. Model it as an optional lever, not baseline cost.
### Weapon honing, average cost per level (+18 → +25, "Average scenario / No additional materials")
Confirmed live data, Silver and Juice columns dropped per the above
(Silver ignored; Juice is optional/not part of baseline cost):
| Level | Value (Gold) | Shards | Fusion | Destruction | Leapstones |
|---|---|---|---|---|---|
| +18 | 120,567 | 571,179 | 560 | 50,673 | 525 |
| +19 | 129,303 | 612,426 | 595 | 54,343 | 560 |
| +20 | 257,242 | 1,121,551 | 1,198 | 108,074 | 1,101 |
| +21 | 275,038 | 1,199,443 | 1,262 | 115,516 | 1,198 |
| +22 | 426,716 | 1,802,800 | 1,981 | 179,174 | 1,839 |
| +23 | 452,649 | 1,912,646 | 2,075 | 190,019 | 1,981 |
| +24 | 926,909 | 3,782,229 | 4,293 | 389,028 | 4,019 |
| +25 | 977,135 | 3,987,482 | 4,567 | 410,945 | 4,293 |
| **Total (+18→+25)** | **3,565,555** | **14,989,752** | **16,526** | **1,497,760** | **15,511** |
This is now the primary source for weapon honing averages +18 through
+25 — supersedes needing to re-derive from the attempt-by-attempt table
below for anything except understanding *why* the average comes out that
way (success-chance curve, pity).
### Tier 4.5 real data (captured, weapon +24 → +25, "Average scenario / Full materials")
Straight from Maxroll's live calculator — this **resolves** the earlier
finding that no official static T4.5 table exists; Maxroll's calculator
has it even though Smilegate's patch notes don't publish it directly.
Transcribed from the screenshot (attempt-by-attempt, base chance shown
`[with accumulated Artisan's Energy in brackets]`):
| Attempt | Base chance `[Artisan's Energy]` | Gold | Shards | Fusions | Destruction | Crystal | Leapstones | Juice (qty ↓) | Juice (gold value ↓) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.50% `[0.00%]` | 150,030 | 60,000 | 10,150 | 39,840 | 47 | 4,260 | 44 | 1,701 / 572 |
| 2 | 1.55% `[0.70%]` | 150,030 | 60,000 | 10,150 | 39,840 | 47 | 4,260 | 44 | 1,697 / 568 |
| 3 | 1.60% `[1.42%]` | 150,030 | 60,000 | 10,150 | 39,840 | 47 | 4,260 | 44 | 1,694 / 564 |
| 4 | 1.65% `[2.16%]` | 150,030 | 60,000 | 10,150 | 39,840 | 47 | 4,260 | 44 | 1,692 / 560 |
| 5 | 1.70% `[2.93%]` | 150,030 | 60,000 | 10,150 | 39,840 | 47 | 4,260 | 44 | 1,690 / 557 |
| 6 | 1.75% `[3.72%]` | 150,030 | 60,000 | 10,150 | 39,840 | 47 | 4,260 | 44 | 1,690 / 554 |
| 7 | 1.80% `[4.53%]` | 150,030 | 60,000 | 10,150 | 39,840 | 47 | 4,260 | 44 | 1,690 / 551 |
| 8 | 1.85% `[5.37%]` | 150,030 | 60,000 | 10,150 | 39,840 | 47 | 4,260 | 44 | 1,691 / 549 |
| 9 | 1.90% `[6.23%]` | 150,030 | 60,000 | 10,150 | 39,840 | 47 | 4,260 | 44 | 1,693 / 546 |
Totals row (all 25 levels, this weapon): Value 6,860,369 · 4,184,356 ·
464,254 · 1,966,253 · 2,150 · 194,850 · 2,013 · 2,282.
Note this "Full materials" totals row (6,860,369 gold) doesn't match the
"No additional materials" total above (3,565,555 gold) — expected, since
"Full materials" presumably means buying everything from the market
(including at attempt-by-attempt granularity) rather than using
owned/free materials. Which mode the final model should use is itself an
open question (see below) — depends on whether the goal is "cost if I buy
everything" vs. "cost given typical owned-material stockpiles," and the
two source tables aren't directly interchangeable.
**Confirmed pattern:** per-attempt base chance climbs +0.05pp per fail
(classic Artisan's Energy pity, same shape as T1–T4), and material cost
per attempt is flat regardless of attempt number.
**Action for next session:** pull the same table for armor pieces and for
other honing levels (this only covers +24→+25) directly from Maxroll's
calculator, the same way — it's a live, current, load-bearing data source,
so treat it as the primary T4.5 source going forward instead of waiting on
official patch-note tables that don't exist.
**Math-validation note:** the old sheet's honing costs appear to be a
straight *average cost* figure (no explicit success-chance/attempts math
shown), which is consistent with — and a valid sanity check against — the
`expected gold = expected attempts × cost/attempt` formula above, since an
"average scenario, full materials" total is exactly what that formula
should produce. This is a real independent cross-check of the honing
formula (see the open question this thread raised about validating it
against a known source) — worth doing the same comparison for at least one
more tier/level to build confidence before trusting the formula for tiers
where we don't have a second reference point.
---
## 3. Accessory / engraving / bracelet / Ark Grid damage gain
This is **not** a universal formula — the Arsonistic DPS Calculator derives
it by full build simulation: it computes your total DPS with a stat/gear
bonus included, removes it, recomputes, and reports the delta. That's why
its own docs say "all numbers are only comparable between builds on the
same class/skill setup."
Captured table (from the `Acc` tab, `EffData`-linked — necklace/earring/
ring substat real damage-gain %, by quality tier and combined-piece tier):
| Bonus (raw stat, Low/Mid/High) | Low | Mid | High | LL | ML | MM | HL | HM | HH |
|---|---|---|---|---|---|---|---|---|---|
| Additional Damage +0.7/1.6/2.6% | 0.53% | 1.2% | 1.95% | 1.08% | 1.76% | 2.42% | 2.51% | 3.18% | 3.99% |
| Outgoing Damage +0.55/1.2/2% | 0.55% | 1.2% | 2% | — | 1.73% | — | 2.54% | 3.23% | — |
| Attack Power +0.4/0.95/1.55% | 0.36% | 0.85% | 1.38% | 0.63% | 1.12% | 1.47% | 1.66% | 2.01% | 2.42% |
| Weapon Power +0.8/1.8/3% | 0.28% | 0.62% | 1.03% | — | 0.98% | — | 1.39% | 1.88% | — |
| Crit Rate +0.4/0.95/1.55% | 0.32% | 0.75% | 1.23% | 0.67% | 1.11% | 1.53% | 1.59% | 2.01% | 2.53% |
| Crit Damage +1.1/2.4/4% | 0.35% | 0.77% | 1.29% | — | 1.09% | — | 1.61% | 2.05% | — |
| Attack Power (grid, +80/195/390) | 0.04% | 0.11% | 0.21% | | | | | | |
| Weapon Power (grid, +195/480/960) | 0.05% | 0.11% | 0.22% | | | | | | |
| Quality STR/DEX/INT (+1935–2679) | 0.14% | 0.15% | 0.19% | | | | | | |
**This directly answers the earlier open question** from this
conversation (necklace 2.6% Additional Damage + 2.0% Outgoing Damage):
those two lines are simulated *separately* in this tool (both listed as
distinct rows, both vary independently in the High-High combo columns),
which is empirical evidence they are **not** the same bucket — but note
this table is specific to whatever class/build was loaded into `Calc` when
these numbers were generated. Re-derive per class before trusting it for a
different character.
**Open task:** this sheet's `Calc`/`EffData` tabs contain the actual DPS
formula (crit/spec/swift scaling, engraving multipliers, tripods) — not
yet pulled apart. If we want the dashboard to compute *new* damage-gain
numbers for a specific class/build rather than reading pre-baked ones,
that formula needs extracting. Flagged for whoever picks this up.
---
## 4. Astrogem optimization (Shizukaziye's model)
Decision made: **do not re-derive their Bellman DP.** It's a serious,
independently-verified piece of engineering (6,912 exact DP solves baked,
cross-checked against independent Monte Carlo, JS/Python parity-tested).
Re-implementing it from scratch risks being subtly wrong on a tool used for
real gold decisions. Instead: **consume their published baked output
directly.**
- Live baked data: `https://shizukaziye.github.io/astrogem-calculator/data/pipeline.json`
  (and `data/pipeline-support.json` for the support/side-node axis — this
  is the piece most other calculators skip, and exactly what was asked for)
- Key schema: `cells["{rarity}_{cost}_{bucket}_{baseline}_{gpd}"] = { nrb: {cut, act, pAbove, expScore, expSpend, fLeg, fRelic, fAnc}, rb: {...} }`
- `rarity` ∈ uncommon/rare/epic, `cost` ∈ 8/9/10, `bucket` ∈
  `2_damage`/`optimal_damage`/`suboptimal_damage`/`no_damage`, `baseline`
  and `gpd` must snap to their **baked anchor values**
  (`meta.bakedBaselines`, `meta.anchorGpd`) — no interpolation, exact
  key lookup only.
### Core formulas (from their `METHODOLOGY.md`, for reference — not to be
re-derived, just to understand what the baked numbers mean)
- Each damage stat line scored in log space (additive despite damage being
  multiplicative): `D = 100·ln(multiplier)`.
- Per-level constants: Boss Damage ≈0.0813, Additional Damage ≈0.0593,
  Attack Power ≈0.0324 (all per level), Order ≈0.1599 per point (flat).
  These match the "real stat baseline" derivation style as the Arsonistic
  sheet's Acc tab — both are build-relative marginal-value approaches,
  good cross-check if numbers ever look off.
- `gemValue = gemDamage × M(effectiveCost)` — willpower is efficiency, not
  a damage line; `M` is calibrated so a perfect gem of any base cost scores
  identically (grade 100).
- Gold value: `directValue = max(0, (gemValue - baseline) × goldPerDamage)`.
- Fusion (3→1) is a **joint 9-variable fixed point** across 3 tiers × 3
  base costs (surplus legendaries from higher-tier fuses are fungible
  across costs).
- Cut/reroll/complete decision: exact Bellman DP,
  `W(config, turn, rerolls, costMult)`, too slow to run live (~3s/epic
  cell) — this is *why* they bake and publish a static table instead of
  computing on demand, which is also why we should read their table rather
  than solve our own copy.
- **Side-node/support axis** (the ask): `pipeline-support.json` re-keys
  buckets on Ally Attack Enh./Brand Power/Ally Damage Enh. as the live
  lines, values via `supportValue`, applies a ×3 party-benefit multiplier
  to gold-per-damage. This is the file to use for "account for side
  nodes" — confirms it's a first-class, already-solved axis in their
  model, not something we need to bolt on ourselves.
**Open task:** confirm cross-origin fetch of their `data/*.json` actually
works from outside their own domain (CORS). If blocked, fall back to
manually copying baked numbers from their live site, or ask permission to
mirror the JSON.
---
## 5. Combined ranking formula (ties everything together)
Same as the original sheet's `Gold to DMG% DPS` tab:
```
Cost per 1% DMG = Expense (gold) ÷ Gain (% damage)
```
Every section above ultimately needs to produce a `(gain%, expense_gold)`
pair per upgrade option so it can be dropped into one sorted table. Note
the astrogem model's native output is a gold **EV** (`cut` value), not a
gold-per-1%-damage figure directly — converting between the two (e.g. via
`expSpend` and `expScore` in the baked cells) is an open math question, not
yet solved. Don't force-fit it without checking the units line up.
---
## Open questions / decisions for next session
1. Market price field: `CurrentMinPrice` vs. an average of top-N listings?
2. ~~T4.5 column identities~~ — **resolved**, see §2: Silver (ignore) /
   Gold (fixed) / Shards / Fusion Materials / Destruction Stones /
   Leapstones (all four market-priced) / Juice (optional success-chance
   booster, not baseline cost). Confirmed directly, not inferred.
3. **New:** "Average scenario / No additional materials" totals
   (3,565,555 gold, +18→+25) vs. "Average scenario / Full materials"
   totals (6,860,369 gold, +24→+25 alone) don't reconcile — figure out
   which mode the model should use, and whether "No additional materials"
   silently assumes free/owned mats that a from-scratch gold-cost model
   shouldn't assume.
4. **New:** breakthrough-past-+20 was assumed to have "no separate
   gold/success-rate cost," but the +21→+25 average-cost rows scale
   smoothly with no visible one-time jump — confirm directly what
   breakthrough actually costs and whether it's already inside these
   averages.
5. Extract the Arsonistic sheet's `Calc`/`EffData` DPS formula if
   per-class/build-specific numbers are needed (vs. using their pre-baked
   table as-is).
6. Confirm CORS behavior fetching Shizukaziye's `data/*.json` cross-origin;
   plan a relay if blocked.
7. Work out the unit conversion from astrogem `cut`/`expSpend`/`expScore`
   to a comparable "gold per 1% damage" figure for the combined ranking.
8. Decide dashboard vs. Sheet-Apps-Script delivery target (previously
   leaning dashboard, but not committed since nothing's been built).
## Explicitly not done yet
No code, no dashboard, no Apps Script. This file is the handoff point —
next step for whoever (or whichever Claude) picks this up is to resolve
the open questions above, *then* start building.
