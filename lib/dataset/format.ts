export function formatNumber(value: number, decimals = 2): string {
  if (Number.isNaN(value)) return '—';
  if (Number.isInteger(value) && decimals === 0) return value.toLocaleString();
  const abs = Math.abs(value);
  if (abs >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (abs >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function formatPercent(value: number, decimals = 1): string {
  if (Number.isNaN(value)) return '—';
  return value.toFixed(decimals) + '%';
}

export function formatCompact(value: number): string {
  return value.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });
}

export function formatNullable(value: number | null, decimals = 2): string {
  if (value === null) return '—';
  return formatNumber(value, decimals);
}
