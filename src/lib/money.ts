/** Parse a user-entered amount like "1,234.5" into integer cents. Invalid → 0. */
export function parseMoneyToCents(input: string | null | undefined) {
  if (!input) return 0;
  const cleaned = String(input).replace(/[,\s¥$￥]/g, "");
  if (!/^-?\d+(\.\d{0,2})?$/.test(cleaned)) return 0;
  const negative = cleaned.startsWith("-");
  const [whole, frac = ""] = cleaned.replace("-", "").split(".");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return negative ? -cents : cents;
}

export function centsToInput(cents: number) {
  if (!cents) return "";
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

export function currency() {
  return process.env.NEXT_PUBLIC_CURRENCY ?? "CNY";
}

export function formatCents(cents: number, code = currency()) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
