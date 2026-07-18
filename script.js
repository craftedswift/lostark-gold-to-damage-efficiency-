// Default estimates — rough community averages, meant to be edited to match
// the user's actual server prices and current progression. Not exact patch data.
const DEFAULT_SYSTEMS = [
  { id: "engraving",  name: "Engraving books / accessory swap", level: 0, max: 3,  cost: 8000,  growth: 2.2, dmgPerLevel: 6.0 },
  { id: "dmg_gem",    name: "Damage gem",                        level: 3, max: 10, cost: 300,   growth: 1.55, dmgPerLevel: 0.55 },
  { id: "cd_gem",     name: "Cooldown gem",                      level: 3, max: 10, cost: 300,   growth: 1.55, dmgPerLevel: 0.5 },
  { id: "quality",    name: "Accessory quality (reform)",        level: 40, max: 100, cost: 400, growth: 1.05, dmgPerLevel: 0.15 },
  { id: "weapon_hone",name: "Weapon honing",                     level: 10, max: 25, cost: 5000, growth: 1.6, dmgPerLevel: 1.4 },
  { id: "armor_hone", name: "Armor honing (per piece avg)",      level: 10, max: 25, cost: 3500, growth: 1.55, dmgPerLevel: 0.5 },
  { id: "elixir",     name: "Elixir level",                      level: 2, max: 5,  cost: 6000,  growth: 1.8, dmgPerLevel: 1.2 },
  { id: "transcend",  name: "Transcendence points",               level: 5, max: 20, cost: 1500, growth: 1.3, dmgPerLevel: 0.35 },
];

const STORAGE_KEY = "lostark-gold-optimizer-systems-v1";

let systems = loadSystems();

const budgetInput = document.getElementById("budget");
const tbody = document.getElementById("systems-body");
const planBody = document.getElementById("plan-body");
const summaryEl = document.getElementById("summary");
const resetBtn = document.getElementById("reset-defaults");

function loadSystems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_SYSTEMS.map((s) => ({ ...s }));
}

function saveSystems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(systems));
}

function nextCost(sys) {
  return sys.cost * Math.pow(sys.growth, sys.level - baseLevelFor(sys));
}

// growth is applied relative to the system's *default* starting level so
// edits to "current level" don't retroactively distort the cost curve.
function baseLevelFor(sys) {
  const def = DEFAULT_SYSTEMS.find((d) => d.id === sys.id);
  return def ? def.level : 0;
}

function efficiency(sys) {
  if (sys.level >= sys.max) return 0;
  const cost = nextCost(sys);
  if (cost <= 0) return 0;
  return (sys.dmgPerLevel / cost) * 1000; // % per 1000 gold
}

function renderTable() {
  tbody.innerHTML = "";
  const rows = [...systems].sort((a, b) => efficiency(b) - efficiency(a));
  for (const sys of rows) {
    const tr = document.createElement("tr");
    const maxed = sys.level >= sys.max;
    const eff = efficiency(sys);
    tr.innerHTML = `
      <td>${sys.name}</td>
      <td><input type="number" data-field="level" data-id="${sys.id}" value="${sys.level}" min="0" max="${sys.max}"></td>
      <td><input type="number" data-field="max" data-id="${sys.id}" value="${sys.max}" min="0"></td>
      <td><input type="number" data-field="cost" data-id="${sys.id}" value="${sys.cost}" min="0" step="100"></td>
      <td><input type="number" data-field="growth" data-id="${sys.id}" value="${sys.growth}" min="1" step="0.01"></td>
      <td><input type="number" data-field="dmgPerLevel" data-id="${sys.id}" value="${sys.dmgPerLevel}" min="0" step="0.01"></td>
      <td class="efficiency-cell">${maxed ? "maxed" : eff.toFixed(3)}</td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", onFieldChange);
  });
}

function onFieldChange(e) {
  const { field, id } = e.target.dataset;
  const sys = systems.find((s) => s.id === id);
  if (!sys) return;
  const val = parseFloat(e.target.value);
  sys[field] = isNaN(val) ? 0 : val;
  if (sys.level > sys.max) sys.level = sys.max;
  saveSystems();
  renderTable();
  computePlan();
}

function computePlan() {
  const budget = parseFloat(budgetInput.value) || 0;
  let remaining = budget;
  let totalDmg = 0;
  const working = systems.map((s) => ({ ...s }));
  const plan = [];

  while (true) {
    let best = null;
    let bestEff = -1;
    for (const sys of working) {
      if (sys.level >= sys.max) continue;
      const cost = nextCost(sys);
      if (cost > remaining || cost <= 0) continue;
      const eff = (sys.dmgPerLevel / cost) * 1000;
      if (eff > bestEff) {
        bestEff = eff;
        best = sys;
      }
    }
    if (!best) break;
    const cost = nextCost(best);
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

  renderPlan(plan, budget, remaining, totalDmg);
}

function renderPlan(plan, budget, remaining, totalDmg) {
  planBody.innerHTML = "";
  plan.forEach((step, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${step.name}</td>
      <td>${step.newLevel}</td>
      <td>${Math.round(step.cost).toLocaleString()}</td>
      <td>+${step.dmg.toFixed(2)}%</td>
      <td>${step.runningDmg.toFixed(2)}%</td>
      <td>${Math.round(step.remaining).toLocaleString()}</td>
    `;
    planBody.appendChild(tr);
  });

  summaryEl.innerHTML = `
    <div class="stat"><div class="label">Gold budget</div><div class="value">${Math.round(budget).toLocaleString()}</div></div>
    <div class="stat"><div class="label">Purchases made</div><div class="value">${plan.length}</div></div>
    <div class="stat"><div class="label">Total dmg % gained</div><div class="value">+${totalDmg.toFixed(2)}%</div></div>
    <div class="stat"><div class="label">Gold left over</div><div class="value">${Math.round(remaining).toLocaleString()}</div></div>
  `;
}

budgetInput.addEventListener("input", computePlan);

resetBtn.addEventListener("click", () => {
  systems = DEFAULT_SYSTEMS.map((s) => ({ ...s }));
  saveSystems();
  renderTable();
  computePlan();
});

renderTable();
computePlan();
