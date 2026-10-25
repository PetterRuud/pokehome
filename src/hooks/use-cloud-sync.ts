import { useAuth } from '@clerk/tanstack-react-start';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getCloudSnapshot, putCloudSnapshot } from '@/server/sync';
import { useDexStore } from '@/lib/store';

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error';

export type CloudSyncState = {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  syncNow: () => Promise<void>;
};

/**
 * Last-write-wins cloud sync while signed in.
 * Pulls once on sign-in; debounced push after local changes.
 */
export function useCloudSync(): CloudSyncState {
  const { isSignedIn, userId, isLoaded } = useAuth();
  const hydrated = useDexStore((s) => s.hydrated);
  const localUpdatedAt = useDexStore((s) => s.localUpdatedAt);
  const exportData = useDexStore((s) => s.exportData);
  const importData = useDexStore((s) => s.importData);

  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pulledForUser = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncing = useRef(false);

  const runSync = useCallback(
    async (reason: 'login' | 'manual' | 'auto') => {
      if (!isSignedIn || !userId || !hydrated) return;
      if (syncing.current) return;
      syncing.current = true;
      setStatus('syncing');
      setError(null);

      try {
        const cloud = await getCloudSnapshot();
        const localAt = useDexStore.getState().localUpdatedAt;

        if (!cloud) {
          const payload = exportData();
          const { updatedAt } = await putCloudSnapshot({
            data: { payload, updatedAt: localAt },
          });
          setLastSyncedAt(updatedAt);
          setStatus('ok');
          return;
        }

        if (cloud.updatedAt > localAt) {
          importData(cloud.payload, 'replace');
          useDexStore.setState({ localUpdatedAt: cloud.updatedAt });
          setLastSyncedAt(cloud.updatedAt);
          setStatus('ok');
          return;
        }

        if (cloud.updatedAt < localAt || reason === 'manual') {
          const payload = exportData();
          const { updatedAt } = await putCloudSnapshot({
            data: { payload, updatedAt: localAt },
          });
          setLastSyncedAt(updatedAt);
          setStatus('ok');
          return;
        }

        // Equal timestamps — already in sync
        setLastSyncedAt(cloud.updatedAt);
        setStatus('ok');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed';
        setError(message);
        setStatus('error');
      } finally {
        syncing.current = false;
      }
    },
    [isSignedIn, userId, hydrated, exportData, importData],
  );

  // Pull / reconcile once per signed-in user after hydrate
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !hydrated) {
      if (!isSignedIn) pulledForUser.current = null;
      return;
    }
    if (pulledForUser.current === userId) return;
    pulledForUser.current = userId;
    void runSync('login');
  }, [isLoaded, isSignedIn, userId, hydrated, runSync]);

  // Debounced push when local data changes after initial pull
  useEffect(() => {
    if (!isSignedIn || !userId || !hydrated) return;
    if (pulledForUser.current !== userId) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      void runSync('auto');
    }, 2000);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [localUpdatedAt, isSignedIn, userId, hydrated, runSync]);

  return {
    status,
    lastSyncedAt,
    error,
    syncNow: () => runSync('manual'),
  };
}
