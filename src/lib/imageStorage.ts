/**
 * IndexedDB wrapper for building inspiration images.
 * Keeps large blobs out of localStorage entirely.
 *
 * Keys are UUIDs stored in Building.inspoPics[].
 * Strings starting with "data:" are legacy base64 and are handled
 * by callers without touching IndexedDB.
 */

const DB_NAME    = 'atm10-images'
const STORE_NAME = 'images'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
    req.onerror   = ()  => reject(new Error('IndexedDB konnte nicht geöffnet werden'))
  })
}

/** Save a Blob under the given key. */
export async function saveImage(key: string, blob: Blob): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.put(blob, key)
    req.onsuccess = () => { db.close(); resolve() }
    req.onerror   = () => { db.close(); reject(new Error('Bild konnte nicht gespeichert werden')) }
  })
}

/** Retrieve a Blob by key. Returns null if not found. */
export async function getImageBlob(key: string): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.get(key)
    req.onsuccess = (e) => {
      db.close()
      resolve((e.target as IDBRequest<Blob | undefined>).result ?? null)
    }
    req.onerror = () => { db.close(); reject(new Error('Bild konnte nicht geladen werden')) }
  })
}

/** Delete a single image by key. */
export async function deleteImage(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req   = store.delete(key)
    req.onsuccess = () => { db.close(); resolve() }
    req.onerror   = () => { db.close(); reject(new Error('Bild konnte nicht gelöscht werden')) }
  })
}

/** Delete multiple images by keys (ignores errors per key). */
export async function deleteImages(keys: string[]): Promise<void> {
  if (keys.length === 0) return
  await Promise.allSettled(keys.map(deleteImage))
}

/** Returns true for legacy base64 data URLs — these bypass IndexedDB entirely. */
export function isDataUrl(s: string): boolean {
  return s.startsWith('data:')
}
