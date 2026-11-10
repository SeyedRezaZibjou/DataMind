'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Linkedin,
  Github,
  Youtube,
  Mail,
  Database,
  Brain,
  BarChart3,
  Code2,
  LineChart,
  Sparkles,
  BrainCircuit,
  ArrowRight,
} from 'lucide-react';

import { useI18n } from '@/components/providers/i18n-provider';
import { PageHeader } from '@/components/shared/page-components';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { loadProfile, type ProfileData } from '@/lib/profile/persistence';

const SKILLS = [
  { icon: Database, label: 'Data Science' },
  { icon: BarChart3, label: 'Data Analysis' },
  { icon: Brain, label: 'Artificial Intelligence' },
  { icon: BrainCircuit, label: 'Machine Learning' },
  { icon: Sparkles, label: 'Deep Learning' },
  { icon: Code2, label: 'Python' },
  { icon: Database, label: 'SQL' },
  { icon: BarChart3, label: 'Power BI' },
  { icon: LineChart, label: 'Data Visualization' },
] as const;

const SKILLS_FA = [
  'علم داده',
  'تحلیل داده',
  'هوش مصنوعی',
  'یادگیری ماشین',
  'یادگیری عمیق',
  'پایتون',
  'SQL',
  'پاور بی‌آی',
  'بصری‌سازی داده',
] as const;

export default function AboutPage() {
  const { t, lang } = useI18n();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  const fullName = profile?.fullName || t.settings.defaultFullName;
  const title = profile?.title || t.settings.defaultTitle;
  const photo = profile?.photoDataUrl;

  const skills = lang === 'fa' ? SKILLS_FA : SKILLS.map((s) => s.label);

  // Social links supplied by the project owner.
  const socialLinks: { icon: React.ElementType; label: string; href: string; available: boolean }[] = [
    { icon: Linkedin, label: t.about.linkedin, href: 'https://www.linkedin.com/in/zibjou', available: true },
    { icon: Github, label: t.about.github, href: 'https://github.com/SeyedRezaZibjou', available: true },
    { icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@ExcelByReza', available: true },
    { icon: Mail, label: t.about.emailMe, href: 'https://mail.google.com/mail/?view=cm&fs=1&to=seyed.reza.zibjou%40gmail.com', available: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t.about.title} subtitle={t.about.subtitle} />

      {/* ── A. Profile Header ── */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* Decorative gradient banner */}
          <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/15 to-primary/10" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center gap-4 -mt-12 sm:flex-row sm:items-end sm:gap-6">
            <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
              {photo ? <AvatarImage src={photo} alt={fullName} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-start">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{fullName}</h2>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">{title}</p>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t.about.intro}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── B. About Me ── */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.about.aboutMe}</h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t.about.aboutMeBody}
        </p>
      </Card>

      {/* ── C. Skills & Expertise ── */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.about.skillsTitle}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {SKILLS.map((skill, i) => {
            const Icon = skill.icon;
            const label = skills[i];
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── D. Social Media & Contact ── */}
      <Card className="p-6">
        <div className="mb-2 flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.about.contactTitle}</h3>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">{t.about.contactHint}</p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {socialLinks.map((link) => {
            const Icon = link.icon;
            if (link.available && link.href) {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{link.label}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </a>
              );
            }

            return (
              <div
                key={link.label}
                className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 opacity-70"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{link.label}</p>
                  <p className="text-xs text-muted-foreground/70">{t.about.linkPlaceholder}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── E. About DataMind ── */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.about.dataMindTitle}</h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t.about.dataMindBody}
        </p>
      </Card>
    </div>
  );
}
