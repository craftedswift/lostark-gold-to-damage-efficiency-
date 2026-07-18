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
### Tier 4.5 real data (captured, weapon +24 → +25, "Average scenario / Full materials")
Straight from Maxroll's live calculator — this **resolves** the earlier
finding that no official static T4.5 table exists; Maxroll's calculator
has it even though Smilegate's patch notes don't publish it directly.
Transcribed from the screenshot (attempt-by-attempt, base chance shown
`[with accumulated Artisan's Energy in brackets]`); column identities
below are now **confirmed** (see resolution note after the table):
| Attempt | Base chance `[Artisan's Energy]` | Gold | Shards | Fusions | Destruction | Crystal | Leapstones | Special Honing (qty ↓) | Special Honing (gold value ↓) |
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
**Resolved (previously open task):** cross-checked against the old
Cracine/Skaitavia sheet's own per-level honing cost table (rows 18–25,
columns Gold/Shards/Fusions/Destruction/Crystal/Leapstones) — values
match Maxroll's "Average scenario / Full materials" output for the same
levels. Maxroll shows two extra columns the old sheet doesn't track:
**Silver** (leftmost, before Gold) and **Special Honing** (rightmost,
shown as a qty/gold-value pair) — which is what the mysterious decreasing
paired numbers in the last two columns above actually are: Special
Honing material owned-quantity and its gold-equivalent value, both
draining as an account-wide pool gets consumed (not a per-attempt cost,
confirming the earlier guess). **New sub-question:** the old sheet's
totals don't include Silver cost at all — decide whether the rebuilt
version should price Silver in too, since it's real spend even if it's a
secondary currency.
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
2. ~~T4.5 column C–I material identities~~ — **resolved**, see §2: Gold /
   Shards / Fusions / Destruction / Crystal / Leapstones / Special Honing
   (qty + gold value), cross-checked against the old sheet and matching.
   Follow-up: decide whether to price in Silver too (Maxroll-only column,
   not in the old sheet's totals).
3. Extract the Arsonistic sheet's `Calc`/`EffData` DPS formula if
   per-class/build-specific numbers are needed (vs. using their pre-baked
   table as-is).
4. Confirm CORS behavior fetching Shizukaziye's `data/*.json` cross-origin;
   plan a relay if blocked.
5. Work out the unit conversion from astrogem `cut`/`expSpend`/`expScore`
   to a comparable "gold per 1% damage" figure for the combined ranking.
6. Decide dashboard vs. Sheet-Apps-Script delivery target (previously
   leaning dashboard, but not committed since nothing's been built).
## Explicitly not done yet
No code, no dashboard, no Apps Script. This file is the handoff point —
next step for whoever (or whichever Claude) picks this up is to resolve
the open questions above, *then* start building.
