'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ParsedDataset, DatasetOverview, QualityReport, TypeOverrides } from '@/lib/dataset/types';
import { computeOverview, computeQuality } from '@/lib/dataset/analysis';
import {
  saveDataset,
  loadDataset,
  clearDataset as clearStoredDataset,
  saveOverrides,
  loadOverrides,
  clearOverrides,
} from '@/lib/dataset/persistence';

export type ActivityEntry = {
  id: string;
  key: string;
  page?: string;
  timestamp: number;
};

type DatasetContextValue = {
  dataset: ParsedDataset | null;
  overview: DatasetOverview | null;
  quality: QualityReport | null;
  activity: ActivityEntry[];
  typeOverrides: TypeOverrides;
  /** False until the initial IndexedDB restore attempt has completed. */
  hydrated: boolean;
  setDataset: (ds: ParsedDataset | null) => void;
  clearDataset: () => void;
  logActivity: (key: string, page?: string) => void;
  setColumnType: (column: string, type: import('@/lib/dataset/types').ColumnType, subtype?: import('@/lib/dataset/types').CategoricalSubtype) => void;
  setOrdinalOrder: (column: string, order: string[]) => void;
  resetTypeOverrides: () => void;
};

const DatasetContext = createContext<DatasetContextValue | null>(null);

const ACTIVITY_KEY = 'datamind-activity';
const MAX_ACTIVITY = 8;

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [dataset, setDatasetState] = useState<ParsedDataset | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [typeOverrides, setTypeOverrides] = useState<TypeOverrides>({});
  const [hydrated, setHydrated] = useState(false);

  // Restore activity log from localStorage (unchanged behavior).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACTIVITY_KEY);
      if (stored) setActivity(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  // Restore the persisted dataset + overrides from IndexedDB on mount.
  // Runs once; sets `hydrated` to true when finished so pages know it's
  // safe to show the empty state.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [savedDs, savedOverrides] = await Promise.all([
          loadDataset(),
          loadOverrides(),
        ]);
        if (cancelled) return;
        if (savedDs) setDatasetState(savedDs);
        if (savedOverrides) setTypeOverrides(savedOverrides);
      } catch {
        /* storage unavailable — ignore so the app still works in-session */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const logActivity = useCallback((key: string, page?: string) => {
    setActivity((prev) => {
      const entry: ActivityEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        key,
        page,
        timestamp: Date.now(),
      };
      const next = [entry, ...prev].slice(0, MAX_ACTIVITY);
      try {
        localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const setDataset = useCallback((ds: ParsedDataset | null) => {
    setDatasetState(ds);
    setTypeOverrides({});
    // Persist / clear asynchronously. Errors are swallowed so a
    // storage failure never blocks the in-session workflow.
    if (ds) {
      saveDataset(ds).catch(() => {});
      clearOverrides().catch(() => {});
    } else {
      clearStoredDataset().catch(() => {});
      clearOverrides().catch(() => {});
    }
  }, []);

  const clearDataset = useCallback(() => {
    setDatasetState(null);
    setTypeOverrides({});
    clearStoredDataset().catch(() => {});
    clearOverrides().catch(() => {});
  }, []);

  const setColumnType = useCallback(
    (column: string, type: import('@/lib/dataset/types').ColumnType, subtype?: import('@/lib/dataset/types').CategoricalSubtype) => {
      setTypeOverrides((prev) => {
        const existing = prev[column];
        const next: TypeOverrides = {
          ...prev,
          [column]: {
            type,
            subtype,
            ordinalOrder: type === 'categorical' && subtype === 'ordinal'
              ? existing?.ordinalOrder
              : undefined,
          },
        };
        if (next[column].ordinalOrder === undefined) delete next[column].ordinalOrder;
        // Persist the updated overrides.
        saveOverrides(next).catch(() => {});
        return next;
      });
    },
    [],
  );

  const setOrdinalOrder = useCallback((column: string, order: string[]) => {
    setTypeOverrides((prev) => {
      const next: TypeOverrides = {
        ...prev,
        [column]: {
          ...prev[column],
          type: 'categorical',
          subtype: 'ordinal',
          ordinalOrder: order,
        },
      };
      saveOverrides(next).catch(() => {});
      return next;
    });
  }, []);

  const resetTypeOverrides = useCallback(() => {
    setTypeOverrides({});
    clearOverrides().catch(() => {});
  }, []);

  const overview = useMemo(
    () => (dataset ? computeOverview(dataset.rows, dataset.columns, typeOverrides) : null),
    [dataset, typeOverrides],
  );

  const quality = useMemo(
    () => (dataset && overview ? computeQuality(dataset.rows, dataset.columns, overview) : null),
    [dataset, overview],
  );

  const value = useMemo<DatasetContextValue>(
    () => ({
      dataset,
      overview,
      quality,
      activity,
      typeOverrides,
      hydrated,
      setDataset,
      clearDataset,
      logActivity,
      setColumnType,
      setOrdinalOrder,
      resetTypeOverrides,
    }),
    [dataset, overview, quality, activity, typeOverrides, hydrated, setDataset, clearDataset, logActivity, setColumnType, setOrdinalOrder, resetTypeOverrides],
  );

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error('useDataset must be used within DatasetProvider');
  return ctx;
}
