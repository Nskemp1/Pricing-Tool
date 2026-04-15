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

function Field({ label, value, onChange, prefix = "$", suffix = "" }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <label style={{ display: "block", fontFamily: "monospace", fontSize: 10, color: C.textLight, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {prefix && <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textFaint }}>{prefix}</span>}
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
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

function FunnelRow({ label, value, sub, color, pctVal }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: C.textMid, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: C.textFaint, fontFamily: "monospace" }}>{sub}</div>}
      </div>
      {pctVal !== undefined && <div style={{ fontFamily: "monospace", fontSize: 11, color: C.textFaint }}>{pct(pctVal)}</div>}
      <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color, minWidth: 50, textAlign: "right" }}>{value}</div>
    </div>
  );
}

function SectionHead({ children }) {
  return <div style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, marginTop: 18, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>{children}</div>;
}

function Badge({ children, color = C.blue, bg }) {
  return <span style={{ fontSize: 9, fontFamily: "monospace", color, background: bg || color + "18", borderRadius: 3, padding: "1px 5px", fontWeight: 700, marginLeft: 6 }}>{children}</span>;
}

// —— MAIN COMPONENT ————————————————————————————————————————————————————————
export default function PricingModel() {
  // Team
  const [aeFTE, setAeFTE] = useState(1);
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

  // Funnel - SDR
  const [sqlsPerSDR, setSqlsPerSDR] = useState(12);
  const [occurRate, setOccurRate] = useState(0.85);
  const [sqlToQuote, setSqlToQuote] = useState(0.66);
  const [quoteToWin, setQuoteToWin] = useState(0.30);
  const [avgDealSize, setAvgDealSize] = useState(13000);
  const [meetingLagMonths, setMeetingLagMonths] = useState(0.5);

  // Funnel - ISR (inside sales, own outbound)
  const [sqlsPerISR, setSqlsPerISR] = useState(20);
  const [isrOccurRate, setIsrOccurRate] = useState(0.80);
  const [isrQuoteToWin, setIsrQuoteToWin] = useState(0.25);
  const [isrDealSize, setIsrDealSize] = useState(8000);

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

  const [tab, setTab] = useState("summary");
  const [section, setSection] = useState("team");

  // —— CALCULATIONS ————————————————————————————————————————————————————————
  const calc = useMemo(() => {
    const endAE = priceAE * (1 - discountAE / 100);
    const endSDR = priceSDR * (1 - discountSDR / 100);
    const endISR = priceISR * (1 - discountISR / 100);

    // Monthly funnel from SDR team
    const sdrSQLsTotal = sqlsPerSDR * sdrFTE;
    const sdrOccurred = sdrSQLsTotal * occurRate;
    const sdrQuotes = sdrOccurred * sqlToQuote;
    const sdrWins = sdrQuotes * quoteToWin;
    const sdrICV = sdrWins * avgDealSize;

    // Monthly funnel from ISR team (ISR creates own pipeline + closes own deals)
    const isrSQLsTotal = sqlsPerISR * isrFTE;
    const isrOccurred = isrSQLsTotal * isrOccurRate;
    const isrQuotes = isrOccurred * sqlToQuote;
    const isrWins = isrQuotes * isrQuoteToWin;
    const isrICV = isrWins * isrDealSize;

    // Per-month model - ramp applied to deal ramp-up (booking → close lag ~2 months)
    const dealsRampFactor = (m) => {
      if (m <= 2) return 0;
      if (m <= 4) return 0.4;
      if (m <= 6) return 0.7;
      return 1.0;
    };

    let cumGM = 0, breakEven = -1;

    const months = Array.from({ length: 36 }, (_, i) => {
      const m = i + 1;
      const ramp = dealsRampFactor(m);

      // SDR-sourced deals this month
      const sdrDealsM = sdrWins * ramp * aeFTE; // AEs close SDR-sourced pipeline
      const sdrICVM = sdrDealsM * avgDealSize;

      // ISR-sourced & closed deals this month
      const isrDealsM = isrWins * ramp;
      const isrICVM = isrDealsM * isrDealSize;

      const totalDeals = sdrDealsM + isrDealsM;
      const totalICV = sdrICVM + isrICVM;

      const renewYr2 = totalICV * yr1Rate;
      const renewYr3 = totalICV * yr2Rate;

      // Revenue
      const baseRev = endAE * aeFTE + endSDR * sdrFTE + endISR * isrFTE;
      const variableRev = totalICV * varPct;
      const rev = (m === 1 ? setupFee : 0) + baseRev + variableRev;

      // Costs
      const aeMthSal = (aeBase / 12) * aeFTE;
      const aeComm = sdrICVM * aeCommPct / 12;
      const sdrMthSal = (sdrBase / 12) * sdrFTE;
      const sdrBonus = sdrDealsM > 0 ? 500 * sdrFTE * ramp : 0;
      const isrMthSal = (isrBase / 12) * isrFTE;
      const isrComm = isrICVM * isrCommPct / 12;
      const smCos = ((smBase + smBonus) / 12 / smAEs) * aeFTE;
      const baseCos = aeMthSal + aeComm + sdrMthSal + sdrBonus + isrMthSal + isrComm + smCos + (m === 1 ? setupFee : 0);
      const cos = baseCos * (1 + fringePct);
      const gm = rev - cos;
      cumGM += gm;
      if (breakEven === -1 && cumGM >= 0) breakEven = m;

      return { m, ramp, sdrDealsM, isrDealsM, totalDeals, sdrICVM, isrICVM, totalICV, renewYr2, renewYr3, rev, cos, gm, gmPct: rev > 0 ? gm / rev : 0, cumGM };
    });

    const yr = (s, e) => {
      const sl = months.slice(s, e);
      const rev = sl.reduce((a, x) => a + x.rev, 0);
      const cos = sl.reduce((a, x) => a + x.cos, 0);
      const gm = rev - cos;
      return { rev, cos, gm, gmPct: rev > 0 ? gm / rev : 0, deals: sl.reduce((a, x) => a + x.totalDeals, 0), icv: sl.reduce((a, x) => a + x.totalICV, 0) };
    };

    const y1 = yr(0, 12), y2 = yr(12, 24), y3 = yr(24, 36);
    const totRev = y1.rev + y2.rev + y3.rev;
    const totGM = y1.gm + y2.gm + y3.gm;
    const monthlyBill = endAE * aeFTE + endSDR * sdrFTE + endISR * isrFTE;

    // Steady-state funnel (at full ramp)
    const steadySDRBookings = sdrFTE * sqlsPerSDR;
    const steadySDROccurred = steadySDRBookings * occurRate;
    const steadySDRQuotes = steadySDROccurred * sqlToQuote;
    const steadySDRWins = steadySDRQuotes * quoteToWin;
    const steadySDRPipeline = steadySDRWins * avgDealSize;

    const steadyISRBookings = isrFTE * sqlsPerISR;
    const steadyISROccurred = steadyISRBookings * isrOccurRate;
    const steadyISRQuotes = steadyISROccurred * sqlToQuote;
    const steadyISRWins = steadyISRQuotes * isrQuoteToWin;
    const steadyISRPipeline = steadyISRWins * isrDealSize;

    return {
      months, y1, y2, y3, totRev, totGM, breakEven, monthlyBill,
      endAE, endSDR, endISR, roi: totRev > 0 ? totGM / totRev : 0,
      // funnel
      steadySDRBookings, steadySDROccurred, steadySDRQuotes, steadySDRWins, steadySDRPipeline,
      steadyISRBookings, steadyISROccurred, steadyISRQuotes, steadyISRWins, steadyISRPipeline,
      sdrSQLsTotal, sdrOccurred, sdrQuotes, sdrWins,
    };
  }, [aeFTE, sdrFTE, isrFTE, priceAE, priceSDR, priceISR, discountAE, discountSDR, discountISR,
    setupFee, varPct, sqlsPerSDR, occurRate, sqlToQuote, quoteToWin, avgDealSize,
    sqlsPerISR, isrOccurRate, isrQuoteToWin, isrDealSize,
    yr1Rate, yr2Rate, aeBase, aeCommPct, sdrBase, isrBase, isrCommPct, smBase, smBonus, smAEs, fringePct]);

  // —— STYLES ————————————————————————————————————————————————————————————————
  const S = {
    root: { background: "#f1f5f9", minHeight: "100vh", color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" },
    topbar: { background: C.white, borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
    body: { display: "flex", flex: 1, overflow: "hidden" },
    sidebar: { width: 268, background: C.white, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: "14px 13px", flexShrink: 0 },
    main: { flex: 1, overflowY: "auto", padding: 18 },
    secBtn: (a) => ({ display: "block", width: "100%", textAlign: "left", background: a ? C.blueLight : "transparent", border: a ? `1px solid ${C.blueBorder}` : "1px solid transparent", borderRadius: 6, color: a ? C.blue : C.textLight, fontFamily: "monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", padding: "7px 10px", cursor: "pointer", marginBottom: 3 }),
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

          {[["team","Team & Headcount"],["pricing","Pricing"],["funnel","Funnel Metrics"],["isr","ISR Settings"],["costs","Cost Workings"]].map(([k,v]) => (
            <button key={k} style={S.secBtn(section === k)} onClick={() => setSection(k)}>{v}</button>
          ))}

          <div style={{ marginTop: 16 }} />

          {/* TEAM */}
          {section === "team" && <>
            <SectionHead>Headcount</SectionHead>
            <Slider label="AE Headcount" value={aeFTE} min={0} max={20} onChange={setAeFTE} color={C.blue} />
            <Slider label="SDR Headcount" value={sdrFTE} min={0} max={20} onChange={setSdrFTE} color={C.teal} />
            <Slider label="ISR Headcount" value={isrFTE} min={0} max={20} onChange={setIsrFTE} color={C.purple} />
            <div style={{ ...card(C.blueLight, C.blueBorder), fontSize: 11, fontFamily: "monospace", color: C.blue, marginTop: 10 }}>
              Monthly billing: {fmt(calc.monthlyBill)}
            </div>
            <div style={{ fontSize: 10, color: C.textFaint, fontFamily: "monospace", marginTop: 6, lineHeight: 1.6 }}>
              <b style={{ color: C.teal }}>SDR</b> — outbound prospecting, books pipeline for AEs<br/>
              <b style={{ color: C.purple }}>ISR</b> — inside sales rep, own outbound + closes<br/>
              <b style={{ color: C.blue }}>AE</b> — account exec, closes SDR-sourced pipeline
            </div>
          </>}

          {/* PRICING */}
          {section === "pricing" && <>
            <SectionHead>AE Pricing</SectionHead>
            <Field label="Price per AE / month" value={priceAE} onChange={setPriceAE} />
            <Field label="AE Discount" value={discountAE} onChange={setDiscountAE} prefix="" suffix="%" />
            <div style={{ fontFamily: "monospace", fontSize: 11, color: C.blue, marginBottom: 10, background: C.blueLight, borderRadius: 5, padding: "4px 8px" }}>End price: {fmt(calc.endAE)}/mo</div>

            <SectionHead>SDR Pricing</SectionHead>
            <Field label="Price per SDR / month" value={priceSDR} onChange={setPriceSDR} />
            <Field label="SDR Discount" value={discountSDR} onChange={setDiscountSDR} prefix="" suffix="%" />
            <div style={{ fontFamily: "monospace", fontSize: 11, color: C.teal, marginBottom: 10, background: C.tealLight, borderRadius: 5, padding: "4px 8px" }}>End price: {fmt(calc.endSDR)}/mo</div>

            <SectionHead>ISR Pricing</SectionHead>
            <Field label="Price per ISR / month" value={priceISR} onChange={setPriceISR} />
            <Field label="ISR Discount" value={discountISR} onChange={setDiscountISR} prefix="" suffix="%" />
            <div style={{ fontFamily: "monospace", fontSize: 11, color: C.purple, marginBottom: 10, background: C.purpleLight, borderRadius: 5, padding: "4px 8px" }}>End price: {fmt(calc.endISR)}/mo</div>

            <SectionHead>Other</SectionHead>
            <Field label="Setup Fee (one-time)" value={setupFee} onChange={setSetupFee} />
            <Slider label="Variable % of ICV" value={varPct} min={0} max={0.05} step={0.005} onChange={setVarPct} format={pct} color={C.amber} />
          </>}

          {/* FUNNEL */}
          {section === "funnel" && <>
            <SectionHead>SDR Pipeline Creation</SectionHead>
            <Slider label="SQLs booked / SDR / month" value={sqlsPerSDR} min={2} max={30} onChange={setSqlsPerSDR} color={C.teal} />
            <Slider label="Meeting occur rate" value={occurRate} min={0.4} max={1} step={0.01} onChange={setOccurRate} format={pct} color={C.teal} />
            <SectionHead>Conversion Rates (shared)</SectionHead>
            <Slider label="SQL > Quote" value={sqlToQuote} min={0.1} max={1} step={0.01} onChange={setSqlToQuote} format={pct} color={C.amber} />
            <Slider label="Quote > Win (AE)" value={quoteToWin} min={0.05} max={0.8} step={0.01} onChange={setQuoteToWin} format={pct} color={C.blue} />
            <SectionHead>Deal Economics</SectionHead>
            <Field label="Avg Deal Size (AE/SDR)" value={avgDealSize} onChange={setAvgDealSize} />
            <SectionHead>Renewals</SectionHead>
            <Slider label="Yr 1 Renewal Rate" value={yr1Rate} min={0.4} max={1} step={0.01} onChange={setYr1Rate} format={pct} color={C.green} />
            <Slider label="Yr 2 Renewal Rate" value={yr2Rate} min={0.4} max={1} step={0.01} onChange={setYr2Rate} format={pct} color={C.green} />
          </>}

          {/* ISR */}
          {section === "isr" && <>
            <SectionHead>ISR Funnel</SectionHead>
            <Slider label="SQLs booked / ISR / month" value={sqlsPerISR} min={5} max={60} onChange={setSqlsPerISR} color={C.purple} />
            <Slider label="ISR meeting occur rate" value={isrOccurRate} min={0.3} max={1} step={0.01} onChange={setIsrOccurRate} format={pct} color={C.purple} />
            <Slider label="Quote > Win (ISR)" value={isrQuoteToWin} min={0.05} max={0.6} step={0.01} onChange={setIsrQuoteToWin} format={pct} color={C.purple} />
            <Field label="Avg ISR Deal Size" value={isrDealSize} onChange={setIsrDealSize} />
            <div style={{ ...card(C.purpleLight, C.purpleBorder), fontSize: 11, fontFamily: "monospace", color: C.purple, marginTop: 8 }}>
              Steady-state ISR pipeline: {fmt(calc.steadyISRPipeline)}/mo<br/>
              ISR wins/mo: {fmtN(calc.steadyISRWins, 1)} deals
            </div>
          </>}

          {/* COSTS */}
          {section === "costs" && <>
            <SectionHead>AE Costs</SectionHead>
            <Field label="AE Annual Base Salary" value={aeBase} onChange={setAeBase} />
            <Slider label="AE ICV Commission %" value={aeCommPct} min={0.02} max={0.15} step={0.005} onChange={setAeCommPct} format={pct} color={C.blue} />
            <SectionHead>SDR Costs</SectionHead>
            <Field label="SDR Annual Base Salary" value={sdrBase} onChange={setSdrBase} />
            <SectionHead>ISR Costs</SectionHead>
            <Field label="ISR Annual Base Salary" value={isrBase} onChange={setIsrBase} />
            <Slider label="ISR ICV Commission %" value={isrCommPct} min={0.01} max={0.12} step={0.005} onChange={setIsrCommPct} format={pct} color={C.purple} />
            <SectionHead>Sales Manager</SectionHead>
            <Field label="SM Base (annual)" value={smBase} onChange={setSmBase} />
            <Field label="SM Bonus (annual)" value={smBonus} onChange={setSmBonus} />
            <Field label="AEs per Sales Manager" value={smAEs} onChange={setSmAEs} prefix="" />
            <SectionHead>Overhead</SectionHead>
            <Slider label="Fringe / Overhead %" value={fringePct} min={0.04} max={0.25} step={0.01} onChange={setFringePct} format={pct} color={C.slate} />
          </>}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>

            {/* SDR Funnel */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 6, height: 20, background: C.teal, borderRadius: 3 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>SDR Pipeline</span>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint }}>steady-state / month</span>
              </div>
              <FunnelRow label="SQLs Booked" value={fmtN(calc.steadySDRBookings, 0)} sub={`${sqlsPerSDR}/SDR x ${sdrFTE} SDR`} color={C.teal} />
              <FunnelRow label="Meetings Occurred" value={fmtN(calc.steadySDROccurred, 1)} sub={`${pct(occurRate)} occur rate`} color="#0d9488" pctVal={occurRate} />
              <FunnelRow label="Quotes / SALs" value={fmtN(calc.steadySDRQuotes, 1)} sub={`${pct(sqlToQuote)} SQL>Quote`} color={C.amber} pctVal={sqlToQuote} />
              <FunnelRow label="Won Deals (AE)" value={fmtN(calc.steadySDRWins, 1)} sub={`${pct(quoteToWin)} quote>win`} color={C.blue} pctVal={quoteToWin} />
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>Pipeline ICV / mo</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.teal }}>{fmt(calc.steadySDRPipeline)}</span>
              </div>
            </div>

            {/* ISR Funnel */}
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 6, height: 20, background: C.purple, borderRadius: 3 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>ISR Pipeline</span>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint }}>steady-state / month</span>
                {isrFTE === 0 && <span style={{ fontSize: 10, fontFamily: "monospace", color: "#dc2626", background: "#fef2f2", borderRadius: 3, padding: "1px 5px" }}>No ISRs added</span>}
              </div>
              <FunnelRow label="SQLs Booked" value={fmtN(calc.steadyISRBookings, 0)} sub={`${sqlsPerISR}/ISR x ${isrFTE} ISR`} color={C.purple} />
              <FunnelRow label="Meetings Occurred" value={fmtN(calc.steadyISROccurred, 1)} sub={`${pct(isrOccurRate)} occur rate`} color="#7c3aed" pctVal={isrOccurRate} />
              <FunnelRow label="Quotes / SALs" value={fmtN(calc.steadyISRQuotes, 1)} sub={`${pct(sqlToQuote)} SQL>Quote`} color={C.amber} pctVal={sqlToQuote} />
              <FunnelRow label="Won Deals (ISR)" value={fmtN(calc.steadyISRWins, 1)} sub={`${pct(isrQuoteToWin)} quote>win`} color={C.purple} pctVal={isrQuoteToWin} />
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>Pipeline ICV / mo</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.purple }}>{fmt(calc.steadyISRPipeline)}</span>
              </div>
            </div>
          </div>

          {/* Pricing strip */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div><span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>AE </span><span style={{ fontSize: 15, fontWeight: 800, color: C.blue }}>{fmt(calc.endAE)}/mo</span></div>
            <div style={{ color: C.border }}>|</div>
            <div><span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>SDR </span><span style={{ fontSize: 15, fontWeight: 800, color: C.teal }}>{fmt(calc.endSDR)}/mo</span></div>
            <div style={{ color: C.border }}>|</div>
            <div><span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>ISR </span><span style={{ fontSize: 15, fontWeight: 800, color: C.purple }}>{fmt(calc.endISR)}/mo</span></div>
            <div style={{ color: C.border }}>|</div>
            <div><span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>SDR ICV/mo </span><span style={{ fontSize: 15, fontWeight: 800, color: C.teal }}>{fmt(calc.steadySDRPipeline)}</span></div>
            <div style={{ color: C.border }}>|</div>
            <div><span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>ISR ICV/mo </span><span style={{ fontSize: 15, fontWeight: 800, color: C.purple }}>{fmt(calc.steadyISRPipeline)}</span></div>
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
                    ["Total Deals", fmtN(calc.y1.deals,1), fmtN(calc.y2.deals,1), fmtN(calc.y3.deals,1), fmtN(calc.y1.deals+calc.y2.deals+calc.y3.deals,1), false],
                    ["ICV Closed", fmt(calc.y1.icv), fmt(calc.y2.icv), fmt(calc.y3.icv), fmt(calc.y1.icv+calc.y2.icv+calc.y3.icv), false],
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
                  {calc.months.map((x, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                      <td style={S.tdl}>
                        Mo {x.m}
                        {[1,13,25].includes(x.m) && <Badge color={C.blue}>YR{Math.ceil(x.m/12)}</Badge>}
                        {x.ramp < 1 && <Badge color={C.amber} bg={C.amberLight}>ramp</Badge>}
                      </td>
                      <td style={S.td}>{fmt(x.rev)}</td>
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
                    <th style={{ ...S.th, color: C.teal }}>SDR SQLs</th>
                    <th style={{ ...S.th, color: C.teal }}>SDR Wins</th>
                    <th style={{ ...S.th, color: C.teal }}>SDR ICV</th>
                    <th style={{ ...S.th, color: C.purple }}>ISR SQLs</th>
                    <th style={{ ...S.th, color: C.purple }}>ISR Wins</th>
                    <th style={{ ...S.th, color: C.purple }}>ISR ICV</th>
                    <th style={S.th}>Total ICV</th>
                    <th style={S.th}>Yr1 Ren.</th>
                    <th style={S.th}>Yr2 Ren.</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.months.map((x, i) => {
                    const sdrSQLsM = calc.sdrSQLsTotal * x.ramp;
                    const isrSQLsM = (sqlsPerISR * isrFTE) * x.ramp;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                        <td style={S.tdl}>Mo {x.m}{x.ramp < 1 && <Badge color={C.amber} bg={C.amberLight}>{Math.round(x.ramp*100)}%</Badge>}</td>
                        <td style={{ ...S.td, color: C.teal }}>{fmtN(sdrSQLsM, 1)}</td>
                        <td style={{ ...S.td, color: C.teal }}>{fmtN(x.sdrDealsM, 1)}</td>
                        <td style={{ ...S.td, color: C.teal, fontWeight: 600 }}>{fmt(x.sdrICVM)}</td>
                        <td style={{ ...S.td, color: C.purple }}>{fmtN(isrSQLsM, 1)}</td>
                        <td style={{ ...S.td, color: C.purple }}>{fmtN(x.isrDealsM, 1)}</td>
                        <td style={{ ...S.td, color: C.purple, fontWeight: 600 }}>{fmt(x.isrICVM)}</td>
                        <td style={{ ...S.td, fontWeight: 700 }}>{fmt(x.totalICV)}</td>
                        <td style={S.td}>{fmt(x.renewYr2)}</td>
                        <td style={S.td}>{fmt(x.renewYr3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* —— ICV WATERFALL TAB ——————————————————————————————————————— */}
          {tab === "icv" && (
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "auto", maxHeight: 520, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={S.thl}>Month</th>
                    <th style={S.th}>Deals</th>
                    <th style={S.th}>ICV Closed</th>
                    <th style={S.th}>Yr1 Renewals</th>
                    <th style={S.th}>Yr2 Renewals</th>
                    <th style={S.th}>Total ICV</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.months.map((x, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.bg }}>
                      <td style={S.tdl}>Mo {x.m}</td>
                      <td style={S.td}>{fmtN(x.totalDeals, 1)}</td>
                      <td style={S.td}>{fmt(x.totalICV)}</td>
                      <td style={S.td}>{fmt(x.renewYr2)}</td>
                      <td style={S.td}>{fmt(x.renewYr3)}</td>
                      <td style={{ ...S.td, color: C.blue, fontWeight: 700 }}>{fmt(x.totalICV + x.renewYr2 + x.renewYr3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
