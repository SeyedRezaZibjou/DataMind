import type { ColumnType, DatasetRow } from './types';

const DATETIME_RE =
  /^\d{4}[-/]\d{1,2}[-/]\d{1,2}([ T]\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

export function isMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const s = value.trim();
    if (s === '') return true;
    const lower = s.toLowerCase();
    if (['na', 'n/a', 'null', 'nan', 'none', '-'].includes(lower)) return true;
  }
  if (typeof value === 'number' && Number.isNaN(value)) return true;
  return false;
}

function looksBoolean(values: unknown[]): boolean {
  const bools = new Set(['true', 'false', '0', '1']);
  let counted = 0;
  for (const v of values) {
    if (isMissing(v)) continue;
    if (typeof v === 'boolean') {
      counted++;
      continue;
    }
    if (typeof v === 'number' && (v === 0 || v === 1)) {
      counted++;
      continue;
    }
    if (typeof v === 'string' && bools.has(v.trim().toLowerCase())) {
      counted++;
      continue;
    }
    return false;
  }
  return counted > 0;
}

function looksDateTime(values: unknown[]): boolean {
  let matches = 0;
  let counted = 0;
  for (const v of values) {
    if (isMissing(v)) continue;
    counted++;
    if (typeof v === 'string' && DATETIME_RE.test(v.trim())) matches++;
    else if (v instanceof Date) matches++;
  }
  return counted > 0 && matches / counted >= 0.7;
}

function toNum(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.trim());
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function looksNumeric(values: unknown[]): boolean {
  let numeric = 0;
  let counted = 0;
  for (const v of values) {
    if (isMissing(v)) continue;
    counted++;
    const n = toNum(v);
    if (n !== null) numeric++;
  }
  return counted > 0 && numeric / counted >= 0.85;
}

function looksEncodedCategorical(values: unknown[]): boolean {
  let counted = 0;
  const numericValues: number[] = [];
  for (const v of values) {
    if (isMissing(v)) continue;
    counted++;
    const n = toNum(v);
    if (n === null) return false;
    numericValues.push(n);
  }
  if (counted === 0) return false;
  const uniqueSet = new Set(numericValues);
  const uniqueCount = uniqueSet.size;
  return uniqueCount <= 12 && uniqueCount < counted * 0.15;
}

function looksText(values: unknown[]): boolean {
  let counted = 0;
  let longCount = 0;
  let totalChars = 0;
  for (const v of values) {
    if (isMissing(v)) continue;
    counted++;
    if (typeof v === 'string') {
      totalChars += v.length;
      if (v.length > 50) longCount++;
    }
  }
  if (counted === 0) return false;
  const avgLen = totalChars / counted;
  return longCount > 0 && avgLen > 20;
}

export function inferColumnType(values: unknown[]): ColumnType {
  const present = values.filter((v) => !isMissing(v));
  if (present.length === 0) return 'unknown';
  if (looksBoolean(present)) return 'boolean';
  if (looksDateTime(present)) return 'datetime';
  if (looksNumeric(present)) {
    if (looksEncodedCategorical(present)) return 'categorical';
    return 'numeric';
  }
  if (looksText(present)) return 'text';
  return 'categorical';
}

export function toNumber(value: unknown): number | null {
  if (isMissing(value)) return null;
  return toNum(value);
}

export function normalizeRows(rows: DatasetRow[], columns: string[]): DatasetRow[] {
  return rows.map((row) => {
    const out: DatasetRow = {};
    for (const col of columns) {
      const v = row[col];
      if (isMissing(v)) {
        out[col] = null;
      } else {
        out[col] = v;
      }
    }
    return out;
  });
}
