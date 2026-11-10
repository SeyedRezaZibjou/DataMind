'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Upload, TableProperties, ShieldCheck, BarChart3, Sparkles, FileText, Settings, Database, UserCircle } from 'lucide-react';
import { useI18n } from '@/components/providers/i18n-provider';
import { cn } from '@/lib/utils';
import { useDataset } from '@/components/providers/dataset-provider';

type NavItem = {
  href: string;
  key: 'dashboard' | 'upload' | 'overview' | 'quality' | 'visualization' | 'assistant' | 'reports' | 'settings' | 'about';
  icon: React.ElementType;
  group: 'main' | 'analysis' | 'tools';
};

const NAV: NavItem[] = [
  { href: '/', key: 'dashboard', icon: LayoutDashboard, group: 'main' },
  { href: '/upload', key: 'upload', icon: Upload, group: 'main' },
  { href: '/overview', key: 'overview', icon: TableProperties, group: 'analysis' },
  { href: '/quality', key: 'quality', icon: ShieldCheck, group: 'analysis' },
  { href: '/visualization', key: 'visualization', icon: BarChart3, group: 'analysis' },
  { href: '/assistant', key: 'assistant', icon: Sparkles, group: 'tools' },
  { href: '/reports', key: 'reports', icon: FileText, group: 'tools' },
  { href: '/settings', key: 'settings', icon: Settings, group: 'tools' },
  { href: '/about', key: 'about', icon: UserCircle, group: 'tools' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { dataset } = useDataset();

  const groups: { id: NavItem['group']; label: string; items: NavItem[] }[] = [
    { id: 'main', label: '', items: NAV.filter((n) => n.group === 'main') },
    { id: 'analysis', label: t.nav.groups.analysis, items: NAV.filter((n) => n.group === 'analysis') },
    { id: 'tools', label: t.nav.groups.tools, items: NAV.filter((n) => n.group === 'tools') },
  ];

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Database className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-semibold tracking-tight">{t.common.appName}</span>
          <span className="text-[11px] text-muted-foreground">{t.common.tagline}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-3 py-4">
        {groups.map((group) => (
          <div key={group.id} className="space-y-1">
            {group.label && (
              <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                  )}
                >
                  <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                  <span>{t.nav[item.key]}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent/60 px-3 py-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">{t.dashboard.datasetName}</p>
          <p className="truncate text-sm font-medium">
            {dataset ? dataset.name : t.dashboard.noDataset}
          </p>
          {dataset && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {dataset.rows.length.toLocaleString()} {t.common.rows.toLowerCase()} · {dataset.columns.length} {t.common.columns.toLowerCase()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
