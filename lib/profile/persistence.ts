export type ProfileData = {
  fullName: string;
  title: string;
  bio: string;
  email: string;
  photoDataUrl: string | null;
};

const STORAGE_KEY = 'datamind-profile';
const DB_NAME = 'datamind-profile-store';
const DB_VERSION = 1;
const IMAGE_STORE = 'images';
const IMAGE_KEY = 'profile-photo';

const DEFAULTS: ProfileData = {
  fullName: 'Seyed Reza Zibjou',
  title: 'Data Scientist | AI & Machine Learning Enthusiast',
  bio: '',
  email: '',
  photoDataUrl: null,
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export async function loadProfile(): Promise<ProfileData> {
  let textData: Partial<ProfileData> = {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) textData = JSON.parse(stored);
  } catch {
    /* ignore */
  }

  let photoDataUrl: string | null = null;
  try {
    const db = await openDB();
    photoDataUrl = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE, 'readonly');
      const req = tx.objectStore(IMAGE_STORE).get(IMAGE_KEY);
      req.onsuccess = () => resolve((req.result as string) ?? null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    /* ignore */
  }

  return {
    fullName: textData.fullName ?? DEFAULTS.fullName,
    title: textData.title ?? DEFAULTS.title,
    bio: textData.bio ?? DEFAULTS.bio,
    email: textData.email ?? DEFAULTS.email,
    photoDataUrl: photoDataUrl ?? textData.photoDataUrl ?? null,
  };
}

export function saveProfile(data: ProfileData): void {
  const { photoDataUrl, ...textFields } = data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(textFields));
  } catch {
    /* ignore */
  }
  if (photoDataUrl) {
    savePhoto(photoDataUrl).catch(() => {});
  } else {
    deletePhoto().catch(() => {});
  }
}

export async function savePhoto(dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    tx.objectStore(IMAGE_STORE).put(dataUrl, IMAGE_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function deletePhoto(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    tx.objectStore(IMAGE_STORE).delete(IMAGE_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
