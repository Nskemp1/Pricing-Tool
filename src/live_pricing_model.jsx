import { useState, useMemo } from "react";

const fmt = (n) => n == null || isNaN(n) || !isFinite(n) ? "—" : "$" + Math.round(n).toLocaleString("en-US");
const fmtN = (n, dp = 1) => n == null || isNaN(n) ? "—" : Number(n).toFixed(dp);
const pct = (n) => n == null || isNaN(n) || !isFinite(n) ? "—" : (n * 100).toFixed(1) + "%";
const num = (n) => isNaN(n) || !isFinite(n) ? 0 : n;

// —— shared style primitives ————————————————————————————————————————————————
const C = {
  blue: "#1d4ed8", blueLight: "#eff6ff", blueBorder: "#bfdbfe",
  green: "#15803d", greenLight: "#f0fdf4", greenBorder: "#bbf7d0",
  amber: "#b45309", amberLight: "#fffbeb", amberBorder: "#fde68a",
  purple: "#7c3aed", purpleLight: "#f5f3ff", purpleBorder: "#ddd6fe",
  teal: "#0f766e", tealLight: "#f0fdfa", tealBorder: "#99f6e4",
  slate: "#475569", border: "#e2e8f0", bg: "#f8fafc", white: "#ffffff",
  text: "#0f172a", textMid: "#334155", textLight: "#64748b", textFaint: "#94a3b8",
};

function Slider({ label, value, min, max, step = 1, onChange, format, color = C.blue }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 11, marginBottom: 4, color: C.textLight }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textFaint, fontFamily: "monospace" }}>
        <span>{format ? format(min) : min}</span><span>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, prefix = "$", suffix = "", placeholder }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <label style={{ display: "block", fontFamily: "monospace", fontSize: 10, color: C.textLight, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {prefix && <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textFaint }}>{prefix}</span>}
        <input type="number" value={value ?? ""} placeholder={placeholder} onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
          style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, color: C.text, fontFamily: "monospace", fontSize: 12, padding: "5px 8px", outline: "none", width: "100%" }} />
        {suffix && <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textFaint }}>{suffix}</span>}
      </div>
    </div>
  );
}

function KPI({ label, value, sub, color = C.text, bg = C.bg, border = C.border }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "11px 14px" }}>
      <div style={{ fontFamily: "monospace", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 800, color, letterSpacing: "-0.5px", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function ProjectionTable({ rows, S }) {
  const milestones = [
    { label: "M3", n: 3 },
    { label: "M6", n: 6 },
    { label: "Year 1", n: 12 },
    { label: "Year 2", n: 24 },
  ];
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
      <thead>
        <tr>
          <th style={{ ...S.thl, padding: "6px 8px" }}>Metric</th>
          {milestones.map((m) => (
            <th key={m.label} style={{ ...S.th, padding: "6px 8px" }}>{m.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td style={{ ...S.tdl, padding: "7px 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: C.textMid }}>{row.label}</span>
            </td>
            {milestones.map((m) => (
              <td key={m.label} style={{ ...S.td, padding: "7px 8px", fontWeight: 700, color: row.enabled ? row.color : C.textFaint }}>
                {row.enabled ? row.format(row.per * m.n) : "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SectionHead({ children }) {
  return <div style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, marginTop: 18, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>{children}</div>;
}

function Badge({ children, color = C.blue, bg }) {
  return <span style={{ fontSize: 9, fontFamily: "monospace", color, background: bg || color + "18", borderRadius: 3, padding: "1px 5px", fontWeight: 700, marginLeft: 6 }}>{children}</span>;
}

function Collapsible({ title, defaultOpen = true, accent = C.blue, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 10, border: `1px solid ${C.border}`, borderRadius: 6, background: C.white, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "8px 10px", border: "none", cursor: "pointer",
          background: open ? accent + "10" : C.bg,
          fontFamily: "monospace", fontSize: 10, color: open ? accent : C.textLight,
          textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700,
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 10, transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
      </button>
      {open && <div style={{ padding: "10px 10px 4px" }}>{children}</div>}
    </div>
  );
}

// —— MAIN COMPONENT ————————————————————————————————————————————————————————
export default function PricingModel() {
  // Team
  const [aeFTE, setAeFTE] = useState(0);
  const [sdrFTE, setSdrFTE] = useState(1);
  const [isrFTE, setIsrFTE] = useState(0);

  // Pricing
  const [priceAE, setPriceAE] = useState(13000);
  const [priceSDR, setPriceSDR] = useState(11000);
  const [priceISR, setPriceISR] = useState(9500);
  const [discountAE, setDiscountAE] = useState(0);
  const [discountSDR, setDiscountSDR] = useState(0);
  const [discountISR, setDiscountISR] = useState(0);
  const [setupFee, setSetupFee] = useState(3000);
  const [varPct, setVarPct] = useState(0.02);

  // Renewals
  const [yr1Rate, setYr1Rate] = useState(0.80);
  const [yr2Rate, setYr2Rate] = useState(0.75);

  // Costs
  const [aeBase, setAeBase] = useState(75000);
  const [aeCommPct, setAeCommPct] = useState(0.05);
  const [sdrBase, setSdrBase] = useState(50000);
  const [isrBase, setIsrBase] = useState(40000);
  const [isrCommPct, setIsrCommPct] = useState(0.04);
  const [smBase, setSmBase] = useState(120000);
  const [smBonus, setSmBonus] = useState(60000);
  const [smAEs, setSmAEs] = useState(10);
  const [fringePct, setFringePct] = useState(0.08);

  // Program-based ROI inputs (new)
  const [programLengthMonths, setProgramLengthMonths] = useState(6);
  const [monthlyManagement, setMonthlyManagement] = useState(1000);
  const [monthlyData, setMonthlyData] = useState(0);
  const [salToSqlRate, setSalToSqlRate] = useState(0.53);
  // Client inputs — defaulted to Excel ROI sheet values so sliders are live from first render.
  // Reps override these in conversation with the client.
  const [closeRate, setCloseRate] = useState(0.15);
  const [avgContractValue, setAvgContractValue] = useState(14000);
  const [avgSalesCycleMonths, setAvgSalesCycleMonths] = useState(6);
  const [ramp, setRamp] = useState([3, 6, 8, 12, 12, 12]);
  const [isrRamp, setIsrRamp] = useState([3, 6, 8, 12, 12, 12]);

  const [tab, setTab] = useState("summary");
  const [role, setRole] = useState("sdr"); // sdr | isr | ae

  // —— CALCULATIONS ————————————————————————————————————————————————————————
  const calc = useMemo(() => {
    const endAE = priceAE * (1 - discountAE / 100);
    const endSDR = priceSDR * (1 - discountSDR / 100);
    const endISR = priceISR * (1 - discountISR / 100);

    const hasACV = avgContractValue != null && avgContractValue > 0;
    const hasClose = closeRate != null && closeRate > 0;
    const hasCycle = avgSalesCycleMonths != null && avgSalesCycleMonths >= 0;
    const cycle = hasCycle ? avgSalesCycleMonths : 0;
    const totalMonths = programLengthMonths + cycle;

    const monthlyBilling = sdrFTE * endSDR + isrFTE * endISR + aeFTE * endAE;
    const fixedMonthlyCost = (sdrFTE * (sdrBase / 12)) + (isrFTE * (isrBase / 12)) + (aeFTE * (aeBase / 12));
    const smMonthlyCost = aeFTE > 0 ? ((smBase + smBonus) / 12 / smAEs) * aeFTE : 0;

    let cumGM = 0, breakEven = -1;

    // Unified monthly array — drives every calc tab
    // Splits SDR and ISR funnels so each team has its own pipeline view.
    const monthly = Array.from({ length: totalMonths }, (_, i) => {
      const m = i + 1;
      const inProgram = m <= programLengthMonths;

      // SDR funnel
      const sdrSalsPerRep = inProgram ? (ramp[m - 1] ?? 0) : 0;
      const sdrTotalSals = sdrSalsPerRep * sdrFTE;
      const sdrTotalSqls = sdrTotalSals * salToSqlRate;
      const sdrPipeline = hasACV ? sdrTotalSqls * avgContractValue : null;
      const sdrDealsWon = hasClose ? sdrTotalSqls * closeRate : null;

      // ISR funnel (independent ramp when ISR is in the program)
      const isrSalsPerRep = inProgram && isrFTE > 0 ? (isrRamp[m - 1] ?? 0) : 0;
      const isrTotalSals = isrSalsPerRep * isrFTE;
      const isrTotalSqls = isrTotalSals * salToSqlRate;
      const isrPipeline = hasACV ? isrTotalSqls * avgContractValue : null;
      const isrDealsWon = hasClose ? isrTotalSqls * closeRate : null;

      // Combined totals
      const totalSals = sdrTotalSals + isrTotalSals;
      const totalSqls = sdrTotalSqls + isrTotalSqls;
      const pipelineCreated = hasACV ? (sdrPipeline ?? 0) + (isrPipeline ?? 0) : null;
      const dealsWon = hasClose ? (sdrDealsWon ?? 0) + (isrDealsWon ?? 0) : null;

      // Won revenue lags by avgSalesCycleMonths — source from both SDR and ISR ramps
      const sourceMonth = m - cycle;
      const srcIdx = sourceMonth - 1;
      let sdrWonDealValue = null, isrWonDealValue = null, wonDealValue = null;
      if (hasCycle && hasACV && hasClose) {
        if (sourceMonth >= 1 && sourceMonth <= programLengthMonths) {
          const sdrSrcSals = (ramp[srcIdx] ?? 0) * sdrFTE;
          const isrSrcSals = isrFTE > 0 ? (isrRamp[srcIdx] ?? 0) * isrFTE : 0;
          sdrWonDealValue = sdrSrcSals * salToSqlRate * avgContractValue * closeRate;
          isrWonDealValue = isrSrcSals * salToSqlRate * avgContractValue * closeRate;
          wonDealValue = sdrWonDealValue + isrWonDealValue;
        } else {
          sdrWonDealValue = 0;
          isrWonDealValue = 0;
          wonDealValue = 0;
        }
      }
      const wonValueForCalc = wonDealValue ?? 0;

      // Revenue
      const variableRev = wonValueForCalc * varPct;
      const billingThisMonth = inProgram ? monthlyBilling : 0;
      const mgmtThisMonth = inProgram ? monthlyManagement : 0;
      const dataThisMonth = inProgram ? monthlyData : 0;
      const setupThisMonth = m === 1 ? setupFee : 0;
      const revenue = billingThisMonth + mgmtThisMonth + dataThisMonth + variableRev + setupThisMonth;

      // Costs (internal COGS — only while reps are on the program)
      const repSalaries = inProgram ? fixedMonthlyCost : 0;
      const sm = inProgram ? smMonthlyCost : 0;
      const aeComm = wonValueForCalc * aeCommPct;
      const isrComm = wonValueForCalc * isrCommPct;
      const opEx = inProgram ? (mgmtThisMonth + dataThisMonth) : 0;
      const baseCost = repSalaries + sm + aeComm + isrComm + opEx;
      const cos = baseCost * (1 + fringePct) + setupThisMonth;

      const gm = revenue - cos;
      cumGM += gm;
      if (breakEven === -1 && cumGM >= 0) breakEven = m;

      return {
        m, inProgram,
        // Legacy unified keys (kept for Expected Outcomes + Pipeline Detail tabs)
        salsPerRep: sdrSalsPerRep, totalSals, totalSqls, pipelineCreated, dealsWon, wonDealValue,
        // Per-role breakouts
        sdrSalsPerRep, sdrTotalSals, sdrTotalSqls, sdrPipeline, sdrDealsWon, sdrWonDealValue,
        isrSalsPerRep, isrTotalSals, isrTotalSqls, isrPipeline, isrDealsWon, isrWonDealValue,
        revenue, cos, gm, gmPct: revenue > 0 ? gm / revenue : 0, cumGM,
      };
    });

    // Year rollups
    const sumRange = (arr, from, to, key) => arr.slice(from, to).reduce((a, x) => a + (x[key] ?? 0), 0);
    const y1Rev = sumRange(monthly, 0, Math.min(12, totalMonths), "revenue");
    const y1Cos = sumRange(monthly, 0, Math.min(12, totalMonths), "cos");
    const y1Won = sumRange(monthly, 0, Math.min(12, totalMonths), "wonDealValue");
    const y1Sals = sumRange(monthly, 0, Math.min(12, totalMonths), "totalSals");
    const y1Sqls = sumRange(monthly, 0, Math.min(12, totalMonths), "totalSqls");
    const y1Deals = sumRange(monthly, 0, Math.min(12, totalMonths), "dealsWon");
    const y1Pipeline = sumRange(monthly, 0, Math.min(12, totalMonths), "pipelineCreated");

    // Per-year rollup renewal math (clean, not per-month)
    const y2Rev = y1Won * yr1Rate;
    const y3Rev = y2Rev * yr2Rate;
    // Year 2/3 COS approximated as Y1 COS carried forward at renewal rates (no new rep costs post-program,
    // but management of renewed accounts assumed proportional)
    const y2Cos = y1Cos * 0; // renewals have no rep-salary COGS in program window
    const y3Cos = 0;

    const y1 = { rev: y1Rev, cos: y1Cos, gm: y1Rev - y1Cos, gmPct: y1Rev > 0 ? (y1Rev - y1Cos) / y1Rev : 0, wonRev: y1Won, sals: y1Sals, sqls: y1Sqls, deals: y1Deals, pipeline: y1Pipeline };
    const y2 = { rev: y2Rev, cos: y2Cos, gm: y2Rev - y2Cos, gmPct: y2Rev > 0 ? (y2Rev - y2Cos) / y2Rev : 0, wonRev: y2Rev };
    const y3 = { rev: y3Rev, cos: y3Cos, gm: y3Rev - y3Cos, gmPct: y3Rev > 0 ? (y3Rev - y3Cos) / y3Rev : 0, wonRev: y3Rev };

    const totRev = y1.rev + y2.rev + y3.rev;
    const totGM = y1.gm + y2.gm + y3.gm;
    const totalWonDealValue = monthly.reduce((a, x) => a + (x.wonDealValue ?? 0), 0);
    const totalPipelineCreated = monthly.reduce((a, x) => a + (x.pipelineCreated ?? 0), 0);
    const totalDealsWon = monthly.reduce((a, x) => a + (x.dealsWon ?? 0), 0);
    const totalSalsSum = monthly.reduce((a, x) => a + x.totalSals, 0);
    const totalSqlsSum = monthly.reduce((a, x) => a + x.totalSqls, 0);

    // Steady-state (in-program) averages for the overview pipeline cards
    const inProgramMonthly = monthly.filter((x) => x.inProgram);
    const N = inProgramMonthly.length;
    const avgIn = (key) => (N > 0 ? inProgramMonthly.reduce((a, x) => a + (x[key] ?? 0), 0) / N : 0);
    const steadyAvgSals = avgIn("totalSals");
    const steadyAvgSqls = avgIn("totalSqls");
    const steadyAvgPipeline = avgIn("pipelineCreated");
    const steadyAvgWon = avgIn("dealsWon");
    const steadySdrAvgSals = avgIn("sdrTotalSals");
    const steadySdrAvgSqls = avgIn("sdrTotalSqls");
    const steadySdrAvgPipeline = avgIn("sdrPipeline");
    const steadySdrAvgWon = avgIn("sdrDealsWon");
    const steadyIsrAvgSals = avgIn("isrTotalSals");
    const steadyIsrAvgSqls = avgIn("isrTotalSqls");
    const steadyIsrAvgPipeline = avgIn("isrPipeline");
    const steadyIsrAvgWon = avgIn("isrDealsWon");

    return {
      monthly, totalMonths, cycle,
      y1, y2, y3, totRev, totGM, breakEven,
      monthlyBill: monthlyBilling,
      endAE, endSDR, endISR, roi: totRev > 0 ? totGM / totRev : 0,
      // outcomes (alias for Expected Outcomes tab back-compat)
      outcomes: monthly.map((x) => ({
        month: x.m, inProgram: x.inProgram,
        salsPerSdr: x.salsPerRep, totalSals: x.totalSals, totalSqls: x.totalSqls,
        pipelineCreated: x.pipelineCreated, dealsWon: x.dealsWon, wonDealValue: x.wonDealValue,
      })),
      totalWonDealValue, totalPipelineCreated, totalDealsWon, totalSalsSum, totalSqlsSum,
      hasACV, hasClose, hasCycle,
      steadyAvgSals, steadyAvgSqls, steadyAvgPipeline, steadyAvgWon,
      steadySdrAvgSals, steadySdrAvgSqls, steadySdrAvgPipeline, steadySdrAvgWon,
      steadyIsrAvgSals, steadyIsrAvgSqls, steadyIsrAvgPipeline, steadyIsrAvgWon,
    };
  }, [aeFTE, sdrFTE, isrFTE, priceAE, priceSDR, priceISR, discountAE, discountSDR, discountISR,
    setupFee, varPct, monthlyManagement, monthlyData,
    salToSqlRate, closeRate, avgContractValue, avgSalesCycleMonths, ramp, isrRamp, programLengthMonths,
    yr1Rate, yr2Rate, aeBase, aeCommPct, sdrBase, isrBase, isrCommPct, smBase, smBonus, smAEs, fringePct]);

  // —— STYLES ————————————————————————————————————————————————————————————————
  const S = {
    root: { background: "#f1f5f9", minHeight: "100vh", color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" },
    topbar: { background: C.white, borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
    body: { display: "flex", flex: 1, overflow: "hidden" },
    sidebar: { width: 268, background: C.white, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: "14px 13px", flexShrink: 0 },
    main: { flex: 1, overflowY: "auto", padding: 18 },
    secBtn: (a) => ({ display: "block", width: "100%", textAlign: "left", background: a ? C.blueLight : "transparent", border: a ? `1px solid ${C.blueBorder}` : "1px solid transparent", borderRadius: 6, color: a ? C.blue : C.textLight, fontFamily: "monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", padding: "7px 10px", cursor: "pointer", marginBottom: 3 }),
    roleTab: (active, color) => ({ flex: 1, padding: "7px 10px", border: active ? `1px solid ${color}` : `1px solid ${C.border}`, borderRadius: 999, background: active ? color : C.white, color: active ? C.white : C.textLight, fontFamily: "monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.15s" }),
    tabBtn: (a) => ({ padding: "6px 13px", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", background: a ? "#1e40af" : "transparent", color: a ? C.white : C.textLight }),
    th: { padding: "7px 10px", textAlign: "right", color: C.textLight, borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, fontFamily: "monospace", background: C.bg },
    thl: { padding: "7px 10px", textAlign: "left", color: C.textLight, borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, fontFamily: "monospace", background: C.bg },
    td: { padding: "6px 10px", textAlign: "right", color: C.textMid, borderBottom: `1px solid #f1f5f9`, fontSize: 12, fontFamily: "monospace" },
    tdl: { padding: "6px 10px", textAlign: "left", color: C.slate, borderBottom: `1px solid #f1f5f9`, fontSize: 12, fontFamily: "monospace" },
    tdG: { padding: "6px 10px", textAlign: "right", color: C.green, borderBottom: `1px solid #f1f5f9`, fontSize: 12, fontFamily: "monospace", fontWeight: 700 },
    tdR: { padding: "6px 10px", textAlign: "right", color: "#dc2626", borderBottom: `1px solid #f1f5f9`, fontSize: 12, fontFamily: "monospace", fontWeight: 700 },
  };
  const gmTd = (v) => v >= 0 ? S.tdG : S.tdR;

  const card = (bg, border) => ({ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 10 });

  return (
    <div style={S.root}>
      <style>{`
        input[type=range]::-webkit-slider-thumb{height:13px;width:13px;border-radius:50%;cursor:pointer;-webkit-appearance:none}
        input[type=range]::-webkit-slider-runnable-track{height:3px;border-radius:2px;background:#cbd5e1}
        * { box-sizing: border-box; }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#f1f5f9}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
      `}</style>

      {/* —— TOP BAR ———————————————————————————————————————————————————— */}
      <div style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.blue }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>AE / SDR / ISR Pricing Model</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 20, alignItems: "center" }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: C.blue, fontWeight: 700 }}>Monthly: {fmt(calc.monthlyBill)}</span>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: C.green, fontWeight: 700 }}>3yr GM: {fmt(calc.totGM)}</span>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: C.textLight }}>Break-even: {calc.breakEven > 0 ? `Mo ${calc.breakEven}` : "—"}</span>
          <div style={{ display: "flex", gap: 5 }}>
            {aeFTE > 0 && <Badge color={C.blue}>{aeFTE} AE</Badge>}
            {sdrFTE > 0 && <Badge color={C.teal}>{sdrFTE} SDR</Badge>}
            {isrFTE > 0 && <Badge color={C.purple}>{isrFTE} ISR</Badge>}
          </div>
        </div>
      </div>

      <div style={S.body}>
        {/* —— SIDEBAR ———————————————————————————————————————————————————— */}
        <div style={S.sidebar}>
          <div style={{ fontSize: 10, fontFamily: "monospace", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Configuration</div>

          {/* Role tab row */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button style={S.roleTab(role === "sdr", C.teal)} onClick={() => setRole("sdr")}>SDR</button>
            <button style={S.roleTab(role === "isr", C.purple)} onClick={() => setRole("isr")}>ISR</button>
            <button style={S.roleTab(role === "ae", C.blue)} onClick={() => setRole("ae")}>AE</button>
          </div>

          {/* Role legend */}
          <div style={{ fontSize: 10, color: C.textFaint, fontFamily: "monospace", marginBottom: 10, lineHeight: 1.6 }}>
            <b style={{ color: C.teal }}>SDR</b> — outbound prospecting, books pipeline for AEs<br/>
            <b style={{ color: C.purple }}>ISR</b> — inside sales rep, own outbound + closes<br/>
            <b style={{ color: C.blue }}>AE</b> — account exec, closes SDR-sourced pipeline
          </div>

          {/* ——— SDR TAB ——————————————————————————————————————— */}
          {role === "sdr" && <>
            <Collapsible title="Program Setup" accent={C.teal} defaultOpen={true}>
              <Slider label="SDR Headcount" value={sdrFTE} min={0} max={20} onChange={setSdrFTE} color={C.teal} />
              <Slider label="SAL to SQL Rate" value={salToSqlRate} min={0.1} max={1} step={0.01} onChange={setSalToSqlRate} format={pct} color={C.teal} />
              <Slider label="Program Length (Months)" value={programLengthMonths} min={1} max={24} onChange={setProgramLengthMonths} color={C.amber} />
            </Collapsible>

            <Collapsible title="SDR Costs" accent={C.teal} defaultOpen={true}>
              <Field label="Price per SDR / month" value={priceSDR} onChange={setPriceSDR} />
              <Field label="SDR Discount" value={discountSDR} onChange={setDiscountSDR} prefix="" suffix="%" />
              <div style={{ fontFamily: "monospace", fontSize: 11, color: C.teal, marginBottom: 10, background: C.tealLight, borderRadius: 5, padding: "4px 8px" }}>End price: {fmt(calc.endSDR)}/mo</div>
              <Field label="One-Time Program & Tech Setup" value={setupFee} onChange={setSetupFee} />
              <Field label="Monthly Management" value={monthlyManagement} onChange={setMonthlyManagement} />
              <Field label="Monthly Data" value={monthlyData} onChange={setMonthlyData} />
              <Field label="SDR Annual Base Salary" value={sdrBase} onChange={setSdrBase} />
            </Collapsible>

            <Collapsible title="Client Inputs" accent={C.teal} defaultOpen={true}>
              <Field label="Close Rate" value={closeRate == null ? null : closeRate * 100} onChange={(v) => setCloseRate(v == null ? null : v / 100)} prefix="" suffix="%" placeholder="From client convo" />
              <Field label="Avg Contract Value" value={avgContractValue} onChange={setAvgContractValue} placeholder="From client convo" />
              <Field label="Avg Sales Cycle (Months)" value={avgSalesCycleMonths} onChange={setAvgSalesCycleMonths} prefix="" placeholder="From client convo" />
            </Collapsible>
          </>}

          {/* ——— ISR TAB ——————————————————————————————————————— */}
          {role === "isr" && (isrFTE === 0 ? (
            <div style={{ background: C.purpleLight, border: `1px dashed ${C.purpleBorder}`, borderRadius: 8, padding: "24px 16px", textAlign: "center", marginTop: 8 }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: C.purple, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>ISR not in this program</div>
              <div style={{ fontSize: 11, color: C.textLight, marginBottom: 14, lineHeight: 1.5 }}>Add an ISR to enable inside-sales configuration for this campaign.</div>
              <button
                onClick={() => setIsrFTE(1)}
                style={{ padding: "8px 18px", border: "none", borderRadius: 6, background: C.purple, color: C.white, fontFamily: "monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer" }}
              >
                + Add ISR
              </button>
            </div>
          ) : (
            <>
              <Collapsible title="Program Setup" accent={C.purple} defaultOpen={true}>
                <Slider label="ISR Headcount" value={isrFTE} min={0} max={20} onChange={setIsrFTE} color={C.purple} />
                <Slider label="SAL to SQL Rate" value={salToSqlRate} min={0.1} max={1} step={0.01} onChange={setSalToSqlRate} format={pct} color={C.purple} />
                <Slider label="Program Length (Months)" value={programLengthMonths} min={1} max={24} onChange={setProgramLengthMonths} color={C.amber} />
              </Collapsible>

              <Collapsible title="ISR Costs" accent={C.purple} defaultOpen={true}>
                <Field label="Price per ISR / month" value={priceISR} onChange={setPriceISR} />
                <Field label="ISR Discount" value={discountISR} onChange={setDiscountISR} prefix="" suffix="%" />
                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.purple, marginBottom: 10, background: C.purpleLight, borderRadius: 5, padding: "4px 8px" }}>End price: {fmt(calc.endISR)}/mo</div>
                <Field label="ISR Annual Base Salary" value={isrBase} onChange={setIsrBase} />
                <Slider label="ISR ICV Commission %" value={isrCommPct} min={0.01} max={0.12} step={0.005} onChange={setIsrCommPct} format={pct} color={C.purple} />
              </Collapsible>

              <Collapsible title="Client Inputs" accent={C.purple} defaultOpen={true}>
                <Field label="Close Rate" value={closeRate == null ? null : closeRate * 100} onChange={(v) => setCloseRate(v == null ? null : v / 100)} prefix="" suffix="%" placeholder="From client convo" />
                <Field label="Avg Contract Value" value={avgContractValue} onChange={setAvgContractValue} placeholder="From client convo" />
                <Field label="Avg Sales Cycle (Months)" value={avgSalesCycleMonths} onChange={setAvgSalesCycleMonths} prefix="" placeholder="From client convo" />
              </Collapsible>

              <button
                onClick={() => setIsrFTE(0)}
                style={{ width: "100%", padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, color: C.textLight, fontFamily: "monospace", fontSize: 10, cursor: "pointer", marginTop: 6 }}
              >
                × Remove ISR from program
              </button>
            </>
          ))}

          {/* ——— AE TAB ———————————————————————————————————————— */}
          {role === "ae" && (aeFTE === 0 ? (
            <div style={{ background: C.blueLight, border: `1px dashed ${C.blueBorder}`, borderRadius: 8, padding: "24px 16px", textAlign: "center", marginTop: 8 }}>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: C.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>AE not in this program</div>
              <div style={{ fontSize: 11, color: C.textLight, marginBottom: 14, lineHeight: 1.5 }}>Add an AE to close SDR-sourced pipeline in this campaign.</div>
              <button
                onClick={() => setAeFTE(1)}
                style={{ padding: "8px 18px", border: "none", borderRadius: 6, background: C.blue, color: C.white, fontFamily: "monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer" }}
              >
                + Add AE
              </button>
            </div>
          ) : (
            <>
              <Collapsible title="Program Setup" accent={C.blue} defaultOpen={true}>
                <Slider label="AE Headcount" value={aeFTE} min={0} max={20} onChange={setAeFTE} color={C.blue} />
                <Slider label="SAL to SQL Rate" value={salToSqlRate} min={0.1} max={1} step={0.01} onChange={setSalToSqlRate} format={pct} color={C.blue} />
                <Slider label="Program Length (Months)" value={programLengthMonths} min={1} max={24} onChange={setProgramLengthMonths} color={C.amber} />
              </Collapsible>

              <Collapsible title="AE Costs" accent={C.blue} defaultOpen={true}>
                <Field label="Price per AE / month" value={priceAE} onChange={setPriceAE} />
                <Field label="AE Discount" value={discountAE} onChange={setDiscountAE} prefix="" suffix="%" />
                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.blue, marginBottom: 10, background: C.blueLight, borderRadius: 5, padding: "4px 8px" }}>End price: {fmt(calc.endAE)}/mo</div>
                <Field label="AE Annual Base Salary" value={aeBase} onChange={setAeBase} />
                <Slider label="AE ICV Commission %" value={aeCommPct} min={0.02} max={0.15} step={0.005} onChange={setAeCommPct} format={pct} color={C.blue} />
              </Collapsible>

              <Collapsible title="Client Inputs" accent={C.blue} defaultOpen={true}>
                <Field label="Close Rate" value={closeRate == null ? null : closeRate * 100} onChange={(v) => setCloseRate(v == null ? null : v / 100)} prefix="" suffix="%" placeholder="From client convo" />
                <Field label="Avg Contract Value" value={avgContractValue} onChange={setAvgContractValue} placeholder="From client convo" />
                <Field label="Avg Sales Cycle (Months)" value={avgSalesCycleMonths} onChange={setAvgSalesCycleMonths} prefix="" placeholder="From client convo" />
              </Collapsible>

              <button
                onClick={() => setAeFTE(0)}
                style={{ width: "100%", padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, color: C.textLight, fontFamily: "monospace", fontSize: 10, cursor: "pointer", marginTop: 6 }}
              >
                × Remove AE from program
              </button>
            </>
          ))}

          {/* Monthly billing summary (always visible) */}
          <div style={{ ...card(C.blueLight, C.blueBorder), fontSize: 11, fontFamily: "monospace", color: C.blue, marginTop: 10 }}>
            Monthly billing: {fmt(calc.monthlyBill)}
          </div>

          {/* ——— ADVANCED: always available, collapsed by default ———————— */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `2px dashed ${C.border}` }}>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Advanced</div>
          </div>

          <Collapsible title="Variable Revenue" accent={C.amber} defaultOpen={false}>
            <Slider label="Variable % of ICV" value={varPct} min={0} max={0.05} step={0.005} onChange={setVarPct} format={pct} color={C.amber} />
          </Collapsible>

          <Collapsible title="Renewals" accent={C.green} defaultOpen={false}>
            <Slider label="Yr 1 Renewal Rate" value={yr1Rate} min={0.4} max={1} step={0.01} onChange={setYr1Rate} format={pct} color={C.green} />
            <Slider label="Yr 2 Renewal Rate" value={yr2Rate} min={0.4} max={1} step={0.01} onChange={setYr2Rate} format={pct} color={C.green} />
          </Collapsible>

          <Collapsible title="Sales Management" accent={C.slate} defaultOpen={false}>
            <Field label="SM Base (annual)" value={smBase} onChange={setSmBase} />
            <Field label="SM Bonus (annual)" value={smBonus} onChange={setSmBonus} />
            <Field label="AEs per Sales Manager" value={smAEs} onChange={setSmAEs} prefix="" />
          </Collapsible>

          <Collapsible title="Overhead" accent={C.slate} defaultOpen={false}>
            <Slider label="Fringe / Overhead %" value={fringePct} min={0.04} max={0.25} step={0.01} onChange={setFringePct} format={pct} color={C.slate} />
          </Collapsible>
        </div>

        {/* —— MAIN CONTENT ————————————————————————————————————————————————— */}
        <div style={S.main}>

          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
            <KPI label="Monthly Billing" value={fmt(calc.monthlyBill)} sub={`${aeFTE}AE · ${sdrFTE}SDR · ${isrFTE}ISR`} color={C.blue} bg={C.blueLight} border={C.blueBorder} />
            <KPI label="3-Year Revenue" value={fmt(calc.totRev)} sub="Gross billings" />
            <KPI label="3-Year Gross Margin" value={fmt(calc.totGM)} sub={pct(calc.totGM / (calc.totRev || 1))} color={C.green} />
            <KPI label="Break-even Month" value={calc.breakEven > 0 ? `Month ${calc.breakEven}` : "—"} sub="Cumulative GM >= 0" color={C.amber} />
            <KPI label="Campaign ROI" value={pct(calc.roi)} sub="3yr GM / 3yr Revenue" color={C.purple} bg={C.purpleLight} border={C.purpleBorder} />
          </div>

          {/* FUNNEL OVERVIEW CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: isrFTE > 0 ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 16 }}>

            {/* SDR Funnel */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 6, height: 20, background: C.teal, borderRadius: 3 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>SDR Pipeline</span>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint }}>cumulative if engagement continues</span>
              </div>
              <ProjectionTable
                rows={[
                  { label: "Total SALs", per: calc.steadySdrAvgSals, color: C.teal, format: (v) => fmtN(v, 0), enabled: true },
                  { label: "Total SQLs", per: calc.steadySdrAvgSqls, color: "#0d9488", format: (v) => fmtN(v, 0), enabled: true },
                  { label: "Pipeline $", per: calc.steadySdrAvgPipeline, color: C.amber, format: (v) => fmt(v), enabled: calc.hasACV },
                  { label: "Deals Won", per: calc.steadySdrAvgWon, color: C.blue, format: (v) => fmtN(v, 1), enabled: calc.hasClose },
                ]}
                S={S}
              />
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>SDR Won Revenue (program)</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{(calc.hasACV && calc.hasClose && calc.hasCycle) ? fmt(calc.monthly.reduce((a, x) => a + (x.sdrWonDealValue ?? 0), 0)) : "—"}</span>
              </div>
            </div>

            {/* ISR Pipeline card — full funnel when ISR is in the program */}
            {isrFTE > 0 && (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 6, height: 20, background: C.purple, borderRadius: 3 }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>ISR Pipeline</span>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint }}>cumulative if engagement continues</span>
                </div>
                <ProjectionTable
                  rows={[
                    { label: "Total SALs", per: calc.steadyIsrAvgSals, color: C.purple, format: (v) => fmtN(v, 0), enabled: true },
                    { label: "Total SQLs", per: calc.steadyIsrAvgSqls, color: "#7c3aed", format: (v) => fmtN(v, 0), enabled: true },
                    { label: "Pipeline $", per: calc.steadyIsrAvgPipeline, color: C.amber, format: (v) => fmt(v), enabled: calc.hasACV },
                    { label: "Deals Won", per: calc.steadyIsrAvgWon, color: C.purple, format: (v) => fmtN(v, 1), enabled: calc.hasClose },
                  ]}
                  S={S}
                />
                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>ISR Won Revenue (program)</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{(calc.hasACV && calc.hasClose && calc.hasCycle) ? fmt(calc.monthly.reduce((a, x) => a + (x.isrWonDealValue ?? 0), 0)) : "—"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Expected Outcomes — inline table with editable ramp rows */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: 14 }}>
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, fontFamily: "monospace", fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.08em", background: C.bg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Expected Outcomes — Monthly Projection</span>
              <span style={{ color: C.textFaint }}>
                {sdrFTE} SDR{isrFTE > 0 ? ` · ${isrFTE} ISR` : ""} · {programLengthMonths}mo program{calc.hasCycle ? ` + ${avgSalesCycleMonths}mo cycle` : ""}
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...S.thl, minWidth: 200 }}>Metric</th>
                  {calc.monthly.map((o) => (
                    <th key={o.m} style={{ ...S.th, color: o.inProgram ? C.text : C.textFaint }}>
                      M{o.m}
                      {!o.inProgram && <Badge color={C.amber} bg={C.amberLight}>tail</Badge>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Editable SDR ramp input row */}
                <tr style={{ background: C.tealLight }}>
                  <td style={{ ...S.tdl, fontWeight: 700, color: C.teal }}>SALs per SDR (input)</td>
                  {calc.monthly.map((o, i) => (
                    <td key={o.m} style={{ ...S.td, padding: "4px 6px" }}>
                      {o.inProgram ? (
                        <input
                          type="number"
                          min={0}
                          value={ramp[i] ?? 0}
                          onChange={(e) => {
                            const nv = e.target.value === "" ? 0 : Number(e.target.value);
                            setRamp((prev) => {
                              const next = Array.from({ length: programLengthMonths }, (_, j) => prev[j] ?? 0);
                              next[i] = nv;
                              return next;
                            });
                          }}
                          style={{ width: 60, textAlign: "right", fontFamily: "monospace", fontSize: 12, padding: "3px 5px", border: `1px solid ${C.tealBorder}`, borderRadius: 4, background: C.white, color: C.text }}
                        />
                      ) : (
                        <span style={{ color: C.textFaint }}>—</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Editable ISR ramp input row (only when ISR is in program) */}
                {isrFTE > 0 && (
                  <tr style={{ background: C.purpleLight }}>
                    <td style={{ ...S.tdl, fontWeight: 700, color: C.purple }}>SALs per ISR (input)</td>
                    {calc.monthly.map((o, i) => (
                      <td key={o.m} style={{ ...S.td, padding: "4px 6px" }}>
                        {o.inProgram ? (
                          <input
                            type="number"
                            min={0}
                            value={isrRamp[i] ?? 0}
                            onChange={(e) => {
                              const nv = e.target.value === "" ? 0 : Number(e.target.value);
                              setIsrRamp((prev) => {
                                const next = Array.from({ length: programLengthMonths }, (_, j) => prev[j] ?? 0);
                                next[i] = nv;
                                return next;
                              });
                            }}
                            style={{ width: 60, textAlign: "right", fontFamily: "monospace", fontSize: 12, padding: "3px 5px", border: `1px solid ${C.purpleBorder}`, borderRadius: 4, background: C.white, color: C.text }}
                          />
                        ) : (
                          <span style={{ color: C.textFaint }}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )}

                <tr>
                  <td style={S.tdl}>Total SALs</td>
                  {calc.monthly.map((o) => (
                    <td key={o.m} style={S.td}>{o.inProgram ? fmtN(o.totalSals, 1) : "—"}</td>
                  ))}
                </tr>
                <tr style={{ background: C.bg }}>
                  <td style={S.tdl}>Total SQLs</td>
                  {calc.monthly.map((o) => (
                    <td key={o.m} style={S.td}>{o.inProgram ? fmtN(o.totalSqls, 2) : "—"}</td>
                  ))}
                </tr>
                <tr>
                  <td style={S.tdl}>Total Pipeline Created</td>
                  {calc.monthly.map((o) => (
                    <td key={o.m} style={{ ...S.td, color: o.inProgram ? C.teal : C.textFaint }}>
                      {o.inProgram ? (o.pipelineCreated == null ? "—" : fmt(o.pipelineCreated)) : "—"}
                    </td>
                  ))}
                </tr>
                <tr style={{ background: C.bg }}>
                  <td style={S.tdl}>Total Deals Won</td>
                  {calc.monthly.map((o) => (
                    <td key={o.m} style={S.td}>
                      {o.inProgram ? (o.dealsWon == null ? "—" : fmtN(o.dealsWon, 2)) : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ ...S.tdl, fontWeight: 700, color: C.text }}>Won Deal Value (ICV)</td>
                  {calc.monthly.map((o) => (
                    <td key={o.m} style={{ ...S.td, color: (o.wonDealValue ?? 0) > 0 ? C.green : C.textFaint, fontWeight: (o.wonDealValue ?? 0) > 0 ? 700 : 400 }}>
                      {o.wonDealValue == null ? "—" : fmt(o.wonDealValue)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 24, flexWrap: "wrap", background: C.bg, fontFamily: "monospace", fontSize: 12 }}>
              <div>
                <span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" }}>Total Pipeline</span>{" "}
                <span style={{ color: C.teal, fontWeight: 700 }}>{calc.hasACV ? fmt(calc.totalPipelineCreated) : "—"}</span>
              </div>
              <div>
                <span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" }}>Total Deals Won</span>{" "}
                <span style={{ color: C.blue, fontWeight: 700 }}>{calc.hasClose ? fmtN(calc.totalDealsWon, 1) : "—"}</span>
              </div>
              <div>
                <span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" }}>Total Won Revenue</span>{" "}
                <span style={{ color: C.green, fontWeight: 700 }}>{calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.totalWonDealValue) : "—"}</span>
              </div>
            </div>
            {(!calc.hasACV || !calc.hasClose || !calc.hasCycle) && (
              <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, background: C.amberLight, color: C.amber, fontFamily: "monospace", fontSize: 11 }}>
                Enter {[!calc.hasClose && "Close Rate", !calc.hasACV && "Avg Contract Value", !calc.hasCycle && "Avg Sales Cycle"].filter(Boolean).join(", ")} in the sidebar Client Inputs section to complete the projection.
              </div>
            )}
          </div>

          {/* Pricing strip */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            {sdrFTE > 0 && <>
              <div><span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>SDR </span><span style={{ fontSize: 15, fontWeight: 800, color: C.teal }}>{fmt(calc.endSDR)}/mo</span></div>
              <div style={{ color: C.border }}>|</div>
              <div><span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>Avg Pipeline/mo </span><span style={{ fontSize: 15, fontWeight: 800, color: C.teal }}>{calc.hasACV ? fmt(calc.steadyAvgPipeline) : "—"}</span></div>
            </>}
            {isrFTE > 0 && <>
              <div style={{ color: C.border }}>|</div>
              <div><span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>ISR </span><span style={{ fontSize: 15, fontWeight: 800, color: C.purple }}>{fmt(calc.endISR)}/mo</span></div>
            </>}
            {aeFTE > 0 && <>
              <div style={{ color: C.border }}>|</div>
              <div><span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>AE </span><span style={{ fontSize: 15, fontWeight: 800, color: C.blue }}>{fmt(calc.endAE)}/mo</span></div>
            </>}
            <div style={{ color: C.border }}>|</div>
            <div><span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>Variable % </span><span style={{ fontSize: 15, fontWeight: 800, color: C.amber }}>{pct(varPct)}</span></div>
          </div>

          {/* Tabs */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: 4, display: "inline-flex", gap: 3, marginBottom: 12 }}>
            {[["summary","Year Summary"],["monthly","Monthly P&L"],["pipeline","Pipeline Detail"],["icv","ICV Waterfall"]].map(([k,v]) => (
              <button key={k} style={S.tabBtn(tab === k)} onClick={() => setTab(k)}>{v}</button>
            ))}
          </div>

          {/* —— SUMMARY TAB ——————————————————————————————————————————— */}
          {tab === "summary" && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={S.thl}>Metric</th>
                    <th style={S.th}>Year 1</th>
                    <th style={S.th}>Year 2</th>
                    <th style={S.th}>Year 3</th>
                    <th style={{ ...S.th, color: C.blue }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Revenue", fmt(calc.y1.rev), fmt(calc.y2.rev), fmt(calc.y3.rev), fmt(calc.totRev), false],
                    ["Cost of Sales", fmt(calc.y1.cos), fmt(calc.y2.cos), fmt(calc.y3.cos), fmt(calc.y1.cos+calc.y2.cos+calc.y3.cos), false],
                    ["Gross Margin $", fmt(calc.y1.gm), fmt(calc.y2.gm), fmt(calc.y3.gm), fmt(calc.totGM), true],
                    ["Gross Margin %", pct(calc.y1.gmPct), pct(calc.y2.gmPct), pct(calc.y3.gmPct), pct(calc.totGM/(calc.totRev||1)), true],
                    ["Won Revenue (ICV)", calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.y1.wonRev) : "—", calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.y2.wonRev) : "—", calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.y3.wonRev) : "—", calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.y1.wonRev + calc.y2.wonRev + calc.y3.wonRev) : "—", false],
                    ["Total SALs", fmtN(calc.y1.sals, 0), "—", "—", fmtN(calc.y1.sals, 0), false],
                    ["Total SQLs", fmtN(calc.y1.sqls, 1), "—", "—", fmtN(calc.y1.sqls, 1), false],
                    ["Total Deals Won", calc.hasClose ? fmtN(calc.y1.deals, 1) : "—", "—", "—", calc.hasClose ? fmtN(calc.y1.deals, 1) : "—", false],
                    ["Pipeline Created", calc.hasACV ? fmt(calc.y1.pipeline) : "—", "—", "—", calc.hasACV ? fmt(calc.y1.pipeline) : "—", false],
                  ].map(([label, v1, v2, v3, tot, isGM], i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                      <td style={S.tdl}>{label}</td>
                      <td style={isGM ? gmTd(calc.y1.gm) : S.td}>{v1}</td>
                      <td style={isGM ? gmTd(calc.y2.gm) : S.td}>{v2}</td>
                      <td style={isGM ? gmTd(calc.y3.gm) : S.td}>{v3}</td>
                      <td style={isGM ? gmTd(calc.totGM) : { ...S.td, color: C.blue, fontWeight: 700 }}>{tot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* —— MONTHLY TAB ——————————————————————————————————————————— */}
          {tab === "monthly" && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "auto", maxHeight: 520, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={S.thl}>Month</th>
                    <th style={S.th}>Revenue</th>
                    <th style={S.th}>COS</th>
                    <th style={S.th}>GM $</th>
                    <th style={S.th}>GM %</th>
                    <th style={S.th}>Cum GM</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.monthly.map((x, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                      <td style={S.tdl}>
                        Mo {x.m}
                        {x.m === 1 && <Badge color={C.blue}>YR1</Badge>}
                        {!x.inProgram && <Badge color={C.amber} bg={C.amberLight}>tail</Badge>}
                        {x.m === calc.breakEven && <Badge color={C.green} bg={C.greenLight}>break-even</Badge>}
                      </td>
                      <td style={S.td}>{fmt(x.revenue)}</td>
                      <td style={S.td}>{fmt(x.cos)}</td>
                      <td style={gmTd(x.gm)}>{fmt(x.gm)}</td>
                      <td style={gmTd(x.gm)}>{pct(x.gmPct)}</td>
                      <td style={gmTd(x.cumGM)}>{fmt(x.cumGM)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* —— PIPELINE TAB ——————————————————————————————————————————— */}
          {tab === "pipeline" && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "auto", maxHeight: 520, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={S.thl}>Month</th>
                    <th style={S.th}>Total SALs</th>
                    <th style={S.th}>Total SQLs</th>
                    <th style={{ ...S.th, color: C.teal }}>Pipeline Created</th>
                    <th style={S.th}>Deals Won</th>
                    <th style={{ ...S.th, color: C.green }}>Won Deal Value (ICV)</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.monthly.map((x, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                      <td style={S.tdl}>Mo {x.m}{!x.inProgram && <Badge color={C.amber} bg={C.amberLight}>tail</Badge>}</td>
                      <td style={S.td}>{x.inProgram ? fmtN(x.totalSals, 1) : "—"}</td>
                      <td style={S.td}>{x.inProgram ? fmtN(x.totalSqls, 2) : "—"}</td>
                      <td style={{ ...S.td, color: C.teal, fontWeight: 600 }}>{x.inProgram ? (x.pipelineCreated == null ? "—" : fmt(x.pipelineCreated)) : "—"}</td>
                      <td style={S.td}>{x.inProgram ? (x.dealsWon == null ? "—" : fmtN(x.dealsWon, 2)) : "—"}</td>
                      <td style={{ ...S.td, color: (x.wonDealValue ?? 0) > 0 ? C.green : C.textFaint, fontWeight: (x.wonDealValue ?? 0) > 0 ? 700 : 400 }}>
                        {x.wonDealValue == null ? "—" : fmt(x.wonDealValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, background: C.bg, fontFamily: "monospace", fontSize: 12, display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div><span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10 }}>Total SALs </span><span style={{ fontWeight: 700 }}>{fmtN(calc.totalSalsSum, 0)}</span></div>
                <div><span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10 }}>Total SQLs </span><span style={{ fontWeight: 700 }}>{fmtN(calc.totalSqlsSum, 1)}</span></div>
                <div><span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10 }}>Total Pipeline </span><span style={{ color: C.teal, fontWeight: 700 }}>{calc.hasACV ? fmt(calc.totalPipelineCreated) : "—"}</span></div>
                <div><span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10 }}>Total Deals Won </span><span style={{ fontWeight: 700 }}>{calc.hasClose ? fmtN(calc.totalDealsWon, 1) : "—"}</span></div>
                <div><span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10 }}>Total Won Revenue </span><span style={{ color: C.green, fontWeight: 700 }}>{(calc.hasACV && calc.hasClose && calc.hasCycle) ? fmt(calc.totalWonDealValue) : "—"}</span></div>
              </div>
            </div>
          )}

          {/* —— ICV WATERFALL TAB ——————————————————————————————————————— */}
          {tab === "icv" && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "auto", maxHeight: 520, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={S.thl}>Month</th>
                    <th style={S.th}>Deals Won</th>
                    <th style={{ ...S.th, color: C.green }}>ICV Closed</th>
                    <th style={S.th}>Cumulative ICV</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let cumICV = 0;
                    return calc.monthly.map((x, i) => {
                      cumICV += (x.wonDealValue ?? 0);
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                          <td style={S.tdl}>Mo {x.m}{!x.inProgram && <Badge color={C.amber} bg={C.amberLight}>tail</Badge>}</td>
                          <td style={S.td}>{x.inProgram ? (x.dealsWon == null ? "—" : fmtN(x.dealsWon, 2)) : "—"}</td>
                          <td style={{ ...S.td, color: (x.wonDealValue ?? 0) > 0 ? C.green : C.textFaint, fontWeight: (x.wonDealValue ?? 0) > 0 ? 700 : 400 }}>
                            {x.wonDealValue == null ? "—" : fmt(x.wonDealValue)}
                          </td>
                          <td style={{ ...S.td, color: C.blue, fontWeight: 700 }}>{fmt(cumICV)}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, background: C.bg, fontFamily: "monospace", fontSize: 12, display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div><span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10 }}>Year 1 ICV </span><span style={{ color: C.green, fontWeight: 700 }}>{calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.y1.wonRev) : "—"}</span></div>
                <div><span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10 }}>Year 2 (renewal) </span><span style={{ color: C.green, fontWeight: 700 }}>{calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.y2.wonRev) : "—"}</span></div>
                <div><span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10 }}>Year 3 (renewal) </span><span style={{ color: C.green, fontWeight: 700 }}>{calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.y3.wonRev) : "—"}</span></div>
                <div><span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10 }}>3-Year Total </span><span style={{ color: C.blue, fontWeight: 700 }}>{calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.y1.wonRev + calc.y2.wonRev + calc.y3.wonRev) : "—"}</span></div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
