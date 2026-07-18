// Default estimates — rough community averages, meant to be edited to match
// real server prices and current progression. Not exact patch data.
// This file is pure math/logic right now (no DOM) so it can be run and
// checked directly with `node script.js` while the model is being worked out.
const DEFAULT_SYSTEMS = [
  { id: "engraving",   name: "Engraving books / accessory swap", level: 0,  max: 3,   cost: 8000, growth: 2.2,  dmgPerLevel: 6.0 },
  { id: "dmg_gem",     name: "Damage gem",                       level: 3,  max: 10,  cost: 300,  growth: 1.55, dmgPerLevel: 0.55 },
  { id: "cd_gem",      name: "Cooldown gem",                     level: 3,  max: 10,  cost: 300,  growth: 1.55, dmgPerLevel: 0.5 },
  { id: "quality",     name: "Accessory quality (reform)",       level: 40, max: 100, cost: 400,  growth: 1.05, dmgPerLevel: 0.15 },
  { id: "weapon_hone", name: "Weapon honing",                    level: 10, max: 25,  cost: 5000, growth: 1.6,  dmgPerLevel: 1.4 },
  { id: "armor_hone",  name: "Armor honing (per piece avg)",     level: 10, max: 25,  cost: 3500, growth: 1.55, dmgPerLevel: 0.5 },
  { id: "elixir",      name: "Elixir level",                     level: 2,  max: 5,   cost: 6000, growth: 1.8,  dmgPerLevel: 1.2 },
  { id: "transcend",   name: "Transcendence points",             level: 5,  max: 20,  cost: 1500, growth: 1.3,  dmgPerLevel: 0.35 },
];

// growth is applied relative to the system's *default* starting level so
// edits to "current level" don't retroactively distort the cost curve.
function baseLevelFor(sys, defaults) {
  const def = defaults.find((d) => d.id === sys.id);
  return def ? def.level : 0;
}

function nextCost(sys, defaults) {
  return sys.cost * Math.pow(sys.growth, sys.level - baseLevelFor(sys, defaults));
}

function efficiency(sys, defaults) {
  if (sys.level >= sys.max) return 0;
  const cost = nextCost(sys, defaults);
  if (cost <= 0) return 0;
  return (sys.dmgPerLevel / cost) * 1000; // % per 1000 gold
}

// Greedy allocator: repeatedly buy whichever next upgrade gives the best
// damage % per gold, across every system, until the budget runs out.
function computePlan(budget, systems, defaults = systems) {
  let remaining = budget;
  let totalDmg = 0;
  const working = systems.map((s) => ({ ...s }));
  const plan = [];

  while (true) {
    let best = null;
    let bestEff = -1;
    for (const sys of working) {
      if (sys.level >= sys.max) continue;
      const cost = nextCost(sys, defaults);
      if (cost > remaining || cost <= 0) continue;
      const eff = (sys.dmgPerLevel / cost) * 1000;
      if (eff > bestEff) {
        bestEff = eff;
        best = sys;
      }
    }
    if (!best) break;
    const cost = nextCost(best, defaults);
    remaining -= cost;
    best.level += 1;
    totalDmg += best.dmgPerLevel;
    plan.push({
      name: best.name,
      newLevel: best.level,
      cost,
      dmg: best.dmgPerLevel,
      runningDmg: totalDmg,
      remaining,
    });
    if (plan.length > 500) break; // safety valve
  }

  return { plan, budget, remaining, totalDmg };
}

function printReport(result) {
  const { plan, budget, remaining, totalDmg } = result;
  console.log(`Budget: ${budget.toLocaleString()} gold`);
  console.log(`Purchases: ${plan.length}`);
  console.log(`Total dmg % gained: +${totalDmg.toFixed(2)}%`);
  console.log(`Gold left over: ${Math.round(remaining).toLocaleString()}`);
  console.log("");
  plan.forEach((step, i) => {
    console.log(
      `${String(i + 1).padStart(2)}. ${step.name.padEnd(38)} -> lvl ${String(step.newLevel).padEnd(3)} ` +
      `cost ${Math.round(step.cost).toLocaleString().padStart(7)}  +${step.dmg.toFixed(2)}%  ` +
      `total +${step.runningDmg.toFixed(2)}%  remaining ${Math.round(step.remaining).toLocaleString()}`
    );
  });
}

if (require.main === module) {
  const budget = Number(process.argv[2]) || 50000;
  const result = computePlan(budget, DEFAULT_SYSTEMS);
  printReport(result);
}

module.exports = { DEFAULT_SYSTEMS, nextCost, efficiency, computePlan };
