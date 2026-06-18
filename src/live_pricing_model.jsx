import { useState, useMemo, useRef, useEffect } from "react";
import { exportToPdf } from "./lib/exports";
import { getCalibratedRamp, defaultRampForLength } from "./lib/calibration";

const fmt = (n) => n == null || isNaN(n) || !isFinite(n) ? "—" : "$" + Math.round(n).toLocaleString("en-US");
const fmtN = (n, dp = 0) => n == null || isNaN(n) ? "—" : Number(n).toFixed(dp);
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

function TextField({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <label style={{ display: "block", fontFamily: "monospace", fontSize: 10, color: C.textLight, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <input
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, color: C.text, fontFamily: "monospace", fontSize: 12, padding: "5px 8px", outline: "none", width: "100%", boxSizing: "border-box" }}
      />
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

const VERTICALS = [
  "Cybersecurity",
  "Data",
  "AI",
  "FinTech",
  "Health Tech",
  "Networking/Communication",
  "Sales/Marketing/Customer Tech",
  "Supply Chain/Logistics/Transportation Tech",
  "HR Tech",
  "Gov Tech",
  "Education",
  "Professional Services",
  "Legal Tech",
  "Real Estate Tech",
];

const COMPANY_SIZES = ["Startup", "SMB", "Mid-Market", "Enterprise"];

const DEFAULT_TERMS = {
  sal:      { singular: "SAL",                   plural: "SALs"                    },
  sql:      { singular: "SQL",                   plural: "SQLs"                    },
  qopp:     { singular: "Qualified Opportunity", plural: "Qualified Opportunities" },
  sao:      { singular: "SAO",                   plural: "SAOs"                    },
  pipeline: { singular: "Pipeline",              plural: "Pipeline"                },
  deal:     { singular: "Deal",                  plural: "Deals"                   },
  revenue:  { singular: "Won Revenue",           plural: "Won Revenue"             },
};

function Select({ label, value, onChange, options, placeholder = "— Select —" }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <label style={{ display: "block", fontFamily: "monospace", fontSize: 10, color: C.textLight, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        style={{
          width: "100%", boxSizing: "border-box",
          background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5,
          color: value ? C.text : C.textFaint,
          fontFamily: "monospace", fontSize: 12,
          padding: "5px 8px", outline: "none", cursor: "pointer",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const v = typeof opt === "string" ? opt : opt.value;
          const l = typeof opt === "string" ? opt : opt.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </div>
  );
}

function KPI({ label, value, sub, color = C.text, bg = C.bg, border = C.border, rightLabel, rightValue, rightColor = C.purple }) {
  const hasRight = rightValue != null;
  const cardStyle = { background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "11px 14px" };
  const leftCol = (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: "monospace", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 800, color, letterSpacing: "-0.5px", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, marginTop: 3 }}>{sub}</div>}
    </div>
  );
  if (!hasRight) return <div style={cardStyle}>{leftCol}</div>;
  return (
    <div style={{ ...cardStyle, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      {leftCol}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{rightLabel ?? "ROI"}</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: rightColor, letterSpacing: "-0.5px", lineHeight: 1.1 }}>{rightValue}</div>
      </div>
    </div>
  );
}

const PROJECTION_MILESTONES = [3, 6, 12, 24];
const PROJECTION_LABELS = ["M3", "M6", "Year 1", "Year 2"];

// Cumulative-through-milestone with steady-state extrapolation past program end.
function cumulativeAt(monthlyArr, getter, programLength, steadyPerMonth) {
  return PROJECTION_MILESTONES.map((m) => {
    const inSlice = monthlyArr.slice(0, Math.min(m, programLength));
    const sumIn = inSlice.reduce((a, x) => a + (getter(x) ?? 0), 0);
    const extension = m > programLength ? (m - programLength) * steadyPerMonth : 0;
    return sumIn + extension;
  });
}

function FunnelViz({ counts, dollars, isrInProgram, totalClientSpend, term }) {
  const { sals, sqls, qOpps, saos, deals } = counts;
  const { wonRev, ltY1, ltY2, ltY3 } = dollars;

  // Count stages narrow top-down — warm orange/brown family that blends together.
  const countStages = [
    { label: `Total ${term("sal")}`,  value: sals,  role: "SDR", color: "#c2660a" }, // burnt orange
    { label: `Total ${term("sql")}`,  value: sqls,  role: "SDR", color: "#d97706" }, // orange
    ...(isrInProgram ? [
      { label: `Total ${term("qopp")}`, value: qOpps, role: "ISR", color: "#e09660" }, // light peach
      { label: `Total ${term("sao")}`,  value: saos,  role: "ISR", color: "#b8602a" }, // medium orange-brown
    ] : []),
    { label: `${term("deal")} Won`,   value: deals, role: "AE",  color: "#7c4a1e" }, // dark brown
  ];

  // Dollar stages flare outward — progressively darker greens.
  const dollarStages = [
    { label: `${term("revenue","singular")} (program)`, value: wonRev, roi: totalClientSpend > 0 ? wonRev / totalClientSpend : null, color: "#22c55e" }, // bright green
    { label: "Lifetime Revenue — Y1",                    value: ltY1,   roi: totalClientSpend > 0 ? ltY1   / totalClientSpend : null, color: "#16a34a" },
    { label: "Lifetime Revenue — Y2",                    value: ltY2,   roi: totalClientSpend > 0 ? ltY2   / totalClientSpend : null, color: "#15803d" },
    { label: "Lifetime Revenue — Y3",                    value: ltY3,   roi: totalClientSpend > 0 ? ltY3   / totalClientSpend : null, color: "#166534" },
  ];

  // Geometry: trapezoid bands stack without gaps to form an hourglass.
  // Counts narrow from top (inset 0%) to "waist" (inset MAX%) across N count stages.
  // Dollars flare from waist back out to bottom (inset 0%) across N dollar stages.
  const MAX_INSET = 32;
  const cN = countStages.length;
  const dN = dollarStages.length;
  const countInsetAt  = (k) => (k / cN) * MAX_INSET;
  const dollarInsetAt = (k) => ((dN - k) / dN) * MAX_INSET;

  const ROLE_COLOR = { SDR: C.teal, ISR: C.purple, AE: C.blue };
  // Determine the first row index for each role so we only render its label once.
  const firstRoleIdx = {};
  countStages.forEach((s, i) => { if (!(s.role in firstRoleIdx)) firstRoleIdx[s.role] = i; });

  const BAND_HEIGHT = 50;

  const Band = ({ topInset, bottomInset, color, label, valueText, roiText, roleText, roleColor }) => {
    // Inline SVG polygon for the trapezoid — renders reliably in html2canvas (CSS clip-path does not).
    const points = `${topInset.toFixed(2)},0 ${(100 - topInset).toFixed(2)},0 ${(100 - bottomInset).toFixed(2)},100 ${bottomInset.toFixed(2)},100`;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 64px", alignItems: "stretch", height: BAND_HEIGHT }}>
        {/* Left: role tag + stage label */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 8 }}>
          {roleText && (
            <span style={{ fontSize: 9, fontFamily: "monospace", color: roleColor, fontWeight: 700, fontStyle: "italic", textAlign: "right" }}>{roleText}</span>
          )}
          <span style={{ fontSize: 10, color: C.textLight, fontWeight: 600, textAlign: "right", lineHeight: 1.2 }}>{label}</span>
        </div>
        {/* Middle: trapezoid (SVG polygon) + centered value overlay */}
        <div style={{ position: "relative", height: BAND_HEIGHT }}>
          <svg
            width="100%"
            height={BAND_HEIGHT}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ display: "block" }}
          >
            <polygon points={points} fill={color} />
          </svg>
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 17, fontFamily: "monospace", letterSpacing: "0.02em" }}>{valueText}</span>
          </div>
        </div>
        {/* Right: ROI (dollar bands only) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: 8 }}>
          {roiText && (
            <span style={{ fontSize: 11, fontFamily: "monospace", color: C.textFaint, fontWeight: 600 }}>{roiText}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 6, height: 20, background: C.green, borderRadius: 3 }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Funnel visualization</span>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint }}>program totals</span>
      </div>

      {/* Count bands — narrowing hourglass top */}
      <div>
        {countStages.map((stage, i) => (
          <Band
            key={`c-${i}`}
            topInset={countInsetAt(i)}
            bottomInset={countInsetAt(i + 1)}
            color={stage.color}
            label={stage.label}
            valueText={fmtN(stage.value, 0)}
            roleText={firstRoleIdx[stage.role] === i ? stage.role : ""}
            roleColor={ROLE_COLOR[stage.role]}
          />
        ))}
      </div>

      {/* Dollar bands — flaring hourglass bottom (touches the count waist with no gap) */}
      <div>
        {dollarStages.map((stage, i) => (
          <Band
            key={`d-${i}`}
            topInset={dollarInsetAt(i)}
            bottomInset={dollarInsetAt(i + 1)}
            color={stage.color}
            label={stage.label}
            valueText={fmt(stage.value)}
            roiText={stage.roi != null && isFinite(stage.roi) ? `${(Math.round(stage.roi * 10) / 10)}× ROI` : "—"}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectionTable({ rows, S, fill = false }) {
  const rowPad      = fill ? "14px 10px" : "7px 8px";
  const labelFont   = fill ? 13 : undefined;
  const valueFont   = fill ? 17 : undefined;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4, ...(fill ? { height: "100%" } : {}) }}>
      <thead>
        <tr>
          <th style={{ ...S.thl, padding: "6px 8px" }}>Metric</th>
          {PROJECTION_LABELS.map((label) => (
            <th key={label} style={{ ...S.th, padding: "6px 8px" }}>{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <td style={{ ...S.tdl, padding: rowPad, display: "flex", alignItems: "center", gap: 8, fontSize: labelFont }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: C.textMid }}>{row.label}</span>
            </td>
            {row.values.map((v, i) => (
              <td key={i} style={{ ...S.td, padding: rowPad, fontWeight: 700, color: row.enabled ? row.color : C.textFaint, fontSize: valueFont }}>
                {row.enabled ? row.format(v) : "—"}
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
  const [sdrFTE, setSdrFTE] = useState(2);
  const [isrFTE, setIsrFTE] = useState(0);

  // Pricing
  const [priceAE, setPriceAE] = useState(13000);
  const [priceSDR, setPriceSDR] = useState(11500);
  const [priceISR, setPriceISR] = useState(9500);
  const [discountAE, setDiscountAE] = useState(0);
  const [discountSDR, setDiscountSDR] = useState(0);
  const [discountISR, setDiscountISR] = useState(0);
  const [setupFee, setSetupFee] = useState(3000);
  const [varPct, setVarPct] = useState(0);

  // Program-based ROI inputs (new)
  const [programLengthMonths, setProgramLengthMonths] = useState(6);
  const [monthlyManagement, setMonthlyManagement] = useState(0);
  const [monthlyData, setMonthlyData] = useState(0);
  const [salToSqlRate, setSalToSqlRate] = useState(0.527);
  // Client inputs — defaulted to Excel ROI sheet values so sliders are live from first render.
  // Reps override these in conversation with the client.
  const [closeRate, setCloseRate] = useState(0.15);
  const [avgContractValue, setAvgContractValue] = useState(50000);
  const [avgSalesCycleMonths, setAvgSalesCycleMonths] = useState(6);
  // Goal-seek / program builder (planning inputs — do not feed the forward calc directly)
  const [pipelineTarget, setPipelineTarget] = useState(null);   // $ — XOR with revenueTarget
  const [revenueTarget, setRevenueTarget] = useState(null);     // $ — XOR with pipelineTarget
  const [targetProgramLength, setTargetProgramLength] = useState(8); // months, planning only
  const [ramp, setRamp] = useState([3, 5, 6, 10, 10, 10]);
  // ISR sequential funnel rates (used when isrFTE > 0): SDR SQLs → Q-Opps → SAOs → Deals
  const [sqlToQOppRate, setSqlToQOppRate] = useState(0.60);
  const [qOppToSaoRate, setQOppToSaoRate] = useState(0.80);
  // SAO Win Rate fully replaces the SDR-side Close Rate when ISR is in the program.
  const [saoWinRate, setSaoWinRate] = useState(0.80);

  const [tab, setTab] = useState("summary");
  const [role, setRole] = useState("sdr"); // sdr | isr | ae

  // Calibrate to Client
  const [vertical, setVertical] = useState(null);
  const [companySize, setCompanySize] = useState(null);
  const [yr1Renewal, setYr1Renewal] = useState(0.80);
  const [yr2Renewal, setYr2Renewal] = useState(0.70);
  const [yr3Renewal, setYr3Renewal] = useState(0.60);

  // Per-client terminology overrides (persisted to localStorage)
  const [terms, setTerms] = useState(() => {
    try {
      const saved = localStorage.getItem("pricingTool.terms");
      if (saved) return { ...DEFAULT_TERMS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_TERMS;
  });
  useEffect(() => {
    try { localStorage.setItem("pricingTool.terms", JSON.stringify(terms)); } catch {
      // ignore
    }
  }, [terms]);
  const term = (key, form = "plural") => terms[key]?.[form] || DEFAULT_TERMS[key][form];

  // Holds the pre-calibration ramp so we can restore it when the rep clears
  // the Vertical dropdown.
  const rampSnapshotRef = useRef(null);
  // companySize state IS the tier name (Startup / SMB / Mid-Market / Enterprise).
  const selectedTier = companySize;
  useEffect(() => {
    if (!vertical) {
      if (rampSnapshotRef.current) {
        setRamp(rampSnapshotRef.current);
        rampSnapshotRef.current = null;
      }
      return;
    }
    if (rampSnapshotRef.current === null) {
      rampSnapshotRef.current = ramp;
    }
    const calibrated = getCalibratedRamp(vertical, selectedTier, programLengthMonths);
    setRamp(calibrated ?? defaultRampForLength(programLengthMonths));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vertical, selectedTier, programLengthMonths]);

  // When no Vertical is selected, extending Program Length should pad the ramp
  // with the steady-state value (last value of current ramp — defaults to 10 from
  // DEFAULT_RAMP). Never truncate: shrinking Program Length leaves trailing
  // entries in place. The calc only reads ramp[0..programLengthMonths-1], so
  // unused entries are harmless but preserve original values if the user later
  // expands the program back out.
  useEffect(() => {
    if (vertical) return; // calibration effect handles the with-vertical case
    setRamp((prev) => {
      if (prev.length >= programLengthMonths) return prev;
      const steady = prev.length > 0 ? prev[prev.length - 1] : 10;
      return [...prev, ...Array(programLengthMonths - prev.length).fill(steady)];
    });
  }, [programLengthMonths, vertical]);

  // PDF export
  const mainRef = useRef(null);
  const pdfRef = useRef(null);
  const [exporting, setExporting] = useState(null); // null | "pdf"

  // —— CALCULATIONS ————————————————————————————————————————————————————————
  const calc = useMemo(() => {
    const endAE = priceAE * (1 - discountAE / 100);
    const endSDR = priceSDR * (1 - discountSDR / 100);
    const endISR = priceISR * (1 - discountISR / 100);

    const hasACV = avgContractValue != null && avgContractValue > 0;
    // When ISR is in the program, the deal-closing step uses saoWinRate (AE closes SAOs) instead of closeRate.
    const isrInProgram = isrFTE > 0;
    const effectiveCloseRate = isrInProgram ? saoWinRate : closeRate;
    const hasClose = effectiveCloseRate != null && effectiveCloseRate > 0;
    const hasCycle = avgSalesCycleMonths != null && avgSalesCycleMonths >= 0;
    const cycle = hasCycle ? avgSalesCycleMonths : 0;
    const totalMonths = programLengthMonths + cycle;

    const monthlyBilling = sdrFTE * endSDR + isrFTE * endISR + aeFTE * endAE;
    // Total recurring monthly paid by client (reps + management + data). Setup fee is one-time, not included.
    const monthlyClientBilling = monthlyBilling + monthlyManagement + monthlyData;

    // Break-even is computed from the CLIENT's perspective: the first month where cumulative won
    // revenue from the program meets or exceeds cumulative client spend (billing + fees + setup).
    let cumClientSpend = 0, cumClientWon = 0, breakEven = -1;

    // Unified monthly array — drives every calc tab.
    // Funnel is sequential: SDR ramp → SALs → SQLs (× salToSqlRate)
    //   - If ISR in program: SQLs → Q-Opps (× sqlToQOppRate) → SAOs (× qOppToSaoRate)
    //                        Pipeline = SAOs × ACV, Deals = SAOs × closeRate
    //   - If no ISR:         Pipeline = SQLs × ACV,  Deals = SQLs × closeRate (SDR-only behavior)
    const monthly = Array.from({ length: totalMonths }, (_, i) => {
      const m = i + 1;
      const inProgram = m <= programLengthMonths;

      // SDR top-of-funnel
      const sdrSalsPerRep = inProgram ? (ramp[m - 1] ?? 0) : 0;
      const totalSals = sdrSalsPerRep * sdrFTE;
      const totalSqls = totalSals * salToSqlRate;

      // ISR conversion stages (only used when ISR is in program)
      const qOpps = isrInProgram ? totalSqls * sqlToQOppRate : 0;
      const saos  = isrInProgram ? qOpps * qOppToSaoRate    : 0;

      // Pipeline + deals base unit = SAOs when ISR present, else SQLs
      const dealBaseUnits = isrInProgram ? saos : totalSqls;
      const pipelineCreated = hasACV ? dealBaseUnits * avgContractValue : null;
      const dealsWon = hasClose ? Math.round(dealBaseUnits * effectiveCloseRate) : null;

      // Won revenue lags by avgSalesCycleMonths — source-month-driven through the same funnel
      const sourceMonth = m - cycle;
      const srcIdx = sourceMonth - 1;
      let wonDealValue = null, wonDealsCount = null;
      if (hasCycle && hasACV && hasClose) {
        if (sourceMonth >= 1 && sourceMonth <= programLengthMonths) {
          const srcSdrSals = (ramp[srcIdx] ?? 0) * sdrFTE;
          const srcSdrSqls = srcSdrSals * salToSqlRate;
          const srcDealBase = isrInProgram
            ? srcSdrSqls * sqlToQOppRate * qOppToSaoRate
            : srcSdrSqls;
          wonDealsCount = Math.round(srcDealBase * effectiveCloseRate);
          wonDealValue  = wonDealsCount * avgContractValue;
        } else {
          wonDealValue = 0;
          wonDealsCount = 0;
        }
      }
      const wonValueForCalc = wonDealValue ?? 0;

      // Revenue (client side)
      const variableRev = wonValueForCalc * varPct;
      const billingThisMonth = inProgram ? monthlyBilling : 0;
      const mgmtThisMonth = inProgram ? monthlyManagement : 0;
      const dataThisMonth = inProgram ? monthlyData : 0;
      const setupThisMonth = m === 1 ? setupFee * sdrFTE : 0;
      const revenue = billingThisMonth + mgmtThisMonth + dataThisMonth + variableRev + setupThisMonth;

      cumClientSpend += revenue;
      cumClientWon += wonValueForCalc;
      if (breakEven === -1 && cumClientWon >= cumClientSpend && cumClientSpend > 0) breakEven = m;

      return {
        m, inProgram,
        salsPerRep: sdrSalsPerRep,
        totalSals, totalSqls, qOpps, saos,
        pipelineCreated, dealsWon, wonDealValue, wonDealsCount,
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
      qOpps: sumAll("qOpps"),
      saos: sumAll("saos"),
      deals: sumAll("dealsWon"),
      pipeline: sumAll("pipelineCreated"),
      wonRev: sumAll("wonDealValue"),
    };
    const totalWonDealValue = totals.wonRev;

    // Lifetime revenue projection (renewal rates applied independently to base ICV)
    const y1RenewalRev = totalWonDealValue * (yr1Renewal ?? 0);
    const y2RenewalRev = totalWonDealValue * (yr2Renewal ?? 0);
    const y3RenewalRev = totalWonDealValue * (yr3Renewal ?? 0);
    const lifetimeY1 = totalWonDealValue + y1RenewalRev;
    const lifetimeY2 = lifetimeY1 + y2RenewalRev;
    const lifetimeY3 = lifetimeY2 + y3RenewalRev;
    const hasRenewals = yr1Renewal != null || yr2Renewal != null || yr3Renewal != null;

    // Steady-state (in-program) averages for the overview pipeline cards
    const inProgramMonthly = monthly.filter((x) => x.inProgram);
    const N = inProgramMonthly.length;
    const avgIn = (key) => (N > 0 ? inProgramMonthly.reduce((a, x) => a + (x[key] ?? 0), 0) / N : 0);
    const steadyAvgSals = avgIn("totalSals");
    const steadyAvgSqls = avgIn("totalSqls");
    const steadyAvgQOpps = avgIn("qOpps");
    const steadyAvgSaos = avgIn("saos");
    const steadyAvgPipeline = avgIn("pipelineCreated");
    const steadyAvgWon = avgIn("dealsWon");

    return {
      monthly, totalMonths, cycle,
      totals, breakEven, totalClientSpend,
      monthlyBill: monthlyBilling, monthlyClientBill: monthlyClientBilling,
      endAE, endSDR, endISR,
      totalWonDealValue,
      y1RenewalRev, y2RenewalRev, y3RenewalRev,
      lifetimeY1, lifetimeY2, lifetimeY3, hasRenewals,
      totalPipelineCreated: totals.pipeline,
      totalDealsWon: totals.deals,
      totalSalsSum: totals.sals,
      totalSqlsSum: totals.sqls,
      hasACV, hasClose, hasCycle,
      steadyAvgSals, steadyAvgSqls, steadyAvgQOpps, steadyAvgSaos, steadyAvgPipeline, steadyAvgWon,
    };
  }, [aeFTE, sdrFTE, isrFTE, priceAE, priceSDR, priceISR, discountAE, discountSDR, discountISR,
    setupFee, varPct, monthlyManagement, monthlyData,
    salToSqlRate, sqlToQOppRate, qOppToSaoRate, saoWinRate, closeRate, avgContractValue, avgSalesCycleMonths, ramp, programLengthMonths,
    yr1Renewal, yr2Renewal, yr3Renewal]);

  // —— GOAL-SEEK / PROGRAM BUILDER ———————————————————————————————————————————
  // Inverts the (linear-in-SDR) forward funnel: given a Pipeline OR Revenue target plus a target
  // program length, compute how many SDRs are required. Planning-only — never mutates the model
  // until the rep clicks "Build This Program".
  const goalSeek = useMemo(() => {
    const L = Math.max(1, Math.round(targetProgramLength || 0));
    // Build the ramp for the TARGET length, mirroring the live ramp effects so the preview matches
    // exactly what Build will produce.
    const targetRamp = vertical
      ? (getCalibratedRamp(vertical, selectedTier, L) ?? defaultRampForLength(L))
      : (() => {
          const steady = ramp.length ? ramp[ramp.length - 1] : 10;
          return Array.from({ length: L }, (_, i) => ramp[i] ?? steady);
        })();
    const rampSum = targetRamp.reduce((a, x) => a + x, 0);

    const isrInProgram = isrFTE > 0;
    const isrMult = isrInProgram ? (sqlToQOppRate ?? 0) * (qOppToSaoRate ?? 0) : 1;
    const effClose = isrInProgram ? saoWinRate : closeRate;

    const pipelinePerSdr = rampSum * (salToSqlRate ?? 0) * isrMult * (avgContractValue ?? 0);
    const revenuePerSdr = pipelinePerSdr * (effClose ?? 0);

    const mode = pipelineTarget != null ? "pipeline" : revenueTarget != null ? "revenue" : null;
    const target = mode === "pipeline" ? pipelineTarget : revenueTarget;
    const perSdr = mode === "pipeline" ? pipelinePerSdr : revenuePerSdr;

    // Figure out which client inputs are still missing for the chosen mode.
    const missing = [];
    if (!(avgContractValue > 0)) missing.push("Avg Contract Value");
    if (!(salToSqlRate > 0)) missing.push(`${term("sal", "singular")} to ${term("sql", "singular")} Rate`);
    if (mode === "revenue" && !(effClose > 0)) missing.push(isrInProgram ? `${term("sao", "singular")} Win Rate` : "Close Rate");

    const solvable = mode != null && perSdr > 0 && (target ?? 0) > 0;
    const sdrsNeeded = solvable ? Math.max(1, Math.ceil(target / perSdr)) : null;
    const projPipeline = sdrsNeeded != null ? sdrsNeeded * pipelinePerSdr : null;
    const projRevenue = sdrsNeeded != null ? sdrsNeeded * revenuePerSdr : null;

    return { mode, length: L, sdrsNeeded, projPipeline, projRevenue, solvable, missing };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineTarget, revenueTarget, targetProgramLength, vertical, selectedTier, ramp,
    isrFTE, sqlToQOppRate, qOppToSaoRate, saoWinRate, closeRate, salToSqlRate, avgContractValue, terms]);

  const buildProgram = () => {
    if (!goalSeek.solvable) return;
    setProgramLengthMonths(goalSeek.length); // existing ramp effects recalibrate `ramp` to this length
    setSdrFTE(goalSeek.sdrsNeeded);
  };

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

          {/* Export PDF button */}
          <button
            onClick={async () => {
              setExporting("pdf");
              try {
                const inputs = {
                  aeFTE, sdrFTE, isrFTE,
                  priceAE, priceSDR, priceISR,
                  discountAE, discountSDR, discountISR,
                  setupFee, monthlyManagement, monthlyData,
                  closeRate, avgContractValue, avgSalesCycleMonths,
                  salToSqlRate, sqlToQOppRate, qOppToSaoRate, saoWinRate,
                  programLengthMonths, ramp,
                };
                await exportToPdf(pdfRef.current, inputs);
              } catch (err) {
                console.error("Export failed:", err);
                alert(`Export failed: ${err.message}`);
              } finally {
                setExporting(null);
              }
            }}
            disabled={exporting !== null}
            style={{
              fontFamily: "monospace", fontSize: 11, fontWeight: 700,
              padding: "5px 10px", border: `1px solid ${C.blueBorder}`,
              borderRadius: 5, background: exporting ? C.bg : C.blueLight, color: C.blue,
              cursor: exporting ? "default" : "pointer",
            }}
          >
            {exporting === "pdf" ? "Generating PDF…" : "Export PDF"}
          </button>

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

          <Collapsible title="Calibrate to Client" accent={C.blue} defaultOpen={true}>
            <Select
              label="Vertical"
              value={vertical}
              onChange={setVertical}
              options={VERTICALS}
              placeholder="— Select vertical —"
            />
            <Select
              label="Company Size"
              value={companySize}
              onChange={setCompanySize}
              options={COMPANY_SIZES}
              placeholder="— Select company size —"
            />
          </Collapsible>

          {/* Role tab row */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button style={S.roleTab(role === "sdr", C.teal)} onClick={() => setRole("sdr")}>SDR</button>
            <button style={S.roleTab(role === "isr", C.purple)} onClick={() => setRole("isr")}>ISR</button>
            <button style={S.roleTab(role === "ae", C.blue)} onClick={() => setRole("ae")}>AE</button>
          </div>

          {/* Role legend */}
          <div style={{ fontSize: 10, color: C.textFaint, fontFamily: "monospace", marginBottom: 10, lineHeight: 1.6 }}>
            <b style={{ color: C.teal }}>SDR</b> — Delivers meetings and opportunities<br/>
            <b style={{ color: C.purple }}>ISR</b> — Nurtures and drives opportunities<br/>
            <b style={{ color: C.blue }}>AE</b> — Closing Business
          </div>

          {/* ——— SDR TAB ——————————————————————————————————————— */}
          {role === "sdr" && <>
            <Collapsible title="Program Setup" accent={C.teal} defaultOpen={true}>
              <Field label="SDR Headcount" value={sdrFTE} onChange={setSdrFTE} prefix="" />
              <Field label={`${term("sal","singular")} to ${term("sql","singular")} Rate`} value={salToSqlRate == null ? null : salToSqlRate * 100} onChange={(v) => setSalToSqlRate(v == null ? null : v / 100)} prefix="" suffix="%" />
              <Field label="Program Length (Months)" value={programLengthMonths} onChange={setProgramLengthMonths} prefix="" />
            </Collapsible>

            <Collapsible title="SDR Costs" accent={C.teal} defaultOpen={true}>
              <Field label="Price per SDR / month" value={priceSDR} onChange={setPriceSDR} />
              <div style={{ fontFamily: "monospace", fontSize: 11, color: C.teal, marginBottom: 10, background: C.tealLight, borderRadius: 5, padding: "4px 8px" }}>End price: {fmt(calc.endSDR)}/mo</div>
              <Field label="One Time Setup Fee per SDR" value={setupFee} onChange={setSetupFee} />
              <div style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, marginTop: -6, marginBottom: 10 }}>Total: {fmt(setupFee * sdrFTE)} ({sdrFTE} SDR × {fmt(setupFee)})</div>
              <Field label="Monthly Management" value={monthlyManagement} onChange={setMonthlyManagement} />
              <Field label="Monthly Data" value={monthlyData} onChange={setMonthlyData} />
            </Collapsible>

            <Collapsible title="Client Inputs" accent={C.teal} defaultOpen={true}>
              {/* ——— Program builder (goal-seek): size the program from a target ——— */}
              <Field label="Pipeline Target" value={pipelineTarget}
                onChange={(v) => { setPipelineTarget(v); if (v != null) setRevenueTarget(null); }}
                placeholder="e.g. 1,000,000" />
              <Field label="Revenue Target" value={revenueTarget}
                onChange={(v) => { setRevenueTarget(v); if (v != null) setPipelineTarget(null); }}
                placeholder="or set a revenue goal instead" />
              <Field label="Target Program Length (Months)" value={targetProgramLength}
                onChange={setTargetProgramLength} prefix="" />
              {goalSeek.mode == null ? (
                <div style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, marginTop: -4, marginBottom: 12, lineHeight: 1.5 }}>
                  Enter a Pipeline or Revenue target to size the program.
                </div>
              ) : !goalSeek.solvable ? (
                <div style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, marginTop: -4, marginBottom: 12, lineHeight: 1.5 }}>
                  {goalSeek.missing.length ? `Add ${goalSeek.missing.join(", ")} to size the program.` : "Enter a target above $0 to size the program."}
                </div>
              ) : (
                <div style={{ marginTop: -2, marginBottom: 12 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: C.teal, background: C.tealLight, borderRadius: 5, padding: "6px 8px", marginBottom: 6, lineHeight: 1.5 }}>
                    ~{goalSeek.sdrsNeeded} SDR{goalSeek.sdrsNeeded === 1 ? "" : "s"} → {fmt(goalSeek.projPipeline)} pipeline / {fmt(goalSeek.projRevenue)} revenue over {goalSeek.length} mo
                  </div>
                  <button onClick={buildProgram}
                    style={{ width: "100%", padding: "7px 12px", border: "none", borderRadius: 6, background: C.teal, color: C.white, fontFamily: "monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer" }}>
                    Build This Program
                  </button>
                </div>
              )}
              <Field label="Close Rate" value={closeRate == null ? null : closeRate * 100} onChange={(v) => setCloseRate(v == null ? null : v / 100)} prefix="" suffix="%" placeholder="From client convo" />
              <Field label="Avg Contract Value" value={avgContractValue} onChange={setAvgContractValue} placeholder="From client convo" />
              <Field label="Avg Sales Cycle (Months)" value={avgSalesCycleMonths} onChange={setAvgSalesCycleMonths} prefix="" placeholder="From client convo" />
              <Field label="Yr 1 Renewal Rate" value={yr1Renewal == null ? null : yr1Renewal * 100} onChange={(v) => setYr1Renewal(v == null ? null : v / 100)} prefix="" suffix="%" placeholder="% of deals renewing at Y1" />
              <Field label="Yr 2 Renewal Rate" value={yr2Renewal == null ? null : yr2Renewal * 100} onChange={(v) => setYr2Renewal(v == null ? null : v / 100)} prefix="" suffix="%" placeholder="% of deals still active at Y2" />
              <Field label="Yr 3 Renewal Rate" value={yr3Renewal == null ? null : yr3Renewal * 100} onChange={(v) => setYr3Renewal(v == null ? null : v / 100)} prefix="" suffix="%" placeholder="% of deals still active at Y3" />
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
                <Field label="ISR Headcount" value={isrFTE} onChange={setIsrFTE} prefix="" />
                <Field label={`${term("sql","singular")} to ${term("qopp","singular")} Rate`} value={sqlToQOppRate == null ? null : sqlToQOppRate * 100} onChange={(v) => setSqlToQOppRate(v == null ? null : v / 100)} prefix="" suffix="%" />
                <Field label={`${term("qopp","singular")} to ${term("sao","singular")} Rate`} value={qOppToSaoRate == null ? null : qOppToSaoRate * 100} onChange={(v) => setQOppToSaoRate(v == null ? null : v / 100)} prefix="" suffix="%" />
                <Field label={`${term("sao","singular")} Win Rate`} value={saoWinRate == null ? null : saoWinRate * 100} onChange={(v) => setSaoWinRate(v == null ? null : v / 100)} prefix="" suffix="%" placeholder="Overrides Close Rate when ISR is in program" />
                <Field label="Program Length (Months)" value={programLengthMonths} onChange={setProgramLengthMonths} prefix="" />
              </Collapsible>

              <Collapsible title="ISR Costs" accent={C.purple} defaultOpen={true}>
                <Field label="Price per ISR / month" value={priceISR} onChange={setPriceISR} />
                <Field label="ISR Discount" value={discountISR} onChange={setDiscountISR} prefix="" suffix="%" />
                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.purple, marginBottom: 10, background: C.purpleLight, borderRadius: 5, padding: "4px 8px" }}>End price: {fmt(calc.endISR)}/mo</div>
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
                <Field label="AE Headcount" value={aeFTE} onChange={setAeFTE} prefix="" />
                <Field label={`${term("sal","singular")} to ${term("sql","singular")} Rate`} value={salToSqlRate == null ? null : salToSqlRate * 100} onChange={(v) => setSalToSqlRate(v == null ? null : v / 100)} prefix="" suffix="%" />
                <Field label="Program Length (Months)" value={programLengthMonths} onChange={setProgramLengthMonths} prefix="" />
              </Collapsible>

              <Collapsible title="AE Costs" accent={C.blue} defaultOpen={true}>
                <Field label="Price per AE / month" value={priceAE} onChange={setPriceAE} />
                <Field label="AE Discount" value={discountAE} onChange={setDiscountAE} prefix="" suffix="%" />
                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.blue, marginBottom: 10, background: C.blueLight, borderRadius: 5, padding: "4px 8px" }}>End price: {fmt(calc.endAE)}/mo</div>
              </Collapsible>

              <button
                onClick={() => setAeFTE(0)}
                style={{ width: "100%", padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, color: C.textLight, fontFamily: "monospace", fontSize: 10, cursor: "pointer", marginTop: 6 }}
              >
                × Remove AE from program
              </button>
            </>
          ))}

          {/* Monthly investment summary (always visible) */}
          <div style={{ ...card(C.blueLight, C.blueBorder), fontSize: 11, fontFamily: "monospace", color: C.blue, marginTop: 10 }}>
            Monthly investment: {fmt(calc.monthlyClientBill)}
          </div>

          {/* ——— ADVANCED: always available, collapsed by default ———————— */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `2px dashed ${C.border}` }}>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Advanced</div>
          </div>

          <Collapsible title="Variable Revenue" accent={C.amber} defaultOpen={false}>
            <Slider label="Variable % of ICV" value={varPct} min={0} max={0.05} step={0.005} onChange={setVarPct} format={pct} color={C.amber} />
          </Collapsible>

          <Collapsible title="Terminology" accent={C.amber} defaultOpen={false}>
            <div style={{ fontSize: 10, color: C.textFaint, marginBottom: 10, lineHeight: 1.5 }}>
              Rename funnel terms to match the client's vocabulary. Updates labels everywhere, including the PDF export.
            </div>
            {Object.keys(DEFAULT_TERMS).map((key) => (
              <div key={key} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: `1px dashed ${C.border}` }}>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: C.amber, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Default: {DEFAULT_TERMS[key].singular}
                </div>
                <TextField
                  label="Singular"
                  value={terms[key].singular}
                  onChange={(v) => setTerms({ ...terms, [key]: { ...terms[key], singular: v } })}
                  placeholder={DEFAULT_TERMS[key].singular}
                />
                <TextField
                  label="Plural"
                  value={terms[key].plural}
                  onChange={(v) => setTerms({ ...terms, [key]: { ...terms[key], plural: v } })}
                  placeholder={DEFAULT_TERMS[key].plural}
                />
              </div>
            ))}
            <button
              onClick={() => setTerms(DEFAULT_TERMS)}
              style={{ width: "100%", padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 5, background: C.white, color: C.textLight, fontFamily: "monospace", fontSize: 10, cursor: "pointer" }}
            >
              × Reset to defaults
            </button>
          </Collapsible>
        </div>

        {/* —— MAIN CONTENT ————————————————————————————————————————————————— */}
        <div ref={mainRef} style={S.main}>

          <div ref={pdfRef} data-pdf-root="true">

          {/* KPI row */}
          {(() => {
            const roiReady = calc.hasACV && calc.hasClose && calc.hasCycle && calc.totalClientSpend > 0;
            const roiNum = roiReady ? calc.totalWonDealValue / calc.totalClientSpend : null;
            const roiDisplay = roiNum == null ? "—" : (Math.round(roiNum * 10) / 10) + "x";
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
                <KPI label="Monthly Investment" value={fmt(calc.monthlyClientBill)} sub={`${aeFTE}AE · ${sdrFTE}SDR · ${isrFTE}ISR + mgmt + data`} color={C.blue} bg={C.blueLight} border={C.blueBorder} />
                <KPI label="Total Client Investment" value={fmt(calc.totalClientSpend)} sub="Program total (billing + fees + setup)" />
                <KPI label={`Total ${term("revenue","singular")}`} value={calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.totalWonDealValue) : "—"} sub="ICV closed from program pipeline" color={C.green} />
                <KPI label="ROI" value={roiDisplay} sub="Won revenue ÷ client investment" color={C.purple} bg={C.purpleLight} border={C.purpleBorder} />
                <KPI label="Client Break-even" value={calc.breakEven > 0 ? `Month ${calc.breakEven}` : "—"} sub="Won rev ≥ client spend" color={C.amber} />
              </div>
            );
          })()}

          {/* Lifetime Revenue KPI row */}
          {(() => {
            const ltRoiReady = calc.hasACV && calc.hasClose && calc.hasCycle && calc.totalClientSpend > 0;
            const fmtRoi = (n) => (n == null ? "—" : (Math.round(n * 10) / 10) + "x");
            const roiY1 = ltRoiReady ? fmtRoi(calc.lifetimeY1 / calc.totalClientSpend) : "—";
            const roiY2 = ltRoiReady ? fmtRoi(calc.lifetimeY2 / calc.totalClientSpend) : "—";
            const roiY3 = ltRoiReady ? fmtRoi(calc.lifetimeY3 / calc.totalClientSpend) : "—";
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                <KPI
                  label="Lifetime Revenue — Y1"
                  value={calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.lifetimeY1) : "—"}
                  sub={`Won + Y1 renewals (${yr1Renewal == null ? "—" : Math.round(yr1Renewal * 100) + "%"})`}
                  color={C.green}
                  bg={C.blueLight}
                  border={C.blueBorder}
                  rightLabel="ROI"
                  rightValue={roiY1}
                />
                <KPI
                  label="Lifetime Revenue — Y2"
                  value={calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.lifetimeY2) : "—"}
                  sub={`Cumulative through Y2 (${yr2Renewal == null ? "—" : Math.round(yr2Renewal * 100) + "%"})`}
                  color={C.green}
                  bg={C.blueLight}
                  border={C.blueBorder}
                  rightLabel="ROI"
                  rightValue={roiY2}
                />
                <KPI
                  label="Lifetime Revenue — Y3"
                  value={calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.lifetimeY3) : "—"}
                  sub={`Cumulative through Y3 (${yr3Renewal == null ? "—" : Math.round(yr3Renewal * 100) + "%"})`}
                  color={C.green}
                  bg={C.blueLight}
                  border={C.blueBorder}
                  rightLabel="ROI"
                  rightValue={roiY3}
                />
              </div>
            );
          })()}

          {/* FUNNEL OVERVIEW — visualization on the left, table card on the right */}
          <div data-pdf-funnel-grid="true" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <FunnelViz
              counts={{
                sals:  calc.totals.sals,
                sqls:  calc.totals.sqls,
                qOpps: calc.totals.qOpps,
                saos:  calc.totals.saos,
                deals: calc.totals.deals,
              }}
              dollars={{
                wonRev: calc.totalWonDealValue,
                ltY1:   calc.lifetimeY1,
                ltY2:   calc.lifetimeY2,
                ltY3:   calc.lifetimeY3,
              }}
              isrInProgram={isrFTE > 0}
              totalClientSpend={calc.totalClientSpend}
              term={term}
            />

            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 6, height: 20, background: isrFTE > 0 ? C.purple : C.teal, borderRadius: 3 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Funnel</span>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint }}>cumulative if engagement continues</span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <ProjectionTable
                  fill
                  rows={[
                    { label: `Total ${term("sal")}`,                values: cumulativeAt(calc.monthly, (x) => x.totalSals,       programLengthMonths, calc.steadyAvgSals),                                color: C.teal,    format: (v) => fmtN(v, 0), enabled: true },
                    { label: `Total ${term("sql")}`,                values: cumulativeAt(calc.monthly, (x) => x.totalSqls,       programLengthMonths, calc.steadyAvgSqls),                                color: "#0d9488", format: (v) => fmtN(v, 0), enabled: true },
                    ...(isrFTE > 0 ? [
                      { label: `Total ${term("qopp")}`,             values: cumulativeAt(calc.monthly, (x) => x.qOpps,           programLengthMonths, calc.steadyAvgQOpps),                               color: C.purple,  format: (v) => fmtN(v, 0), enabled: true },
                      { label: `Total ${term("sao")}`,              values: cumulativeAt(calc.monthly, (x) => x.saos,            programLengthMonths, calc.steadyAvgSaos),                                color: "#7c3aed", format: (v) => fmtN(v, 0), enabled: true },
                    ] : []),
                    { label: `${term("pipeline","singular")} $`,    values: cumulativeAt(calc.monthly, (x) => x.pipelineCreated, programLengthMonths, calc.steadyAvgPipeline),                            color: C.amber,   format: (v) => fmt(v),     enabled: calc.hasACV },
                    { label: `${term("deal")} Won`,                 values: cumulativeAt(calc.monthly, (x) => x.dealsWon,        programLengthMonths, calc.steadyAvgWon),                                 color: C.blue,    format: (v) => fmtN(v, 0), enabled: calc.hasClose },
                    { label: `Total ${term("revenue","singular")}`, values: cumulativeAt(calc.monthly, (x) => (x.dealsWon ?? 0) * (avgContractValue ?? 0), programLengthMonths, calc.steadyAvgWon * (avgContractValue ?? 0)), color: C.green, format: (v) => fmt(v), enabled: calc.hasACV && calc.hasClose },
                  ]}
                  S={S}
                />
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: C.textFaint, textTransform: "uppercase" }}>Total {term("revenue","singular")} (program)</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{(calc.hasACV && calc.hasClose && calc.hasCycle) ? fmt(calc.monthly.reduce((a, x) => a + (x.wonDealValue ?? 0), 0)) : "—"}</span>
              </div>
            </div>
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
                  <td style={{ ...S.tdl, fontWeight: 700, color: C.teal }}>{term("sal")} per SDR (input)</td>
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
                              const len = Math.max(prev.length, i + 1);
                              const next = Array.from({ length: len }, (_, j) => prev[j] ?? 0);
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

                <tr>
                  <td style={S.tdl}>Total {term("sal")}</td>
                  {calc.monthly.map((o) => (
                    <td key={o.m} style={S.td}>{o.inProgram ? fmtN(o.totalSals, 0) : "—"}</td>
                  ))}
                </tr>
                <tr style={{ background: C.bg }}>
                  <td style={S.tdl}>Total {term("sql")} <span style={{ color: C.textFaint, fontWeight: 400 }}>({pct(salToSqlRate)})</span></td>
                  {calc.monthly.map((o) => (
                    <td key={o.m} style={S.td}>{o.inProgram ? fmtN(o.totalSqls, 0) : "—"}</td>
                  ))}
                </tr>
                {isrFTE > 0 && (
                  <tr>
                    <td style={S.tdl}>Total {term("qopp")} <span style={{ color: C.textFaint, fontWeight: 400 }}>({pct(sqlToQOppRate)})</span></td>
                    {calc.monthly.map((o) => (
                      <td key={o.m} style={S.td}>{o.inProgram ? fmtN(o.qOpps, 0) : "—"}</td>
                    ))}
                  </tr>
                )}
                {isrFTE > 0 && (
                  <tr style={{ background: C.bg }}>
                    <td style={S.tdl}>Total {term("sao")} <span style={{ color: C.textFaint, fontWeight: 400 }}>({pct(qOppToSaoRate)})</span></td>
                    {calc.monthly.map((o) => (
                      <td key={o.m} style={S.td}>{o.inProgram ? fmtN(o.saos, 0) : "—"}</td>
                    ))}
                  </tr>
                )}
                <tr>
                  <td style={S.tdl}>Total {term("pipeline","singular")} Created <span style={{ color: C.textFaint, fontWeight: 400 }}>({calc.hasACV ? fmt(avgContractValue) : "ACV"})</span></td>
                  {calc.monthly.map((o) => (
                    <td key={o.m} style={{ ...S.td, color: o.inProgram ? C.teal : C.textFaint }}>
                      {o.inProgram ? (o.pipelineCreated == null ? "—" : fmt(o.pipelineCreated)) : "—"}
                    </td>
                  ))}
                </tr>
                <tr style={{ background: C.bg }}>
                  <td style={S.tdl}>Total {term("deal")} Won <span style={{ color: C.textFaint, fontWeight: 400 }}>({isrFTE > 0 ? (saoWinRate != null ? `${pct(saoWinRate)} ${term("sao","singular")} win rate` : `${term("sao","singular")} win rate`) : (calc.hasClose ? pct(closeRate) : "close rate")})</span></td>
                  {calc.monthly.map((o) => (
                    <td key={o.m} style={{ ...S.td, color: (o.wonDealsCount ?? 0) > 0 ? C.blue : C.textFaint, fontWeight: (o.wonDealsCount ?? 0) > 0 ? 700 : 400 }}>
                      {o.wonDealsCount == null ? "—" : fmtN(o.wonDealsCount, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ ...S.tdl, fontWeight: 700, color: C.text }}>Total Revenue Closed Won (Per Month)</td>
                  {calc.monthly.map((o) => (
                    <td key={o.m} style={{ ...S.td, color: (o.wonDealValue ?? 0) > 0 ? C.green : C.textFaint, fontWeight: (o.wonDealValue ?? 0) > 0 ? 700 : 400 }}>
                      {o.wonDealValue == null ? "—" : fmt(o.wonDealValue)}
                    </td>
                  ))}
                </tr>
                <tr style={{ background: C.bg }}>
                  <td style={{ ...S.tdl, fontWeight: 700, color: C.blue }}>Total Revenue Closed Won (Cumulative)</td>
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
                <span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" }}>Total {term("pipeline","singular")} Created</span>{" "}
                <span style={{ color: C.teal, fontWeight: 700 }}>{calc.hasACV ? fmt(calc.totalPipelineCreated) : "—"}</span>
              </div>
              <div>
                <span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" }}>Total {term("deal")} Won</span>{" "}
                <span style={{ color: C.blue, fontWeight: 700 }}>{calc.hasClose ? fmtN(calc.totalDealsWon, 0) : "—"}</span>
              </div>
              <div>
                <span style={{ color: C.textFaint, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.08em" }}>Total Revenue Won</span>{" "}
                <span style={{ color: C.green, fontWeight: 700 }}>{calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.totalWonDealValue) : "—"}</span>
              </div>
            </div>
            {(!calc.hasACV || !calc.hasClose || !calc.hasCycle) && (
              <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, background: C.amberLight, color: C.amber, fontFamily: "monospace", fontSize: 11 }}>
                Enter {[!calc.hasClose && "Close Rate", !calc.hasACV && "Avg Contract Value", !calc.hasCycle && "Avg Sales Cycle"].filter(Boolean).join(", ")} in the sidebar Client Inputs section to complete the projection.
              </div>
            )}
          </div>

          </div> {/* end pdfRef wrapper */}

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
                    [`${term("revenue","singular")} (ICV)`, calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.totals.wonRev) : "—"],
                    ["Lifetime Revenue — Y1", calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.lifetimeY1) : "—"],
                    ["Lifetime Revenue — Y2", calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.lifetimeY2) : "—"],
                    ["Lifetime Revenue — Y3", calc.hasACV && calc.hasClose && calc.hasCycle ? fmt(calc.lifetimeY3) : "—"],
                    [`${term("pipeline","singular")} Created`, calc.hasACV ? fmt(calc.totals.pipeline) : "—"],
                    [`Total ${term("deal")} Won`, calc.hasClose ? fmtN(calc.totals.deals, 0) : "—"],
                    [`Total ${term("sal")}`, fmtN(calc.totals.sals, 0)],
                    [`Total ${term("sql")}`, fmtN(calc.totals.sqls, 0)],
                    ...(isrFTE > 0 ? [
                      [`Total ${term("qopp")}`, fmtN(calc.totals.qOpps, 0)],
                      [`Total ${term("sao")}`,  fmtN(calc.totals.saos, 0)],
                    ] : []),
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
