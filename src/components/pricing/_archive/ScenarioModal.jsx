import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ScenarioModal({ onClose, onLoad }) {
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchScenarios = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user) return

      const { data } = await supabase
        .from('pricing_scenarios')
        .select('id,scenario_name,account_name,vertical,output_summary,updated_at')
        .eq('created_by_user_id', user.user.id)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(20)

      setScenarios(data ?? [])
      setLoading(false)
    }
    fetchScenarios()
  }, [])

  const handleSelect = async (scenario) => {
    const { data } = await supabase
      .from('pricing_scenarios')
      .select('*')
      .eq('id', scenario.id)
      .single()

    if (data) onLoad(data)
  }

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
  }

  const modalStyle = {
    background: '#141b2d',
    borderRadius: 12,
    padding: 24,
    width: 520,
    maxHeight: '70vh',
    overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  }

  const rowStyle = {
    padding: '12px 14px',
    borderBottom: '1px solid #1e293b',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#e2e8f0', fontSize: 16, margin: 0 }}>Load Scenario</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#64748b', fontSize: 13 }}>Loading...</p>
        ) : scenarios.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 13 }}>No saved scenarios yet.</p>
        ) : (
          scenarios.map((s) => {
            const rev = s.output_summary?.total_3yr_rev
            return (
              <div
                key={s.id}
                style={rowStyle}
                onClick={() => handleSelect(s)}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>
                    {s.scenario_name || 'Untitled'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                    {s.account_name ?? 'No account'}
                    {s.vertical ? ` · ${s.vertical}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {rev != null && (
                    <div style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>
                      ${Number(rev).toLocaleString()} 3yr
                    </div>
                  )}
                  <div style={{ color: '#475569', fontSize: 10 }}>
                    {new Date(s.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
