'use client';

import Link from 'next/link';
import { Database, Rows3, Columns3, AlertTriangle, Copy, Upload, Sparkles, BarChart3, ShieldCheck, TableProperties, Clock, ArrowRight } from 'lucide-react';
import { useI18n } from '@/components/providers/i18n-provider';
import { useDataset } from '@/components/providers/dataset-provider';
import { PageHeader, EmptyState } from '@/components/shared/page-components';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function relativeTime(ts: number, lang: string): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (lang === 'fa') {
    if (mins < 1) return 'همین حالا';
    if (mins < 60) return `${mins} دقیقه پیش`;
    if (hours < 24) return `${hours} ساعت پیش`;
    return `${days} روز پیش`;
  }
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const { dataset, overview, quality, activity } = useDataset();

  if (!dataset || !overview || !quality) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.dashboard.title} subtitle={t.dashboard.welcomeBody} />
        <EmptyState
          icon={Database}
          title={t.dashboard.noDataset}
          description={t.dashboard.noDatasetBody}
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/upload">
                <Button size="lg" className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t.dashboard.uploadDataset}
                </Button>
              </Link>
              <Link href="/upload?demo=1">
                <Button size="lg" variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t.dashboard.loadDemo}
                </Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const quickActions = [
    { href: '/overview', icon: TableProperties, label: t.dashboard.goToOverview },
    { href: '/quality', icon: ShieldCheck, label: t.dashboard.goToQuality },
    { href: '/visualization', icon: BarChart3, label: t.dashboard.goToViz },
    { href: '/upload', icon: Upload, label: t.dashboard.goToUpload },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.dashboard.welcome}
        subtitle={t.dashboard.welcomeBody}
        action={
          dataset.source === 'demo' ? (
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {t.common.demo}
            </Badge>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.dashboard.stats.totalRows} value={overview.rowCount.toLocaleString()} icon={Rows3} tone="primary" />
        <StatCard label={t.dashboard.stats.totalColumns} value={overview.columnCount} icon={Columns3} tone="accent" />
        <StatCard label={t.dashboard.stats.missingValues} value={quality.totalMissing.toLocaleString()} icon={AlertTriangle} tone={quality.totalMissing > 0 ? 'warning' : 'success'} />
        <StatCard label={t.dashboard.stats.duplicateRows} value={quality.duplicateRows.toLocaleString()} icon={Copy} tone={quality.duplicateRows > 0 ? 'warning' : 'success'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{t.dashboard.quickActions}</h3>
            <Badge variant="outline" className="gap-1.5">
              <Database className="h-3.5 w-3.5" />
              {dataset.name}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <Link
                  key={qa.href}
                  href={qa.href}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-background/50 p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{qa.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">{t.dashboard.recentActivity}</h3>
          </div>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t.dashboard.noActivity}</p>
          ) : (
            <ul className="space-y-3">
              {activity.slice(0, 6).map((a) => {
                const msg = a.key === 'visited' && a.page
                  ? t.dashboard.activity.visited.replace('{page}', a.page)
                  : t.dashboard.activity[a.key as keyof typeof t.dashboard.activity] ?? a.key;
                return (
                  <li key={a.id} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{msg}</p>
                      <p className="text-[11px] text-muted-foreground">{relativeTime(a.timestamp, lang)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
