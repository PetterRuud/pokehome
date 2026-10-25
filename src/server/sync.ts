import { createServerFn } from '@tanstack/react-start';
import { auth } from '@clerk/tanstack-react-start/server';
import { getWorkerEnv } from '@/lib/cloudflare';
import type { AnyExportPayload, ExportPayload } from '@/lib/types';

export type CloudSnapshot = {
  payload: ExportPayload;
  updatedAt: string;
};

function isExportPayload(value: unknown): value is ExportPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as AnyExportPayload;
  return v.version === 5;
}

async function requireUserId(): Promise<string> {
  const { userId, isAuthenticated } = await auth();
  if (!isAuthenticated || !userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

async function requireDb() {
  const env = await getWorkerEnv();
  if (!env?.DB) {
    throw new Error('D1 database not bound');
  }
  return env.DB;
}

export const getCloudSnapshot = createServerFn({ method: 'GET' }).handler(async (): Promise<CloudSnapshot | null> => {
  const userId = await requireUserId();
  const db = await requireDb();
  const row = await db
    .prepare('SELECT payload, updated_at FROM dex_snapshots WHERE user_id = ?')
    .bind(userId)
    .first<{ payload: string; updated_at: string }>();

  if (!row) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(row.payload);
  } catch {
    return null;
  }
  if (!isExportPayload(parsed)) return null;

  return { payload: parsed, updatedAt: row.updated_at };
});

export const putCloudSnapshot = createServerFn({ method: 'POST' })
  .validator((data: { payload: ExportPayload; updatedAt: string }) => data)
  .handler(async ({ data }): Promise<{ updatedAt: string }> => {
    const userId = await requireUserId();
    const db = await requireDb();

    if (!isExportPayload(data.payload)) {
      throw new Error('Invalid snapshot payload');
    }

    const updatedAt = data.updatedAt || new Date().toISOString();
    const body = JSON.stringify({
      ...data.payload,
      exportedAt: updatedAt,
    });

    await db
      .prepare(
        `INSERT INTO dex_snapshots (user_id, payload, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           payload = excluded.payload,
           updated_at = excluded.updated_at`,
      )
      .bind(userId, body, updatedAt)
      .run();

    return { updatedAt };
  });
