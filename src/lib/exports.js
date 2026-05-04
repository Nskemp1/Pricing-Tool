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
    ["One-time Setup Fee per SDR", inputs.setupFee],
    ["Setup Fee Total", inputs.setupFee * inputs.sdrFTE],
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
  rows.push(["Total Revenue Closed Won (Per Month)", ...months.map((o) => o.wonDealValue ?? null)]);

  let cumICV = 0;
  rows.push(["Total Revenue Closed Won (Cumulative)", ...months.map((o) => {
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

const PDF_SCALE = 3;
const PAGE_MARGIN = 36;
const HEADER_HEIGHT = 64;
const SECTION_BAR_HEIGHT = 26;

// html2canvas doesn't reliably render <input> values, so swap each input with a
// styled <span> showing the same text for the duration of the capture.
function freezeInputs(element) {
  const inputs = element.querySelectorAll("input");
  const restorers = [];
  inputs.forEach((input) => {
    const cs = window.getComputedStyle(input);
    const span = document.createElement("span");
    span.textContent = input.value || "";
    span.style.cssText = `
      display: inline-block;
      box-sizing: border-box;
      width: ${input.offsetWidth}px;
      height: ${input.offsetHeight}px;
      line-height: ${input.offsetHeight}px;
      padding: 0 ${cs.paddingRight} 0 ${cs.paddingLeft};
      background: ${cs.backgroundColor};
      border: ${cs.borderTopWidth} solid ${cs.borderTopColor};
      border-radius: ${cs.borderRadius};
      color: ${cs.color};
      font: ${cs.font};
      font-family: ${cs.fontFamily};
      font-size: ${cs.fontSize};
      font-weight: ${cs.fontWeight};
      text-align: ${cs.textAlign === "start" ? "right" : cs.textAlign};
      vertical-align: middle;
    `;
    const prevDisplay = input.style.display;
    input.style.display = "none";
    input.parentNode.insertBefore(span, input);
    restorers.push(() => {
      span.parentNode.removeChild(span);
      input.style.display = prevDisplay;
    });
  });
  return () => restorers.forEach((r) => r());
}

async function captureCanvas(element, html2canvas) {
  const prev = {
    overflow: element.style.overflow,
    height: element.style.height,
    maxHeight: element.style.maxHeight,
  };
  element.style.overflow = "visible";
  element.style.height = "auto";
  element.style.maxHeight = "none";
  const restoreInputs = freezeInputs(element);
  try {
    return await html2canvas(element, {
      scale: PDF_SCALE,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });
  } finally {
    restoreInputs();
    element.style.overflow = prev.overflow;
    element.style.height = prev.height;
    element.style.maxHeight = prev.maxHeight;
  }
}

function teamLine(inputs) {
  const parts = [
    inputs.aeFTE > 0 && `${inputs.aeFTE} AE`,
    inputs.sdrFTE > 0 && `${inputs.sdrFTE} SDR`,
    inputs.isrFTE > 0 && `${inputs.isrFTE} ISR`,
  ].filter(Boolean);
  const team = parts.length ? parts.join(" · ") : "No reps configured";
  return `${team} · ${inputs.programLengthMonths}mo program`;
}

function drawHeader(pdf, inputs, pageW) {
  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(29, 78, 216); // C.blue
  pdf.text("MemoryBlue Pricing Proposal", PAGE_MARGIN, PAGE_MARGIN + 14);

  // Subtitle
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139); // C.textLight
  pdf.text(`Generated ${todayStamp()} · ${teamLine(inputs)}`, PAGE_MARGIN, PAGE_MARGIN + 32);

  // Divider
  pdf.setDrawColor(226, 232, 240); // C.border
  pdf.setLineWidth(0.5);
  pdf.line(PAGE_MARGIN, PAGE_MARGIN + 44, pageW - PAGE_MARGIN, PAGE_MARGIN + 44);

  return PAGE_MARGIN + HEADER_HEIGHT;
}

function drawSectionBar(pdf, label, accent, x, y) {
  // Accent bar on left
  pdf.setFillColor(...accent);
  pdf.rect(x, y, 4, 18, "F");
  // Label
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(15, 23, 42); // C.text
  pdf.text(label, x + 12, y + 13);
  return y + SECTION_BAR_HEIGHT;
}

function placeCanvas(pdf, canvas, startY, pageW, pageH) {
  const usableW = pageW - PAGE_MARGIN * 2;
  const ratio = usableW / canvas.width;
  const scaledFullH = canvas.height * ratio;
  const usableH = pageH - PAGE_MARGIN - startY;

  if (scaledFullH <= usableH) {
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", PAGE_MARGIN, startY, usableW, scaledFullH);
    return;
  }

  // Paginate. First slice fits in (pageH - startY - margin); subsequent slices use full usable height.
  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width = canvas.width;
  const ctx = sliceCanvas.getContext("2d");

  let y = 0;
  let isFirst = true;
  while (y < canvas.height) {
    const availPdfH = isFirst ? usableH : (pageH - PAGE_MARGIN * 2);
    const sliceCanvasH = Math.floor(availPdfH / ratio);
    const remaining = canvas.height - y;
    const thisH = Math.min(sliceCanvasH, remaining);
    sliceCanvas.height = thisH;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, thisH);
    ctx.drawImage(canvas, 0, y, canvas.width, thisH, 0, 0, canvas.width, thisH);

    if (!isFirst) pdf.addPage();
    const drawY = isFirst ? startY : PAGE_MARGIN;
    pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", PAGE_MARGIN, drawY, usableW, thisH * ratio);

    y += thisH;
    isFirst = false;
  }
}

export async function exportToPdf(element, inputs, opts = {}) {
  if (!element) throw new Error("No element to capture");
  const { setTabAndWait, originalTab, tabs } = opts;

  const [{ jsPDF }, html2canvasMod] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const html2canvas = html2canvasMod.default;

  // Capture each tab (or just the current view if no tab cycling provided).
  const captures = [];
  if (setTabAndWait && tabs && tabs.length) {
    for (const t of tabs) {
      await setTabAndWait(t.key);
      const canvas = await captureCanvas(element, html2canvas);
      captures.push({ label: t.label, accent: t.accent, canvas });
    }
    if (originalTab !== undefined) await setTabAndWait(originalTab);
  } else {
    const canvas = await captureCanvas(element, html2canvas);
    captures.push({ label: null, canvas });
  }

  // Build PDF.
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  let y = drawHeader(pdf, inputs, pageW);
  for (let i = 0; i < captures.length; i++) {
    if (i > 0) {
      pdf.addPage();
      y = PAGE_MARGIN;
    }
    if (captures[i].label) {
      const accent = captures[i].accent || [29, 78, 216]; // default C.blue rgb
      y = drawSectionBar(pdf, captures[i].label, accent, PAGE_MARGIN, y);
    }
    placeCanvas(pdf, captures[i].canvas, y, pageW, pageH);
  }

  pdf.save(buildFilename(inputs, "pdf"));
}
