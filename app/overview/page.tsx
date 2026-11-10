
'use client';

import Link from 'next/link';
import {
  TableProperties,
  Upload,
  Hash,
  Type as TypeIcon,
  Calendar,
  ToggleLeft,
  HelpCircle,
  BarChart2,
} from 'lucide-react';

import { useI18n } from '@/components/providers/i18n-provider';
import { useDataset } from '@/components/providers/dataset-provider';
import { PageHeader, EmptyState } from '@/components/shared/page-components';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/dataset/format';
import type { ColumnType } from '@/lib/dataset/types';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const TYPE_META: Record<ColumnType, { icon: React.ElementType; color: string }> = {
  numeric: { icon: Hash, color: 'hsl(var(--chart-1))' },
  categorical: { icon: TypeIcon, color: 'hsl(var(--chart-2))' },
  datetime: { icon: Calendar, color: 'hsl(var(--chart-3))' },
  boolean: { icon: ToggleLeft, color: 'hsl(var(--chart-4))' },
  text: { icon: TypeIcon, color: 'hsl(var(--chart-5))' },
  unknown: { icon: HelpCircle, color: 'hsl(var(--muted-foreground))' },
};

const TYPE_LABELS: Record<ColumnType, string> = {
  numeric: 'numeric',
  categorical: 'categorical',
  datetime: 'datetime',
  boolean: 'boolean',
  text: 'text',
  unknown: 'unknown',
};

export default function OverviewPage() {
  const { t } = useI18n();
  const { dataset, overview } = useDataset();

  if (!dataset || !overview) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.overview.title} subtitle={t.overview.subtitle} />

        <EmptyState
          icon={TableProperties}
          title={t.overview.noDataset}
          description={t.overview.noDatasetBody}
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

  const typeData = (Object.keys(overview.typeCounts) as ColumnType[])
    .filter((k) => overview.typeCounts[k] > 0)
    .map((k) => ({
      name: t.common[TYPE_LABELS[k] as keyof typeof t.common],
      key: k,
      value: overview.typeCounts[k],
    }));

  const statKeys: { key: keyof typeof t.overview.stat; raw: string }[] = [
    { key: 'count', raw: 'count' },
    { key: 'mean', raw: 'mean' },
    { key: 'std', raw: 'std' },
    { key: 'min', raw: 'min' },
    { key: 'q1', raw: 'q1' },
    { key: 'median', raw: 'median' },
    { key: 'q3', raw: 'q3' },
    { key: 'max', raw: 'max' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t.overview.title} subtitle={t.overview.subtitle} />

      {/* Dataset summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t.overview.shape}
          value={`${overview.rowCount.toLocaleString()} × ${overview.columnCount}`}
          icon={TableProperties}
          tone="primary"
        />

        <StatCard
          label={t.common.rows}
          value={overview.rowCount.toLocaleString()}
          icon={Hash}
          tone="accent"
        />

        <StatCard
          label={t.common.columns}
          value={overview.columnCount}
          icon={TypeIcon}
          tone="default"
        />
      </div>

      {/* Column types and distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">{t.overview.columnTypes}</h3>

          <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">
                    {t.overview.column}
                  </th>
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">
                    {t.overview.type}
                  </th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">
                    {t.overview.nonNull}
                  </th>
                  <th className="px-3 py-2 text-end font-medium text-muted-foreground">
                    {t.overview.unique}
                  </th>
                </tr>
              </thead>

              <tbody>
                {overview.columns.map((col) => {
                  const meta = TYPE_META[col.type];
                  const Icon = meta.icon;

                  return (
                    <tr
                      key={col.name}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-3 py-2 font-medium">{col.name}</td>

                      <td className="px-3 py-2">
                        <Badge variant="outline" className="gap-1.5 font-normal">
                          <Icon
                            className="h-3 w-3"
                            style={{ color: meta.color }}
                          />
                          {t.common[TYPE_LABELS[col.type] as keyof typeof t.common]}
                        </Badge>
                      </td>

                      <td className="px-3 py-2 text-end tabular-nums">
                        {col.nonNull.toLocaleString()}
                      </td>

                      <td className="px-3 py-2 text-end tabular-nums">
                        {col.unique.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold">{t.overview.typeDistribution}</h3>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {typeData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={TYPE_META[entry.key].color}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'hsl(var(--popover-foreground))',
                    padding: '10px 12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
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
                  formatter={(value: number, name: string, props: any) => {
                    const total = typeData.reduce(
                      (sum, item) => sum + item.value,
                      0
                    );

                    const percentage =
                      total > 0 ? (value / total) * 100 : 0;

                    return [
                      `${value.toLocaleString()} (${formatNumber(percentage, 2)}%)`,
                      name,
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 space-y-2">
            {typeData.map((entry) => (
              <div
                key={entry.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: TYPE_META[entry.key].color }}
                  />
                  {entry.name}
                </span>

                <span className="font-medium tabular-nums">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Numeric descriptive statistics */}
      <Card className="p-5">
        <h3 className="mb-1 font-semibold">{t.overview.statistics}</h3>

        <p className="mb-4 text-xs text-muted-foreground">
          {t.overview.statisticsHint}
        </p>

        {overview.numericStats.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t.overview.noNumericCols}
          </p>
        ) : (
          <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">
                    {t.overview.column}
                  </th>

                  {statKeys.map((s) => (
                    <th
                      key={s.key}
                      className="px-3 py-2 text-end font-medium text-muted-foreground"
                    >
                      {t.overview.stat[s.key]}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {overview.numericStats.map((stat) => (
                  <tr
                    key={stat.column}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-3 py-2 font-medium">
                      {stat.column}
                    </td>

                    {statKeys.map((s) => {
                      const val = (stat as unknown as Record<string, number>)[s.raw];

                      return (
                        <td
                          key={s.key}
                          className="px-3 py-2 text-end tabular-nums text-foreground/80"
                        >
                          {formatNumber(val, 2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Categorical and Boolean descriptive statistics */}
      <Card className="p-5">
        <div className="mb-4">
          <h3 className="font-semibold">
            {t.overview.categoricalStats}
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            {t.overview.statisticsHint}
          </p>
        </div>

        {overview.categoricalStats.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t.overview.noCategoricalCols}
          </p>
        ) : (
          <div className="space-y-6">
            {overview.categoricalStats.map((stat) => {
              const isBinary = stat.uniqueCategories === 2;

              return (
                <div
                  key={stat.column}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold">{stat.column}</h4>

                    <Badge variant="outline">
                      {isBinary
                        ? t.common.boolean
                        : t.common.categorical}
                    </Badge>
                  </div>

                  {/* Summary metrics */}
                  <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t.overview.stat.count}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {stat.count.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t.overview.stat.missing}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {stat.missingCount.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t.overview.stat.missingPct}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {formatNumber(stat.missingPct, 2)}%
                      </p>
                    </div>

                    <div className="rounded-md bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">
                        {t.overview.stat.uniqueCategories}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {stat.uniqueCategories.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Mode information */}
                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">
                        {t.overview.stat.mode}
                      </p>

                      <p className="mt-1 font-semibold break-words">
                        {stat.mode.length > 0
                          ? stat.mode.join(', ')
                          : '—'}
                      </p>

                      {stat.hasTiedMode && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t.overview.tiedMode}
                        </p>
                      )}
                    </div>

                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">
                        {t.overview.stat.modeFrequency}
                      </p>

                      <p className="mt-1 font-semibold tabular-nums">
                        {stat.modeFrequency.toLocaleString()}
                        {' '}
                        <span className="text-sm font-normal text-muted-foreground">
                          ({formatNumber(stat.modePercentage, 2)}%)
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Ordinal statistics */}
                  {stat.hasOrdinalOrder && (
                    <div className="mb-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-md bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">
                          {t.overview.stat.ordinalMin}
                        </p>
                        <p className="mt-1 font-semibold">
                          {stat.ordinalMin ?? '—'}
                        </p>
                      </div>

                      <div className="rounded-md bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">
                          {t.overview.stat.ordinalMedian}
                        </p>
                        <p className="mt-1 font-semibold">
                          {stat.ordinalMedian ?? '—'}
                        </p>
                      </div>

                      <div className="rounded-md bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">
                          {t.overview.stat.ordinalMax}
                        </p>
                        <p className="mt-1 font-semibold">
                          {stat.ordinalMax ?? '—'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Frequency distribution */}
                  <h5 className="mb-2 text-sm font-medium">
                    {t.overview.stat.frequency}
                  </h5>

                  {stat.frequency.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {t.overview.noCategoricalCols}
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="px-3 py-2 text-start font-medium text-muted-foreground">
                              {t.overview.column}
                            </th>

                            <th className="px-3 py-2 text-end font-medium text-muted-foreground">
                              {t.overview.stat.count}
                            </th>

                            <th className="px-3 py-2 text-end font-medium text-muted-foreground">
                              {t.overview.stat.percentage}
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {stat.frequency.map((item) => (
                            <tr
                              key={item.value}
                              className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                            >
                              <td className="px-3 py-2 font-medium">
                                {item.value}
                              </td>

                              <td className="px-3 py-2 text-end tabular-nums">
                                {item.count.toLocaleString()}
                              </td>

                              <td className="px-3 py-2 text-end tabular-nums">
                                {formatNumber(item.percentage, 2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Sample records */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.overview.sampleRecords}</h3>
        </div>

        <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {dataset.columns.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-3 py-2 text-start font-medium text-muted-foreground"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {overview.sample.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                >
                  {dataset.columns.map((col) => (
                    <td
                      key={col}
                      className="whitespace-nowrap px-3 py-2 text-foreground/80"
                    >
                      {row[col] === null || row[col] === undefined ? (
                        <span className="text-muted-foreground/50 italic">
                          —
                        </span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
