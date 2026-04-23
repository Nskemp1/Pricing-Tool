# Break-Even Calculation

Documents how the **Client Break-Even** KPI in the Live Pricing Tool is computed, and how it differs from the original (MemoryBlue-internal) break-even logic that was replaced.

## Current logic — Client Break-Even

The KPI at the top of the dashboard labeled **"Client Break-Even"** answers the question the client cares about: *"In what month does the revenue I win from this program equal what I've paid MemoryBlue so far?"*

For each month `m` in the monthly projection, the calc loop in `src/live_pricing_model.jsx` tracks two running totals:

```js
cumClientSpend += revenue;        // what the client has paid us through month m
cumClientWon   += wonValueForCalc; // won deal ICV the client has realized through month m
if (breakEven === -1 && cumClientWon >= cumClientSpend && cumClientSpend > 0) breakEven = m;
```

Where each month's `revenue` is what the client writes a check for that month:

```
revenue = billingThisMonth        // per-rep pricing × FTE (discount-adjusted), in-program only
        + mgmtThisMonth           // monthly management fee, in-program only
        + dataThisMonth           // monthly data fee, in-program only
        + variableRev             // variable % × won ICV that month
        + setupThisMonth          // one-time setup fee, month 1 only
```

And `wonValueForCalc` is the won deal ICV attributed to month `m`, sourced from the SAL activity `avgSalesCycleMonths` earlier:

```
sourceMonth = m - cycle                                             // which month of pipeline work produced this win
sdrSrcSals  = ramp[sourceMonth - 1] × sdrFTE                        // SALs from that source month
isrSrcSals  = isrRamp[sourceMonth - 1] × isrFTE                     // (if ISR in program)
wonDealValue = (sdrSrcSals + isrSrcSals) × salToSqlRate × avgContractValue × closeRate
```

Break-even fires the first month where cumulative wins catch up to cumulative spend. With a typical 6-month program and 6-month sales cycle, the client pays through months 1–6, then won revenue starts landing in month 7, so break-even typically falls in the M9–M11 range.

## Previous logic — MemoryBlue internal break-even (removed)

Before this change, break-even was computed from **MemoryBlue's** perspective — the month our *cumulative gross margin* turned positive. The original code (removed from `src/live_pricing_model.jsx`) did:

```js
// Revenue from the client
const revenue = billingThisMonth + mgmtThisMonth + dataThisMonth + variableRev + setupThisMonth;

// MemoryBlue's internal cost of delivering
const repSalaries = inProgram ? fixedMonthlyCost : 0;    // sdrFTE × (sdrBase/12) + similar for AE/ISR
const sm          = inProgram ? smMonthlyCost : 0;       // prorated sales-manager overhead
const aeComm      = wonValueForCalc × aeCommPct;         // AE commission on won ICV
const isrComm     = wonValueForCalc × isrCommPct;        // ISR commission on won ICV
const opEx        = inProgram ? (mgmtThisMonth + dataThisMonth) : 0;
const baseCost    = repSalaries + sm + aeComm + isrComm + opEx;
const cos         = baseCost × (1 + fringePct) + setupThisMonth;

// Gross margin and break-even
const gm  = revenue - cos;
cumGM    += gm;
if (breakEven === -1 && cumGM >= 0) breakEven = m;
```

This produced "Month 1" break-even for most programs: an SDR billed to the client at $11,000/mo costs MB ~$4,167/mo in base salary (plus fringe and management allocation) — GM is positive from day one, so `cumGM >= 0` triggers immediately.

## Why the logic was changed

The old metric was a useful *internal* number for MB sales leadership but misleading as a client-facing figure:

- The old "Break-even" in a pricing conversation implied the client would see a return in Month 1, even though they don't see *any* won revenue until month `programLength + cycle` (Month 7 in the default scenario).
- All the inputs feeding the old calculation — annual base salaries, commission percentages, fringe/overhead percentage, sales-manager base/bonus — are MB-internal compensation data that has no place in a tool shown to prospects.
- The Live Pricing Tool's purpose is to demonstrate *the client's* ROI from engaging MB. Break-even in that framing must answer "when does my investment pay off," not "when does MB's margin turn positive."

## What else changed alongside it

When break-even was flipped to the client perspective, the MB-internal calculation inputs were also removed so the tool stops tracking them entirely:

- **Removed sidebar inputs**: SDR / ISR / AE Annual Base Salary, ISR / AE ICV Commission %, Sales Manager Base + Bonus + AEs-per-SM, Fringe / Overhead %, Year 1 & Year 2 Renewal Rates.
- **Removed KPIs**: 3-Year Revenue, 3-Year Gross Margin, Campaign ROI.
- **Removed tabs**: Pipeline Detail (redundant with Expected Outcomes), ICV Waterfall (replaced by a Cumulative ICV row inside Expected Outcomes).
- **Removed Year Summary rows**: Cost of Sales, Gross Margin $, Gross Margin %.

## Where the code lives

- Break-even computation: `src/live_pricing_model.jsx`, inside the `calc` useMemo (search for `cumClientWon >= cumClientSpend`).
- KPI rendering: `src/live_pricing_model.jsx`, in the KPI row (search for `"Client Break-even"`).
- Per-month cashflow rendering (with break-even badge): `src/live_pricing_model.jsx`, in the `tab === "monthly"` block.
