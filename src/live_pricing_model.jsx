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
    // Total recurring monthly paid by client (reps + management + data). Setup fee is one-time, not included.
    const monthlyClientBilling = monthlyBilling + monthlyManagement + monthlyData;

    // Break-even is computed from the CLIENT's perspective: the first month where cumulative won
    // revenue from the program meets or exceeds cumulative client spend (billing + fees + setup).
    let cumClientSpend = 0, cumClientWon = 0, breakEven = -1;

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
      let sdrWonDealValue = null, isrWonDealValue = null, wonDealValue = null, wonDealsCount = null;
      if (hasCycle && hasACV && hasClose) {
        if (sourceMonth >= 1 && sourceMonth <= programLengthMonths) {
          const sdrSrcSals = (ramp[srcIdx] ?? 0) * sdrFTE;
          const isrSrcSals = isrFTE > 0 ? (isrRamp[srcIdx] ?? 0) * isrFTE : 0;
          sdrWonDealValue = sdrSrcSals * salToSqlRate * avgContractValue * closeRate;
          isrWonDealValue = isrSrcSals * salToSqlRate * avgContractValue * closeRate;
          wonDealValue = sdrWonDealValue + isrWonDealValue;
          wonDealsCount = (sdrSrcSals + isrSrcSals) * salToSqlRate * closeRate;
        } else {
          sdrWonDealValue = 0;
          isrWonDealValue = 0;
          wonDealValue = 0;
          wonDealsCount = 0;
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

      cumClientSpend += revenue;
      cumClientWon += wonValueForCalc;
      if (breakEven === -1 && cumClientWon >= cumClientSpend && cumClientSpend > 0) breakEven = m;

      return {
        m, inProgram,
        salsPerRep: sdrSalsPerRep, totalSals, totalSqls, pipelineCreated, dealsWon, wonDealValue, wonDealsCount,
        // Per-role breakouts
        sdrSalsPerRep, sdrTotalSals, sdrTotalSqls, sdrPipeline, sdrDealsWon, sdrWonDealValue,
        isrSalsPerRep, isrTotalSals, isrTotalSqls, isrPipeline, isrDealsWon, isrWonDealValue,
        revenue, cumClientSpend, cumClientWon,
      };
    });

    // Program rollups (single program window — no Y2/Y3 renewal projection)
    const sumAll = (key) => monthly.reduce((a, x) => a + (x[key] ?? 0), 0);
    const totalClientSpend = sumAll("revenue");
    const totals = {
      clientSpend: totalClientSpend,
      sals: sumAll("totalSals"),
      sqls: sumAll("totalSqls"),
      deals: sumAll("dealsWon"),
      pipeline: sumAll("pipelineCreated"),
      wonRev: sumAll("wonDealValue"),
    };
    const totalWonDealValue = totals.wonRev;

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
      totals, breakEven, totalClientSpend,
      monthlyBill: monthlyBilling, monthlyClientBill: monthlyClientBilling,
      endAE, endSDR, endISR,
      totalWonDealValue,
      totalPipelineCreated: totals.pipeline,
      totalDealsWon: totals.deals,
      totalSalsSum: totals.sals,
      totalSqlsSum: totals.sqls,
      hasACV, hasClose, hasCycle,
      steadyAvgSals, steadyAvgSqls, steadyAvgPipeline, steadyAvgWon,
      steadySdrAvgSals, steadySdrAvgSqls, steadySdrAvgPipeline, steadySdrAvgWon,
      steadyIsrAvgSals, steadyIsrAvgSqls, steadyIsrAvgPipeline, steadyIsrAvgWon,
    };
  }, [aeFTE, sdrFTE, isrFTE, priceAE, priceSDR, priceISR, discountAE, discountSDR, discountISR,
    setupFee, varPct, monthlyManagement, monthlyData,
    salToSqlRate, closeRate, avgContractValue, avgSalesCycleMonths, ramp, isrRamp, programLengthMonths]);

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
  };

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
          <span style={{ fontFamily: "monospace", fontSize: 11, color: C.blue, fontWeight: 700 }}>Monthly: {fmt(calc.monthlyClientBill)}</span>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: C.green, fontWeight: 700 }}>Won: {calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.totalWonDealValue) : "—"}</span>
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
            Monthly billing: {fmt(calc.monthlyClientBill)}
          </div>

          {/* ——— ADVANCED: always available, collapsed by default ———————— */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `2px dashed ${C.border}` }}>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Advanced</div>
          </div>

          <Collapsible title="Variable Revenue" accent={C.amber} defaultOpen={false}>
            <Slider label="Variable % of ICV" value={varPct} min={0} max={0.05} step={0.005} onChange={setVarPct} format={pct} color={C.amber} />
          </Collapsible>
        </div>

        {/* —— MAIN CONTENT ————————————————————————————————————————————————— */}
        <div style={S.main}>

          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
            <KPI label="Monthly Billing" value={fmt(calc.monthlyClientBill)} sub={`${aeFTE}AE · ${sdrFTE}SDR · ${isrFTE}ISR + mgmt + data`} color={C.blue} bg={C.blueLight} border={C.blueBorder} />
            <KPI label="Total Client Investment" value={fmt(calc.totalClientSpend)} sub="Program total (billing + fees + setup)" />
            <KPI label="Total Won Revenue" value={calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.totalWonDealValue) : "—"} sub="ICV closed from program pipeline" color={C.green} />
            <KPI label="Client Break-even" value={calc.breakEven > 0 ? `Month ${calc.breakEven}` : "—"} sub="Won rev ≥ client spend" color={C.amber} />
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
                    <td key={o.m} style={{ ...S.td, color: (o.wonDealsCount ?? 0) > 0 ? C.blue : C.textFaint, fontWeight: (o.wonDealsCount ?? 0) > 0 ? 700 : 400 }}>
                      {o.wonDealsCount == null ? "—" : fmtN(o.wonDealsCount, 2)}
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
                <tr style={{ background: C.bg }}>
                  <td style={{ ...S.tdl, fontWeight: 700, color: C.blue }}>Cumulative ICV</td>
                  {(() => {
                    let cumICV = 0;
                    return calc.monthly.map((o) => {
                      cumICV += (o.wonDealValue ?? 0);
                      return (
                        <td key={o.m} style={{ ...S.td, color: cumICV > 0 ? C.blue : C.textFaint, fontWeight: 700 }}>
                          {o.wonDealValue == null ? "—" : fmt(cumICV)}
                        </td>
                      );
                    });
                  })()}
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
            {[["summary","Program Totals"],["monthly","Monthly Cashflow"]].map(([k,v]) => (
              <button key={k} style={S.tabBtn(tab === k)} onClick={() => setTab(k)}>{v}</button>
            ))}
          </div>

          {/* —— PROGRAM TOTALS TAB ——————————————————————————————————— */}
          {tab === "summary" && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={S.thl}>Metric</th>
                    <th style={{ ...S.th, color: C.blue }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Client Investment", fmt(calc.totalClientSpend)],
                    ["Won Revenue (ICV)", calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.totals.wonRev) : "—"],
                    ["Pipeline Created", calc.hasACV ? fmt(calc.totals.pipeline) : "—"],
                    ["Total Deals Won", calc.hasClose ? fmtN(calc.totals.deals, 1) : "—"],
                    ["Total SALs", fmtN(calc.totals.sals, 0)],
                    ["Total SQLs", fmtN(calc.totals.sqls, 1)],
                  ].map(([label, tot], i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                      <td style={S.tdl}>{label}</td>
                      <td style={{ ...S.td, color: C.blue, fontWeight: 700 }}>{tot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* —— MONTHLY CASHFLOW TAB ——————————————————————————————————— */}
          {tab === "monthly" && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "auto", maxHeight: 520, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={S.thl}>Month</th>
                    <th style={S.th}>Client Spend</th>
                    <th style={{ ...S.th, color: C.green }}>Won Revenue</th>
                    <th style={S.th}>Cumulative Spend</th>
                    <th style={{ ...S.th, color: C.green }}>Cumulative Won</th>
                    <th style={S.th}>Net Position</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.monthly.map((x, i) => {
                    const net = (x.cumClientWon ?? 0) - (x.cumClientSpend ?? 0);
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                        <td style={S.tdl}>
                          Mo {x.m}
                          {!x.inProgram && <Badge color={C.amber} bg={C.amberLight}>tail</Badge>}
                          {x.m === calc.breakEven && <Badge color={C.green} bg={C.greenLight}>break-even</Badge>}
                        </td>
                        <td style={S.td}>{fmt(x.revenue)}</td>
                        <td style={{ ...S.td, color: (x.wonDealValue ?? 0) > 0 ? C.green : C.textFaint, fontWeight: (x.wonDealValue ?? 0) > 0 ? 700 : 400 }}>
                          {x.wonDealValue == null ? "—" : fmt(x.wonDealValue)}
                        </td>
                        <td style={S.td}>{fmt(x.cumClientSpend)}</td>
                        <td style={{ ...S.td, color: C.green, fontWeight: 600 }}>{fmt(x.cumClientWon)}</td>
                        <td style={{ ...S.td, color: net >= 0 ? C.green : "#dc2626", fontWeight: 700 }}>{fmt(net)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
