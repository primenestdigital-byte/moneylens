import React, { useMemo, useState } from 'react'
import { amortize, monthlyPayment, fmtUSD, fmtUSD2 } from './loan.js'

function BalanceChart({ schedule }) {
  // yearly balance samples
  const pts = useMemo(() => {
    const out = []
    let lastMonth = 0
    for (const s of schedule) {
      if (s.month % 12 === 0 || s.month === schedule.length) {
        out.push({ month: s.month, balance: s.balance })
        lastMonth = s.month
      }
    }
    if (out[out.length - 1]?.month !== schedule.length) {
      out.push({ month: schedule.length, balance: 0 })
    }
    return out
  }, [schedule])

  const w = 700, h = 200, pad = 30
  const maxB = Math.max(...pts.map(p => p.balance), 1)
  const maxM = schedule.length
  const path = pts.map((p, i) => {
    const x = pad + (p.month / maxM) * (w - 2 * pad)
    const y = h - pad - (p.balance / maxB) * (h - 2 * pad)
    return `${i ? 'L' : 'M'}${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Loan balance over time">
      <path d={path} fill="none" stroke="var(--principal)" strokeWidth="2" strokeLinecap="round" />
      {[0, 0.5, 1].map(f => (
        <text key={f} x={pad} y={h - pad - f * (h - 2 * pad) - 4} fontSize="10" fill="var(--muted)">
          {fmtUSD(maxB * f)}
        </text>
      ))}
      {[0, 0.5, 1].map(f => (
        <text key={f} x={pad + f * (w - 2 * pad)} y={h - 8} fontSize="10" fill="var(--muted)" textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}>
          year {Math.round((maxM / 12) * f)}
        </text>
      ))}
    </svg>
  )
}

function PaymentSplitBars({ base, extra }) {
  const total = base + extra
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full" title={`principal ${base} + extra ${extra}`}>
      <div className="bar-grow h-full" style={{ width: `${(base / total) * 100}%`, background: 'var(--principal)' }} />
      {extra > 0 && <div className="bar-grow h-full" style={{ width: `${(extra / total) * 100}%`, background: 'var(--extra)' }} />}
    </div>
  )
}

export default function App() {
  const [principal, setPrincipal] = useState(350000)
  const [rate, setRate] = useState(6.5)
  const [years, setYears] = useState(30)
  const [extra, setExtra] = useState(0)

  const baseline = useMemo(
    () => amortize(principal, rate, years * 12, 0),
    [principal, rate, years]
  )
  const plan = useMemo(
    () => amortize(principal, rate, years * 12, extra),
    [principal, rate, years, extra]
  )

  const interestSaved = baseline.totals.interest - plan.totals.interest
  const monthsSaved = baseline.months - plan.months
  const pctInterest = baseline.totals.paid > 0
    ? Math.round((plan.totals.interest / plan.totals.paid) * 100)
    : 0

  const slider = (label, value, setValue, min, max, step, format) => (
    <label className="block">
      <span className="mb-1 flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
        <span>{label}</span>
        <span className="mono" style={{ color: 'var(--fg)' }}>{format(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => setValue(Number(e.target.value))} className="w-full" />
    </label>
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Money<span style={{ color: 'var(--accent)' }}>Lens</span></h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>see the true cost of a loan — and what extra payments buy you</p>
      </header>

      {/* controls */}
      <section className="panel mb-4 grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
        {slider('loan amount', principal, setPrincipal, 10000, 2000000, 5000, v => fmtUSD(v))}
        {slider('interest rate', rate, setRate, 0, 20, 0.1, v => `${v.toFixed(1)}%`)}
        {slider('term', years, setYears, 1, 40, 1, v => `${v} yr`)}
        {slider('extra monthly payment', extra, setExtra, 0, 3000, 25, v => fmtUSD(v))}
      </section>

      {/* headline stats */}
      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['monthly payment', fmtUSD2(monthlyPayment(principal, rate, years * 12))],
          ['total interest', fmtUSD(plan.totals.interest)],
          ['payoff time', `${Math.floor(plan.months / 12)}y ${plan.months % 12}m`],
          ['interest share', `${pctInterest}% of payments`],
        ].map(([label, val]) => (
          <div key={label} className="panel stat-pop p-4 text-center">
            <p className="mono text-xl font-bold" style={{ color: 'var(--accent)' }}>{val}</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{label}</p>
          </div>
        ))}
      </section>

      {/* extra-payment impact */}
      {extra > 0 && (
        <section className="panel stat-pop mb-4 p-5">
          <h2 className="mb-2 text-xs uppercase tracking-widest" style={{ color: 'var(--extra)' }}>
            impact of {fmtUSD(extra)}/month extra
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mono text-2xl font-bold" style={{ color: 'var(--accent)' }}>{fmtUSD(interestSaved)}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>interest saved</p>
            </div>
            <div>
              <p className="mono text-2xl font-bold" style={{ color: 'var(--extra)' }}>
                {Math.floor(monthsSaved / 12)}y {monthsSaved % 12}m
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>sooner payoff</p>
            </div>
          </div>
        </section>
      )}

      {/* balance chart */}
      <section className="panel mb-4 p-5">
        <h2 className="mb-2 text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>balance over time</h2>
        <BalanceChart schedule={plan.schedule} />
      </section>

      {/* payment composition */}
      <section className="panel mb-4 p-5">
        <h2 className="mb-3 text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>monthly payment composition</h2>
        <PaymentSplitBars base={plan.base - plan.schedule[0].interest} extra={extra} />
        <div className="mono mt-2 flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
          <span style={{ color: 'var(--principal)' }}>■ principal {fmtUSD2(plan.base - plan.schedule[0].interest)}</span>
          <span style={{ color: 'var(--interest)' }}>■ interest {fmtUSD2(plan.schedule[0].interest)}</span>
          {extra > 0 && <span style={{ color: 'var(--extra)' }}>■ extra {fmtUSD2(extra)}</span>}
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          first payment splits: {fmtUSD2(plan.schedule[0].interest)} interest vs {fmtUSD2(plan.schedule[0].principal)} principal
          {extra > 0 ? ` + ${fmtUSD2(plan.schedule[0].extra)} extra` : ''} — early payments are mostly interest
        </p>
      </section>

      {/* year-by-year table (first 5 + last) */}
      <section className="panel overflow-hidden">
        <h2 className="px-5 pt-4 text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>amortization schedule (year ends)</h2>
        <table className="mono mt-2 w-full text-xs">
          <thead>
            <tr className="text-left" style={{ color: 'var(--muted)' }}>
              <th className="px-5 py-2">yr</th>
              <th className="px-5 py-2 text-right">balance</th>
              <th className="px-5 py-2 text-right">interest paid (cum.)</th>
            </tr>
          </thead>
          <tbody>
            {plan.schedule
              .filter(s => s.month % 12 === 0)
              .slice(0, 8)
              .map(s => {
                const cumInterest = plan.schedule.slice(0, s.month).reduce((a, x) => a + x.interest, 0)
                return (
                  <tr key={s.month} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-1.5">{Math.floor(s.month / 12)}</td>
                    <td className="px-5 py-1.5 text-right">{fmtUSD(s.balance)}</td>
                    <td className="px-5 py-1.5 text-right" style={{ color: 'var(--interest)' }}>{fmtUSD(cumInterest)}</td>
                  </tr>
                )
              })}
            <tr className="border-t" style={{ borderColor: 'var(--border)' }}>
              <td className="px-5 py-1.5 font-bold">{Math.ceil(plan.months / 12)} (final)</td>
              <td className="px-5 py-1.5 text-right font-bold">$0</td>
              <td className="px-5 py-1.5 text-right font-bold" style={{ color: 'var(--interest)' }}>{fmtUSD(plan.totals.interest)}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}
