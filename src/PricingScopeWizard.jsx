import React, { useMemo, useState } from "react";

// -----------------------------------------------------------------------------
// Pricing & Scoping Wizard – MVP
// - Single-file React component (Tailwind CSS classes)
// - 3 steps: Project Inputs → Services Bundling → Workforce Planning & Pricing
// - In-memory "pricing engine" to compute cost, price, and margin
// - Approval hints based on margin thresholds
// -----------------------------------------------------------------------------

// --- Domain Models (simplified) ------------------------------------------------
const STAFF_LEVELS = [
  "Admin",
  "Intern",
  "Staff L1",
  "Staff L2",
  "Senior L1/2",
  "Senior L3/Supv",
  "Manager",
  "Sr Manager",
  "Director",
  "Partner",
];

const DEFAULT_RATES = {
  US: {
    "Admin": 45,
    "Intern": 35,
    "Staff L1": 85,
    "Staff L2": 110,
    "Senior L1/2": 150,
    "Senior L3/Supv": 185,
    "Manager": 230,
    "Sr Manager": 275,
    "Director": 325,
    "Partner": 450,
  },
  Offshore: {
    "Admin": 15,
    "Intern": 10,
    "Staff L1": 30,
    "Staff L2": 45,
    "Senior L1/2": 60,
    "Senior L3/Supv": 85,
    "Manager": 120,
    "Sr Manager": 150,
    "Director": 200,
    "Partner": 275,
  },
};

const TIERS = [
  { id: "essential", label: "Essential", markup: 1.25 },
  { id: "enhanced", label: "Enhanced", markup: 1.35 },
  { id: "ultimate", label: "Ultimate", markup: 1.5 },
];

const SERVICES = [
  { id: "fed-1040", name: "Federal Tax Return" },
  { id: "state-tax", name: "State Tax Returns" },
  { id: "extensions", name: "Income Tax Extensions" },
  { id: "quarterlies", name: "Quarterly Estimated Tax Calcs" },
  { id: "k1", name: "Estimated K-1s for Investors" },
  { id: "r&d", name: "R&D Credit Calculation" },
  { id: "provision", name: "Tax Provision & Memo" },
  { id: "salt", name: "SALT Updates" },
  { id: "consult", name: "General Consulting" },
];

// Frequencies similar to screenshots (annual/quarterly/monthly)
const FREQS = ["N/A", "Annually", "Quarterly", "Monthly", "Annual/State"]; // example

// --- Helpers -------------------------------------------------------------------
const currency = (n) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

function calcServiceCostPrice(serviceRow, rates, tier) {
  // serviceRow.hoursUS/offshore: { level: number hours }
  const { hoursUS, hoursOff } = serviceRow;
  let costUS = 0;
  let costOff = 0;
  for (const lvl of STAFF_LEVELS) {
    const hUS = Number(hoursUS[lvl] || 0);
    const hOff = Number(hoursOff[lvl] || 0);
    costUS += hUS * (rates.US[lvl] || 0);
    costOff += hOff * (rates.Offshore[lvl] || 0);
  }
  const baseCost = costUS + costOff;
  const adminPct = Number(serviceRow.adminPct || 0) / 100;
  const adminCost = baseCost * adminPct;
  const totalCost = baseCost + adminCost;

  const tierDef = TIERS.find((t) => t.id === tier) || TIERS[0];
  const price = totalCost * (tierDef.markup || 1.25);
  const margin = price <= 0 ? 0 : (price - totalCost) / price;

  return { cost: totalCost, price, margin };
}

function ApprovalBadge({ margin }) {
  // Example rules → tweak to your org’s thresholds
  // < 20% → exec approval; 20–30% → director; >= 30% auto-approve
  let text = "Auto-approve";
  let color = "bg-emerald-100 text-emerald-700 border-emerald-300";
  if (margin < 0.2) {
    text = "CFO / Exec Approval";
    color = "bg-rose-100 text-rose-700 border-rose-300";
  } else if (margin < 0.3) {
    text = "Director Approval";
    color = "bg-amber-100 text-amber-700 border-amber-300";
  }
  return (
    <span className={`px-2 py-1 text-xs rounded-full border ${color}`}>{text}</span>
  );
}

// --- Main Component ------------------------------------------------------------
export default function PricingScopeWizard() {
  // Step management
  const [step, setStep] = useState(1);

  // Project info
  const [project, setProject] = useState({
    office: "National",
    projectName: "ACME Corp.",
    startDate: "",
    endDate: "",
    adminFeePct: 5,
    customerName: "",
    serviceType: "",
    industry: "",
  });

  // Service bundling grid → each service has: selectedTiers[essential|enhanced|ultimate], frequency per tier
  const [bundle, setBundle] = useState(() => {
    const base = {};
    for (const s of SERVICES) {
      base[s.id] = {
        serviceId: s.id,
        name: s.name,
        tiers: {
          essential: { selected: false, freq: "Annually" },
          enhanced: { selected: false, freq: "Annually" },
          ultimate: { selected: false, freq: "Annually" },
        },
      };
    }
    return base;
  });

  // Workforce planning per (service,tier) & per staff level for US/Offshore
  // Structure: allocations[serviceId][tier] = { hoursUS: {lvl: num}, hoursOff: {lvl: num}, adminPct }
  const [allocations, setAllocations] = useState(() => {
    const a = {};
    for (const s of SERVICES) {
      a[s.id] = { essential: mkEmptyAlloc(), enhanced: mkEmptyAlloc(), ultimate: mkEmptyAlloc() };
    }
    return a;
  });

  function mkEmptyAlloc() {
    const hoursUS = {}; const hoursOff = {};
    STAFF_LEVELS.forEach((l) => { hoursUS[l] = 0; hoursOff[l] = 0; });
    return { hoursUS, hoursOff, adminPct: project.adminFeePct };
  }

  // --- Derived totals from pricing engine -------------------------------------
  const results = useMemo(() => {
    const rows = [];
    let totalCost = 0, totalPrice = 0;

    for (const s of SERVICES) {
      const svcRow = bundle[s.id];
      for (const t of TIERS) {
        if (!svcRow.tiers[t.id].selected) continue;
        const alloc = allocations[s.id][t.id];
        const { cost, price, margin } = calcServiceCostPrice(alloc, DEFAULT_RATES, t.id);
        rows.push({ service: s.name, tier: t.label, freq: svcRow.tiers[t.id].freq, cost, price, margin });
        totalCost += cost; totalPrice += price;
      }
    }
    const grandMargin = totalPrice <= 0 ? 0 : (totalPrice - totalCost) / totalPrice;
    return { rows, totalCost, totalPrice, grandMargin };
  }, [bundle, allocations, project.adminFeePct]);

  function updateBundle(serviceId, tierId, key, value) {
    setBundle((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        tiers: {
          ...prev[serviceId].tiers,
          [tierId]: { ...prev[serviceId].tiers[tierId], [key]: value },
        },
      },
    }));
  }

  function updateHours(serviceId, tierId, where, level, value) {
    setAllocations((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [tierId]: {
          ...prev[serviceId][tierId],
          [where]: { ...prev[serviceId][tierId][where], [level]: value },
        },
      },
    }));
  }

  function updateAdminPct(serviceId, tierId, value) {
    setAllocations((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [tierId]: { ...prev[serviceId][tierId], adminPct: value },
      },
    }));
  }

  const Header = () => (
    <div className="mb-6">
      <div className="text-xs text-slate-500 mb-2 bg-slate-50 border border-slate-200 rounded-md p-2">
        MVP Development Phase: basic cost calculations; benchmark lookup & history can be added later.
      </div>
      <div className="flex items-center gap-2 text-sm">
        {[1,2,3].map((n) => (
          <div key={n} className={`flex items-center gap-2 ${n!==3?"after:content-['→'] after:mx-2":''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center border font-semibold ${step===n?"bg-amber-500 text-white border-amber-600":"bg-white text-slate-600"}`}>{n}</div>
            <span className={`${step===n?"text-amber-700":"text-slate-500"}`}>
              {n===1?"Project Inputs": n===2?"Services Selection": "Workforce & Pricing"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto text-slate-800">
      <Header />

      {step === 1 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Step 1: Project Inputs</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-xl shadow-sm">
            <LabeledInput label="Office" value={project.office} onChange={(v)=>setProject({...project, office:v})} />
            <LabeledInput label="Project Name" value={project.projectName} onChange={(v)=>setProject({...project, projectName:v})} />
            <LabeledInput type="number" label="Admin/Tech Fee %" value={project.adminFeePct} onChange={(v)=>setProject({...project, adminFeePct:Number(v)})} />
            <LabeledInput type="date" label="Start Date" value={project.startDate} onChange={(v)=>setProject({...project, startDate:v})} />
            <LabeledInput type="date" label="End Date" value={project.endDate} onChange={(v)=>setProject({...project, endDate:v})} />
            <div className="flex items-end text-xs text-slate-500">Project duration is calculated implicitly.</div>
          </div>

          <div className="border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <LabeledInput label="Customer Name" value={project.customerName} onChange={(v)=>setProject({...project, customerName:v})} />
            <LabeledInput label="Selected Benchmark" placeholder="(optional)" value={project.benchmark||""} onChange={(v)=>setProject({...project, benchmark:v})} />
            <LabeledInput label="Service Type" value={project.serviceType} onChange={(v)=>setProject({...project, serviceType:v})} />
            <LabeledInput label="Industry" value={project.industry} onChange={(v)=>setProject({...project, industry:v})} />
          </div>

          <div className="flex justify-end">
            <button className="px-4 py-2 rounded-lg bg-amber-500 text-white shadow" onClick={()=>setStep(2)}>Next: Services</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Step 2: Services Selection</h2>
          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-3 text-left w-56">Service</th>
                  {TIERS.map((t) => (
                    <th key={t.id} className="p-3 text-left">
                      <div className="font-semibold">{t.label}</div>
                      <div className="text-xs text-slate-500">Markup ×{t.markup}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SERVICES.map((s, idx) => (
                  <tr key={s.id} className={idx%2?"bg-white":"bg-slate-50/30"}>
                    <td className="p-3 font-medium">{s.name}</td>
                    {TIERS.map((t) => (
                      <td key={t.id} className="p-3">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4" checked={bundle[s.id].tiers[t.id].selected} onChange={(e)=>updateBundle(s.id, t.id, "selected", e.target.checked)} />
                          <select className="border rounded px-2 py-1" value={bundle[s.id].tiers[t.id].freq} onChange={(e)=>updateBundle(s.id, t.id, "freq", e.target.value)}>
                            {FREQS.map((f)=> (<option key={f} value={f}>{f}</option>))}
                          </select>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <button className="px-4 py-2 rounded-lg border" onClick={()=>setStep(1)}>Back</button>
            <button className="px-4 py-2 rounded-lg bg-amber-500 text-white shadow" onClick={()=>setStep(3)}>Next: Workforce & Pricing</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Step 3: Workforce Planning & Pricing</h2>

          <div className="text-sm text-slate-600">Enter US vs Offshore hours per staff level for each selected (Service, Tier). Admin fee% defaults to project-level but can be overridden per row.</div>

          {/* Selected rows */}
          <div className="space-y-6">
            {SERVICES.map((s) => (
              <div key={s.id}>
                {TIERS.filter((t)=> bundle[s.id].tiers[t.id].selected).map((t) => (
                  <div key={t.id} className="border rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold">{s.name} — <span className="text-amber-700">{t.label}</span> <span className="text-xs text-slate-500 ml-2">({bundle[s.id].tiers[t.id].freq})</span></div>
                      <div className="flex items-center gap-2 text-sm">
                        <span>Admin/Tech %</span>
                        <input type="number" className="w-20 border rounded px-2 py-1" value={allocations[s.id][t.id].adminPct} onChange={(e)=>updateAdminPct(s.id, t.id, Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <HoursGrid title="US Hours" serviceId={s.id} tierId={t.id} where="hoursUS" values={allocations[s.id][t.id].hoursUS} onChange={updateHours} />
                      <HoursGrid title="Offshore Hours" serviceId={s.id} tierId={t.id} where="hoursOff" values={allocations[s.id][t.id].hoursOff} onChange={updateHours} />
                    </div>

                    {/* Row pricing preview */}
                    <RowTotals alloc={allocations[s.id][t.id]} tierId={t.id} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Grand totals */}
          <div className="border rounded-xl p-4 bg-slate-50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-lg font-semibold">Proposal Summary</div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-lg bg-white border">Cost: <span className="font-semibold">{currency(results.totalCost)}</span></div>
                <div className="px-3 py-1 rounded-lg bg-white border">Price: <span className="font-semibold">{currency(results.totalPrice)}</span></div>
                <div className="px-3 py-1 rounded-lg bg-white border">Margin: <span className="font-semibold">{(results.grandMargin*100).toFixed(1)}%</span></div>
                <ApprovalBadge margin={results.grandMargin} />
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white">
                    <th className="p-2 text-left">Service</th>
                    <th className="p-2 text-left">Tier</th>
                    <th className="p-2 text-left">Freq</th>
                    <th className="p-2 text-right">Cost</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Margin</th>
                    <th className="p-2 text-left">Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((r, i) => (
                    <tr key={i} className={i%2?"bg-slate-50":"bg-white"}>
                      <td className="p-2">{r.service}</td>
                      <td className="p-2">{r.tier}</td>
                      <td className="p-2">{r.freq}</td>
                      <td className="p-2 text-right">{currency(r.cost)}</td>
                      <td className="p-2 text-right">{currency(r.price)}</td>
                      <td className="p-2 text-right">{(r.margin*100).toFixed(1)}%</td>
                      <td className="p-2"><ApprovalBadge margin={r.margin} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="px-4 py-2 rounded-lg border" onClick={()=>setStep(2)}>Back</button>
              <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white" onClick={()=>downloadJSON({ project, bundle, allocations, results })}>Export JSON</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// --- Reusable bits -------------------------------------------------------------
function LabeledInput({ label, value, onChange, type="text", placeholder }) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-slate-600">{label}</div>
      <input
        type={type}
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function HoursGrid({ title, serviceId, tierId, where, values, onChange }) {
  return (
    <div className="border rounded-lg">
      <div className="px-3 py-2 bg-slate-100 rounded-t-lg font-medium">{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 p-3">
        {STAFF_LEVELS.map((lvl) => (
          <label key={lvl} className="text-xs">
            <div className="text-slate-500 mb-1">{lvl}</div>
            <input type="number" className="w-full border rounded px-2 py-1" value={values[lvl]} onChange={(e)=>onChange(serviceId, tierId, where, lvl, Number(e.target.value))} />
          </label>
        ))}
      </div>
    </div>
  );
}

function RowTotals({ alloc, tierId }) {
  const { cost, price, margin } = useMemo(() => calcServiceCostPrice(alloc, DEFAULT_RATES, tierId), [alloc, tierId]);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
      <div className="px-2 py-1 rounded bg-slate-100 border">Row Cost: <span className="font-semibold">{currency(cost)}</span></div>
      <div className="px-2 py-1 rounded bg-slate-100 border">Row Price: <span className="font-semibold">{currency(price)}</span></div>
      <div className="px-2 py-1 rounded bg-slate-100 border">Row Margin: <span className="font-semibold">{(margin*100).toFixed(1)}%</span></div>
      <ApprovalBadge margin={margin} />
    </div>
  );
}

function downloadJSON(obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pricing_scope_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
