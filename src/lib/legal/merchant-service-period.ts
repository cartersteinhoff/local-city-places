export const merchantAgreementServiceTimeZone = "America/Phoenix";

const servicePeriodDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: merchantAgreementServiceTimeZone,
});

export interface MerchantAgreementServicePeriod {
  startsAt: Date;
  endsAt: Date;
  label: string;
}

export function formatMerchantAgreementServiceDate(date: Date) {
  return servicePeriodDateFormatter.format(date);
}

export function getMerchantAgreementServicePeriod(
  startsAt = new Date(),
): MerchantAgreementServicePeriod {
  const periodStart = new Date(startsAt);
  const periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    startsAt: periodStart,
    endsAt: periodEnd,
    label: `${formatMerchantAgreementServiceDate(periodStart)} - ${formatMerchantAgreementServiceDate(periodEnd)}`,
  };
}
