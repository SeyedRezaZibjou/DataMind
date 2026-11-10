
import type {
    ParsedDataset,
    DatasetOverview,
    QualityReport,
} from '@/lib/dataset/types';

// Prevent non-finite numbers such as NaN and Infinity
// from entering the AI context.
function safeNumber(value: number): number | null {
    return Number.isFinite(value)
        ? Math.round(value * 10000) / 10000
        : null;
}

export function buildDatasetContext(
    dataset: ParsedDataset,
    overview: DatasetOverview,
    quality: QualityReport,
) {
    const maxColumns = 60;
    const maxNumericStats = 40;
    const maxCategoricalStats = 30;
    const maxFrequencyEntries = 8;

    return {
        dataset: {
            name: dataset.name,
            source: dataset.source,
            rowCount: overview.rowCount,
            columnCount: overview.columnCount,
        },

        columnTypes: overview.typeCounts,

        columns: overview.columns
            .slice(0, maxColumns)
            .map((column) => ({
                name: column.name,
                type: column.type,
                subtype: column.subtype ?? null,
                nonNull: column.nonNull,
                missing: column.missing,
                missingPct: safeNumber(column.missingPct),
                unique: column.unique,
            })),

        omittedColumns: Math.max(
            0,
            overview.columns.length - maxColumns,
        ),

        numericStatistics: overview.numericStats
            .slice(0, maxNumericStats)
            .map((stat) => ({
                column: stat.column,
                count: stat.count,
                mean: safeNumber(stat.mean),
                std: safeNumber(stat.std),
                variance: safeNumber(stat.variance),
                min: safeNumber(stat.min),
                q1: safeNumber(stat.q1),
                median: safeNumber(stat.median),
                q3: safeNumber(stat.q3),
                max: safeNumber(stat.max),
                iqr: safeNumber(stat.iqr),
                mode: stat.mode === null
                    ? null
                    : safeNumber(stat.mode),
                outliers: stat.outliers,
            })),

        omittedNumericStatistics: Math.max(
            0,
            overview.numericStats.length - maxNumericStats,
        ),

        categoricalStatistics: overview.categoricalStats
            .slice(0, maxCategoricalStats)
            .map((stat) => ({
                column: stat.column,
                count: stat.count,
                missingCount: stat.missingCount,
                missingPct: safeNumber(stat.missingPct),
                uniqueCategories: stat.uniqueCategories,
                mode: stat.mode,
                modeFrequency: stat.modeFrequency,
                modePercentage: safeNumber(stat.modePercentage),
                hasTiedMode: stat.hasTiedMode,
                ordinalMin: stat.ordinalMin,
                ordinalMax: stat.ordinalMax,
                ordinalMedian: stat.ordinalMedian,
                hasOrdinalOrder: stat.hasOrdinalOrder,

                topFrequencies: stat.frequency
                    .slice(0, maxFrequencyEntries)
                    .map((entry) => ({
                        value: entry.value,
                        count: entry.count,
                        percentage: safeNumber(entry.percentage),
                    })),

                omittedFrequencyEntries: Math.max(
                    0,
                    stat.frequency.length - maxFrequencyEntries,
                ),
            })),

        omittedCategoricalStatistics: Math.max(
            0,
            overview.categoricalStats.length - maxCategoricalStats,
        ),

        dataQuality: {
            overallScore: quality.overallScore,

            completeness: safeNumber(quality.completeness),
            uniqueness: safeNumber(quality.uniqueness),
            consistency: safeNumber(quality.consistency),

            totalMissing: quality.totalMissing,
            totalCells: quality.totalCells,
            missingPct: safeNumber(quality.missingPct),

            duplicateRows: quality.duplicateRows,
            duplicatePct: safeNumber(quality.duplicatePct),
            duplicateGroupCount: quality.duplicateGroups.length,

            constantColumns: quality.constantColumns.slice(0, 30),

            columnsWithMissingValues: quality.columnMissing
                .filter((column) => column.missing > 0)
                .sort((a, b) => b.missingPct - a.missingPct)
                .slice(0, 30)
                .map((column) => ({
                    column: column.column,
                    missing: column.missing,
                    missingPct: safeNumber(column.missingPct),
                    unique: column.unique,
                })),

            outliers: quality.outliers
                .slice(0, 30)
                .map((outlier) => ({
                    column: outlier.column,
                    count: outlier.count,
                    lowerBound: safeNumber(outlier.lowerBound),
                    upperBound: safeNumber(outlier.upperBound),
                })),
        },
    };
}
