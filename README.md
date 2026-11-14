# MoneyLens

A loan & mortgage calculator that shows the true cost of borrowing — full amortization, payoff timeline, and what extra payments actually save you.

## Features

- Sliders: amount ($10k–$2M), rate (0–20%), term (1–40y), extra monthly payment ($0–$3k)
- Standard amortization formula; extra payments shorten the schedule and compound savings
- Impact panel: interest saved + years/months shaved off, live as you drag
- SVG balance-over-time chart, first-payment composition breakdown (principal vs interest vs extra)
- Year-end amortization table with cumulative interest

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

## Math

Monthly payment: `P·r·(1+r)^n / ((1+r)^n − 1)`, `r = APR/12`. Each month: interest = balance·r, remainder hits principal; extra payments truncate the schedule with a final-payment clamp and a 3× term safety cap.

## License

MIT
