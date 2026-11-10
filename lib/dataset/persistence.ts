import type { ParsedDataset, TypeOverrides } from './types';

const DB_NAME = 'datamind-store';
const DB_VERSION = 1;
const DATASET_STORE = 'dataset';
const OVERRIDES_STORE = 'overrides';
const DATASET_KEY = 'current';
const OVERRIDES_KEY = 'current';

/**
 * Opens (or creates) the IndexedDB database used to persist the
 * currently-loaded dataset across page reloads. Datasets can be
 * large, so we use IndexedDB instead of localStorage.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DATASET_STORE)) {
        db.createObjectStore(DATASET_STORE);
      }
      if (!db.objectStoreNames.contains(OVERRIDES_STORE)) {
        db.createObjectStore(OVERRIDES_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function putRecord(storeName: string, value: unknown): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value, DATASET_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Failed to write to IndexedDB'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

function getRecord<T>(storeName: string, key: string = DATASET_KEY): Promise<T | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(key);
      request.onsuccess = () => {
        db.close();
        resolve((request.result as T) ?? null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error ?? new Error('Failed to read from IndexedDB'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

function clearRecord(storeName: string, key: string = DATASET_KEY): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Failed to clear IndexedDB record'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

export async function saveDataset(ds: ParsedDataset): Promise<void> {
  await putRecord(DATASET_STORE, ds);
}

export async function loadDataset(): Promise<ParsedDataset | null> {
  return getRecord<ParsedDataset>(DATASET_STORE);
}

export async function clearDataset(): Promise<void> {
  await clearRecord(DATASET_STORE);
}

export async function saveOverrides(overrides: TypeOverrides): Promise<void> {
  await putRecord(OVERRIDES_STORE, overrides);
}

export async function loadOverrides(): Promise<TypeOverrides | null> {
  return getRecord<TypeOverrides>(OVERRIDES_STORE, OVERRIDES_KEY);
}

export async function clearOverrides(): Promise<void> {
  await clearRecord(OVERRIDES_STORE, OVERRIDES_KEY);
}
