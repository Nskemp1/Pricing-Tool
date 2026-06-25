// Calibration data for the Calibrate to Client sidebar. Drives the
// SALs per SDR (input) ramp in the Expected Outcomes table when a rep
// selects a Vertical (and optionally a Company Size tier).
//
// Eventually this will be backed by a ZoomInfo dataset; for now the
// tables are inlined.

// Aggregated per-vertical defaults (used when no Company Size selected OR
// the specific (vertical, tier) combo has no data). 13 verticals; Real
// Estate Tech intentionally omitted.
// For the 6 verticals with full (vertical, tier) coverage — Cybersecurity,
// Data, FinTech, Professional Services, Sales/Marketing/Customer Tech and
// Supply Chain — the aggregate is the SMB tier (most common client bucket).
// The remaining verticals use their own blended aggregate.
export const VERTICAL_RAMP = {
  "AI":                                         [1, 3, 5, 7, 7, 7],
  "Cybersecurity":                              [1, 3, 5, 7, 7, 7],
  "Data":                                       [1, 3, 5, 8, 8, 9],
  "Education":                                  [1, 3, 5, 7, 7, 7],
  "FinTech":                                    [1, 3, 5, 7, 7, 8],
  "Gov Tech":                                   [1, 3, 5, 10, 10, 10],
  "HR Tech":                                    [1, 3, 5, 7, 7, 7],
  "Health Tech":                                [1, 3, 5, 8, 8, 8],
  "Legal Tech":                                 [1, 3, 5, 9, 9, 9],
  "Networking/Communication":                   [1, 3, 5, 10, 10, 10],
  "Professional Services":                      [1, 3, 5, 7, 7, 7],
  "Sales/Marketing/Customer Tech":              [1, 3, 5, 6, 6, 6],
  "Supply Chain/Logistics/Transportation Tech": [1, 3, 5, 7, 7, 7],
};

// Per (vertical, tier) refinement. Key format: `${vertical}|${tier}`.
export const VERTICAL_TIER_RAMP = {
  "AI|Startup":                                                      [1, 3, 5, 8, 8, 8],
  "AI|SMB":                                                          [1, 3, 5, 7, 7, 7],
  "AI|Enterprise":                                         [0, 1, 1, 1, 1, 1],
  "Cybersecurity|Startup":                                           [1, 3, 5, 8, 8, 8],
  "Cybersecurity|SMB":                                               [1, 3, 5, 7, 7, 7],
  "Cybersecurity|Mid-Market":                                        [1, 3, 5, 7, 8, 8],
  "Cybersecurity|Enterprise":                              [0, 1, 3, 6, 6, 6],
  "Data|Startup":                                                    [1, 3, 5, 7, 7, 7],
  "Data|SMB":                                                        [1, 3, 5, 8, 8, 9],
  "Data|Mid-Market":                                                 [1, 3, 5, 7, 7, 7],
  "Data|Enterprise":                                       [0, 1, 3, 5, 5, 5],
  "Education|Startup":                                               [1, 3, 5, 8, 8, 8],
  "Education|SMB":                                                   [1, 3, 5, 9, 9, 9],
  "Education|Mid-Market":                                            [1, 3, 5, 9, 9, 9],
  "FinTech|Startup":                                                 [1, 3, 5, 6, 6, 6],
  "FinTech|SMB":                                                     [1, 3, 5, 7, 7, 8],
  "FinTech|Mid-Market":                                              [1, 3, 5, 9, 9, 9],
  "FinTech|Enterprise":                                    [1, 3, 5, 7, 7, 7],
  "Gov Tech|Startup":                                                [1, 3, 5, 11, 11, 11],
  "Gov Tech|SMB":                                                    [1, 3, 5, 10, 10, 10],
  "HR Tech|SMB":                                                     [1, 3, 5, 7, 7, 7],
  "HR Tech|Mid-Market":                                              [1, 3, 5, 8, 8, 8],
  "Health Tech|Startup":                                             [1, 3, 5, 9, 9, 9],
  "Health Tech|SMB":                                                 [1, 3, 5, 6, 6, 6],
  "Health Tech|Mid-Market":                                          [1, 3, 5, 6, 8, 10],
  "Legal Tech|Startup":                                              [1, 3, 5, 9, 9, 9],
  "Legal Tech|SMB":                                                  [1, 3, 5, 7, 7, 7],
  "Legal Tech|Mid-Market":                                           [1, 3, 5, 9, 9, 9],
  "Networking/Communication|Startup":                                [1, 3, 5, 7, 8, 8],
  "Networking/Communication|SMB":                                    [1, 3, 5, 8, 8, 8],
  "Networking/Communication|Enterprise":                   [1, 3, 5, 10, 10, 10],
  "Professional Services|Startup":                                   [1, 3, 5, 8, 8, 8],
  "Professional Services|SMB":                                       [1, 3, 5, 7, 7, 7],
  "Professional Services|Mid-Market":                                [1, 3, 5, 7, 7, 7],
  "Professional Services|Enterprise":                      [1, 3, 5, 9, 9, 9],
  "Sales/Marketing/Customer Tech|Startup":                           [0, 2, 3, 6, 6, 6],
  "Sales/Marketing/Customer Tech|SMB":                               [1, 3, 5, 6, 6, 6],
  "Sales/Marketing/Customer Tech|Mid-Market":                        [1, 3, 5, 7, 7, 7],
  "Sales/Marketing/Customer Tech|Enterprise":              [0, 1, 3, 3, 3, 3],
  "Supply Chain/Logistics/Transportation Tech|Startup":              [1, 3, 5, 6, 10, 12],
  "Supply Chain/Logistics/Transportation Tech|SMB":                  [1, 3, 5, 7, 7, 7],
  "Supply Chain/Logistics/Transportation Tech|Mid-Market":           [1, 3, 5, 11, 11, 11],
  "Supply Chain/Logistics/Transportation Tech|Enterprise": [1, 3, 5, 9, 9, 9],
};

export const DEFAULT_RAMP = [1, 3, 5, 10, 10, 10];

// Fully-loaded internal monthly cost to employ one rep in-house, by role.
// = base salary/12 + commission + benefits/payroll tax + tech stack + data
//   platforms + manager allocation + RevOps allocation + recruiting amortization
//   + training/ramp. PLACEHOLDER values — replace with sourced benchmarks
//   (US / DC-metro market) before client use.
export const INTERNAL_FULLY_LOADED = {
  sdr: 13500,
  isr: 12330,
  ae:  18700,
};

// Returns a length-`programLengthMonths` ramp array, or null when there is
// no calibration data at all for the chosen vertical (caller decides what
// to do, e.g. fall back to DEFAULT_RAMP for Real Estate Tech).
//   - tier may be undefined/null when only the vertical is chosen.
//   - When a (vertical, tier) combo isn't in VERTICAL_TIER_RAMP, fall back
//     to VERTICAL_RAMP[vertical].
//   - For program length > 6, pad months 7+ with the M6 (steady-state) value.
//   - For program length < 6, truncate to the first N values.
export function getCalibratedRamp(vertical, tier, programLengthMonths) {
  if (!vertical) return null;
  const tierKey = tier ? `${vertical}|${tier}` : null;
  const base = (tierKey && VERTICAL_TIER_RAMP[tierKey]) || VERTICAL_RAMP[vertical] || null;
  if (!base) return null;
  const steady = base[base.length - 1];
  return Array.from({ length: programLengthMonths }, (_, i) =>
    i < base.length ? base[i] : steady
  );
}

// Extend/truncate the app default ramp to a given program length, padding
// with the steady-state value beyond month 6.
export function defaultRampForLength(programLengthMonths) {
  const steady = DEFAULT_RAMP[DEFAULT_RAMP.length - 1];
  return Array.from({ length: programLengthMonths }, (_, i) =>
    i < DEFAULT_RAMP.length ? DEFAULT_RAMP[i] : steady
  );
}
