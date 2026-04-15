import PricingModel from '../live_pricing_model'

// NOTE: Supabase data integration (benchmarks, account lookup, save/load scenarios)
// has been removed from the live tool. See docs/SUPABASE_INTEGRATION.md for full
// historical documentation and the reconstruction checklist.
//
// This page is now a thin pass-through. live_App.jsx still uses Supabase for auth
// (login gate only); once authenticated, the ROI calculator renders directly.
export default function PricingPage() {
  return <PricingModel />
}
