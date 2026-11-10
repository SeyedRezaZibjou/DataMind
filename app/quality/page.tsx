
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Upload,
  AlertTriangle,
  Copy,
  Lock,
  TrendingDown,
  Gauge,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { useI18n } from '@/components/providers/i18n-provider';
import { useDataset } from '@/components/providers/dataset-provider';
import { PageHeader, EmptyState } from '@/components/shared/page-components';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { formatPercent, formatNumber } from '@/lib/dataset/format';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Convert a dataset value to a finite number.
function getNumericValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

// Format values displayed in the duplicate rows table.
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}


// Local accessible progress bar to avoid the Radix Progress build issue.
type QualityProgressProps = {
  value: number;
};

function QualityProgress({ value }: QualityProgressProps) {
  const safeValue = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20"
    >
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

type BoxPlotProps = {
  column: string;
  values: number[];
  q1: number;
  median: number;
  q3: number;
  iqr: number;
  lowerWhiskerLabel: string;
  upperWhiskerLabel: string;
  minimumLabel: string;
  maximumLabel: string;
};

// Custom SVG Box Plot component.
function BoxPlot({
  column,
  values,
  q1,
  median,
  q3,
  iqr,
  lowerWhiskerLabel,
  upperWhiskerLabel,
  minimumLabel,
  maximumLabel,
}: BoxPlotProps) {
  if (values.length === 0) return null;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const inliers = values.filter(
    (value) => value >= lowerBound && value <= upperBound
  );

  const outliers = values.filter(
    (value) => value < lowerBound || value > upperBound
  );

  const lowerWhisker = inliers.length
    ? Math.min(...inliers)
    : q1;

  const upperWhisker = inliers.length
    ? Math.max(...inliers)
    : q3;

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);

  const range = dataMax - dataMin;
  const padding = range === 0 ? 1 : range * 0.05;

  const domainMin = dataMin - padding;
  const domainMax = dataMax + padding;

  const chartLeft = 24;
  const chartRight = 616;
  const chartWidth = chartRight - chartLeft;

  const xScale = (value: number) =>
    chartLeft +
    ((value - domainMin) / (domainMax - domainMin)) * chartWidth;

  const boxLeft = xScale(q1);
  const boxRight = xScale(q3);
  const medianX = xScale(median);
  const lowerX = xScale(lowerWhisker);
  const upperX = xScale(upperWhisker);

  return (
    <div className="mt-3">
      <div className="w-full overflow-hidden">
        <svg
          viewBox="0 0 640 100"
          className="h-auto w-full"
          role="img"
          aria-label={`Box Plot for ${column}`}
        >
          <line
            x1={lowerX}
            y1="48"
            x2={upperX}
            y2="48"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />

          <line
            x1={lowerX}
            y1="35"
            x2={lowerX}
            y2="61"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />

          <line
            x1={upperX}
            y1="35"
            x2={upperX}
            y2="61"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />

          <rect
            x={boxLeft}
            y="25"
            width={Math.max(boxRight - boxLeft, 1)}
            height="46"
            rx="4"
            fill="hsl(var(--chart-1))"
            fillOpacity="0.22"
            stroke="hsl(var(--chart-1))"
            strokeWidth="2"
          />

          <line
            x1={medianX}
            y1="25"
            x2={medianX}
            y2="71"
            stroke="hsl(var(--chart-1))"
            strokeWidth="3"
          />

          {outliers.map((value, index) => (
            <circle
              key={`${value}-${index}`}
              cx={xScale(value)}
              cy={48 + (index % 3 - 1) * 9}
              r="4"
              fill="hsl(var(--destructive))"
              stroke="hsl(var(--background))"
              strokeWidth="1.5"
            >
              <title>{formatNumber(value, 3)}</title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-md bg-muted/40 p-2">
          <p className="text-muted-foreground">
            {lowerWhiskerLabel}
          </p>
          <p className="mt-1 font-semibold tabular-nums">
            {formatNumber(lowerWhisker, 3)}
          </p>
        </div>

        <div className="rounded-md bg-muted/40 p-2">
          <p className="text-muted-foreground">
            {upperWhiskerLabel}
          </p>
          <p className="mt-1 font-semibold tabular-nums">
            {formatNumber(upperWhisker, 3)}
          </p>
        </div>

        <div className="rounded-md bg-muted/40 p-2">
          <p className="text-muted-foreground">
            {minimumLabel}
          </p>
          <p className="mt-1 font-semibold tabular-nums">
            {formatNumber(dataMin, 3)}
          </p>
        </div>

        <div className="rounded-md bg-muted/40 p-2">
          <p className="text-muted-foreground">
            {maximumLabel}
          </p>
          <p className="mt-1 font-semibold tabular-nums">
            {formatNumber(dataMax, 3)}
          </p>
        </div>
      </div>

      {outliers.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          {outliers.length}{' '}
          {maximumLabel === 'Maximum' ? 'potential outliers' : ''}
        </div>
      )}
    </div>
  );
}

export default function QualityPage() {
  const { t } = useI18n();
  const { dataset, quality, overview } = useDataset();

  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    null
  );

  if (!dataset || !quality || !overview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t.quality.title}
          subtitle={t.quality.subtitle}
        />

        <EmptyState
          icon={ShieldCheck}
          title={t.quality.noDataset}
          description={t.quality.noDatasetBody}
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

  const scoreColor =
    quality.overallScore >= 80
      ? 'text-success'
      : quality.overallScore >= 60
        ? 'text-warning'
        : 'text-destructive';

  const missingChartData = quality.columnMissing
    .filter((c) => c.missing > 0)
    .map((c) => ({
      name: c.column,
      missing: c.missing,
      missingPct: c.missingPct,
    }));

  // Prepare Box Plot data for all numeric columns.
  const boxPlotData = overview.numericStats.map((stats) => {
    const values = dataset.rows
      .map((row) => getNumericValue(row[stats.column]))
      .filter((value): value is number => value !== null);

    return {
      ...stats,
      values,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.quality.title}
        subtitle={t.quality.subtitle}
      />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          icon={Lock}
          tone="primary"
        />

        <StatCard
          label={t.dashboard.stats.duplicateRows}
          value={quality.duplicateRows.toLocaleString()}
          icon={Copy}
          tone={quality.duplicateRows > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Overall score and missing values */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">
              {t.quality.overallScore}
            </h3>
          </div>

          <p className="mb-4 text-xs text-muted-foreground">
            {t.quality.scoreHint}
          </p>

          <div className="flex flex-col items-center">
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg
                className="h-36 w-36 -rotate-90"
                viewBox="0 0 144 144"
              >
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="10"
                />

                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  fill="none"
                  stroke={
                    quality.overallScore >= 80
                      ? 'hsl(var(--success))'
                      : quality.overallScore >= 60
                        ? 'hsl(var(--warning))'
                        : 'hsl(var(--destructive))'
                  }
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(quality.overallScore / 100) * 377
                    } 377`}
                />
              </svg>

              <div className="absolute flex flex-col items-center">
                <span
                  className={`text-3xl font-bold tabular-nums ${scoreColor}`}
                >
                  {quality.overallScore}
                </span>
                <span className="text-xs text-muted-foreground">
                  / 100
                </span>
              </div>
            </div>

            <div className="mt-4 w-full space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t.quality.completeness}
                </span>
                <span className="font-medium tabular-nums">
                  {formatPercent(quality.completeness)}
                </span>
              </div>

              <QualityProgress value={quality.completeness} />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t.quality.uniqueness}
                </span>
                <span className="font-medium tabular-nums">
                  {formatPercent(quality.uniqueness)}
                </span>
              </div>

              <QualityProgress value={quality.uniqueness} />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t.quality.consistency}
                </span>
                <span className="font-medium tabular-nums">
                  {formatPercent(quality.consistency)}
                </span>
              </div>

              <QualityProgress value={quality.consistency} />
            </div>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">
            {t.quality.missingPerColumn}
          </h3>

          {missingChartData.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <p className="text-sm text-muted-foreground">
                {t.quality.noMissingValues}
              </p>
            </div>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={missingChartData}
                    margin={{
                      top: 4,
                      right: 8,
                      bottom: 4,
                      left: 8,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 11,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />

                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: 'hsl(var(--muted-foreground))',
                      }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: 'hsl(var(--popover-foreground))',
                        padding: '10px 12px',
                        boxShadow:
                          '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                      labelStyle={{
                        color: 'hsl(var(--popover-foreground))',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}
                      itemStyle={{
                        color: 'hsl(var(--popover-foreground))',
                        fontWeight: 500,
                      }}
                      wrapperStyle={{
                        outline: 'none',
                        zIndex: 50,
                      }}
                      formatter={(v: number) => [
                        v.toLocaleString(),
                        t.quality.missing,
                      ]}
                    />

                    <Bar
                      dataKey="missing"
                      radius={[4, 4, 0, 0]}
                    >
                      {missingChartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.missingPct > 20
                              ? 'hsl(var(--destructive))'
                              : entry.missingPct > 5
                                ? 'hsl(var(--warning))'
                                : 'hsl(var(--chart-1))'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 overflow-x-auto scrollbar-thin rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-3 py-2 text-start font-medium text-muted-foreground">
                        {t.quality.column}
                      </th>
                      <th className="px-3 py-2 text-end font-medium text-muted-foreground">
                        {t.quality.missing}
                      </th>
                      <th className="px-3 py-2 text-end font-medium text-muted-foreground">
                        {t.quality.missingPct}
                      </th>
                      <th className="px-3 py-2 text-end font-medium text-muted-foreground">
                        {t.quality.unique}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {quality.columnMissing
                      .filter((c) => c.missing > 0)
                      .map((c) => (
                        <tr
                          key={c.column}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-3 py-2 font-medium">
                            {c.column}
                          </td>

                          <td className="px-3 py-2 text-end tabular-nums">
                            {c.missing.toLocaleString()}
                          </td>

                          <td className="px-3 py-2 text-end tabular-nums">
                            <span
                              className={
                                c.missingPct > 20
                                  ? 'text-destructive font-medium'
                                  : c.missingPct > 5
                                    ? 'text-warning'
                                    : ''
                              }
                            >
                              {formatPercent(c.missingPct)}
                            </span>
                          </td>

                          <td className="px-3 py-2 text-end tabular-nums">
                            {c.unique.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Duplicate rows and constant columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Copy className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">
              {t.quality.duplicates}
            </h3>
          </div>

          {quality.duplicateRows === 0 ? (
            <div className="flex items-center gap-3 rounded-lg bg-success/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="text-sm text-foreground">
                {t.quality.noDuplicates}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-warning/5 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />

                <p className="text-sm text-foreground">
                  {t.quality.duplicateCount
                    .replace(
                      '{count}',
                      String(quality.duplicateRows)
                    )
                    .replace(
                      '{pct}',
                      formatNumber(quality.duplicatePct, 1)
                    )}
                </p>
              </div>

              <div className="mb-3">
                <h4 className="text-sm font-semibold">
                  {t.quality.duplicateGroups}
                </h4>

                <p className="mt-1 text-xs text-muted-foreground">
                  {t.quality.duplicateGroupHint}
                </p>
              </div>

              {/* Duplicate groups with inline row details */}
              <div className="space-y-2">
                {quality.duplicateGroups.map((group) => {
                  const isSelected =
                    selectedGroupId === group.groupId;

                  const firstRowNumber = group.rowNumbers[0];
                  const row = dataset.rows[firstRowNumber - 1];

                  return (
                    <div
                      key={group.groupId}
                      className="overflow-hidden rounded-lg border border-border"
                    >
                      {/* Group header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {t.quality.duplicateGroup}{' '}
                            {group.groupId}
                          </Badge>

                          <span className="text-xs text-muted-foreground">
                            {group.rowNumbers.length}{' '}
                            {t.quality.rowNumbers}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() =>
                            setSelectedGroupId(
                              isSelected ? null : group.groupId
                            )
                          }
                        >
                          {isSelected ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              {t.quality.viewDuplicateRows}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              {t.quality.viewDuplicateRows}
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Duplicate row numbers */}
                      <div className="flex flex-wrap gap-2 border-t border-border bg-muted/20 px-3 py-3">
                        {group.rowNumbers.map((rowNumber) => (
                          <button
                            key={rowNumber}
                            type="button"
                            onClick={() =>
                              setSelectedGroupId(
                                isSelected ? null : group.groupId
                              )
                            }
                            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium tabular-nums transition-colors hover:border-primary hover:bg-primary/5"
                          >
                            #{rowNumber}
                          </button>
                        ))}
                      </div>

                      {/* Selected group details - directly below its group */}
                      {isSelected && row && (
                        <div className="space-y-3 border-t border-border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold">
                              {t.quality.duplicateDetails}
                            </h4>

                            <Badge variant="secondary">
                              #{firstRowNumber}
                            </Badge>
                          </div>

                          <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full min-w-max text-xs">
                              <thead>
                                <tr className="border-b border-border bg-muted/40">
                                  {dataset.columns.map((column) => (
                                    <th
                                      key={column}
                                      className="whitespace-nowrap px-3 py-3 text-start font-medium text-muted-foreground"
                                    >
                                      {column}
                                    </th>
                                  ))}
                                </tr>
                              </thead>

                              <tbody>
                                <tr className="hover:bg-muted/30">
                                  {dataset.columns.map((column) => (
                                    <td
                                      key={column}
                                      className="whitespace-nowrap border-t border-border/50 px-3 py-3"
                                    >
                                      {formatCellValue(row[column])}
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">
              {t.quality.constantColumns}
            </h3>
          </div>

          <p className="mb-3 text-xs text-muted-foreground">
            {t.quality.constantHint}
          </p>

          {quality.constantColumns.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg bg-success/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="text-sm text-foreground">
                {t.quality.noConstant}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {quality.constantColumns.map((col) => (
                <Badge
                  key={col}
                  variant="outline"
                  className="gap-1.5 border-warning/40 text-warning"
                >
                  <Lock className="h-3 w-3" />
                  {col}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Potential outliers and Box Plots */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />

          <h3 className="font-semibold">
            {t.quality.outliers}
          </h3>
        </div>

        <p className="mb-5 text-xs text-muted-foreground">
          {t.quality.outliersHint}
        </p>

        {boxPlotData.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-4">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t.quality.noOutliers}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {boxPlotData.map((stats) => {
              const outlierCount = stats.outliers;

              return (
                <div
                  key={stats.column}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">
                      {stats.column}
                    </h4>

                    <Badge
                      variant="outline"
                      className={
                        outlierCount > 0
                          ? 'gap-1 border-warning/40 text-warning'
                          : 'gap-1 border-success/40 text-success'
                      }
                    >
                      {outlierCount > 0 ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}

                      {t.quality.outlierCount.replace(
                        '{count}',
                        String(outlierCount)
                      )}
                    </Badge>
                  </div>

                  <BoxPlot
                    column={stats.column}
                    values={stats.values}
                    q1={stats.q1}
                    median={stats.median}
                    q3={stats.q3}
                    iqr={stats.iqr}
                    lowerWhiskerLabel={t.quality.lowerWhisker}
                    upperWhiskerLabel={t.quality.upperWhisker}
                    minimumLabel={t.quality.minimum}
                    maximumLabel={t.quality.maximum}
                  />

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>
                      Q1: {formatNumber(stats.q1, 3)}
                    </span>

                    <span>
                      Median: {formatNumber(stats.median, 3)}
                    </span>

                    <span>
                      Q3: {formatNumber(stats.q3, 3)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
