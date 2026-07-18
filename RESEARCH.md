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
| Lost Ark OpenAPI | Official live market price endpoint (`POST /markets/items`), auth via personal JWT — superseded as our chosen price source (see §1), kept here for reference/fallback | https://developer-lostark.game.onstove.com |
| Shizukaziye's loa-deal-finder | Same author as the astrogem calculator; live "fair price" model with an outlier-resistant methodology (see §1) — the methodology (not necessarily the exact data source) is the basis for our market-price approach | https://shizukaziye.github.io/loa-deal-finder/ |
| Lost Ark Market Online API | **Chosen market data source** (see §1). Community-run, live + historic prices, regional filters including NA East/NA West/EU Central/EU West/South America (covers global-release regions). Postman-documented. | Postman docs: https://documenter.getpostman.com/view/20821530/UyxbppKr · org: https://github.com/Lost-Ark-Market-Online |
---
## 1. Live market prices
**Decision: use the Lost Ark Market Online API** (Postman-documented:
https://documenter.getpostman.com/view/20821530/UyxbppKr), not the
official Lost Ark OpenAPI, as this project's market price source. It
offers live + historic prices with regional filters covering NA East,
NA West, EU Central, EU West, and South America — matches this
project's target region (NA East) and the global-release servers
generally.
**Caveat carried forward, don't lose track of this:** this API's
underlying data is community-sourced via volunteer "market watchers"
running an OCR tool (Tesseract) that screenshots their in-game market
window — not a direct game-server scrape. That means real risk of OCR
misreads, coverage gaps on less-watched items, and staleness; the
project also looked lightly maintained as of this research (last major
updates ~Feb 2024). Worth a basic sanity check (compare a handful of
known prices against what's visible in-game or via the official OpenAPI)
before fully trusting it as ground truth.
**Open task (blocks implementation):** the Postman documentation page
didn't yield endpoint/auth/schema details through automated fetching —
someone needs to actually open
https://documenter.getpostman.com/view/20821530/UyxbppKr in a browser
and record: exact endpoint URLs, required auth (API key? none?), request/
response shape, and — most importantly — whether the historic-price
response gives enough daily granularity (ideally 14+ days) to actually
run the fair-price trimmed-mean formula below. Nothing here is confirmed
beyond "this API exists and covers the right regions."
**Superseded finding, still true and worth keeping:** the *official*
OpenAPI (`POST https://developer-lostark.game.onstove.com/markets/items`)
exposes **no trade volume / order-book depth** — no per-listing
quantities to smooth across, only per-item daily aggregate prices. This
ruled out the earlier "average of top-N listings" idea. Whether the same
limitation applies to the Lost Ark Market Online API is unconfirmed —
check as part of the open task above; it's plausible their OCR-collected
data has different structure entirely.
**Resolved — pricing methodology (adopted from Shizukaziye's
loa-deal-finder, same author/data source as the astrogem calculator):**
use a **"fair price"** derived from recent daily averages, not a single
raw API field (`CurrentMinPrice`/`AvgPrice`/`RecentPrice`) picked in
isolation. Their model, to replicate:
1. Take the last 14 daily average prices for the item.
2. Drop the current (live, still in-progress) day — incomplete data.
3. Drop the highest and lowest couple of completed days — trims single
   buyout spikes or troll/lowball listings.
4. Take a **recency-weighted mean** of what's left.
This tracks real price movement while being resistant to one-off spikes
in either direction — a better fit for this project than any single raw
field, especially since honing needs bulk quantities where a single
lowball listing (`CurrentMinPrice`) would badly understate real cost.
**Not directly needed, but same toolkit:** their `deal = (spot - fair) /
fair` metric (negative = below fair = a good buy) is for *finding market
deals*, not something this project needs — we only need the `fair` price
itself as a per-material gold value, not the deal-percentage layer on
top. Worth knowing about in case a "should I buy materials now or wait"
feature ever gets added later.
**Liquidity filtering (their term, may not apply to us):** since there's
no real volume data, they infer liquidity from price *behavior* scaled by
value — an item only counts as reliably priced if it has a full 14-day
history and stays within a value-scaled steadiness tolerance. Relevant
mainly for their "should this item be trusted at all" filter; for the
handful of specific honing materials we care about (Shards, Fusion
Materials, Destiny Stones, Leapstones), we'd want their fair price
regardless of whether they'd pass that liquidity filter for a general
deal-finder.
**Open task:** find and read the source/methodology doc for
loa-deal-finder (if public, likely alongside the site the same way
astrogem-calculator has `METHODOLOGY.md`) to get the *exact*
recency-weighting formula and the "couple" of high/low days trimmed —
the screenshot description is close enough to replicate roughly, but not
precise enough to hardcode without checking, the same caution as the
astrogem model.
**Known blocker (official OpenAPI, kept for reference/fallback):** the
API likely doesn't send CORS headers for arbitrary browser origins.
Shizukaziye's project works around an equivalent problem with a small
Cloudflare Worker relay (see their `worker/` folder). **Unconfirmed
whether this applies to the Lost Ark Market Online API too** — check as
part of the open task above; a community-run API aimed at public
consumption may already allow CORS, but don't assume it.
**Getting access (official OpenAPI, kept for reference/fallback):** sign
in at the developer portal with your Steam/Stove login → Create Client →
copy the JWT from "My Clients." Free, instant, personal (don't commit it
to a public repo). **Whether the Lost Ark Market Online API needs its own
API key/auth is unconfirmed** — part of the open task above.
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
**Resolved:** breakthrough is a materials *gate*, not a cost — to hone
past +20 you need raid materials from **Serca** (raid drop), not extra
gold or a separate success-rate roll. It doesn't add a cost line item at
all; it's a prerequisite/unlock check. The +19→+20 cost jump identified
below is therefore just normal escalating honing cost (each tier gets
more expensive), unrelated to breakthrough — the earlier "tension"
between assumed breakthrough cost and the smooth curve was a false
lead: there was never a breakthrough cost to show up in the curve.
**Modeling decision: ignore it.** Most players accumulate enough Serca
raid materials naturally that this isn't a real blocker in practice — not
worth modeling as a gating requirement. Excluded from the model entirely
rather than special-cased.
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
- **Shards, Fusion Materials, Destiny Stones, Leapstones** — the four
  honing materials actually bought on the market; these are what the
  live-price API (§1) needs to price. "Destiny Stones" is this project's
  umbrella vocab for this material slot — in-game it's actually two
  different items depending on gear type: **Guardian Stone** for armor,
  **Destruction Stone** for weapons. When pricing via the market API,
  query the correct one per gear-piece type — don't use one item name for
  both.
- **Juice** — optional material that increases success chance. Not a
  required per-attempt cost. This is what the earlier "Special Honing
  (qty/value, decreasing)" columns in the +24→+25 attempt-by-attempt table
  below actually are — an optional, account-inventory-depleting booster,
  not a mandatory spend. Model it as an optional lever, not baseline cost.
### Weapon honing, average cost per level (+18 → +25, "Average scenario / No additional materials")
Confirmed live data, Silver and Juice columns dropped per the above
(Silver ignored; Juice is optional/not part of baseline cost):
| Level | Value (Gold) | Shards | Fusion | Destiny Stones | Leapstones |
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
### Weapon honing, average cost per level (+16 → +25, "Average scenario / Full materials")
Second confirmed live dataset, same weapon, with Juice included this
time — used below to quantify the actual Juice cost premium and
double-check the breakthrough-cost question. Note **Value ≠ Gold** here
(unlike the no-Juice table above), because Juice itself is a
market-priced material folded into Value but not into the raw Gold
column:
| Level | Value | Silver | Gold | Shards | Fusion | Destiny Stones | Leapstones | Juice |
|---|---|---|---|---|---|---|---|---|
| +16 | 98,955 | 1,028,753 | 52,850 | 290,425 | 244 | 22,225 | 226 | 179 |
| +17 | 148,212 | 1,201,228 | 74,149 | 381,032 | 336 | 31,166 | 325 | 288 |
| +18 | 154,005 | 1,281,228 | 79,942 | 411,740 | 371 | 33,599 | 348 | 288 |
| +19 | 159,797 | 1,351,228 | 85,734 | 441,448 | 394 | 36,032 | 371 | 288 |
| +20 | 309,942 | 1,896,613 | 171,502 | 785,065 | 799 | 72,053 | 734 | 537 |
| +21 | 321,807 | 1,976,613 | 183,367 | 839,662 | 842 | 77,015 | 799 | 537 |
| +22 | 486,906 | 2,790,054 | 284,709 | 1,245,440 | 1,322 | 119,546 | 1,227 | 784 |
| +23 | 504,208 | 2,870,054 | 302,011 | 1,321,393 | 1,385 | 126,782 | 1,322 | 784 |
| +24 | 1,052,824 | 4,184,356 | 464,254 | 1,966,253 | 2,150 | 194,850 | 2,013 | 2,282 |
| +25 | 1,077,980 | 4,264,356 | 489,411 | 2,073,050 | 2,287 | 205,827 | 2,150 | 2,282 |
| **Total (+16→+25)** | **4,314,632** | **22,844,479** | **2,187,925** | **9,755,503** | **10,127** | **919,090** | **9,511** | **8,244** |
**Juice premium, quantified:** summing this table's Value column for
+18→+25 only (to match the no-Juice table's range) gives 4,067,469 gold,
vs. 3,565,555 gold with no Juice for the same 8 levels — a **501,914
gold premium (+14.1%) to fully use Juice**, for a build already this far
into T4.5. This is the first real number behind "Juice costs more than
the value it provides" — confirms the qualitative claim, though the
actual damage/time value Juice buys (faster completion, fewer wasted
pity resets) still isn't priced, so this is a cost figure, not yet a
full cost-benefit comparison.
**Breakthrough-cost finding (revises the earlier tension note):** the
big proportional jump in both tables is actually at **+19 → +20**, not
+20 → +21 as originally assumed:
- No-Juice: +19=129,303 → +20=257,242 (**+98.9%**); +20=257,242 →
  +21=275,038 (only +6.9%)
- Full-Juice: +19=159,797 → +20=309,942 (**+94.0%**); +20=309,942 →
  +21=321,807 (only +3.8%)
Both datasets agree: the sharp step-up happens entering +20, and +20→+21
(previously assumed to be where breakthrough cost would show up) is a
comparatively small increase. **Still open:** whether the +19→+20 jump
*is* the breakthrough cost showing up one level earlier than assumed, a
T4→T4.5 tier-entry cost unrelated to breakthrough, or something else —
needs checking directly against Maxroll's stated breakthrough material
list rather than inferred from the cost curve shape alone.
### Tier 4.5 real data (captured, weapon +24 → +25, "Average scenario / Full materials")
Straight from Maxroll's live calculator — this **resolves** the earlier
finding that no official static T4.5 table exists; Maxroll's calculator
has it even though Smilegate's patch notes don't publish it directly.
Transcribed from the screenshot (attempt-by-attempt, base chance shown
`[with accumulated Artisan's Energy in brackets]`):
| Attempt | Base chance `[Artisan's Energy]` | Gold | Shards | Fusions | Destiny Stones | Crystal | Leapstones | Juice (qty ↓) | Juice (gold value ↓) |
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
**Resolved:** the gap between "No additional materials" totals and
"Full materials" totals is the **Juice toggle**, not a stockpile
assumption — "No additional materials" = no Juice, "Full materials" =
full Juice usage. (Note: the 6,860,369 total directly above is summed
across **all 25 levels, +1→+25**, for this weapon — a wider range than
the +18→+25/+16→+25 tables elsewhere in this section, so don't compare
it to those totals directly; use the like-for-like +18→+25 comparison in
the next table's Juice-premium note instead.) The reason "No additional
materials" is the right default for a *gold-efficiency* model: Juice's
own gold cost exceeds the gold value of the success-chance boost it
provides (quantified below: ~+14% gold for full Juice, +18→+25), so
buying it is never optimal from a pure gold-per-%-damage standpoint.
**Use "No additional materials" / no-Juice numbers as the baseline
honing cost** for this project; Juice only matters if someone cares
about *guaranteeing* a faster/more predictable outcome at a known gold
premium, which is a different (non-optimal-spend) use case.
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
## 5. Combat/Support gem (Damage/Cooldown) — damage-gain math
**Distinct system from §4.** This is the classic per-skill Damage/
Cooldown gem system (levels 1-10, one gem socketed per skill) — not the
newer Ars Goddess astrogem cut/fuse system covered in §4. Both are real,
separate gold sinks and need separate treatment.
**Core correction (this is why the placeholder in the old deleted
`script.js` was wrong):** a gem's damage-gain is **not a flat number
independent of what it's socketed into.** A Damage gem gives "+X% damage"
*to the specific skill it's socketed on*, so the actual gold-relevant
gain — the effect on total build DPS — depends on **that skill's share
of total damage output**:
```
Gem's build-wide dmg% gain ≈ (gem's %dmg boost to the skill) × (skill's % share of total DPS)
```
A gem level that boosts a skill's own damage by, say, 8% is worth much
more on a skill that's 50% of your total damage than the same 8% boost
on a skill that's only 20% of your damage — same gem level, same gold
cost, very different real value. **This means gem upgrades can't be
ranked as one undifferentiated "Damage gem" line item** (as the old
sheet/placeholder did) — they need to be ranked per skill-socket, using
that skill's damage share.
**Secondary effect — flat stat buff, not skill-share-weighted:** gems
also grant a small flat stat bonus (e.g. a small Attack Power buff) in
addition to their skill-specific effect. This part is **not** weighted
by skill damage share — it's a global stat increase like any other flat
Attack Power source, so it should be priced the same way as the
Attack Power rows already captured elsewhere in this doc (§3's Arsonistic
sheet numbers, or §4's astrogem Attack Power per-level constant
≈0.0324) rather than needing new math of its own.
**Combined gem value, conceptually:**
```
Gem dmg% gain = (skill-specific %dmg gain × that skill's dmg-share%) + (flat AP buff's marginal dmg% value)
```
**Resolved — sidestep exact damage-share data, use buckets instead:**
rather than requiring precise per-skill DPS-share numbers (which would
need the Arsonistic sheet's DPS formula extracted, a real project on its
own), use **damage-share buckets — 20% / 40% / 60%** — and let the user
pick which bucket their skill falls into. This drops the dependency on
extracting Arsonistic's `Calc`/`EffData` formula entirely for this
section; that extraction (§3) goes back to being a "nice to have" for
build-specific accessory accuracy, not a blocker for anything in §5.
**Open task:** the user picks their skill's bucket manually (no attempt
to auto-derive it from a log parser or build guide) — figure out where
in the UI/flow this selection happens, and whether 20/40/60% is granular
enough or a 4th bucket (e.g. 80%, for classes with one dominant hyper-
carried skill) is worth adding once real builds are tested against it.
---
## 6. Combined ranking formula (ties everything together)
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
1. ~~Market price field~~ — **resolved**, see §1: adopt Shizukaziye's
   loa-deal-finder "fair price" methodology (14-day daily averages, drop
   the live day + high/low outlier days, recency-weighted mean of the
   rest) instead of picking a single raw API field. Follow-up: find their
   exact methodology doc to confirm precise weighting/trim parameters
   before hardcoding.
1b. **New — data source decision:** use the **Lost Ark Market Online API**
   (Postman-documented) instead of the official Lost Ark OpenAPI for
   market prices — covers NA East and the other global-release regions.
   **Not yet done:** actually opening the Postman docs and recording
   endpoints/auth/schema, and confirming it has enough daily history
   depth to run the fair-price formula from item 1. This blocks any real
   implementation and should be the first thing next session.
2. ~~T4.5 column identities~~ — **resolved**, see §2: Silver (ignore) /
   Gold (fixed) / Shards / Fusion Materials / Destiny Stones /
   Leapstones (all four market-priced) / Juice (optional success-chance
   booster, not baseline cost). Confirmed directly, not inferred.
3. ~~"No additional materials" vs. "Full materials" totals don't
   reconcile~~ — **resolved**, see §2: the difference is the Juice
   (success-chance booster) toggle, not a stockpile assumption. Use
   "No additional materials" (no Juice) as baseline, since Juice's gold
   cost exceeds the gold value of the chance boost it buys.
4. ~~Breakthrough cost tension~~ — **resolved**, see §2: breakthrough is
   a materials-gate (raid drops from Serca), not a gold cost, so it was
   never going to show up as a cost jump in the curve. The +19→+20 jump
   (~+95-99%) is just normal escalating per-level honing cost, unrelated
   to breakthrough. Decision: ignore breakthrough materials in the model
   entirely — most players have enough naturally, not worth modeling as
   a gate.
5. Extract the Arsonistic sheet's `Calc`/`EffData` DPS formula if
   per-class/build-specific numbers are needed (vs. using their pre-baked
   table as-is). **No longer a blocker for §5/gems** — gem ranking uses
   user-picked damage-share buckets instead (see item 9), so this is back
   to being a "nice to have" for accessory-number accuracy only.
6. Confirm CORS behavior fetching Shizukaziye's `data/*.json` cross-origin;
   plan a relay if blocked.
7. Work out the unit conversion from astrogem `cut`/`expSpend`/`expScore`
   to a comparable "gold per 1% damage" figure for the combined ranking.
8. Decide dashboard vs. Sheet-Apps-Script delivery target (previously
   leaning dashboard, but not committed since nothing's been built).
9. **Revised, see §5:** gem upgrades (Damage/Cooldown, per-skill) use
   **user-picked damage-share buckets (20% / 40% / 60%)** instead of
   exact per-skill DPS-share data — combines (a) the skill-specific %dmg
   gain weighted by the chosen bucket, and (b) the gem's flat Attack
   Power buff, priced the same way as other flat-AP sources already in
   this doc. No longer blocked on item 5. Open: where this bucket-picker
   lives in the UI/flow, and whether 3 buckets are granular enough.
## Explicitly not done yet
No code, no dashboard, no Apps Script. This file is the handoff point —
next step for whoever (or whichever Claude) picks this up is to resolve
the open questions above, *then* start building.
