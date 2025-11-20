# Original Calculator Backup

This directory contains the **original version** of the calculator before optimization.

## What's Backed Up

- `calculator.ts` - Original SellerFinanceCalculator class
- `utils.ts` - Original CalculatorUtils class
- `config.ts` - Original configuration
- `types.ts` - Type definitions

## Original Calculator Characteristics

- **Linear Search**: Checks amortization 1-40 years sequentially
- **Fixed Entry Fee**: Always uses maximum (22.5% or 20%)
- **Yield-Only Optimization**: Targets net rental yield only
- **No Intelligent Bounds**: Always searches full 1-40 year range

## How to Restore Original Calculator

If you need to revert to the original calculator:

```bash
# From project root
cp lib/calculator/backup-original/calculator.ts lib/calculator/calculator.ts
cp lib/calculator/backup-original/utils.ts lib/calculator/utils.ts
cp lib/calculator/backup-original/config.ts lib/calculator/config.ts
```

Or simply:
```bash
cp lib/calculator/backup-original/*.ts lib/calculator/
```

## Backup Date

Created: 2025-01-20

## Original Calculator Formula

```
Monthly Cash Flow = Rent - Operating Expenses - Monthly Payment

Where:
- Operating Expenses = Tax + Insurance + HOA + Fees + (Rent × 20%)
- Monthly Payment = Loan Amount / (Amortization Years × 12)
- Amortization: Linear search from 1-40 years targeting yield range
```

## Performance

- **Iterations**: 20-40 per offer calculation
- **Entry Fee**: Always maximum (not optimized)
- **Speed**: Baseline (100%)
