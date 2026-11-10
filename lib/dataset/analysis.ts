import type {
  ColumnProfile,
  DatasetOverview,
  DatasetRow,
  NumericColumnStats,
  CategoricalColumnStats,
  FrequencyEntry,
  QualityReport,
  ColumnType,
  TypeOverrides,
  DuplicateRowGroup,
} from './types';
import { inferColumnType, isMissing, toNumber } from './infer';

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function computeNumericMode(values: number[]): number | null {
  if (values.length === 0) return null;
  const freq = new Map<number, number>();
  for (const v of values) {
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  let maxFreq = 0;
  let mode: number | null = null;

  freq.forEach((f, v) => {
    if (f > maxFreq) {
      maxFreq = f;
      mode = v;
    }
  });
  return mode;
}

function computeNumericStats(values: number[]): Omit<NumericColumnStats, 'column'> {
  const n = values.length;
  if (n === 0) {
    return { count: 0, mean: NaN, std: NaN, variance: NaN, min: NaN, q1: NaN, median: NaN, q3: NaN, max: NaN, iqr: NaN, mode: null, outliers: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const q1 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = values.filter((v) => v < lowerBound || v > upperBound).length;
  const mode = computeNumericMode(values);
  return {
    count: n,
    mean,
    std,
    variance,
    min: sorted[0],
    q1,
    median,
    q3,
    max: sorted[n - 1],
    iqr,
    mode,
    outliers,
  };
}

function computeFrequency(present: unknown[]): FrequencyEntry[] {
  const freq = new Map<string, number>();
  for (const v of present) {
    const key = String(v);
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  const total = present.length;
  const entries: FrequencyEntry[] = Array.from(freq.entries()).map(([value, count]) => ({
    value,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
  entries.sort((a, b) => b.count - a.count);
  return entries;
}

function computeCategoricalStats(
  column: string,
  rows: DatasetRow[],
  rowCount: number,
  ordinalOrder?: string[],
): CategoricalColumnStats {
  const colValues = rows.map((r) => r[column]);
  const present = colValues.filter((v) => !isMissing(v));
  const missingCount = colValues.length - present.length;
  const frequency = computeFrequency(present);
  const uniqueCategories = frequency.length;

  let maxFreq = 0;
  for (const e of frequency) {
    if (e.count > maxFreq) maxFreq = e.count;
  }
  const modes = frequency.filter((e) => e.count === maxFreq).map((e) => e.value);
  const hasTiedMode = modes.length > 1;
  const modePercentage = present.length > 0 ? (maxFreq / present.length) * 100 : 0;

  const hasOrdinalOrder = !!ordinalOrder && ordinalOrder.length > 0;

  let ordinalMin: string | null = null;
  let ordinalMax: string | null = null;
  let ordinalMedian: string | null = null;

  if (hasOrdinalOrder && ordinalOrder) {
    const orderMap = new Map<string, number>();
    ordinalOrder.forEach((cat, i) => orderMap.set(cat, i));

    const mapped = present
      .map((v) => {
        const key = String(v);
        return { key, rank: orderMap.get(key) };
      })
      .filter((x): x is { key: string; rank: number } => x.rank !== undefined);

    if (mapped.length > 0) {
      mapped.sort((a, b) => a.rank - b.rank);
      ordinalMin = mapped[0].key;
      ordinalMax = mapped[mapped.length - 1].key;

      const midIdx = Math.floor(mapped.length / 2);
      if (mapped.length % 2 === 1) {
        ordinalMedian = mapped[midIdx].key;
      } else {
        ordinalMedian = mapped[midIdx - 1].key;
      }
    }
  }

  return {
    column,
    count: present.length,
    missingCount,
    missingPct: rowCount > 0 ? (missingCount / rowCount) * 100 : 0,
    uniqueCategories,
    mode: modes,
    modeFrequency: maxFreq,
    modePercentage,
    frequency,
    hasTiedMode,
    ordinalMin,
    ordinalMax,
    ordinalMedian,
    hasOrdinalOrder,
  };
}

export function computeOverview(
  rows: DatasetRow[],
  columns: string[],
  overrides?: TypeOverrides,
): DatasetOverview {
  const rowCount = rows.length;
  const columnCount = columns.length;

  const profiles: ColumnProfile[] = columns.map((col) => {
    const colValues = rows.map((r) => r[col]);
    const present = colValues.filter((v) => !isMissing(v));
    const missing = colValues.length - present.length;
    const inferredType = inferColumnType(colValues);
    const override = overrides?.[col];
    const type = override?.type ?? inferredType;
    const subtype = override?.subtype;
    const uniqueSet = new Set(present.map((v) => String(v)));
    return {
      name: col,
      type,
      subtype,
      nonNull: present.length,
      missing,
      missingPct: rowCount > 0 ? (missing / rowCount) * 100 : 0,
      unique: uniqueSet.size,
    };
  });

  const typeCounts = profiles.reduce(
    (acc, p) => {
      acc[p.type] = (acc[p.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<ColumnType, number>,
  );
  (Object.keys(typeCounts) as ColumnType[]).forEach((k) => {
    typeCounts[k] ??= 0;
  });

  const numericStats: NumericColumnStats[] = profiles
    .filter((p) => p.type === 'numeric')
    .map((p) => {
      const nums = rows
        .map((r) => toNumber(r[p.name]))
        .filter((v): v is number => v !== null);
      return { ...computeNumericStats(nums), column: p.name };
    });

  const categoricalStats: CategoricalColumnStats[] = profiles
    .filter((p) => p.type === 'categorical' || p.type === 'boolean')
    .map((p) => {
      const override = overrides?.[p.name];
      const ordinalOrder = override?.subtype === 'ordinal' ? override.ordinalOrder : undefined;

      return computeCategoricalStats(p.name, rows, rowCount, ordinalOrder);
    });

  const sample = rows.slice(0, 10);

  return { rowCount, columnCount, columns: profiles, typeCounts, numericStats, categoricalStats, sample };
}

export function computeQuality(rows: DatasetRow[], columns: string[], overview: DatasetOverview): QualityReport {
  const rowCount = rows.length;
  const columnCount = columns.length;
  const totalCells = rowCount * columnCount;

  const totalMissing = overview.columns.reduce((sum, c) => sum + c.missing, 0);
  const missingPct = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;

  // Group rows by their complete values
  const rowGroups = new Map<string, number[]>();

  rows.forEach((row, index) => {
    const key = JSON.stringify(
      columns.map((column) => {
        const value = row[column];

        if (value === null || value === undefined) {
          return '';
        }

        return String(value).trim();
      }),
    );

    const existingRows = rowGroups.get(key);

    if (existingRows) {
      existingRows.push(index + 1);
    } else {
      rowGroups.set(key, [index + 1]);
    }
  });

  // Keep only groups containing duplicate rows
  const duplicateGroups: DuplicateRowGroup[] = Array.from(
    rowGroups.values(),
  )
    .filter((rowNumbers) => rowNumbers.length > 1)
    .map((rowNumbers, index) => ({
      groupId: index + 1,
      rowNumbers,
    }));

  // Count only additional duplicate occurrences
  const duplicateRows = duplicateGroups.reduce(
    (total, group) => total + group.rowNumbers.length - 1,
    0,
  );

  const duplicatePct =
    rowCount > 0 ? (duplicateRows / rowCount) * 100 : 0;

  const constantColumns = overview.columns
    .filter((c) => c.unique <= 1 && c.nonNull > 0)
    .map((c) => c.name);

  const columnMissing = overview.columns.map((c) => ({
    column: c.name,
    missing: c.missing,
    missingPct: c.missingPct,
    unique: c.unique,
  }));

  const outliers = overview.numericStats
    .filter((s) => s.outliers > 0)
    .map((s) => {
      const iqr = s.q3 - s.q1;
      return {
        column: s.column,
        count: s.outliers,
        lowerBound: s.q1 - 1.5 * iqr,
        upperBound: s.q3 + 1.5 * iqr,
      };
    });

  const completeness = totalCells > 0 ? 100 - missingPct : 100;
  const uniqueness = rowCount > 0 ? 100 - duplicatePct : 100;
  const consistency =
    columnCount > 0 ? 100 - (constantColumns.length / columnCount) * 100 : 100;

  const overallScore = Math.round(
    completeness * 0.5 + uniqueness * 0.3 + consistency * 0.2,
  );

  return {
    overallScore,
    totalMissing,
    totalCells,
    missingPct,
    duplicateRows,
    duplicatePct,
    duplicateGroups,
    constantColumns,
    columnMissing,
    outliers,
    completeness,
    uniqueness,
    consistency,
  };
}
