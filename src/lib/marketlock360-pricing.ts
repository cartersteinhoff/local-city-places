export function getMarketLock360MonthlyAmountCents() {
  const amountCents = Number(process.env.MARKETLOCK360_MONTHLY_AMOUNT_CENTS);

  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return null;
  }

  return amountCents;
}

export function getMarketLock360Currency() {
  return process.env.MARKETLOCK360_MONTHLY_CURRENCY || "usd";
}

export function formatMarketLock360Amount(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: getMarketLock360Currency().toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}
