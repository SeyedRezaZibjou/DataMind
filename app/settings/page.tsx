'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Globe,
  User,
  Info,
  Database,
  Trash2,
  Check,
  Camera,
  Mail,
  Briefcase,
  FileText,
  Save,
  X,
  CheckCircle2,
} from 'lucide-react';

import { useI18n } from '@/components/providers/i18n-provider';
import { useDataset } from '@/components/providers/dataset-provider';
import { PageHeader } from '@/components/shared/page-components';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LANGUAGES, type Language } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';
import { loadProfile, saveProfile, type ProfileData } from '@/lib/profile/persistence';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const { dataset, clearDataset } = useDataset();

  // ── Profile state ──
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [emailError, setEmailError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile().then((data) => {
      setProfile(data);
      setEditFullName(data.fullName);
      setEditTitle(data.title);
      setEditBio(data.bio);
      setEditEmail(data.email);
      setEditPhoto(data.photoDataUrl);
    });
  }, []);

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setEditPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSave = useCallback(() => {
    const emailValid = editEmail === '' || EMAIL_RE.test(editEmail);
    setEmailError(!emailValid);
    if (!emailValid) return;

    const data: ProfileData = {
      fullName: editFullName,
      title: editTitle,
      bio: editBio,
      email: editEmail,
      photoDataUrl: editPhoto,
    };
    saveProfile(data);
    setProfile(data);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  }, [editFullName, editTitle, editBio, editEmail, editPhoto]);

  const handleCancel = useCallback(() => {
    if (!profile) return;
    setEditFullName(profile.fullName);
    setEditTitle(profile.title);
    setEditBio(profile.bio);
    setEditEmail(profile.email);
    setEditPhoto(profile.photoDataUrl);
    setEmailError(false);
  }, [profile]);

  return (
    <div className="space-y-6">
      <PageHeader title={t.settings.title} subtitle={t.settings.subtitle} />

      {/* ── Appearance ── */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.settings.appearance}</h3>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t.settings.theme}</p>
          <p className="text-xs text-muted-foreground">{t.settings.themeHint}</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center gap-3 rounded-lg border-2 p-4 text-start transition-all hover:bg-muted/40',
              theme === 'light' ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Sun className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t.settings.themeLight}</p>
            </div>
            {theme === 'light' && <Check className="h-4 w-4 text-primary" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center gap-3 rounded-lg border-2 p-4 text-start transition-all hover:bg-muted/40',
              theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Moon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t.settings.themeDark}</p>
            </div>
            {theme === 'dark' && <Check className="h-4 w-4 text-primary" />}
          </button>
        </div>
      </Card>

      {/* ── Language ── */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.settings.language}</h3>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t.settings.language}</p>
          <p className="text-xs text-muted-foreground">{t.settings.languageHint}</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code as Language)}
              className={cn(
                'flex items-center gap-3 rounded-lg border-2 p-4 text-start transition-all hover:bg-muted/40',
                lang === l.code ? 'border-primary bg-primary/5' : 'border-border',
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{l.nativeLabel}</p>
                <p className="text-xs text-muted-foreground">{l.label}</p>
              </div>
              {lang === l.code && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Profile (functional) ── */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.settings.profileSection}</h3>
        </div>

        {profile === null ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Photo + preview */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                <Avatar className="h-24 w-24 border-2 border-border">
                  {editPhoto ? (
                    <AvatarImage src={editPhoto} alt={editFullName} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -end-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110"
                  aria-label={t.settings.changePhoto}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">{t.settings.profilePhoto}</p>
                <p className="text-xs text-muted-foreground">
                  {editPhoto ? t.settings.changePhoto : t.settings.uploadPhoto}
                </p>
                {editPhoto && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-7 gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => setEditPhoto(null)}
                  >
                    <Trash2 className="h-3 w-3" />
                    {t.common.delete}
                  </Button>
                )}
              </div>
            </div>

            {/* Text fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {t.settings.fullName}
                </Label>
                <Input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder={t.settings.defaultFullName}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  {t.settings.professionalTitle}
                </Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={t.settings.defaultTitle}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {t.settings.email}
              </Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  if (emailError) setEmailError(false);
                }}
                placeholder={t.settings.emailPlaceholder}
                className={emailError ? 'border-destructive' : ''}
              />
              {emailError && (
                <p className="text-xs text-destructive">{t.settings.invalidEmail}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                {t.settings.bio}
              </Label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder={t.settings.bioPlaceholder}
                rows={4}
              />
            </div>

            {/* Success message */}
            {showSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-success/5 p-3 text-success animate-fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">{t.settings.profileSaved}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <Button className="gap-2" onClick={handleSave}>
                <Save className="h-4 w-4" />
                {t.settings.saveChanges}
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleCancel}>
                <X className="h-4 w-4" />
                {t.settings.cancelChanges}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Data Management ── */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.settings.dataManagement}</h3>
        </div>

        <p className="text-xs text-muted-foreground">{t.settings.clearDatasetHint}</p>

        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-border p-4">
          <div className="min-w-0">
            {dataset ? (
              <>
                <p className="truncate text-sm font-medium">{dataset.name}</p>
                <p className="text-xs text-muted-foreground">
                  {dataset.rows.length.toLocaleString()} {t.common.rows} · {dataset.columns.length} {t.common.columns}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t.settings.noDataset}</p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            disabled={!dataset}
            onClick={clearDataset}
          >
            <Trash2 className="h-4 w-4" />
            {t.settings.clear}
          </Button>
        </div>
      </Card>

      {/* ── About ── */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{t.settings.about}</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">{t.common.appName}</p>
              <p className="text-xs text-muted-foreground">{t.settings.aboutBody}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">{t.settings.version}</span>
            <Badge variant="outline">1.0.0</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
