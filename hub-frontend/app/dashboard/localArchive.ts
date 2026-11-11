/** Optional, account-scoped private archive persistence.
 * Nothing is uploaded to Alpha Alerts, Supabase, Render, or Vercel.
 * Saves only after the signed-in user explicitly opts in.
 */
export type SavedLaneArchive = {
  userId: string;
  name: string;
  archive: unknown;
  savedAt: number;
};

const DB_NAME = "alpha-alerts-private-lane-archive";
const STORE_NAME = "archives";

function openArchiveDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Browser storage is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "userId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local archive storage"));
    request.onblocked = () => reject(new Error("Close other dashboard tabs and try again"));
  });
}

async function transact<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openArchiveDb();
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let value: T;
    const finishError = (error: Error) => {
      if (settled) return;
      settled = true;
      db.close();
      reject(error);
    };
    try {
      const tx = db.transaction(STORE_NAME, mode);
      const request = operation(tx.objectStore(STORE_NAME));
      request.onsuccess = () => { value = request.result; };
      request.onerror = () => finishError(request.error ?? new Error("Local archive operation failed"));
      tx.oncomplete = () => {
        if (settled) return;
        settled = true;
        db.close();
        resolve(value);
      };
      tx.onerror = () => finishError(tx.error ?? new Error("Local archive transaction failed"));
      tx.onabort = () => finishError(tx.error ?? new Error("Local archive transaction aborted"));
    } catch (error) {
      finishError(error instanceof Error ? error : new Error("Local archive unavailable"));
    }
  });
}

export function readSavedLaneArchive(userId: string): Promise<SavedLaneArchive | undefined> {
  return transact("readonly", (store) => store.get(userId));
}

export async function saveLaneArchive(userId: string, name: string, archive: unknown): Promise<void> {
  await transact("readwrite", (store) => store.put({
    userId, name, archive, savedAt: Date.now(),
  } satisfies SavedLaneArchive));
}

export async function forgetLaneArchive(userId: string): Promise<void> {
  await transact("readwrite", (store) => store.delete(userId));
}
