
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3, Upload, BarChart2, LineChart as LineIcon, ScatterChart as ScatterIcon,
  Box, ChartColumn, PieChart as PieIcon, Circle, TrendingUp, Layers, Columns2,
} from 'lucide-react';

import { useI18n } from '@/components/providers/i18n-provider';
import { useDataset } from '@/components/providers/dataset-provider';
import { PageHeader, EmptyState } from '@/components/shared/page-components';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { formatNumber, formatCompact } from '@/lib/dataset/format';
import { toNumber } from '@/lib/dataset/infer';
import type { ColumnProfile } from '@/lib/dataset/types';

import {
  BarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  ScatterChart as ReScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
  PieChart as RePieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';

type ChartType =
  | 'histogram' | 'line' | 'scatter' | 'boxplot'
  | 'barCat' | 'pie' | 'donut' | 'pareto' | 'stacked' | 'grouped';

type MeasureMode = 'count' | 'pct';
type SortMode = 'freq' | 'alpha' | 'ordinal';
type Orientation = 'vertical' | 'horizontal';

const CHART_ICONS: Record<ChartType, React.ElementType> = {
  histogram: ChartColumn,
  line: LineIcon,
  scatter: ScatterIcon,
  boxplot: Box,
  barCat: BarChart2,
  pie: PieIcon,
  donut: Circle,
  pareto: TrendingUp,
  stacked: Layers,
  grouped: Columns2,
};

const NUMERIC_CHARTS: ChartType[] = [
  'histogram', 'line', 'scatter', 'boxplot',
];

const CATEGORICAL_SINGLE: ChartType[] = [
  'barCat', 'pie', 'donut', 'pareto',
];

const CATEGORICAL_DUAL: ChartType[] = [
  'stacked', 'grouped',
];

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-1) / 0.7)',
  'hsl(var(--chart-2) / 0.7)',
  'hsl(var(--chart-3) / 0.7)',
  'hsl(var(--chart-4) / 0.7)',
  'hsl(var(--chart-5) / 0.7)',
];

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;

  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;

  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function isCategorical(col: ColumnProfile): boolean {
  return col.type === 'categorical' || col.type === 'boolean';
}

function isNumeric(col: ColumnProfile): boolean {
  return col.type === 'numeric';
}

export default function VisualizationPage() {
  const { t } = useI18n();
  const { dataset, overview, typeOverrides } = useDataset();

  // --------------------------------------------------
  // State
  // --------------------------------------------------

  const [chartType, setChartType] = useState<ChartType>('histogram');

  const [xCol, setXCol] = useState<string>('');
  const [yCol, setYCol] = useState<string>('');
  const [groupCol, setGroupCol] = useState<string>('');

  const [bins, setBins] = useState<number[]>([10]);
  const [measure, setMeasure] = useState<MeasureMode>('count');
  const [sortMode, setSortMode] = useState<SortMode>('freq');
  const [orientation, setOrientation] = useState<Orientation>('horizontal');

  // --------------------------------------------------
  // Column information
  // --------------------------------------------------

  const numericCols = useMemo(
    () => (overview?.columns ?? []).filter(isNumeric),
    [overview],
  );

  const categoricalCols = useMemo(
    () => (overview?.columns ?? []).filter(isCategorical),
    [overview],
  );

  const allCols = overview?.columns ?? [];

  const getOrdinalOrder = (col: string): string[] | undefined => {
    const ov = typeOverrides[col];

    if (ov?.subtype === 'ordinal' && ov.ordinalOrder) {
      return ov.ordinalOrder;
    }

    return undefined;
  };

  // --------------------------------------------------
  // Available charts
  // --------------------------------------------------

  const availableCharts = useMemo<ChartType[]>(() => {
    const charts: ChartType[] = [];

    if (numericCols.length >= 1) {
      charts.push('histogram', 'boxplot');
    }

    if (numericCols.length >= 2) {
      charts.push('line', 'scatter');
    }

    if (categoricalCols.length >= 1) {
      charts.push('barCat', 'pie', 'donut', 'pareto');
    }

    if (categoricalCols.length >= 2) {
      charts.push('stacked', 'grouped');
    }

    return charts;
  }, [numericCols, categoricalCols]);

  // --------------------------------------------------
  // FIX 1: Stable column selection
  // --------------------------------------------------

  // Select X column according to the active chart type.
  // This prevents numeric and categorical columns from
  // repeatedly overwriting each other's selection.

  useEffect(() => {
    let options: ColumnProfile[] = [];

    if (NUMERIC_CHARTS.includes(chartType)) {
      options = numericCols;
    } else if (
      CATEGORICAL_SINGLE.includes(chartType) ||
      CATEGORICAL_DUAL.includes(chartType)
    ) {
      options = categoricalCols;
    }

    const isValid = options.some((col) => col.name === xCol);

    if (!isValid) {
      setXCol(options[0]?.name ?? '');
    }
  }, [chartType, numericCols, categoricalCols, xCol]);

  // Select Y column for line and scatter charts.
  // X and Y must be different columns.

  useEffect(() => {
    if (chartType !== 'line' && chartType !== 'scatter') {
      return;
    }

    const validY = numericCols.some(
      (col) => col.name === yCol && col.name !== xCol,
    );

    if (!validY) {
      const nextY = numericCols.find(
        (col) => col.name !== xCol,
      );

      setYCol(nextY?.name ?? '');
    }
  }, [chartType, numericCols, xCol, yCol]);

  // Select grouping column for stacked and grouped charts.
  // X and group columns must be different.

  useEffect(() => {
    if (!CATEGORICAL_DUAL.includes(chartType)) {
      return;
    }

    const validGroup = categoricalCols.some(
      (col) => col.name === groupCol && col.name !== xCol,
    );

    if (!validGroup) {
      const nextGroup = categoricalCols.find(
        (col) => col.name !== xCol,
      );

      setGroupCol(nextGroup?.name ?? '');
    }
  }, [chartType, categoricalCols, xCol, groupCol]);

  // Keep the selected chart valid when dataset changes.

  useEffect(() => {
    if (
      availableCharts.length > 0 &&
      !availableCharts.includes(chartType)
    ) {
      setChartType(availableCharts[0]);
    }
  }, [availableCharts, chartType]);

  // --------------------------------------------------
  // FIX 2: Chart data calculations
  // All hooks are called before the conditional return.
  // --------------------------------------------------

  const histogramData = useMemo(() => {
    if (!dataset || !xCol || chartType !== 'histogram') {
      return [];
    }

    const values = dataset.rows
      .map((row) => toNumber(row[xCol]))
      .filter((value): value is number => value !== null);

    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      return [{ bin: formatNumber(min), count: values.length }];
    }

    const binCount = bins[0];
    const step = (max - min) / binCount;

    const buckets = Array.from({ length: binCount }, (_, i) => ({
      binStart: min + i * step,
      binEnd: min + (i + 1) * step,
      bin: `${formatCompact(min + i * step)}–${formatCompact(min + (i + 1) * step)}`,
      count: 0,
    }));

    for (const value of values) {
      let index = Math.floor((value - min) / step);

      if (index >= binCount) index = binCount - 1;
      if (index < 0) index = 0;

      buckets[index].count++;
    }

    return buckets;
  }, [dataset, xCol, bins, chartType]);

  const lineData = useMemo(() => {
    if (!dataset || !xCol || !yCol || chartType !== 'line') {
      return [];
    }

    const points = dataset.rows
      .map((row) => ({
        x: toNumber(row[xCol]),
        y: toNumber(row[yCol]),
      }))
      .filter(
        (point) => point.x !== null && point.y !== null,
      ) as { x: number; y: number }[];

    points.sort((a, b) => a.x - b.x);

    return points.map((point) => ({
      x: point.x,
      y: point.y,
    }));
  }, [dataset, xCol, yCol, chartType]);

  const scatterData = useMemo(() => {
    if (!dataset || !xCol || !yCol || chartType !== 'scatter') {
      return [];
    }

    return dataset.rows
      .map((row) => ({
        x: toNumber(row[xCol]),
        y: toNumber(row[yCol]),
      }))
      .filter(
        (point): point is { x: number; y: number } =>
          point.x !== null && point.y !== null,
      );
  }, [dataset, xCol, yCol, chartType]);

  const boxplotData = useMemo(() => {
    if (!dataset || !xCol || chartType !== 'boxplot') {
      return [];
    }

    const values = dataset.rows
      .map((row) => toNumber(row[xCol]))
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b);

    if (values.length === 0) return [];

    const q1 = quantile(values, 0.25);
    const median = quantile(values, 0.5);
    const q3 = quantile(values, 0.75);

    const iqr = q3 - q1;

    const whiskerLow =
      values.find((value) => value >= q1 - 1.5 * iqr) ?? values[0];

    const whiskerHigh =
      [...values].reverse().find(
        (value) => value <= q3 + 1.5 * iqr,
      ) ?? values[values.length - 1];

    return [{
      name: xCol,
      min: whiskerLow,
      q1,
      median,
      q3,
      max: whiskerHigh,
    }];
  }, [dataset, xCol, chartType]);

  // Categorical frequency data always returns the same structure.

  const catFreqData = useMemo(() => {
    if (!dataset || !xCol || !CATEGORICAL_SINGLE.includes(chartType)) {
      return { data: [] as { name: string; count: number; pct: number }[], total: 0 };
    }

    const counts = new Map<string, number>();

    let total = 0;

    for (const row of dataset.rows) {
      const value = row[xCol];

      if (value === null || value === undefined) continue;

      const key = String(value);

      counts.set(key, (counts.get(key) ?? 0) + 1);
      total++;
    }

    let arr = Array.from(counts.entries()).map(([name, count]) => ({
      name,
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
    }));

    if (sortMode === 'freq') {
      arr.sort((a, b) => b.count - a.count);
    } else if (sortMode === 'alpha') {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'ordinal') {
      const order = getOrdinalOrder(xCol);

      if (order) {
        const rank = new Map(order.map((value, index) => [value, index]));

        arr.sort(
          (a, b) =>
            (rank.get(a.name) ?? 999) -
            (rank.get(b.name) ?? 999),
        );
      } else {
        arr.sort((a, b) => b.count - a.count);
      }
    }

    return {
      data: arr.slice(0, 20),
      total,
    };
  }, [dataset, xCol, chartType, sortMode, typeOverrides]);

  const paretoData = useMemo(() => {
    if (chartType !== 'pareto') {
      return [];
    }

    let cumulative = 0;

    return catFreqData.data.map((item) => {
      cumulative += item.pct;

      return {
        ...item,
        cumulative,
      };
    });
  }, [catFreqData, chartType]);

  const crossTabData = useMemo(() => {
    if (
      !dataset ||
      !xCol ||
      !groupCol ||
      !CATEGORICAL_DUAL.includes(chartType)
    ) {
      return {
        data: [] as Record<string, number | string>[],
        groups: [] as string[],
        total: 0,
      };
    }

    const cross = new Map<string, Map<string, number>>();

    let total = 0;

    for (const row of dataset.rows) {
      const xv = row[xCol];
      const gv = row[groupCol];

      if (
        xv === null || xv === undefined ||
        gv === null || gv === undefined
      ) {
        continue;
      }

      const xKey = String(xv);
      const gKey = String(gv);

      if (!cross.has(xKey)) {
        cross.set(xKey, new Map());
      }

      const inner = cross.get(xKey)!;

      inner.set(gKey, (inner.get(gKey) ?? 0) + 1);

      total++;
    }

    const allGroups = new Set<string>();

    for (const inner of Array.from(cross.values())) {
      for (const group of Array.from(inner.keys())) {
        allGroups.add(group);
      }
    }

    const groups = Array.from(allGroups).sort();

    let arr = Array.from(cross.entries()).map(([name, inner]) => {
      const row: Record<string, number | string> = { name };

      let rowTotal = 0;

      for (const group of groups) {
        const count = inner.get(group) ?? 0;

        rowTotal += count;
        row[group] = count;
      }

      if (measure === 'pct') {
        for (const group of groups) {
          row[group] =
            rowTotal > 0
              ? ((row[group] as number) / rowTotal) * 100
              : 0;
        }
      }

      return row;
    });

    arr.sort((a, b) => {
      const aSum = groups.reduce(
        (sum, group) => sum + (a[group] as number),
        0,
      );

      const bSum = groups.reduce(
        (sum, group) => sum + (b[group] as number),
        0,
      );

      return bSum - aSum;
    });

    return {
      data: arr.slice(0, 15),
      groups,
      total,
    };
  }, [dataset, xCol, groupCol, chartType, measure]);

  // --------------------------------------------------
  // FIX 3: Conditional return AFTER all hooks
  // --------------------------------------------------

  if (!dataset || !overview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t.viz.title}
          subtitle={t.viz.subtitle}
        />

        <EmptyState
          icon={BarChart3}
          title={t.viz.noDataset}
          description={t.viz.noDatasetBody}
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

  // --------------------------------------------------
  // Error / availability
  // --------------------------------------------------

  const isChartAvailable = (ct: ChartType): boolean =>
    availableCharts.includes(ct);

  const errorMsg = (() => {
    if (availableCharts.length === 0) {
      return t.common.noData;
    }

    if (NUMERIC_CHARTS.includes(chartType)) {
      if (chartType === 'histogram' || chartType === 'boxplot') {
        return numericCols.length === 0
          ? t.viz.needsOneNumeric
          : null;
      }

      if (chartType === 'line' || chartType === 'scatter') {
        return numericCols.length < 2
          ? t.viz.needsTwoNumeric
          : null;
      }
    }

    if (chartType === 'pie' || chartType === 'donut') {
      if (categoricalCols.length === 0) {
        return t.viz.needsOneCategorical;
      }

      if (catFreqData.data.length > 10) {
        return t.viz.needsLowCardinality;
      }

      return null;
    }

    if (chartType === 'barCat' || chartType === 'pareto') {
      return categoricalCols.length === 0
        ? t.viz.needsOneCategorical
        : null;
    }

    if (chartType === 'stacked' || chartType === 'grouped') {
      return categoricalCols.length < 2
        ? t.viz.needsTwoCategorical
        : null;
    }

    return null;
  })();

  // --------------------------------------------------
  // Shared styles
  // --------------------------------------------------

  const tooltipStyle = {
    background: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '13px',
    color: 'hsl(var(--popover-foreground))',
  };

  const axisTick = {
    fontSize: 11,
    fill: 'hsl(var(--muted-foreground))',
  };

  const gridStroke = 'hsl(var(--border))';

  const chartColor = 'hsl(var(--chart-1))';
  const chartColor2 = 'hsl(var(--chart-2))';

  const chartTypeLabel = (ct: ChartType): string =>
    t.viz[ct as keyof typeof t.viz] as string;

  // --------------------------------------------------
  // FIX 4: Disable chart animations
  // --------------------------------------------------

  const renderChart = () => {
    if (errorMsg) {
      return (
        <div className="flex h-80 items-center justify-center text-center">
          <p className="max-w-xs text-sm text-muted-foreground">
            {errorMsg}
          </p>
        </div>
      );
    }

    const isVertical = orientation === 'vertical';

    // Histogram

    if (chartType === 'histogram') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={histogramData}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />

            <XAxis
              dataKey="bin"
              tick={axisTick}
              angle={-20}
              textAnchor="end"
              height={60}
              interval={0}
            />

            <YAxis tick={axisTick} />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [v, t.viz.count]}
            />

            <Bar
              dataKey="count"
              fill={chartColor}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Line chart

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart
            data={lineData}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
            />

            <XAxis
              dataKey="x"
              tick={axisTick}
              type="number"
              name={xCol}
            />

            <YAxis
              dataKey="y"
              tick={axisTick}
              name={yCol}
            />

            <Tooltip contentStyle={tooltipStyle} />

            <Line
              type="monotone"
              dataKey="y"
              stroke={chartColor}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </ReLineChart>
        </ResponsiveContainer>
      );
    }

    // Scatter chart

    if (chartType === 'scatter') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ReScatterChart
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
            />

            <XAxis
              dataKey="x"
              type="number"
              name={xCol}
              tick={axisTick}
            />

            <YAxis
              dataKey="y"
              type="number"
              name={yCol}
              tick={axisTick}
            />

            <ZAxis range={[20, 20]} />

            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ strokeDasharray: '3 3' }}
            />

            <Scatter
              data={scatterData}
              fill={chartColor}
              fillOpacity={0.6}
              isAnimationActive={false}
            />
          </ReScatterChart>
        </ResponsiveContainer>
      );
    }

    // Boxplot

    if (chartType === 'boxplot') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={boxplotData}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />

            <XAxis dataKey="name" tick={axisTick} />
            <YAxis tick={axisTick} />

            <Tooltip contentStyle={tooltipStyle} />

            <Bar dataKey="min" fill="transparent" isAnimationActive={false} />

            <Bar
              dataKey="q1"
              fill={chartColor2}
              fillOpacity={0.3}
              stackId="box"
              isAnimationActive={false}
            />

            <Bar
              dataKey="median"
              fill={chartColor}
              stackId="box"
              isAnimationActive={false}
            />

            <Bar
              dataKey="q3"
              fill={chartColor2}
              fillOpacity={0.3}
              stackId="box"
              isAnimationActive={false}
            />

            <Bar dataKey="max" fill="transparent" isAnimationActive={false} />

            <Legend />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Categorical bar chart

    if (chartType === 'barCat') {
      const data = catFreqData.data;
      const dataKey = measure === 'count' ? 'count' : 'pct';

      if (isVertical) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridStroke}
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={axisTick}
                angle={-20}
                textAnchor="end"
                height={60}
                interval={0}
              />

              <YAxis tick={axisTick} />

              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [
                  measure === 'count' ? v : formatNumber(v, 1) + '%',
                  measure === 'count' ? t.viz.count : t.viz.percentage,
                ]}
              />

              <Bar
                dataKey={dataKey}
                fill={chartColor}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            layout="vertical"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              horizontal={false}
            />

            <XAxis type="number" tick={axisTick} />

            <YAxis
              dataKey="name"
              type="category"
              tick={axisTick}
              width={90}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [
                measure === 'count' ? v : formatNumber(v, 1) + '%',
                measure === 'count' ? t.viz.count : t.viz.percentage,
              ]}
            />

            <Bar
              dataKey={dataKey}
              fill={chartColor}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Pie and Donut charts

    if (chartType === 'pie' || chartType === 'donut') {
      const data = catFreqData.data.slice(0, 10);

      const innerR = chartType === 'donut' ? 50 : 0;
      const outerR = 85;

      return (
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerR}
              outerRadius={outerR}
              paddingAngle={chartType === 'donut' ? 2 : 0}
              isAnimationActive={false}
            >
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name: string) => [v, name]}
            />

            <Legend wrapperStyle={{ fontSize: 12 }} />
          </RePieChart>
        </ResponsiveContainer>
      );
    }

    // Pareto chart

    if (chartType === 'pareto') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={paretoData}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={axisTick}
              angle={-20}
              textAnchor="end"
              height={60}
              interval={0}
            />

            <YAxis yAxisId="left" tick={axisTick} />

            <YAxis
              yAxisId="right"
              orientation="right"
              tick={axisTick}
              domain={[0, 100]}
              unit="%"
            />

            <Tooltip contentStyle={tooltipStyle} />

            <Bar
              yAxisId="left"
              dataKey="count"
              fill={chartColor}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              stroke={chartColor2}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    // Stacked and Grouped charts

    if (chartType === 'stacked' || chartType === 'grouped') {
      const { data, groups } = crossTabData;

      const stacked = chartType === 'stacked';

      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridStroke}
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={axisTick}
              angle={-20}
              textAnchor="end"
              height={60}
              interval={0}
            />

            <YAxis
              tick={axisTick}
              unit={measure === 'pct' ? '%' : ''}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [
                measure === 'count' ? v : formatNumber(v, 1) + '%',
                '',
              ]}
            />

            <Legend wrapperStyle={{ fontSize: 12 }} />

            {groups.map((group, index) => (
              <Bar
                key={group}
                dataKey={group}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
                stackId={stacked ? 'stack' : undefined}
                radius={stacked ? undefined : [4, 4, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  // --------------------------------------------------
  // Controls
  // --------------------------------------------------

  const allChartTypes: ChartType[] = [
    'histogram', 'barCat', 'pie', 'donut', 'pareto',
    'line', 'scatter', 'boxplot', 'stacked', 'grouped',
  ];

  const showMeasureControl =
    chartType === 'barCat' ||
    chartType === 'stacked' ||
    chartType === 'grouped';

  const showSortControl =
    chartType === 'barCat' ||
    chartType === 'pareto' ||
    chartType === 'pie' ||
    chartType === 'donut';

  const showOrientationControl = chartType === 'barCat';
  const showBinsControl = chartType === 'histogram';

  const showGroupControl =
    chartType === 'stacked' || chartType === 'grouped';

  const isNumericChart = NUMERIC_CHARTS.includes(chartType);
  const isCatSingle = CATEGORICAL_SINGLE.includes(chartType);
  const isCatDual = CATEGORICAL_DUAL.includes(chartType);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.viz.title}
        subtitle={t.viz.subtitle}
      />

      <div className="grid gap-6 lg:grid-cols-4">

        {/* Configuration panel */}

        <Card className="min-w-0 p-5 lg:col-span-1">
          <h3 className="mb-4 font-semibold">
            {t.viz.configure}
          </h3>

          <div className="space-y-4">

            {/* Chart type */}

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t.viz.chartType}
              </Label>

              <div className="grid grid-cols-5 gap-1.5">
                {allChartTypes.map((ct) => {
                  const Icon = CHART_ICONS[ct];

                  const available = isChartAvailable(ct);
                  const active = chartType === ct;

                  return (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => {
                        if (available) setChartType(ct);
                      }}
                      disabled={!available}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${active
                        ? 'border-primary bg-primary/10 text-primary'
                        : available
                          ? 'border-border text-muted-foreground hover:bg-muted/50'
                          : 'border-border cursor-not-allowed text-muted-foreground opacity-30'
                        }`}
                      title={chartTypeLabel(ct)}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <p className="text-xs font-medium">
                  {chartTypeLabel(chartType)}
                </p>

                {availableCharts.includes(chartType) && (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[10px]"
                  >
                    {t.viz.suggestedCharts}
                  </Badge>
                )}
              </div>
            </div>

            {/* Numeric column selector */}

            {isNumericChart &&
              (chartType === 'histogram' || chartType === 'boxplot') && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t.viz.valueColumn}
                  </Label>

                  <Select
                    value={xCol}
                    onValueChange={setXCol}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.viz.valueColumn} />
                    </SelectTrigger>

                    <SelectContent>
                      {numericCols.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {showBinsControl && (
                    <div className="pt-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground">
                          {t.viz.bins}
                        </Label>

                        <span className="text-xs font-medium tabular-nums">
                          {bins[0]}
                        </span>
                      </div>

                      <Slider
                        value={bins}
                        onValueChange={setBins}
                        min={5}
                        max={30}
                        step={1}
                      />
                    </div>
                  )}
                </div>
              )}

            {/* Line and Scatter selectors */}

            {isNumericChart &&
              (chartType === 'line' || chartType === 'scatter') && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t.viz.xAxis}
                    </Label>

                    <Select
                      value={xCol}
                      onValueChange={setXCol}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t.viz.xAxis} />
                      </SelectTrigger>

                      <SelectContent>
                        {numericCols.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t.viz.yAxis}
                    </Label>

                    <Select
                      value={yCol}
                      onValueChange={setYCol}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t.viz.yAxis} />
                      </SelectTrigger>

                      <SelectContent>
                        {numericCols
                          .filter((col) => col.name !== xCol)
                          .map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {col.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

            {/* Single categorical selector */}

            {isCatSingle && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t.viz.categoryColumn}
                </Label>

                <Select
                  value={xCol}
                  onValueChange={setXCol}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.viz.categoryColumn} />
                  </SelectTrigger>

                  <SelectContent>
                    {categoricalCols.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-[11px] text-muted-foreground">
                  {t.viz.topCategories}
                </p>
              </div>
            )}

            {/* Stacked and Grouped selectors */}

            {isCatDual && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t.viz.categoryColumn}
                  </Label>

                  <Select
                    value={xCol}
                    onValueChange={setXCol}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.viz.categoryColumn} />
                    </SelectTrigger>

                    <SelectContent>
                      {categoricalCols.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {t.viz.groupColumn}
                  </Label>

                  <Select
                    value={groupCol}
                    onValueChange={setGroupCol}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.viz.groupColumn} />
                    </SelectTrigger>

                    <SelectContent>
                      {categoricalCols
                        .filter((col) => col.name !== xCol)
                        .map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Measure control */}

            {showMeasureControl && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t.viz.measure}
                </Label>

                <ToggleGroup
                  type="single"
                  value={measure}
                  onValueChange={(value) => {
                    if (value) setMeasure(value as MeasureMode);
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="count" className="text-xs">
                    {t.viz.measureCount}
                  </ToggleGroupItem>

                  <ToggleGroupItem value="pct" className="text-xs">
                    {t.viz.measurePct}
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            {/* Sort control */}

            {showSortControl && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t.viz.sort}
                </Label>

                <Select
                  value={sortMode}
                  onValueChange={(value) =>
                    setSortMode(value as SortMode)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="freq">
                      {t.viz.sortFreq}
                    </SelectItem>

                    <SelectItem value="alpha">
                      {t.viz.sortAlpha}
                    </SelectItem>

                    {getOrdinalOrder(xCol) && (
                      <SelectItem value="ordinal">
                        {t.viz.sortOrdinal}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Orientation control */}

            {showOrientationControl && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t.viz.orientation}
                </Label>

                <ToggleGroup
                  type="single"
                  value={orientation}
                  onValueChange={(value) => {
                    if (value) setOrientation(value as Orientation);
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="horizontal" className="text-xs">
                    {t.viz.orientHorizontal}
                  </ToggleGroupItem>

                  <ToggleGroupItem value="vertical" className="text-xs">
                    {t.viz.orientVertical}
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

          </div>
        </Card>

        {/* Chart preview */}

        <Card className="min-w-0 p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">
              {t.viz.chartPreview}
            </h3>

            <span className="text-xs text-muted-foreground">
              {chartTypeLabel(chartType)}
            </span>
          </div>

          <div className="h-80 min-w-0 w-full">
            {renderChart()}
          </div>
        </Card>

      </div>
    </div>
  );
}
