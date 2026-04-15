import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function ProspectBar({
  reps,
  selectedRep,
  onRepChange,
  selectedAccount,
  onAccountSelect,
  onAccountClear,
  verticals,
  selectedVertical,
  onVerticalChange,
  onSave,
  onLoadOpen,
  currentScenarioName,
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [showSavePopover, setShowSavePopover] = useState(false)
  const [scenarioName, setScenarioName] = useState('')
  const debounceRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (value) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value || value.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .schema('pricing_tool')
        .from('account_lookup')
        .select('account_id,account_name,vertical,num_sdrs,hiring_signal,lifecycle_stage,has_active_order,active_fte,latest_opp_stage,company_size,num_sdrs_label,num_aes_label')
        .ilike('account_name', `%${value}%`)
        .limit(8)
      setResults(data ?? [])
      setShowResults(true)
    }, 300)
  }

  const handleAccountClick = (account) => {
    onAccountSelect(account)
    setQuery(account.account_name)
    setShowResults(false)
  }

  const handleClear = () => {
    onAccountClear()
    setQuery('')
    setResults([])
  }

  const handleSaveClick = () => {
    const defaultName = selectedAccount
      ? `${selectedAccount.account_name} — ${new Date().toLocaleDateString()}`
      : 'Untitled Scenario'
    setScenarioName(currentScenarioName || defaultName)
    setShowSavePopover(true)
  }

  const handleSaveConfirm = () => {
    onSave(scenarioName)
    setShowSavePopover(false)
  }

  const barStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    background: '#141b2d',
    borderBottom: '1px solid #1e293b',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexWrap: 'wrap',
  }

  const selectStyle = {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #2d3748',
    background: '#0a0f1a',
    color: '#e2e8f0',
    fontSize: 13,
  }

  const inputStyle = {
    ...selectStyle,
    flex: 1,
    minWidth: 200,
  }

  const btnStyle = {
    padding: '8px 14px',
    borderRadius: 6,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  }

  return (
    <div style={barStyle}>
      {/* Rep selector */}
      <select
        value={selectedRep?.owner_id ?? ''}
        onChange={(e) => {
          const rep = reps.find((r) => r.owner_id === e.target.value)
          onRepChange(rep || null)
        }}
        style={selectStyle}
      >
        <option value="">Select Rep</option>
        {reps.map((r) => (
          <option key={r.owner_id} value={r.owner_id}>{r.owner_name}</option>
        ))}
      </select>

      {/* Account search */}
      <div style={{ position: 'relative', flex: 1, minWidth: 200 }} ref={dropdownRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="text"
            placeholder="Search accounts..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            style={inputStyle}
          />
          {selectedAccount && (
            <>
              {selectedAccount.has_active_order && (
                <span style={{
                  background: '#78350f',
                  color: '#fbbf24',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  Existing client
                </span>
              )}
              <button
                onClick={handleClear}
                style={{ ...btnStyle, background: 'transparent', color: '#94a3b8', fontSize: 12 }}
              >
                ✕ Clear
              </button>
            </>
          )}
        </div>
        {showResults && results.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1e293b',
            borderRadius: 6,
            marginTop: 4,
            maxHeight: 280,
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 200,
          }}>
            {results.map((acct) => (
              <div
                key={acct.account_id}
                onClick={() => handleAccountClick(acct)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #2d3748',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>
                    {acct.account_name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                    {acct.vertical}{acct.company_size ? ` · ${acct.company_size}` : ''}
                  </div>
                </div>
                {acct.has_active_order && (
                  <span style={{
                    background: '#78350f',
                    color: '#fbbf24',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                  }}>
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vertical selector */}
      <select
        value={selectedVertical ?? ''}
        onChange={(e) => onVerticalChange(e.target.value || null)}
        style={selectStyle}
      >
        <option value="">Vertical</option>
        {verticals.map((v) => (
          <option key={v.vertical} value={v.vertical}>{v.vertical}</option>
        ))}
      </select>

      {/* Scenario controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        {currentScenarioName && (
          <span style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic' }}>
            {currentScenarioName}
          </span>
        )}
        <button
          onClick={handleSaveClick}
          style={{ ...btnStyle, background: '#3b82f6', color: '#fff' }}
        >
          Save
        </button>
        <button
          onClick={onLoadOpen}
          style={{ ...btnStyle, background: '#1e293b', color: '#e2e8f0', border: '1px solid #2d3748' }}
        >
          Load
        </button>

        {showSavePopover && (
          <div style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            background: '#1e293b',
            borderRadius: 8,
            padding: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 300,
            minWidth: 260,
          }}>
            <label style={{ color: '#94a3b8', fontSize: 12, display: 'block', marginBottom: 6 }}>
              Scenario name
            </label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSavePopover(false)}
                style={{ ...btnStyle, background: 'transparent', color: '#94a3b8' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfirm}
                style={{ ...btnStyle, background: '#3b82f6', color: '#fff' }}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
