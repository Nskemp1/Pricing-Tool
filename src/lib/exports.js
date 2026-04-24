// Export helpers for the Live Pricing Tool.
// Excel: SheetJS (xlsx). PDF: jsPDF + html2canvas. All loaded via dynamic import
// so the ~900KB of libs only ship to users who actually click Export.

function todayStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function buildFilename(inputs, ext) {
  const team = [
    inputs.aeFTE > 0 && `${inputs.aeFTE}AE`,
    inputs.sdrFTE > 0 && `${inputs.sdrFTE}SDR`,
    inputs.isrFTE > 0 && `${inputs.isrFTE}ISR`,
  ].filter(Boolean).join("-") || "NoTeam";
  return `MemoryBlue-Pricing-${todayStamp()}-${team}.${ext}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL
// ─────────────────────────────────────────────────────────────────────────────

function sheetSummary(calc, inputs) {
  const rows = [
    ["MemoryBlue Pricing Proposal"],
    [`Generated ${todayStamp()}`],
    [],
    ["Team"],
    ["AE FTE", inputs.aeFTE],
    ["SDR FTE", inputs.sdrFTE],
    ["ISR FTE", inputs.isrFTE],
    [],
    ["Pricing"],
    ["Price per AE / month", inputs.priceAE],
    ["AE Discount %", inputs.discountAE],
    ["Price per SDR / month", inputs.priceSDR],
    ["SDR Discount %", inputs.discountSDR],
    ["Price per ISR / month", inputs.priceISR],
    ["ISR Discount %", inputs.discountISR],
    ["One-time Setup Fee", inputs.setupFee],
    ["Monthly Management", inputs.monthlyManagement],
    ["Monthly Data", inputs.monthlyData],
    [],
    ["Client Inputs"],
    ["Close Rate", inputs.closeRate],
    ["Avg Contract Value", inputs.avgContractValue],
    ["Avg Sales Cycle (Months)", inputs.avgSalesCycleMonths],
    ["Program Length (Months)", inputs.programLengthMonths],
    [],
    ["KPIs"],
    ["Monthly Billing (client total)", calc.monthlyClientBill],
    ["Total Client Investment", calc.totalClientSpend],
    ["Total Won Revenue (ICV)", calc.totalWonDealValue],
    ["Client Break-even (month)", calc.breakEven > 0 ? calc.breakEven : "—"],
    [],
    ["Program Totals"],
    ["Client Investment", calc.totalClientSpend],
    ["Won Revenue (ICV)", calc.totals.wonRev],
    ["Pipeline Created", calc.totals.pipeline],
    ["Total Deals Won", calc.totals.deals],
    ["Total SALs", calc.totals.sals],
    ["Total SQLs", calc.totals.sqls],
  ];
  return rows;
}

function sheetPipelineProjection(label, steady, hasACV, hasClose, acv) {
  const milestones = [3, 6, 12, 24];
  const header = ["Metric", "M3", "M6", "Year 1", "Year 2"];
  const rows = [
    [`${label} — cumulative if engagement continues at steady state`],
    [],
    header,
    ["Total SALs", ...milestones.map((n) => steady.sals * n)],
    ["Total SQLs", ...milestones.map((n) => steady.sqls * n)],
    ["Pipeline $", ...milestones.map((n) => hasACV ? steady.pipeline * n : null)],
    ["Deals Won", ...milestones.map((n) => hasClose ? steady.won * n : null)],
    ["Total Won ICV", ...milestones.map((n) => (hasACV && hasClose) ? steady.won * (acv ?? 0) * n : null)],
  ];
  return rows;
}

function sheetExpectedOutcomes(calc, inputs) {
  const months = calc.monthly;
  const monthHeaders = months.map((o) => o.inProgram ? `M${o.m}` : `M${o.m} (tail)`);
  const rows = [["Metric", ...monthHeaders]];

  rows.push(["SALs per SDR (input)", ...months.map((o, i) => o.inProgram ? (inputs.ramp[i] ?? 0) : null)]);
  if (inputs.isrFTE > 0) {
    rows.push(["SALs per ISR (input)", ...months.map((o, i) => o.inProgram ? (inputs.isrRamp[i] ?? 0) : null)]);
  }
  rows.push(["Total SALs", ...months.map((o) => o.inProgram ? o.totalSals : null)]);
  rows.push(["Total SQLs", ...months.map((o) => o.inProgram ? o.totalSqls : null)]);
  rows.push(["Pipeline Created", ...months.map((o) => o.inProgram ? (o.pipelineCreated ?? null) : null)]);
  rows.push(["Total Deals Won", ...months.map((o) => o.wonDealsCount ?? null)]);
  rows.push(["Won Deal Value (ICV)", ...months.map((o) => o.wonDealValue ?? null)]);

  let cumICV = 0;
  rows.push(["Cumulative ICV", ...months.map((o) => {
    cumICV += (o.wonDealValue ?? 0);
    return o.wonDealValue == null ? null : cumICV;
  })]);

  return rows;
}

function sheetMonthlyCashflow(calc) {
  const rows = [["Month", "Client Spend", "Won Revenue", "Cumulative Spend", "Cumulative Won", "Net Position"]];
  for (const x of calc.monthly) {
    const net = (x.cumClientWon ?? 0) - (x.cumClientSpend ?? 0);
    rows.push([
      x.inProgram ? `M${x.m}` : `M${x.m} (tail)`,
      x.revenue,
      x.wonDealValue ?? null,
      x.cumClientSpend,
      x.cumClientWon,
      net,
    ]);
  }
  return rows;
}

export async function exportToExcel(calc, inputs) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const add = (name, aoa) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);

  add("Summary", sheetSummary(calc, inputs));
  add("SDR Pipeline", sheetPipelineProjection(
    "SDR",
    { sals: calc.steadySdrAvgSals, sqls: calc.steadySdrAvgSqls, pipeline: calc.steadySdrAvgPipeline, won: calc.steadySdrAvgWon },
    calc.hasACV, calc.hasClose, inputs.avgContractValue,
  ));
  if (inputs.isrFTE > 0) {
    add("ISR Pipeline", sheetPipelineProjection(
      "ISR",
      { sals: calc.steadyIsrAvgSals, sqls: calc.steadyIsrAvgSqls, pipeline: calc.steadyIsrAvgPipeline, won: calc.steadyIsrAvgWon },
      calc.hasACV, calc.hasClose, inputs.avgContractValue,
    ));
  }
  add("Expected Outcomes", sheetExpectedOutcomes(calc, inputs));
  add("Monthly Cashflow", sheetMonthlyCashflow(calc));

  XLSX.writeFile(wb, buildFilename(inputs, "xlsx"));
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────────────────────

export async function exportToPdf(element, inputs) {
  if (!element) throw new Error("No element to capture");

  const [{ jsPDF }, html2canvasMod] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const html2canvas = html2canvasMod.default;

  // Temporarily expand the scrollable container so html2canvas captures the full content.
  const prev = {
    overflow: element.style.overflow,
    height: element.style.height,
    maxHeight: element.style.maxHeight,
  };
  element.style.overflow = "visible";
  element.style.height = "auto";
  element.style.maxHeight = "none";

  let canvas;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });
  } finally {
    element.style.overflow = prev.overflow;
    element.style.height = prev.height;
    element.style.maxHeight = prev.maxHeight;
  }

  // Letter portrait, 36pt margins.
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2;

  // Scale canvas to fit width, then paginate vertically.
  const ratio = usableW / canvas.width;
  const scaledFullH = canvas.height * ratio;

  if (scaledFullH <= usableH) {
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, usableW, scaledFullH);
  } else {
    // Slice the canvas into page-height chunks.
    const sliceCanvasH = Math.floor(usableH / ratio); // canvas pixels per page
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceCanvasH;
    const ctx = sliceCanvas.getContext("2d");

    let y = 0;
    let firstPage = true;
    while (y < canvas.height) {
      const remaining = canvas.height - y;
      const thisH = Math.min(sliceCanvasH, remaining);
      sliceCanvas.height = thisH;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sliceCanvas.width, thisH);
      ctx.drawImage(canvas, 0, y, canvas.width, thisH, 0, 0, canvas.width, thisH);
      const imgData = sliceCanvas.toDataURL("image/png");
      if (!firstPage) pdf.addPage();
      firstPage = false;
      pdf.addImage(imgData, "PNG", margin, margin, usableW, thisH * ratio);
      y += thisH;
    }
  }

  pdf.save(buildFilename(inputs, "pdf"));
}
