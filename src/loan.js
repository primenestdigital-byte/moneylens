// MoneyLens — amortization math.

// Monthly payment for an amortizing loan (standard formula).
export function monthlyPayment(principal, annualRate, months) {
  if (months <= 0) return principal
  const r = annualRate / 100 / 12
  if (r === 0) return principal / months
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1)
}

// Full schedule. extra = additional monthly principal payment.
// Returns { schedule: [{month, interest, principal, extra, balance}], totals: {...}, months }
export function amortize(principal, annualRate, months, extra = 0) {
  const base = monthlyPayment(principal, annualRate, months)
  const r = annualRate / 100 / 12
  let bal = principal
  const schedule = []
  let totalInterest = 0, totalPaid = 0
  let m = 0
  while (bal > 0.005 && m < months * 3 + 600) { // safety cap
    m++
    const interest = bal * r
    let principalPart = base - interest
    let extraPart = extra
    // final payment adjustments
    if (principalPart + extraPart > bal) {
      extraPart = Math.max(0, bal - principalPart)
    }
    if (principalPart > bal) principalPart = bal
    bal -= principalPart + extraPart
    totalInterest += interest
    totalPaid += principalPart + extraPart + interest
    schedule.push({
      month: m,
      interest: Math.round(interest * 100) / 100,
      principal: Math.round(principalPart * 100) / 100,
      extra: Math.round(extraPart * 100) / 100,
      balance: Math.max(0, Math.round(bal * 100) / 100),
    })
    if (bal <= 0.005) break
  }
  return {
    schedule,
    base,
    months: m,
    totals: {
      interest: Math.round(totalInterest * 100) / 100,
      paid: Math.round(totalPaid * 100) / 100,
    },
  }
}

export function fmtUSD(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
export function fmtUSD2(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}
