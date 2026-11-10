'use client';

import { Suspense, useCallback, useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UploadCloud, FileSpreadsheet, Loader2, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useI18n } from '@/components/providers/i18n-provider';
import { useDataset } from '@/components/providers/dataset-provider';
import { parseFile, validateFile, MAX_FILE_SIZE, ACCEPTED_EXT } from '@/lib/dataset/parser';
import { buildDemoDataset } from '@/lib/dataset/demo-data';
import { PageHeader } from '@/components/shared/page-components';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function UploadPage() {
  return (
    <Suspense fallback={null}>
      <UploadContent />
    </Suspense>
  );
}

function UploadContent() {
  const { t } = useI18n();
  const { dataset, setDataset, clearDataset, logActivity } = useDataset();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = ACCEPTED_EXT.map((e) => `.${e}`).join(',');

  const loadDemo = useCallback(() => {
    const demo = buildDemoDataset();
    setDataset(demo);
    logActivity('loadedDemo');
    toast.success(t.toast.demoLoaded);
    setError(null);
  }, [setDataset, logActivity, t]);

  useEffect(() => {
    if (searchParams.get('demo') === '1') {
      loadDemo();
    }
  }, [searchParams, loadDemo]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        const msg = t.upload[validationError.message as keyof typeof t.upload] ?? validationError.message;
        setError(msg);
        toast.error(msg);
        return;
      }

      setParsing(true);
      try {
        const parsed = await parseFile(file);
        setDataset(parsed);
        logActivity('uploaded');
        const successMsg = t.upload.success
          .replace('{name}', parsed.name)
          .replace('{rows}', String(parsed.rows.length))
          .replace('{columns}', String(parsed.columns.length));
        toast.success(t.toast.datasetLoaded, { description: `${parsed.rows.length} × ${parsed.columns.length}` });
      } catch (err) {
        const code = err instanceof Error && err.message === 'EMPTY' ? 'emptyFile' : 'parseError';
        const msg = t.upload[code as keyof typeof t.upload] ?? t.upload.parseError;
        setError(msg);
        toast.error(t.toast.loadFailed, { description: msg });
      } finally {
        setParsing(false);
      }
    },
    [setDataset, logActivity, t],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    clearDataset();
    logActivity('cleared');
    toast.info(t.toast.datasetCleared);
  };

  const previewCols = dataset ? dataset.columns.slice(0, 8) : [];
  const previewRows = dataset ? dataset.rows.slice(0, 8) : [];

  return (
    <div className="space-y-6">
      <PageHeader title={t.upload.title} subtitle={t.upload.subtitle} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card
            className={cn(
              'relative border-2 border-dashed transition-colors',
              dragging ? 'border-primary bg-primary/5' : 'border-border',
              parsing && 'pointer-events-none opacity-80',
            )}
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !parsing && inputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center px-6 py-14 text-center"
            >
              {parsing ? (
                <>
                  <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
                  <p className="font-medium text-foreground">{t.upload.parsing}</p>
                </>
              ) : dragging ? (
                <>
                  <UploadCloud className="mb-3 h-10 w-10 text-primary" />
                  <p className="font-medium text-primary">{t.upload.dropToUpload}</p>
                </>
              ) : (
                <>
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="font-medium text-foreground">{t.upload.dragHere}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.upload.orClick}</p>
                  <Button className="mt-4 gap-2" size="sm" variant="outline">
                    <FileSpreadsheet className="h-4 w-4" />
                    {t.upload.browse}
                  </Button>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={onInputChange}
                className="hidden"
              />
            </div>
          </Card>

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div className="text-sm text-muted-foreground">
              <p>{t.upload.supportedFormats}</p>
              <p className="text-xs">{t.upload.maxFileSize}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 border-t border-border pt-4 sm:flex-row sm:justify-center">
            <span className="text-sm text-muted-foreground">{t.upload.tryDemo}</span>
            <Button variant="outline" size="sm" className="gap-2" onClick={loadDemo}>
              <Sparkles className="h-4 w-4" />
              {t.upload.loadDemo}
            </Button>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {dataset ? (
            <Card className="p-5 animate-fade-in">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t.upload.currentDataset}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    <p className="truncate font-semibold">{dataset.name}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dataset.rows.length.toLocaleString()} {t.common.rows} · {dataset.columns.length} {t.common.columns}
                  </p>
                </div>
                {dataset.source === 'demo' && (
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <Sparkles className="h-3 w-3" />
                    {t.common.demo}
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2 text-destructive hover:text-destructive" onClick={handleClear}>
                <X className="h-4 w-4" />
                {t.upload.clearDataset}
              </Button>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center p-8 text-center">
              <FileSpreadsheet className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t.dashboard.noDataset}</p>
            </Card>
          )}
        </div>
      </div>

      {dataset && previewRows.length > 0 && (
        <Card className="p-5 animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">{t.upload.preview}</h3>
            <span className="text-xs text-muted-foreground">
              {t.upload.firstRows.replace('{n}', String(previewRows.length))}
            </span>
          </div>
          <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {previewCols.map((col) => (
                    <th key={col} className="whitespace-nowrap px-3 py-2 text-start font-medium text-muted-foreground">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    {previewCols.map((col) => (
                      <td key={col} className="whitespace-nowrap px-3 py-2 text-foreground/80">
                        {row[col] === null || row[col] === undefined ? (
                          <span className="text-muted-foreground/50 italic">—</span>
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
      )}
    </div>
  );
}
