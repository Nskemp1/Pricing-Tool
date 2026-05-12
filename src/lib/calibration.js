// Calibration data for the Calibrate to Client sidebar. Drives the
// SALs per SDR (input) ramp in the Expected Outcomes table when a rep
// selects a Vertical (and optionally a Company Size tier).
//
// Eventually this will be backed by a ZoomInfo dataset; for now the
// tables are inlined.

// Aggregated per-vertical defaults (used when no Company Size selected OR
// the specific (vertical, tier) combo has no data). 13 verticals; Real
// Estate Tech intentionally omitted.
export const VERTICAL_RAMP = {
  "AI":                                         [4, 5, 7, 7, 7, 6],
  "Cybersecurity":                              [4, 6, 6, 7, 7, 7],
  "Data":                                       [3, 5, 6, 7, 6, 7],
  "Education":                                  [5, 8, 7, 7, 8, 7],
  "FinTech":                                    [4, 6, 5, 6, 5, 7],
  "Gov Tech":                                   [6, 8, 11, 10, 11, 17],
  "HR Tech":                                    [5, 4, 6, 7, 5, 6],
  "Health Tech":                                [4, 8, 7, 8, 7, 6],
  "Legal Tech":                                 [8, 10, 11, 9, 11, 8],
  "Networking/Communication":                   [8, 7, 10, 10, 8, 10],
  "Professional Services":                      [3, 5, 6, 6, 6, 7],
  "Sales/Marketing/Customer Tech":              [4, 6, 6, 6, 5, 5],
  "Supply Chain/Logistics/Transportation Tech": [7, 10, 10, 9, 9, 9],
};

// Per (vertical, tier) refinement. Key format: `${vertical}|${tier}`.
// Empty source cells (e.g., AI Enterprise/Strategic M5–M6) are recorded
// as 0.
export const VERTICAL_TIER_RAMP = {
  "AI|Startup":                                                      [5, 5, 8, 9, 8, 5],
  "AI|SMB":                                                          [4, 6, 8, 7, 6, 6],
  "AI|Enterprise/Strategic":                                         [0, 1, 2, 1, 0, 0],
  "Cybersecurity|Startup":                                           [5, 7, 9, 8, 8, 6],
  "Cybersecurity|SMB":                                               [3, 5, 5, 6, 6, 7],
  "Cybersecurity|Mid-Market":                                        [4, 6, 5, 7, 8, 8],
  "Cybersecurity|Enterprise/Strategic":                              [2, 2, 2, 6, 3, 2],
  "Data|Startup":                                                    [3, 5, 6, 7, 5, 7],
  "Data|SMB":                                                        [4, 6, 6, 8, 8, 9],
  "Data|Mid-Market":                                                 [2, 5, 6, 7, 5, 3],
  "Data|Enterprise/Strategic":                                       [2, 4, 4, 5, 5, 3],
  "Education|Startup":                                               [4, 11, 6, 8, 7, 8],
  "Education|SMB":                                                   [5, 6, 7, 7, 9, 6],
  "Education|Mid-Market":                                            [8, 9, 9, 5, 9, 12],
  "FinTech|Startup":                                                 [3, 5, 5, 5, 4, 6],
  "FinTech|SMB":                                                     [3, 0, 1, 1, 2, 0],
  "FinTech|Mid-Market":                                              [5, 9, 8, 10, 7, 11],
  "FinTech|Enterprise/Strategic":                                    [5, 6, 7, 7, 7, 7],
  "Gov Tech|Startup":                                                [7, 10, 10, 11, 10, 19],
  "Gov Tech|SMB":                                                    [5, 7, 11, 10, 12, 16],
  "HR Tech|SMB":                                                     [5, 3, 5, 7, 4, 4],
  "HR Tech|Mid-Market":                                              [4, 6, 8, 6, 6, 8],
  "Health Tech|Startup":                                             [4, 11, 7, 9, 9, 7],
  "Health Tech|SMB":                                                 [3, 4, 4, 6, 5, 3],
  "Health Tech|Mid-Market":                                          [4, 6, 11, 6, 7, 13],
  "Legal Tech|Startup":                                              [8, 11, 12, 9, 13, 8],
  "Legal Tech|SMB":                                                  [5, 7, 7, 7, 6, 5],
  "Legal Tech|Mid-Market":                                           [7, 8, 10, 8, 9, 9],
  "Networking/Communication|Startup":                                [14, 11, 14, 13, 5, 7],
  "Networking/Communication|SMB":                                    [4, 5, 10, 8, 8, 7],
  "Networking/Communication|Enterprise/Strategic":                   [1, 2, 2, 6, 12, 16],
  "Professional Services|Startup":                                   [4, 5, 6, 5, 4, 8],
  "Professional Services|SMB":                                       [4, 6, 6, 6, 6, 6],
  "Professional Services|Mid-Market":                                [3, 5, 5, 6, 6, 6],
  "Professional Services|Enterprise/Strategic":                      [4, 8, 8, 10, 11, 11],
  "Sales/Marketing/Customer Tech|Startup":                           [4, 4, 4, 6, 3, 4],
  "Sales/Marketing/Customer Tech|SMB":                               [3, 5, 5, 5, 5, 6],
  "Sales/Marketing/Customer Tech|Mid-Market":                        [6, 8, 10, 7, 7, 6],
  "Sales/Marketing/Customer Tech|Enterprise/Strategic":              [1, 6, 7, 3, 5, 0],
  "Supply Chain/Logistics/Transportation Tech|Startup":              [10, 10, 10, 6, 10, 12],
  "Supply Chain/Logistics/Transportation Tech|SMB":                  [3, 8, 9, 9, 7, 7],
  "Supply Chain/Logistics/Transportation Tech|Mid-Market":           [6, 10, 9, 13, 11, 11],
  "Supply Chain/Logistics/Transportation Tech|Enterprise/Strategic": [9, 30, 14, 9, 10, 7],
};

export const DEFAULT_RAMP = [3, 6, 8, 12, 12, 12];

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
