import { LineChart, Line, XAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

const fmt = (v, type) => {
  if (v == null) return '—'
  if (type === 'pct') return `${(v * 100).toFixed(1)}%`
  if (type === 'dollar') return `$${Number(v).toLocaleString()}`
  return String(v)
}

const cellColor = (yours, benchmark) => {
  if (yours == null || benchmark == null) return '#e2e8f0'
  return yours >= benchmark ? '#4ade80' : '#fbbf24'
}

function ComparisonTable({ currentInputs, verticalBenchmark, globalBenchmark }) {
  if (!globalBenchmark) return null

  const rows = [
    { label: 'Occur rate', key: 'occurRate', vKey: 'avg_occur_rate', gKey: 'avg_occur_rate', type: 'pct' },
    { label: 'SQL-to-Quote', key: 'sqlToQuote', vKey: 'sql_to_quote_rate', gKey: 'sql_to_quote_rate', type: 'pct' },
    { label: 'Quote-to-Win', key: 'quoteToWin', vKey: 'quote_to_win_rate', gKey: 'quote_to_win_rate', type: 'pct' },
    { label: 'Avg deal size', key: 'avgDealSize', vKey: 'avg_icv', gKey: 'avg_icv_won', type: 'dollar' },
    { label: 'Yr1 renewal', key: 'yr1Rate', vKey: null, gKey: 'yr1_renewal_rate', type: 'pct' },
    { label: 'Yr2 renewal', key: 'yr2Rate', vKey: null, gKey: 'yr2_renewal_rate', type: 'pct' },
  ]

  const thStyle = {
    padding: '6px 8px',
    fontSize: 11,
    color: '#64748b',
    textAlign: 'left',
    borderBottom: '1px solid #1e293b',
    fontWeight: 600,
  }
  const tdStyle = {
    padding: '6px 8px',
    fontSize: 12,
    borderBottom: '1px solid #1e293b',
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Metric</th>
          <th style={thStyle}>Your Input</th>
          {verticalBenchmark && <th style={thStyle}>Vertical</th>}
          <th style={thStyle}>Global</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const yours = currentInputs?.[r.key]
          const vVal = verticalBenchmark && r.vKey ? Number(verticalBenchmark[r.vKey]) : null
          const gVal = r.gKey ? Number(globalBenchmark[r.gKey]) : null
          const benchmark = vVal ?? gVal

          return (
            <tr key={r.key}>
              <td style={{ ...tdStyle, color: '#94a3b8' }}>{r.label}</td>
              <td style={{ ...tdStyle, color: cellColor(yours, benchmark), fontWeight: 600 }}>
                {fmt(yours, r.type)}
              </td>
              {verticalBenchmark && (
                <td style={{ ...tdStyle, color: '#e2e8f0' }}>{fmt(vVal, r.type)}</td>
              )}
              <td style={{ ...tdStyle, color: '#e2e8f0' }}>{fmt(gVal, r.type)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function OccurRateTrend({ trend, currentOccurRate }) {
  if (!trend || trend.length === 0) return null

  const data = trend.map((t) => ({
    month: new Date(t.month).toLocaleDateString('en-US', { month: 'short' }),
    rate: Number(t.occur_rate) * 100,
    booked: t.total_booked,
  }))

  return (
    <div>
      <h4 style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
        Occur Rate Trend (12 mo)
      </h4>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #2d3748', borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value, name, props) => [
              `${value.toFixed(1)}% occur rate, ${props.payload.booked} meetings booked`,
              null,
            ]}
          />
          <ReferenceLine
            y={currentOccurRate != null ? currentOccurRate * 100 : null}
            stroke="#3b82f6"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Line type="monotone" dataKey="rate" stroke="#4ade80" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const stageBadgeColors = {
  Prospect: { bg: '#1e3a5f', color: '#60a5fa' },
  'Active Client': { bg: '#14532d', color: '#4ade80' },
  'Former Client': { bg: '#78350f', color: '#fbbf24' },
  Lost: { bg: '#3d1c1c', color: '#f87171' },
}

function AccountSignals({ account }) {
  if (!account) return null

  const stage = account.lifecycle_stage
  const badgeStyle = stageBadgeColors[stage] ?? { bg: '#1e293b', color: '#94a3b8' }

  return (
    <div>
      <h4 style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
        Account Signals
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {account.company_size && (
          <span style={{
            background: '#1e293b',
            color: '#94a3b8',
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 11,
          }}>
            {account.company_size}
          </span>
        )}
        {stage && (
          <span style={{
            background: badgeStyle.bg,
            color: badgeStyle.color,
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
          }}>
            {stage}
            {stage === 'Active Client' && account.active_fte ? ` (${account.active_fte} FTE)` : ''}
          </span>
        )}
        {account.latest_opp_stage && (
          <span style={{
            background: '#1e293b',
            color: '#94a3b8',
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 11,
          }}>
            Opp: {account.latest_opp_stage}
          </span>
        )}
      </div>
      {account.hiring_signal && (
        <p style={{ color: '#60a5fa', fontSize: 12, margin: 0 }}>
          {account.hiring_signal}
        </p>
      )}
    </div>
  )
}

export default function BenchmarkSidebar({
  currentInputs,
  globalBenchmark,
  verticalBenchmark,
  trend,
  selectedAccount,
}) {
  const currentOccurRate = currentInputs?.occurRate

  return (
    <div style={{
      background: '#141b2d',
      borderLeft: '1px solid #1e293b',
      padding: 16,
      width: 300,
      minWidth: 260,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      <h3 style={{ color: '#e2e8f0', fontSize: 14, margin: 0 }}>Benchmarks</h3>

      <ComparisonTable
        currentInputs={currentInputs}
        verticalBenchmark={verticalBenchmark}
        globalBenchmark={globalBenchmark}
      />

      <OccurRateTrend trend={trend} currentOccurRate={currentOccurRate} />

      <AccountSignals account={selectedAccount} />

      {globalBenchmark?.calculated_at && (
        <p style={{ color: '#475569', fontSize: 10, margin: 0 }}>
          Data as of {new Date(globalBenchmark.calculated_at).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
