// IndexedDB 初期化ユーティリティ（requirements.md §6）
// progress: 学習進捗・SRS / cache: Groq生成コンテンツのキャッシュ

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type ItemType = 'hangul' | 'phrase' | 'pattern';
export type ProgressStatus = 'new' | 'learning' | 'mastered';

export interface ProgressRecord {
  itemId: string;
  itemType: ItemType;
  status: ProgressStatus;
  srsLevel: number; // 0〜5
  nextReviewAt: number; // epoch ms
  bestScore: number; // phrase のみ使用（hangul / pattern は 0 固定）
  attempts: number;
  updatedAt: number; // epoch ms
}

export interface CacheRecord {
  key: string; // `{type}:{itemId}`（例: feedback:phrase_001 / example:phrase_001）
  value: unknown;
  updatedAt: number;
}

interface KoreanStudyDB extends DBSchema {
  progress: {
    key: string;
    value: ProgressRecord;
    indexes: { 'by-nextReviewAt': number; 'by-itemType': string };
  };
  cache: {
    key: string;
    value: CacheRecord;
  };
}

const DB_NAME = 'korean-study';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<KoreanStudyDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<KoreanStudyDB>> {
  dbPromise ??= openDB<KoreanStudyDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const progress = db.createObjectStore('progress', { keyPath: 'itemId' });
      progress.createIndex('by-nextReviewAt', 'nextReviewAt');
      progress.createIndex('by-itemType', 'itemType');
      db.createObjectStore('cache', { keyPath: 'key' });
    },
  });
  return dbPromise;
}

// ---- progress ----

export async function getProgress(
  itemId: string,
): Promise<ProgressRecord | undefined> {
  return (await getDB()).get('progress', itemId);
}

export async function getAllProgress(): Promise<ProgressRecord[]> {
  return (await getDB()).getAll('progress');
}

export async function getProgressByType(
  itemType: ItemType,
): Promise<ProgressRecord[]> {
  return (await getDB()).getAllFromIndex('progress', 'by-itemType', itemType);
}

export async function putProgress(record: ProgressRecord): Promise<void> {
  await (await getDB()).put('progress', record);
}

/** nextReviewAt が now を過ぎた復習対象アイテムを返す（F-06 復習キュー用） */
export async function getDueProgress(
  now: number = Date.now(),
): Promise<ProgressRecord[]> {
  return (await getDB()).getAllFromIndex(
    'progress',
    'by-nextReviewAt',
    IDBKeyRange.upperBound(now),
  );
}

// ---- cache ----

export async function getCache<T>(key: string): Promise<T | undefined> {
  const record = await (await getDB()).get('cache', key);
  return record?.value as T | undefined;
}

export async function setCache(key: string, value: unknown): Promise<void> {
  await (await getDB()).put('cache', { key, value, updatedAt: Date.now() });
}

// ---- reset（F-08 データリセット用） ----

export async function clearAllStores(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['progress', 'cache'], 'readwrite');
  await Promise.all([
    tx.objectStore('progress').clear(),
    tx.objectStore('cache').clear(),
    tx.done,
  ]);
}
