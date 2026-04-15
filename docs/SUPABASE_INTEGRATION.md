# Supabase Integration — Historical Reference

This file documents the Supabase-backed data integration that the Pricing Tool USED to depend on for its ROI calculator. The data-plane integration has been intentionally removed from the live tool because the sales rep now enters every relevant input (SAL→SQL rate, close rate, ACV, sales cycle, ramp) directly. Supabase is retained **only** as the authentication gate.

This document is a complete record so that the integration can be reconstructed later if needed (e.g., for the post-close "actual vs projected" tracking feature).

**Last verified:** April 2026

---

## 1. Supabase Project Identity

| Setting | Value |
|---|---|
| Project ID | `hvzkrfresrudvlmrjnwy` |
| URL | `https://hvzkrfresrudvlmrjnwy.supabase.co` |
| Env vars (set in `.env.local`) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Exposed schemas (Dashboard > Settings > API) | `public, pricing_tool` |

The anon key is a legacy JWT-style key. A newer publishable key exists (`sb_publishable_L51n8zqL-eQooBRtcukIKA_1-2oYAyY`) but the app uses the legacy key.

---

## 2. Database Objects

The integration used four **views** in the `pricing_tool` schema, plus two **tables** in `public`.

### 2.1 View: `pricing_tool.benchmarks_global`

Single-row view returning global averages across all opportunities, leads, and orders from the last 3 years.

**Columns:**

| Column | Type | Meaning |
|---|---|---|
| `sql_to_quote_rate` | numeric | Opps that reached scoping / all opps |
| `quote_to_win_rate` | numeric | Deals closed / opps that reached scoping |
| `overall_win_rate` | numeric | Deal Closed / (Deal Closed + Closed Lost) |
| `avg_icv_won` | numeric | Avg initial_contract_value__c of won deals (> $0) |
| `avg_amount_won` | numeric | Avg monthly amount of won deals |
| `avg_fte_sold` | numeric | Avg FTE count per won deal |
| `avg_months_to_close` | numeric | Avg sales cycle in months |
| `avg_occur_rate` | numeric | Avg monthly occur rate over last 12 full months |
| `avg_monthly_leads_booked` | numeric | Avg bookings per month |
| `yr1_renewal_rate` | numeric | **SEE BUG IN SECTION 3** |
| `yr2_renewal_rate` | numeric | `yr1_renewal_rate × 0.90` (hardcoded multiplier) |
| `avg_active_months` | numeric | Avg months_mature__c on active orders |
| `avg_initial_commitment_days` | numeric | Avg IC duration |
| `calculated_at` | timestamptz | `now()` at query time |

**Full SQL definition:**

```sql
CREATE OR REPLACE VIEW pricing_tool.benchmarks_global AS
WITH opp_stats AS (
  SELECT
    round(count(*) FILTER (WHERE date_of_scoping__c IS NOT NULL)::numeric
          / NULLIF(count(*), 0)::numeric, 3) AS sql_to_quote_rate,
    round(count(*) FILTER (WHERE date_of_scoping__c IS NOT NULL
                                  AND stage_name = 'Deal Closed')::numeric
          / NULLIF(count(*) FILTER (WHERE date_of_scoping__c IS NOT NULL), 0)::numeric, 3) AS quote_to_win_rate,
    round(count(*) FILTER (WHERE stage_name = 'Deal Closed')::numeric
          / NULLIF(count(*) FILTER (WHERE stage_name = ANY (ARRAY['Deal Closed','Closed Lost'])), 0)::numeric, 3) AS overall_win_rate,
    round(avg(initial_contract_value__c) FILTER (WHERE stage_name = 'Deal Closed' AND initial_contract_value__c > 0), 0) AS avg_icv_won,
    round(avg(amount) FILTER (WHERE stage_name = 'Deal Closed' AND amount > 0), 0) AS avg_amount_won,
    round(avg(fte__c) FILTER (WHERE stage_name = 'Deal Closed' AND fte__c > 0), 2) AS avg_fte_sold,
    round(avg(EXTRACT(epoch FROM close_date::timestamptz - created_date) / (86400 * 30)::numeric)
          FILTER (WHERE stage_name = 'Deal Closed' AND created_date IS NOT NULL), 1) AS avg_months_to_close
  FROM opportunity
  WHERE is_deleted = false AND created_date >= (now() - interval '3 years')
),
occur_stats AS (
  SELECT
    round(avg(m.occur_rate), 3) AS avg_occur_rate,
    round(avg(m.total_booked), 0) AS avg_monthly_leads_booked
  FROM (
    SELECT
      date_trunc('month', booking_date__c::timestamptz) AS month,
      count(*) AS total_booked,
      round(count(*) FILTER (WHERE lead_status__c = 'Occurred')::numeric / NULLIF(count(*), 0)::numeric, 3) AS occur_rate
    FROM mb_lead__c
    WHERE is_deleted = false
      AND booking_date__c >= (now() - interval '1 year')
      AND booking_date__c < date_trunc('month', now())
      AND booking_date__c IS NOT NULL
    GROUP BY 1
  ) m
),
renewal_stats AS (
  SELECT
    round(count(*) FILTER (WHERE post_initial_commit__c = true AND cancel__c = false)::numeric
          / NULLIF(count(*) FILTER (WHERE post_initial_commit__c = true), 0)::numeric, 3) AS yr1_renewal_rate,
    round(avg(months_mature__c) FILTER (WHERE active_order__c = true), 1) AS avg_active_months,
    round(avg(initial_commitment_days__c) FILTER (WHERE initial_commitment_days__c > 0), 0) AS avg_initial_commitment_days
  FROM salesforce_order
  WHERE is_deleted = false
)
SELECT
  o.sql_to_quote_rate, o.quote_to_win_rate, o.overall_win_rate,
  o.avg_icv_won, o.avg_amount_won, o.avg_fte_sold, o.avg_months_to_close,
  oc.avg_occur_rate, oc.avg_monthly_leads_booked,
  r.yr1_renewal_rate,
  round(r.yr1_renewal_rate * 0.90, 3) AS yr2_renewal_rate,
  r.avg_active_months, r.avg_initial_commitment_days,
  now() AS calculated_at
FROM opp_stats o
CROSS JOIN occur_stats oc
CROSS JOIN renewal_stats r;
```

**Grants:** `authenticated` has SELECT. No RLS on views (inherit from underlying tables).

---

### 2.2 View: `pricing_tool.benchmarks_by_vertical`

One row per vertical with `>= 10` deals in the closed-deal buckets.

**Columns:** `vertical, deals_won, deals_lost, open_pipeline, win_rate, sql_to_quote_rate, quote_to_win_rate, avg_icv, avg_amount, avg_fte_sold, avg_commitment_months`

**Full SQL definition:**

```sql
CREATE OR REPLACE VIEW pricing_tool.benchmarks_by_vertical AS
SELECT
  vertical__c AS vertical,
  count(*) FILTER (WHERE stage_name = 'Deal Closed') AS deals_won,
  count(*) FILTER (WHERE stage_name = 'Closed Lost') AS deals_lost,
  count(*) FILTER (WHERE stage_name <> ALL (ARRAY['Deal Closed','Closed Lost','No Opportunity'])) AS open_pipeline,
  round(count(*) FILTER (WHERE stage_name = 'Deal Closed')::numeric
        / NULLIF(count(*) FILTER (WHERE stage_name = ANY (ARRAY['Deal Closed','Closed Lost'])), 0)::numeric, 3) AS win_rate,
  round(count(*) FILTER (WHERE date_of_scoping__c IS NOT NULL)::numeric
        / NULLIF(count(*), 0)::numeric, 3) AS sql_to_quote_rate,
  round(count(*) FILTER (WHERE date_of_scoping__c IS NOT NULL AND stage_name = 'Deal Closed')::numeric
        / NULLIF(count(*) FILTER (WHERE date_of_scoping__c IS NOT NULL), 0)::numeric, 3) AS quote_to_win_rate,
  round(avg(initial_contract_value__c) FILTER (WHERE stage_name = 'Deal Closed' AND initial_contract_value__c > 0), 0) AS avg_icv,
  round(avg(amount) FILTER (WHERE stage_name = 'Deal Closed' AND amount > 0), 0) AS avg_amount,
  round(avg(fte__c) FILTER (WHERE stage_name = 'Deal Closed' AND fte__c > 0), 2) AS avg_fte_sold,
  round(avg(initial_commitment_months__c) FILTER (WHERE stage_name = 'Deal Closed' AND initial_commitment_months__c > 0), 1) AS avg_commitment_months
FROM opportunity
WHERE is_deleted = false AND vertical__c IS NOT NULL
GROUP BY vertical__c
HAVING count(*) FILTER (WHERE stage_name = ANY (ARRAY['Deal Closed','Closed Lost'])) >= 10
ORDER BY deals_won DESC;
```

---

### 2.3 View: `pricing_tool.occur_rate_trend`

12-month occur-rate time series, excluding the current (partial) month.

**Columns:** `month (date), total_booked (bigint), occurred (bigint), occur_rate (numeric), active_campaigns (bigint)`

**Full SQL definition:**

```sql
CREATE OR REPLACE VIEW pricing_tool.occur_rate_trend AS
SELECT
  date_trunc('month', booking_date__c::timestamptz)::date AS month,
  count(*) AS total_booked,
  count(*) FILTER (WHERE lead_status__c = 'Occurred') AS occurred,
  round(count(*) FILTER (WHERE lead_status__c = 'Occurred')::numeric / NULLIF(count(*), 0)::numeric, 3) AS occur_rate,
  count(DISTINCT client_campaign__c) AS active_campaigns
FROM mb_lead__c
WHERE is_deleted = false
  AND booking_date__c >= (now() - interval '1 year 1 month')
  AND booking_date__c < date_trunc('month', now())
  AND booking_date__c IS NOT NULL
GROUP BY 1
ORDER BY month DESC;
```

---

### 2.4 View: `pricing_tool.account_lookup`

Account search view, joining `account` with the latest opportunity and any active order (LATERAL joins).

**Columns:** `account_id, account_name, vertical, subvertical, num_sdrs, num_sdrs_label, num_aes_label, hiring_signal, company_size, lifecycle_stage, ae_status, region, domain, website, latest_opp_stage, latest_opp_amount, latest_opp_icv, latest_opp_close_date, latest_opp_owner_id, has_active_order, active_fte, order_icv, order_kickoff_date`

**Full SQL definition:**

```sql
CREATE OR REPLACE VIEW pricing_tool.account_lookup AS
SELECT
  a.id AS account_id,
  a.name AS account_name,
  a.vertical__c AS vertical,
  a.subvertical__c AS subvertical,
  a.number_of_sdrs__c AS num_sdrs,
  a.number_of_sdrs_picklist__c AS num_sdrs_label,
  a.number_of_aes_overall_location__c AS num_aes_label,
  a.hiring_sdrs_aes__c AS hiring_signal,
  a.company_size_bucket__c AS company_size,
  a.account_lifecycle_stage__c AS lifecycle_stage,
  a.ae_account_status__c AS ae_status,
  a.company_region__c AS region,
  a.domain__c AS domain,
  a.website,
  opp.stage_name AS latest_opp_stage,
  opp.amount AS latest_opp_amount,
  opp.initial_contract_value__c AS latest_opp_icv,
  opp.close_date AS latest_opp_close_date,
  opp.owner_id AS latest_opp_owner_id,
  ord.active_order__c AS has_active_order,
  ord.active_fte__c AS active_fte,
  ord.initial_contract_value__c AS order_icv,
  ord.kickoff_date__c AS order_kickoff_date
FROM account a
LEFT JOIN LATERAL (
  SELECT stage_name, amount, initial_contract_value__c, close_date, owner_id
  FROM opportunity
  WHERE account_id = a.id AND is_deleted = false
  ORDER BY created_date DESC
  LIMIT 1
) opp ON true
LEFT JOIN LATERAL (
  SELECT active_order__c, active_fte__c, initial_contract_value__c, kickoff_date__c
  FROM salesforce_order
  WHERE account_id = a.id AND is_deleted = false AND active_order__c = true
  ORDER BY created_date DESC
  LIMIT 1
) ord ON true
WHERE a.is_deleted = false;
```

---

### 2.5 Table: `public.ae_roster`

Active AE list (12 rows) used for the rep dropdown.

**Columns:**

| Column | Type | NOT NULL |
|---|---|---|
| `owner_id` | text (PK) | yes |
| `owner_name` | text | yes |
| `is_active` | boolean | yes |

**RLS:** enabled. Policy `Authenticated users can read ae_roster` — SELECT for role `authenticated`, `USING (true)`.

---

### 2.6 Table: `public.pricing_scenarios`

Saved-scenario storage — never populated during the current flow, but the schema and RLS were set up.

**Columns:**

| Column | Type | NOT NULL |
|---|---|---|
| `id` | uuid (PK) | yes |
| `created_at` | timestamptz | yes |
| `updated_at` | timestamptz | yes |
| `created_by_user_id` | text | no |
| `account_id` | text | no |
| `account_name` | text | no |
| `vertical` | text | no |
| `inputs` | jsonb | yes |
| `output_summary` | jsonb | no |
| `share_token` | text (unique) | no |
| `is_shared` | boolean | no |
| `is_deleted` | boolean | no |
| `rep_owner_id` | text | no |
| `rep_name` | text | no |
| `scenario_name` | text | no |
| `notes` | text | no |
| `opportunity_id` | text | no |

**Indexes:** `pricing_scenarios_pkey`, `pricing_scenarios_share_token_key`, `idx_pricing_scenarios_created_by`, `idx_pricing_scenarios_account`, `idx_pricing_scenarios_share_token`, plus a few secondary indexes.

**RLS policies:**
- `pricing_scenarios_insert` — INSERT for `authenticated`, no qual
- `pricing_scenarios_select` — SELECT for `authenticated`, qual `is_deleted = false`
- `pricing_scenarios_update` — UPDATE for `authenticated`, qual `is_deleted = false`
- `pricing_scenarios_own` — ALL for `public`, qual `is_deleted = false AND (created_by_user_id = current_setting('app.current_user_id', true) OR is_shared = true)`

---

## 3. Known Calculation Bugs (preserved for reference)

These are bugs in the view definitions above that should be addressed if the integration is reconstructed.

### Bug 1 — `yr1_renewal_rate` formula is inverted

**Current:** `post_initial_commit = true AND cancel = false` / `post_initial_commit = true`
 = 224 / 1551 = **0.144 (14.4%)**. This actually measures **post-IC retention**, not Yr1 renewal.

**Correct (Yr1 renewal = "survived initial commitment"):**
```sql
count(*) FILTER (WHERE post_initial_commit__c = true)::numeric
/ NULLIF(count(*) FILTER (WHERE post_initial_commit__c = true
                             OR (post_initial_commit__c = false AND cancel__c = true)), 0)
```
= 1551 / 1822 = **0.851 (85.1%)** ← matches hardcoded default of 80%.

### Bug 2 — `yr2_renewal_rate` is not data-driven

Currently hardcoded as `yr1_renewal_rate × 0.90`. A true Yr2 rate would measure post-IC retention from the same source data (which is what `yr1_renewal_rate` accidentally does — see Bug 1).

### Bug 3 — `avg_occur_rate` and `occur_rate_trend.occur_rate` undercount

Both filter `lead_status__c = 'Occurred'` (exact match). Should be `lead_status__c LIKE 'Occurred%'` to include sub-statuses: `Occurred - Lead Pass`, `Occurred - Rejected by Client`, `Occurred - Post Close Rejection`, etc. The exact-match version produces ~73-80%; the LIKE version produces ~91-93% which matches the 85% hardcoded default.

### Bug 4 — `avg_months_to_close` returns suspicious values

Current result is 0.7 months. Likely caused by the `created_date` on `opportunity` being the sync-timestamp rather than the actual SFDC created date, compressing the range.

### Intentional exclusion — not a bug

`occur_rate_trend` filters `booking_date__c < date_trunc('month', now())` to omit the partial current month. This is intentional so the chart doesn't show a misleadingly low current-month rate.

---

## 4. How Each Query Was Wired in the App (Before Removal)

### File paths (historical)

| File | What it did |
|---|---|
| `src/lib/supabase.js` | Creates the Supabase client from env vars — **STILL USED** for auth |
| `src/live_App.jsx` | Login gate via `auth.getSession` + `onAuthStateChange` — **STILL USED** |
| `src/components/pricing/LoginPage.jsx` | Email/password sign-in — **STILL USED** |
| `src/pages/PricingPage.jsx` | Fetched the 4 benchmark views, passed them to PricingModel + BenchmarkSidebar — **REMOVED** (now pass-through) |
| `src/components/pricing/ProspectBar.jsx` | Rep dropdown from `ae_roster`; account search from `account_lookup`; vertical dropdown from `benchmarks_by_vertical` — **ARCHIVED** |
| `src/components/pricing/BenchmarkSidebar.jsx` | Comparison table vs `benchmarks_global`/`benchmarks_by_vertical`; 12-month chart from `occur_rate_trend`; account signals from `account_lookup` — **ARCHIVED** |
| `src/components/pricing/ScenarioModal.jsx` | Saved scenarios list + load from `pricing_scenarios` — **ARCHIVED** |

### Query → UI mapping

| Supabase query | UI surface |
|---|---|
| `pricing_tool.benchmarks_global` (single row) | Seeded default slider values (occurRate, sqlToQuote, quoteToWin, avgDealSize, yr1Rate, yr2Rate). Also displayed in right-side Benchmark Sidebar comparison table. |
| `pricing_tool.benchmarks_by_vertical` (all rows) | When a vertical was selected, overrode default values for sqlToQuote, quoteToWin, avgDealSize. |
| `pricing_tool.occur_rate_trend` (12 rows) | Line chart in Benchmark Sidebar showing monthly occur rate with the user's current value as a horizontal reference line. |
| `pricing_tool.account_lookup` (debounced `ilike`) | Account search in ProspectBar — typing a company name returned up to 8 matches with vertical, company size, lifecycle stage, SDR count, active-order flag. Selecting an account auto-populated vertical + SDR count. |
| `public.ae_roster` (filtered `is_active = true`) | Rep dropdown in ProspectBar. Auto-matched based on logged-in user's email prefix. |
| `public.pricing_scenarios` | Save/Load scenario modal — listed saved scenarios for the current user, loaded all sliders from jsonb `inputs`. |

### Query orchestration pattern

```js
// src/pages/PricingPage.jsx (before removal)
useEffect(() => {
  Promise.all([
    supabase.schema('pricing_tool').from('benchmarks_global').select('*').single(),
    supabase.schema('pricing_tool').from('benchmarks_by_vertical').select('*'),
    supabase.from('ae_roster').select('owner_id,owner_name').eq('is_active', true),
    supabase.schema('pricing_tool').from('occur_rate_trend')
      .select('month,occur_rate,total_booked').order('month', { ascending: true }),
  ]).then(([g, v, r, t]) => {
    setGlobal(g.data); setVerticals(v.data ?? []); setReps(r.data ?? []); setTrend(t.data ?? [])
  })
}, [userId])
```

The page rendered `"Loading benchmarks..."` while `global === null`. This gate was the visible symptom that led to the removal.

---

## 5. Reconstruction Checklist

If you want to rebuild Supabase-backed data integration in the future:

1. **Verify database objects still exist.** Run in Supabase SQL Editor:
   ```sql
   SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'pricing_tool';
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('ae_roster','pricing_scenarios');
   ```

2. **Confirm schema exposure.** Supabase Dashboard > Settings > API > Exposed schemas should include `pricing_tool`. Without this, `supabase.schema('pricing_tool').from(...)` returns a 404.

3. **Fix known bugs** (Section 3 above) before trusting the benchmark values. At minimum, correct the `yr1_renewal_rate` formula and the `LIKE 'Occurred%'` filter.

4. **Restore the components.** Move these back from `src/components/pricing/_archive/` to `src/components/pricing/`:
   - `BenchmarkSidebar.jsx`
   - `ProspectBar.jsx`
   - `ScenarioModal.jsx`

5. **Restore PricingPage.jsx data-fetching role.** The stripped version is a pass-through; the original version (in Git history) fetches the four views with `Promise.all`, manages `selectedRep`/`selectedAccount`/`selectedVertical`, and wires the sidebar/prospect bar around `<PricingModel>`.

6. **Decide how benchmark values should merge with the new unified calc.** The ROI calculator now uses `salToSqlRate`, `closeRate`, `avgContractValue`, `avgSalesCycleMonths` — all user-entered. Supabase benchmarks map to these as:
   - `avg_occur_rate` → `salToSqlRate` (after the LIKE fix)
   - `quote_to_win_rate` → `closeRate`
   - `avg_icv_won` → `avgContractValue`
   - `avg_months_to_close` → `avgSalesCycleMonths` (needs the created_date fix)
   - `yr1_renewal_rate` → `yr1Rate` (after the formula fix)
   - No direct equivalent for `yr2Rate`

7. **Consider performance.** The `benchmarks_global` view was slow (~8 seconds) because every query re-scans 3 years of `opportunity` + `mb_lead__c` + `salesforce_order`. Use a `MATERIALIZED VIEW` with nightly `pg_cron` refresh, or cache responses in `localStorage` with a 24-hour TTL.

8. **Re-add auth loop protection.** The original `useEffect` in `PricingPage.jsx` depended on `[session]` (object reference), causing it to re-run on every token refresh. The fixed version depended on `[userId, userEmail]` (primitives) and guarded against null data — keep that pattern.

---

## 6. Archived Source Code Location

The three React components that formed the Supabase data UI have been moved to `src/components/pricing/_archive/`. Each file still contains all original imports, state management, and render logic — no changes were made during archival.

- `src/components/pricing/_archive/BenchmarkSidebar.jsx` — ~218 lines. Comparison table + 12-month trend chart. Takes props: `currentInputs, globalBenchmark, verticalBenchmark, trend, selectedAccount`.
- `src/components/pricing/_archive/ProspectBar.jsx` — ~295 lines. Rep selector, account autocomplete, vertical dropdown, save/load buttons, account-context display.
- `src/components/pricing/_archive/ScenarioModal.jsx` — ~126 lines. Lists user's saved scenarios, loads a selected one.

The Supabase client (`src/lib/supabase.js`) and login page (`src/components/pricing/LoginPage.jsx`) remain active in the live path — they are NOT archived.
