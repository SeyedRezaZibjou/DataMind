export type ColumnType = 'numeric' | 'categorical' | 'boolean' | 'datetime' | 'text' | 'unknown';

export type CategoricalSubtype = 'nominal' | 'ordinal';

export type DatasetRow = Record<string, unknown>;

export type ParsedDataset = {
  name: string;
  rows: DatasetRow[];
  columns: string[];
  source: 'upload' | 'demo';
  uploadedAt: number;
};

export type ColumnProfile = {
  name: string;
  type: ColumnType;
  subtype?: CategoricalSubtype;
  nonNull: number;
  missing: number;
  missingPct: number;
  unique: number;
};

export type NumericStats = {
  count: number;
  mean: number;
  std: number;
  variance: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  mode: number | null;
};

export type NumericColumnStats = NumericStats & {
  column: string;
  outliers: number;
};

export type FrequencyEntry = {
  value: string;
  count: number;
  percentage: number;
};

export type CategoricalColumnStats = {
  column: string;
  count: number;
  missingCount: number;
  missingPct: number;
  uniqueCategories: number;
  mode: string[];
  modeFrequency: number;
  modePercentage: number;
  frequency: FrequencyEntry[];
  hasTiedMode: boolean;
  ordinalMin: string | null;
  ordinalMax: string | null;
  ordinalMedian: string | null;
  hasOrdinalOrder: boolean;
};

export type DatasetOverview = {
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  typeCounts: Record<ColumnType, number>;
  numericStats: NumericColumnStats[];
  categoricalStats: CategoricalColumnStats[];
  sample: DatasetRow[];
};

export type ColumnTypeOverride = {
  type: ColumnType;
  subtype?: CategoricalSubtype;
  ordinalOrder?: string[];
};

export type TypeOverrides = Record<string, ColumnTypeOverride>;

export type DuplicateRowGroup = {
  groupId: number;
  rowNumbers: number[];
};

export type QualityReport = {
  overallScore: number;
  totalMissing: number;
  totalCells: number;
  missingPct: number;
  duplicateRows: number;
  duplicatePct: number;
  duplicateGroups: DuplicateRowGroup[];
  constantColumns: string[];
  columnMissing: { column: string; missing: number; missingPct: number; unique: number }[];
  outliers: { column: string; count: number; lowerBound: number; upperBound: number }[];
  completeness: number;
  uniqueness: number;
  consistency: number;
};
