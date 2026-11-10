'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Table2,
  Database,
  ShieldCheck,
  TrendingDown,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Hash,
  Type as TypeIcon,
  Calendar,
  ToggleLeft,
  AlignLeft,
  BarChart3,
  Printer,
} from 'lucide-react';

import { useI18n } from '@/components/providers/i18n-provider';
import { useDataset } from '@/components/providers/dataset-provider';
import { PageHeader, EmptyState } from '@/components/shared/page-components';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { formatNumber, formatPercent, formatNullable } from '@/lib/dataset/format';
import type { ColumnType } from '@/lib/dataset/types';

const TYPE_META: Record<ColumnType, { icon: React.ElementType; labelKey: keyof typeof TYPE_LABEL_KEYS }> = {
  numeric: { icon: Hash, labelKey: 'numeric' },
  categorical: { icon: BarChart3, labelKey: 'categorical' },
  boolean: { icon: ToggleLeft, labelKey: 'boolean' },
  datetime: { icon: Calendar, labelKey: 'datetime' },
  text: { icon: AlignLeft, labelKey: 'text' },
  unknown: { icon: TypeIcon, labelKey: 'unknown' },
};

const TYPE_LABEL_KEYS = {
  numeric: 'numeric',
  categorical: 'categorical',
  boolean: 'boolean',
  datetime: 'datetime',
  text: 'text',
  unknown: 'unknown',
} as const;

export default function ReportsPage() {
  const { t, lang } = useI18n();
  const { dataset, overview, quality } = useDataset();

  const generatedOn = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [lang]);

  if (!dataset || !overview || !quality) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.reports.title} subtitle={t.reports.subtitle} />
        <EmptyState
          icon={FileText}
          title={t.reports.noDataset}
          description={t.reports.noDatasetBody}
          action={
            <Link href="/upload">
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                {t.dashboard.uploadDataset}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const typeCountEntries = (Object.entries(overview.typeCounts) as [ColumnType, number][])
    .filter(([, count]) => count > 0);

  const numericCols = overview.columns.filter((c) => c.type === 'numeric');
  const categoricalCols = overview.columns.filter((c) => c.type === 'categorical');

  const totalMissing = quality.totalMissing;
  const duplicateRows = quality.duplicateRows;
  const totalOutliers = quality.outliers.reduce((sum, o) => sum + o.count, 0);
  const constantCount = quality.constantColumns.length;

  const scoreBg =
    quality.overallScore >= 80
      ? 'bg-success/5 border-success/30'
      : quality.overallScore >= 60
        ? 'bg-warning/5 border-warning/30'
        : 'bg-destructive/5 border-destructive/30';

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="print:hidden">
        <PageHeader
          title={t.reports.title}
          subtitle={t.reports.subtitle}
          action={
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              {t.reports.exportPdf}
            </Button>
          }
        />
        <p className="text-xs text-muted-foreground -mt-4 mb-2">{t.reports.exportHint}</p>
      </div>

      {/* Print-only report header */}
      <div className="hidden print:block border-b border-border pb-4">
        <h1 className="text-2xl font-bold">{t.reports.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.reports.reportFor}: <span className="font-medium text-foreground">{dataset.name}</span>
          <span className="mx-2">·</span>
          {t.reports.generatedOn}: <span className="font-medium text-foreground">{generatedOn}</span>
        </p>
      </div>

      {/* Dataset Summary */}
      <Card className="p-6 print:block print:border-0 print:shadow-none print-block">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.reports.datasetSummary}</h3>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {t.reports.reportFor}: <span className="font-medium text-foreground">{dataset.name}</span>
          <span className="mx-2">·</span>
          {t.reports.generatedOn}: <span className="font-medium text-foreground">{generatedOn}</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t.common.rows}
            value={overview.rowCount.toLocaleString()}
            icon={Table2}
            tone="primary"
          />
          <StatCard
            label={t.common.columns}
            value={overview.columnCount.toLocaleString()}
            icon={TypeIcon}
            tone="accent"
          />
          <StatCard
            label={t.dashboard.stats.missingValues}
            value={totalMissing.toLocaleString()}
            icon={AlertTriangle}
            tone={totalMissing > 0 ? 'warning' : 'success'}
          />
          <StatCard
            label={t.dashboard.stats.duplicateRows}
            value={duplicateRows.toLocaleString()}
            icon={Copy}
            tone={duplicateRows > 0 ? 'warning' : 'success'}
          />
        </div>
      </Card>

      {/* Dataset Dimensions / Column types */}
      <Card className="p-6 print:block print:border-0 print:shadow-none print-block">
        <div className="mb-4 flex items-center gap-2">
          <TypeIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.overview.columnTypes}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {typeCountEntries.map(([type, count]) => {
            const meta = TYPE_META[type];
            const Icon = meta.icon;
            const label = (t.common as Record<string, string>)[meta.labelKey] ?? type;
            return (
              <Badge key={type} variant="secondary" className="gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}: {count}
              </Badge>
            );
          })}
        </div>
      </Card>

      {/* Data Quality Overview */}
      <Card className={`p-6 border print:block print:border-0 print:shadow-none print-block ${scoreBg}`}>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.reports.qualitySummary}</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t.quality.overallScore}
            value={quality.overallScore}
            icon={ShieldCheck}
            tone={quality.overallScore >= 80 ? 'success' : quality.overallScore >= 60 ? 'warning' : 'destructive'}
          />
          <StatCard
            label={t.quality.completeness}
            value={formatPercent(quality.completeness)}
            icon={CheckCircle2}
            tone="success"
          />
          <StatCard
            label={t.quality.uniqueness}
            value={formatPercent(quality.uniqueness)}
            icon={Copy}
            tone="accent"
          />
          <StatCard
            label={t.quality.consistency}
            value={formatPercent(quality.consistency)}
            icon={CheckCircle2}
            tone="primary"
          />
        </div>
      </Card>

      {/* Missing Values Summary */}
      <Card className="p-6 print:block print:border-0 print:shadow-none print-block">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.quality.missingPerColumn}</h3>
        </div>
        {totalMissing === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-success/5 p-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="text-sm text-foreground">{t.quality.noMissingValues}</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t.quality.column}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.quality.missing}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.quality.missingPct}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.quality.unique}</th>
                </tr>
              </thead>
              <tbody>
                {quality.columnMissing
                  .filter((c) => c.missing > 0)
                  .map((c) => (
                    <tr key={c.column} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{c.column}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{c.missing.toLocaleString()}</td>
                      <td className="px-3 py-2 text-end tabular-nums">
                        <span className={c.missingPct > 20 ? 'text-destructive font-medium' : c.missingPct > 5 ? 'text-warning' : ''}>
                          {formatPercent(c.missingPct)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums">{c.unique.toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Duplicate & Constant Summary */}
      <div className="grid gap-6 lg:grid-cols-2 print-block">
        <Card className="p-6 print:block print:border-0 print:shadow-none">
          <div className="mb-4 flex items-center gap-2">
            <Copy className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">{t.quality.duplicates}</h3>
          </div>
          {duplicateRows === 0 ? (
            <div className="flex items-center gap-3 rounded-lg bg-success/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="text-sm text-foreground">{t.quality.noDuplicates}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-warning/5 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm text-foreground">
                {t.quality.duplicateCount
                  .replace('{count}', String(duplicateRows))
                  .replace('{pct}', formatNumber(quality.duplicatePct, 1))}
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6 print:block print:border-0 print:shadow-none">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">{t.quality.constantColumns}</h3>
          </div>
          {constantCount === 0 ? (
            <div className="flex items-center gap-3 rounded-lg bg-success/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="text-sm text-foreground">{t.quality.noConstant}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {quality.constantColumns.map((col) => (
                <Badge key={col} variant="outline" className="gap-1.5 border-warning/40 text-warning">
                  {col}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Outlier Summary */}
      <Card className="p-6 print:block print:border-0 print:shadow-none print-block">
        <div className="mb-4 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.quality.outliers}</h3>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">{t.quality.outliersHint}</p>
        {totalOutliers === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-success/5 p-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="text-sm text-foreground">{t.quality.noOutliers}</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t.quality.column}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.quality.outlierCount.replace('{count}', '')}</th>
                </tr>
              </thead>
              <tbody>
                {quality.outliers
                  .filter((o) => o.count > 0)
                  .map((o) => (
                    <tr key={o.column} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{o.column}</td>
                      <td className="px-3 py-2 text-end tabular-nums">
                        <Badge variant="outline" className="gap-1 border-warning/40 text-warning">
                          <AlertTriangle className="h-3 w-3" />
                          {t.quality.outlierCount.replace('{count}', String(o.count))}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Descriptive Statistics - Numeric */}
      {numericCols.length > 0 && (
        <Card className="p-6 print:block print:border-0 print:shadow-none print-block">
          <div className="mb-4 flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">{t.reports.numericStats}</h3>
          </div>
          <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t.overview.column}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.count}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.missing}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.mean}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.std}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.min}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.median}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.max}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.iqr}</th>
                </tr>
              </thead>
              <tbody>
                {overview.numericStats.map((s) => (
                  <tr key={s.column} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{s.column}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{s.count.toLocaleString()}</td>
                    <td className="px-3 py-2 text-end tabular-nums">
                      {overview.columns.find((c) => c.name === s.column)?.missing.toLocaleString() ?? 0}
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">{formatNumber(s.mean)}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{formatNullable(s.std)}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{formatNumber(s.min)}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{formatNumber(s.median)}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{formatNumber(s.max)}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{formatNullable(s.iqr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Descriptive Statistics - Categorical */}
      {categoricalCols.length > 0 && overview.categoricalStats.length > 0 && (
        <Card className="p-6 print:block print:border-0 print:shadow-none print-block">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">{t.reports.categoricalStats}</h3>
          </div>
          <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t.overview.column}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.uniqueCategories}</th>
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t.overview.stat.mode}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.modeFrequency}</th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.modePercentage}</th>
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t.overview.stat.frequency}</th>
                </tr>
              </thead>
              <tbody>
                {overview.categoricalStats.map((s) => {
                  const top3 = s.frequency.slice(0, 3);
                  return (
                    <tr key={s.column} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{s.column}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{s.uniqueCategories.toLocaleString()}</td>
                      <td className="px-3 py-2 text-start">
                        {s.mode.join(', ')}
                        {s.hasTiedMode && (
                          <Badge variant="outline" className="ms-2 text-[10px]">
                            {t.overview.tiedMode}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums">{s.modeFrequency.toLocaleString()}</td>
                      <td className="px-3 py-2 text-end tabular-nums">{formatPercent(s.modePercentage)}</td>
                      <td className="px-3 py-2 text-start text-xs text-muted-foreground">
                        {top3.map((f, i) => (
                          <span key={f.value} className="inline-block">
                            {i > 0 && <span className="mx-1">·</span>}
                            {f.value} ({f.count})
                          </span>
                        ))}
                        {s.frequency.length > 3 && <span className="ms-1 text-muted-foreground/70">+{s.frequency.length - 3}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Column Breakdown */}
      <Card className="p-6 print:block print:border-0 print:shadow-none print-block">
        <div className="mb-4 flex items-center gap-2">
          <Table2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.reports.columnBreakdown}</h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t.overview.column}</th>
                <th className="px-3 py-2 text-start font-medium text-muted-foreground">{t.overview.type}</th>
                <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.nonNull}</th>
                <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.missing}</th>
                <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.stat.missingPct}</th>
                <th className="px-3 py-2 text-end font-medium text-muted-foreground">{t.overview.unique}</th>
              </tr>
            </thead>
            <tbody>
              {overview.columns.map((c) => {
                const meta = TYPE_META[c.type];
                const Icon = meta.icon;
                const label = (t.common as Record<string, string>)[meta.labelKey] ?? c.type;
                return (
                  <tr key={c.name} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary" className="gap-1.5">
                        <Icon className="h-3 w-3" />
                        {label}
                        {c.subtype && <span className="text-[10px]">·{(t.common as Record<string, string>)[c.subtype] ?? c.subtype}</span>}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">{c.nonNull.toLocaleString()}</td>
                    <td className="px-3 py-2 text-end tabular-nums">
                      <span className={c.missingPct > 20 ? 'text-destructive font-medium' : c.missingPct > 5 ? 'text-warning' : ''}>
                        {c.missing.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">{formatPercent(c.missingPct)}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{c.unique.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Visualization Summary */}
      <Card className="p-6 print:block print:border-0 print:shadow-none print-block">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.reports.visualizationSummary}</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={t.reports.chartsCreated}
            value={10}
            icon={BarChart3}
            tone="primary"
          />
          <StatCard
            label={t.overview.numericStats}
            value={numericCols.length}
            icon={Hash}
            tone="accent"
          />
          <StatCard
            label={t.reports.categoricalStats}
            value={categoricalCols.length}
            icon={BarChart3}
            tone="default"
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{t.reports.chartTypes}</p>
      </Card>
    </div>
  );
}
