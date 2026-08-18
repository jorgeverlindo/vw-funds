// ─── Screenshot cache — IndexedDB ─────────────────────────────────────────────
// Stores base64 screenshot data-URLs keyed by WCMItem id.
// IndexedDB has no practical size limit, so large JPEG screenshots (~500 KB each)
// are stored here rather than in localStorage (which has a ~5 MB quota).

const DB_NAME    = 'constellation-screenshots';
const STORE_NAME = 'screenshots';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function saveScreenshot(id: string, dataUrl: string): Promise<void> {
  if (!dataUrl) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(dataUrl, id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function loadScreenshot(id: string): Promise<string | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result as string | undefined);
    req.onerror   = () => reject(req.error);
  });
}

export async function deleteScreenshot(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function loadScreenshots(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  const db = await openDb();
  const results: Record<string, string> = {};
  await Promise.all(ids.map((id) =>
    new Promise<void>((resolve) => {
      const tx  = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => {
        if (req.result) results[id] = req.result as string;
        resolve();
      };
      req.onerror = () => resolve(); // skip missing entries
    }),
  ));
  return results;
}
