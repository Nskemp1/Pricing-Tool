import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './components/pricing/LoginPage'
import PricingModel from '../pricing_model'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading...</div>
  if (!session) return <LoginPage />
  return <PricingModel />
}
