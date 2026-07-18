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
| Cracine/Skaitavia sheet | The original "Gold to DMG% DPS" ranking tab, T1–T4 honing, gems, accessories, Ark Grid (stale prices, T4 only). Has its own "Explanations" tab documenting methodology and credits — read directly, see below | https://docs.google.com/spreadsheets/d/1Cg9q8t4-MeUg-TQUJ_oeHqN-03z9l-RPlHfHp4gZuzs |
| Arsonistic DPS Calculator | Full class-DPS simulator; `Acc`/`Engr+Stone`/`Brace`/`ArkGrid` tabs derive **real, build-specific** damage-gain % by removing a bonus and diffing DPS | https://docs.google.com/spreadsheets/d/1_0J7liyM_yw16pyn6TKlF1YGaIt5n_A9hSoLnT3yTUc |
| Maxroll Honing Calculator | Live, current T4.5 per-level success chance + material quantities (screenshot captured — see below) | https://maxroll.gg/lost-ark/upgrade-calculator |
| Shizukaziye's astrogem-calculator | Open, documented, verified (JS/Python parity + DP-vs-Monte-Carlo gated) astrogem cut/fuse model, including side-node/support scoring | https://shizukaziye.github.io/astrogem-calculator/ · source: https://github.com/shizukaziye/astrogem-calculator · math: `METHODOLOGY.md` in that repo |
| Lost Ark OpenAPI | Official live market price endpoint (`POST /markets/items`), auth via personal JWT — superseded as our chosen price source (see §1), kept here for reference/fallback | https://developer-lostark.game.onstove.com |
| Shizukaziye's loa-deal-finder | Same author as the astrogem calculator. **Confirmed via their open-source `refresh_deals.py`: not an independent data source** — pulls from the same LOA Buddy Worker API. Its exact "fair price" formula (source-verified, see §1) is what we've adopted, and its server-side-fetch architecture is the CORS solution we've adopted too | site: https://shizukaziye.github.io/loa-deal-finder/ · source: https://github.com/shizukaziye/loa-deal-finder |
| Lost Ark Market Online API | Superseded — Postman docs appear deprecated/stale (see §1), replaced by LOA Buddy below. Kept for reference only. | Postman docs: https://documenter.getpostman.com/view/20821530/UyxbppKr · org: https://github.com/Lost-Ark-Market-Online |
| LOA Buddy | **Chosen market data source** (see §1). Live site with Trade Skill + Honing Materials (incl. Additional Honing Materials/Juice) price tracking, NAE confirmed, 7d/14d/30d historical charts. Backed by a public (no-auth) Cloudflare Worker API — confirmed via live inspection, not docs. | https://loa-buddy.pages.dev · API: `marketdata-api.yrzhao1068589.workers.dev` (undocumented, reverse-engineered — see §1) |
---
## 0. Original sheet's own methodology (read directly, not inferred)
Answering "did the original authors pull from a source or do the math
themselves": **both, and they say so explicitly.** The sheet has its own
"Explanations" tab with credits and methodology notes. Read directly
rather than guessed. Key points, by relevance to this project:
**Critical finding — the DMG% numbers cannot be verified from inside the
sheet, because they aren't formulas.** Checked directly by clicking
cells on the "Gold to DMG% DPS" tab (not assumed): the **GAIN [DMG%]
column is hardcoded literal values** — e.g. cell B2 ("ACCESSORY MID [5
ANCIENT]") just contains the typed number `4.6%`, not a formula. This is
true across the rows checked (spot-checked B2 and B21). **The EXPENSE
(gold cost) column, by contrast, is genuinely formula-driven** — e.g.
cell C13 ("WEAPON ADVANCED HONING 11-20 FULL ON GRACE") contains
`=Honing!B29 + Honing!C29/1000 * $H$8 + Honing!D29 * $H$10 + ...`, live-
pulling from the workbook's own `Honing` tab and region-price cells. And
the EXPENSE column elsewhere uses `=ARRAY_CONSTRAIN(ARRAYFORMULA(
INDIRECT($G$2 & "!B2")), 1, 1)` — dynamically switching which regional
price tab (`NA`/`EUC`/`KR`) it reads from based on a region selector
cell.
**What this means for "verify their numbers":** the gold-cost side is
self-consistent and traceable within their own workbook (you can follow
the formula chain to the actual regional price cells). **The damage-%
side is not** — it's an opaque, externally-computed number credited to
Portia/Riyon, pasted in as a constant. There's no formula trail to audit
inside this file. Verifying it requires **cross-referencing against an
independent, formula-driven source** — which we already have two of in
this doc:
- **Arsonistic DPS Calculator (§3)** — real build-simulated damage-gain
  %, formula-derived (their `Calc`/`EffData` tabs), for accessory
  substats. Directly comparable in *kind* to the Cracine sheet's
  accessory rows, though not in scale — Arsonistic's numbers are
  per-single-accessory-piece (e.g. HH Additional Damage = 3.99%), while
  Cracine's "[5 ANCIENT]" rows appear to be **all 5 accessory slots at
  once** (2 rings + 2 earrings + necklace), so a rough sum-of-5-pieces
  check against Arsonistic's per-piece numbers is the right comparison,
  not a direct 1:1 match.
- **Maxroll honing data (§2)** — already directly verified against
  Cracine's own honing costs earlier this session (they matched, see
  §2's honing tables) — but that was the EXPENSE side, which we now know
  was already traceable/self-consistent anyway. The DMG%-per-honing-
  level numbers in Cracine's sheet still haven't been independently
  checked against anything.
**Cross-check performed — real verification, not just diagnosis.**
Found a third, independent Korean source with actual per-substat
accessory damage numbers: an Inven post by **또피셜** (likely the same
person credited as "Portia (포피셜)" in Cracine's sheet, though the
username rendering differs slightly — not 100% certain it's the same
person), "악세 연마옵션별 딜증가 효율표" (Accessory reforging-option
damage-gain efficiency table),
https://www.inven.co.kr/board/lostark/4821/99838 — a well-regarded post
(215,608 views, 20 recommendations, 55 comments as of this check). The
actual numbers are in an embedded image
(`upload3.inven.co.kr/upload/2024/07/25/bbs/i1390309873.png`), read
directly rather than left as an unreadable image link:
| Slot | Raw stat (High/Mid/Low) | Dmg-gain efficiency (High/Mid/Low) | Baseline noted |
|---|---|---|---|
| Necklace | Additional Damage 2.60/1.60/0.60% | 1.88/1.16/0.43% | Ark Passive support build, quality 100, Master Elixir lv40 |
| Necklace | Additional Damage (alt build) | 1.73/1.06/0.40% | "Longing" set support build, same quality/elixir |
| Necklace | Boss/enemy dmg 2.00/1.20/0.55% | 2.00/1.20/0.55% | (1:1, no conversion loss) |
| Earring | Attack Power% 1.55/0.95/0.40% | 1.43/0.88/0.37% | Order Elixir lv5 + Ardent legendary engraving+ |
| Earring | Weapon Power% 3.00/1.80/0.40% | 1.49/0.90/0.40% | same |
| Ring | Crit Rate 1.55/0.95/0.40% | 1.06/0.65/0.27% | Crit rate 80%, crit dmg 250% baseline |
| Ring | Crit Damage 4.00/2.40/1.10% | 1.45/0.87/0.40% | same |
| Common | Attack Power (flat) 390/195/80 | 0.39/0.20/0.08% | at 100k Attack Power; efficiency drops as AP rises |
| Common | Weapon Attack Power (flat) 960/480/195 | 0.40/0.20/0.08% | at 120k Weapon AP; same diminishing pattern |
**Comparison against Arsonistic's §3 numbers (independent build, different
source):** matching each stat's High-tier raw value against the closest
Arsonistic row. "% apart" = |gap in percentage points| ÷ Arsonistic's
value (i.e. how big the gap is relative to the Arsonistic number
specifically — not a symmetric measure, just a consistent one) —
- Additional Damage: Arsonistic 1.95% vs. 또피셜 1.88% (gap 0.07 ÷ 1.95 = **3.6%** apart) — **close agreement**
- Attack Power%: Arsonistic 1.38% vs. 또피셜 1.43% (gap 0.05 ÷ 1.38 = **3.6%** apart) — **close agreement**
- Weapon Power%: Arsonistic 1.03% vs. 또피셜 1.49% (gap 0.46 ÷ 1.03 = **44.7%** apart) — **notable divergence**
- Crit Rate: Arsonistic 1.23% vs. 또피셜 1.06–1.09% (gap 0.14–0.17 ÷ 1.23 = **11.4–13.8%** apart) — **moderate divergence**
- Crit Damage: Arsonistic 1.29% vs. 또피셜 1.45% (gap 0.16 ÷ 1.29 = **12.4%** apart) — **moderate divergence**
**Why the divergence — the actual mechanism, not just "builds differ":**
Arsonistic's DPS calculator computes each stat's damage-gain % by taking
the loaded build's **base stats and base crit rate**, adding the bonus,
and diffing total DPS. Crit Rate and Crit Damage have **strongly
nonlinear marginal value** — the DPS impact of +1% crit rate depends
heavily on what your crit rate already is (going from 20%→21% crit
behaves very differently than 79%→80%, both because of the crit-chance
curve itself and because many classes/engravings have crit-rate
soft-caps or breakpoints). So if Arsonistic's loaded build and 또피셜's
build started from different base crit rates, that alone — not any
error in either source — would produce exactly the kind of moderate
Crit Rate/Crit Damage divergence seen above. Attack Power/Weapon Power%
are comparatively more linear, which likely explains why those two
showed close agreement while crit-related stats didn't.
**Conclusion — this is the real answer to "are their numbers correct":**
two independently-built sources (different players, different exact
builds, different base crit rates) land in the same ballpark for
comparatively linear stats but disagree by double-digit percentages on
Weapon Power% and crit-related stats, for a specific, understood reason
(nonlinear marginal value depending on baseline crit rate) rather than
either source being wrong. **The actionable conclusion: don't treat any
single source's damage-gain % as ground truth for an arbitrary user's
build** — this is especially true for crit-related stats specifically,
where the baseline crit rate assumption matters a lot. If this project
reuses substat damage-gain numbers, it should either (a) let the user
pick/confirm their own baseline crit rate and stats rather than
hardcoding one source's numbers, or (b) clearly label whichever source's
numbers are used as build-specific estimates tied to a stated baseline
— matching what both Arsonistic and 또피셜's own posts already say about
their own numbers.
**Decision: use 또피셜's Inven table as the accessory substat damage-gain
source**, not Arsonistic's. **Correction to the reasoning, worth being
precise about:** it's not that 또피셜's numbers are baseline-*free* —
they aren't. The table explicitly states baselines per row (Crit
Rate/Crit Damage: "crit rate 80%, crit damage 250%"; earrings: "Order
Elixir lv5 + Ardent legendary engraving+"; necklace: specific set +
quality + elixir level). The actual reason to prefer it: it's **one
fixed, explicitly-stated, single baseline across a full accessory-slot
table**, published standalone with its own credibility (215K
views/55 comments), versus Arsonistic's numbers which are a by-product
of whatever specific class/build happened to be loaded in their `Calc`
tab when captured (§3) — less clear what that baseline even was. Neither
is baseline-free; 또피셜's is just the more legible, consistently-stated
one. **Still true regardless of source:** these numbers are only exactly
right for a character actually at that stated baseline (crit rate 80%,
etc.) — don't present them as universal without carrying that caveat
forward.
**Authorship/provenance:** Made by Cracine (Twitch: cracine), crediting
Reddit user **Skaitavia** for explanations/baseline format, and
**Portia (포피셜)** and **Riyon (리연)** — Korean community
theorycrafters — "for math and numbers." So the core damage-gain math
wasn't purely self-derived by the sheet's maintainer; it's aggregated
from named KR theorycrafting sources, then packaged into the sheet.
**Gems — direct confirmation of our §5 approach:** "DMG gems state their
%. Which is the distribution of the skill in the class." The sheet
explicitly used **per-class skill damage-share** to value gems (their
own "1 CYCLE" / "2 CYCLE" skill categorization), and states outright:
"OTHER CLASSES DO NOT APPLY, MATH IS TOO SPECIFIC." This validates the
core idea behind our §5 gem math (damage-gain scales with the socketed
skill's share of total damage) — the original authors used the same
concept, just per-class-specific instead of our simplified buckets.
**Honing — confirms Maxroll as a legitimate source, and reveals a
modeling shortcut we're improving on:** "Please use the average scenario
in the Maxroll calculator with optimal materials" — the original sheet
explicitly sources its honing costs from Maxroll's calculator too,
independently validating our own choice of Maxroll (§2). However, their
per-level cost is **bucketed and averaged** (e.g. "ARMOR 17/18/19" is one
averaged cost across all 3 levels, not per-level) — our §2 approach,
using individual per-level costs (+16 through +25 separately), is more
granular/accurate than the original sheet's own method.
**Accessories:** upgrades assumed relative (sell old gear), Pheon cost
explicitly excluded from their numbers — worth deciding whether we want
to include Pheon cost, since they flag it as a known omission rather
than an oversight.
**Direct validation of this project's whole premise (Goal #1):** "API
(KR Only): KR uses API, NAW EUC NAE is manually updated." **The original
sheet's own author admits NAE (our target region) prices are manually
updated, not automated** — this is exactly the gap stated in this
project's Goal #1 ("Auto-pulls current NA East market prices instead of
stale manual entries"). Not an assumption on our part — the original
author says so directly.
**KR accessory pricing methodology (for context, not directly ours):**
min 70 quality, any trade count/upgrade level, Ancient-only, sorted by
buy price ascending, averaging the cheapest 10 listings. A different
methodology from our adopted "fair price" trimmed-mean (§1) — noted for
context, not something to adopt.
**Ark Grid/Astrogem — direct confirmation of Goal #3's stated gap:** the
sheet has its own custom simulation for astrogem cut probability and
gold cost (reroll/reset decision rules documented), but explicitly
states: **"Does not consider the damage received from side node
upgrades. Attack Power, Additional Damage, Boss Damage, Ally Damage,
Brand Power, Ally Attack are all not considered."** This is the original
author directly naming the exact gap this project's Goal #3 exists to
fill, and is exactly what Shizukaziye's astrogem-calculator's
side-node/support axis (§4) solves — strong validation that adopting
Shizukaziye's model instead of re-deriving the old sheet's Ark Grid
simulation was the right call.
**Engraving/book assumptions (simplifying, worth flagging as a
limitation to inherit or fix):** "All Engravings are assumed to be 100%
uptime and affect 100% of your damage" — acknowledged by the original
author as inaccurate for some engravings (their example: Super Charge,
All-Out Attack don't actually have 100% uptime), and "All books are
going from 0→20" as a fixed assumption. If our model reuses any
engraving-related numbers from this sheet, this same simplification
carries over unless we specifically correct for it.
---
## 1. Live market prices
**Decision: use LOA Buddy's market data API** (https://loa-buddy.pages.dev),
not the official Lost Ark OpenAPI or the Lost Ark Market Online API. The
Lost Ark Market Online Postman docs turned out to be effectively
deprecated (couldn't confirm current endpoints/schema, site/tooling
looked stale) — LOA Buddy replaces it as the chosen source, with actual
confirmed technical details below rather than an untested plan.
**How it was found — reverse-engineered from the live site, not a docs
page:** LOA Buddy has no public API documentation. Confirmed the
mechanism by patching `window.fetch` in the browser devtools while using
the site (https://loa-buddy.pages.dev/materials and its "Market Tracker"
→ "Honing Materials" view) and by direct `curl` testing of the endpoints
found that way. This is an **undocumented third-party API** — nothing
here is a stable public contract, it could change or break without
notice. Treat this section as "how it works today," not a guarantee.
**Confirmed endpoints** (Cloudflare Worker at
`marketdata-api.yrzhao1068589.workers.dev`, no auth/API key required):
- `POST /v1/prices/latest` — body `{"region_slug": "nae", "item_slugs": ["wild-flower", ...]}`
  (batched, multiple items per call) → returns
  `[{"item_slug": "...", "price": N, "timestamp": <unix seconds>}]`,
  one current price per item.
- `GET /v1/prices/historical/{region_slug}/{item_slug}?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
  → returns `[{"day": "YYYY-MM-DD", "min_price": N, "max_price": N, "avg_price": N}]`,
  **one row per day**. The site's own UI offers 7d/14d/30d chart ranges,
  confirming **at least 30 days of daily history is available** — more
  than enough for the 14-day fair-price formula in this section.
- Item slugs are simple kebab-case of the display name (confirmed
  examples: "Crystallized Destruction Stone" → `crystallized-destruction-stone`,
  "Destiny Shard Pouch (L)" → `destiny-shard-pouch-l`, "Wild Flower" →
  `wild-flower`). Exact slugs for our specific honing materials (Shards,
  Fusion Materials, Destiny Guardian/Destruction Stone, Leapstones,
  Juice) still need to be looked up one by one on the live site — not
  enumerated yet, but the naming pattern is established.
- Region param confirmed working: `"nae"` (North America East, this
  project's target). Other regions likely follow the same pattern
  (`"naw"`, etc.) but not individually tested.
**Independent validation of an earlier decision:** LOA Buddy's own
material list uses **"Destiny Guardian Stone"** and **"Destiny
Destruction Stone"** as separate named items — this independently
confirms the Guardian-Stone-for-armor / Destruction-Stone-for-weapon
split already documented in §2, from a completely different source than
where that naming came from originally. Good cross-check.
**CORS confirmed blocking direct frontend calls, but resolved — see
"Architecture takeaway" further down:** tested the Worker directly with
`curl`, sending different `Origin` headers. Result:
`Access-Control-Allow-Origin` is only returned when
`Origin: https://loa-buddy.pages.dev` is sent — tested with a generic
foreign origin and with what would be our own site's likely GitHub
Pages origin, and both got **no CORS header back**, meaning a real
browser would block a client-side request. **Resolution: don't call it
from the browser at all.** Shizukaziye's own `refresh_deals.py` (see
below) proves the fix — fetch server-side (their script uses `curl` in a
periodic Python job, not a browser `fetch()`), since CORS is a
browser-only restriction and doesn't apply to server-to-server calls.
Bake the results into static data our frontend reads, same as their
architecture.
**Not yet checked:** whether hitting this undocumented API at any real
volume triggers rate limiting or is against the (nonexistent, since
there's no public ToS) spirit of a small community tool — worth being a
polite, low-frequency consumer (e.g. cache prices for a day, don't poll
constantly) given this is someone's personal/hobby infrastructure, not a
funded public API.
**Resolved — pricing methodology, EXACT formula confirmed from source
(not a screenshot description anymore):** loa-deal-finder
(https://shizukaziye.github.io/loa-deal-finder/) is **open source**
(https://github.com/shizukaziye/loa-deal-finder) — pulled the actual
code rather than guessing from the UI. Two key files:
- `refresh_deals.py` — a build-time script that fetches fresh prices and
  bakes them into `index.html` as a static `const DEALS=...` blob (no
  live API calls happen when you load the page — everything's
  pre-rendered). **This confirms loa-deal-finder is not an independent
  data source** — its `BASE` constant is literally
  `https://marketdata-api.yrzhao1068589.workers.dev/v1`, the exact same
  Worker already found via LOA Buddy. Scraping loa-deal-finder instead
  of LOA Buddy would just be scraping the same upstream data one layer
  removed, with less coverage (only the items they've chosen to track).
- `index.html`'s inline script has the actual `robust()` function that
  computes fair price — this is the ground truth, verbatim:
  ```js
  function robust(h, te, d){          // h=history (newest-first), te=trim edges, d=decay
    if(!h || !h.length) return null;
    let a = h.length>1 ? h.slice(1) : h.slice();      // drop today (index 0, live/in-progress)
    if(te>0 && a.length>2*te){
      const idx = a.map((v,i)=>i).sort((x,y)=>a[x]-a[y]);
      const drop = new Set([...idx.slice(0,te), ...idx.slice(idx.length-te)]);  // te lowest + te highest
      a = a.filter((v,i)=>!drop.has(i));
    }
    let num=0, den=0, w=1;
    for (const v of a){ num += v*w; den += w; w *= d; }   // geometric recency decay
    return den ? Math.round(num/den) : null;
  }
  // called as: robust(item.history, 2, 0.9) || item.spotPrice   (fallback to spot if no history)
  ```
  So precisely: **drop today, trim the 2 highest + 2 lowest of the
  remaining (up to 13) completed days, then take a decay-weighted mean
  with weight `0.9^i`** (i = position from most-recent surviving day,
  starting at 0). Falls back to current spot price if there's not enough
  history to compute a fair price. This replaces the earlier "couple of
  high/low days" approximation — it's exactly 2, and the decay factor is
  exactly 0.9, both confirmed from source. **Use this exact formula**,
  don't re-derive or approximate it further.
- History window in practice: `refresh_deals.py` fetches 20 days from
  the API but only keeps the most recent 14 (`[:14]` after reversing to
  newest-first) — so "last 14 daily average prices" in the UI text means
  literally 14 raw days in, of which today gets dropped and up to 4 more
  get trimmed, leaving up to 9 days feeding the weighted mean.
**Not directly needed, but same toolkit:** their `deal = (spot - fair) /
fair` metric (negative = below fair = a good buy) is for *finding market
deals*, not something this project needs — we only need the `fair` price
itself as a per-material gold value, not the deal-percentage layer on
top.
**Liquidity filtering (their term, confirmed from source, may not apply
to us):** `r.rel && r.h.length>=8 && r.fair>=minv && Math.abs(x.gap)<=1.5
&& x.vol<=volTol(x.fair)` — requires the item's category to be in a
relevant set (`gather`/`fusion`/`honing`/`meal`/`craft` — **honing is
included**), at least 8 days of history, fair price above a minimum
value threshold, and price volatility under a value-scaled tolerance
(`volTol = clamp(0.6 + 0.9·log10(fair), 1.2, 3.6)`). This is their
"should this item be trusted at all for a general deal-finder" gate —
for the handful of specific honing materials we already know we need
(Shards, Fusion Materials, Destiny Stones, Leapstones), we'd want the
`fair` price regardless of whether they'd individually pass this filter.
**Architecture takeaway — this changes the CORS answer below:**
`refresh_deals.py` calls the Worker via `curl` in a **server-side Python
script**, not a browser `fetch()`. CORS is a browser-enforced
restriction only — it doesn't apply to server-to-server calls at all.
This means the right fix for the CORS blocker isn't necessarily "build a
relay Worker" — it's simpler to just **fetch server-side** (a small
script run periodically, e.g. via GitHub Actions on a schedule,
mirroring this exact architecture) and bake/publish the resulting prices
as static data our frontend reads, rather than the frontend calling the
Worker directly at all.
**Official OpenAPI, kept for reference/fallback only (not the chosen
source):** likely doesn't send CORS headers for arbitrary browser
origins either. Getting access: sign in at the developer portal with
your Steam/Stove login → Create Client → copy the JWT from "My Clients."
Free, instant, personal (don't commit it to a public repo). Only
relevant if LOA Buddy's API becomes unusable (breaks, rate-limits us,
disappears) and a fallback is needed.
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
**Decision: use 또피셜's Inven accessory table (§0) as the accessory
substat damage-gain source**, not the Arsonistic table below. Both are
baseline-dependent, not universal — 또피셜's is preferred because it
states one explicit, consistent baseline per row (crit rate 80%/crit
dmg 250%, specific elixir/engraving levels) across a full accessory
table published standalone, versus Arsonistic's numbers being a
byproduct of whatever build happened to be loaded in their `Calc` tab
with an unclear baseline. See §0 for the full 또피셜 table and the
cross-check against Arsonistic's numbers below (close agreement on
Additional Damage/Attack Power%, real divergence on crit-related stats
— explained there by baseline crit rate differences).
**Arsonistic table kept for reference/cross-check, not the chosen
source.** This is **not** a universal formula — the Arsonistic DPS
Calculator derives it by full build simulation: it computes your total
DPS with a stat/gear bonus included, removes it, recomputes, and reports
the delta. That's why its own docs say "all numbers are only comparable
between builds on the same class/skill setup."
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
1. ~~Market price field~~ — **fully resolved, exact formula confirmed
   from loa-deal-finder's open source** (see §1): drop today, trim the 2
   highest + 2 lowest of the remaining completed days, geometric
   recency-weighted mean with decay 0.9. No longer an approximation —
   this is the actual `robust()` function from their code, not a
   screenshot-derived guess.
1b. ~~Data source decision~~ — **resolved and confirmed**, see §1: the
   Lost Ark Market Online Postman API turned out to be effectively
   deprecated, so switched to **LOA Buddy** (https://loa-buddy.pages.dev),
   reverse-engineered by inspecting live network traffic. Endpoints,
   request/response schema, no-auth confirmation, ≥30-day history depth,
   and item-slug pattern are all confirmed directly (not assumed). Also
   confirmed: loa-deal-finder (Shizukaziye) is downstream of this same
   API, not an independent source — checked their open-source build
   script directly. **CORS is confirmed blocking direct frontend calls,
   and resolved:** don't call the Worker from the browser at all — fetch
   server-side (e.g. a scheduled script/GitHub Action, mirroring
   Shizukaziye's own `refresh_deals.py` architecture) and bake the
   result into static data the frontend reads. No relay Worker needed.
   **Still open:** (a) it's undocumented third-party infra with no
   stability guarantee — build with that fragility in mind; (b) exact
   item slugs for our specific honing materials aren't enumerated yet,
   just the naming pattern (kebab-case of display name); (c) whether
   polling this at any real volume is impolite to someone's hobby
   infrastructure — cache aggressively, don't poll constantly.
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
   per-class/build-specific numbers are needed. **Lower priority now,
   see §3:** 또피셜's table is the chosen accessory damage-gain source,
   not Arsonistic's — this extraction would only matter for a future
   "compute fresh numbers for my exact build" feature, not for the
   baseline accessory ranking.
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
10. ~~Verify Cracine sheet's DMG% numbers~~ — **partially resolved, see
   §0.** Confirmed they're hardcoded constants, not formulas (EXPENSE
   column is formula-driven, GAIN/DMG% is not). Found a third
   independent source (또피셜's Inven accessory efficiency table) and
   cross-checked its per-substat numbers against Arsonistic's §3 data:
   close agreement on Additional Damage/Attack Power%, but 12–45%
   divergence on Weapon Power%/Crit Rate/Crit Damage — expected
   build-to-build spread, not an error in either source. **Conclusion:
   don't hardcode one source's numbers as universal truth.** Still
   open: this verified the underlying substat building blocks, not
   Cracine's specific "[5 ANCIENT]" (all-5-accessories) rows directly —
   that comparison (sum-of-5-pieces vs. Cracine's number) hasn't been
   done yet.
## Explicitly not done yet
No code, no dashboard, no Apps Script. This file is the handoff point —
next step for whoever (or whichever Claude) picks this up is to resolve
the open questions above, *then* start building.
