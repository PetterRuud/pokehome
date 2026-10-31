import { useAuth } from '@clerk/tanstack-react-start';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getCloudSnapshot, putCloudSnapshot } from '@/server/sync';
import { useDexStore } from '@/lib/store';
import { diffExportPayloads, hasMeaningfulLocalProgress, type SyncDiffSummary } from '@/lib/sync-diff';
import type { ExportPayload } from '@/lib/types';

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'conflict';

export type SyncConflictResolution = 'cloud' | 'local' | 'merge';

export type PendingSyncConflict = {
  cloud: ExportPayload;
  localAt: string;
  cloudAt: string;
  diff: SyncDiffSummary;
};

export type CloudSyncState = {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  pendingConflict: PendingSyncConflict | null;
  syncNow: () => Promise<void>;
  resolveConflict: (choice: SyncConflictResolution) => Promise<void>;
};

/**
 * Last-write-wins cloud sync while signed in.
 * Pulls once on sign-in; debounced push after local changes.
 * When cloud is newer and local has progress, pauses for user confirmation.
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
  const [pendingConflict, setPendingConflict] = useState<PendingSyncConflict | null>(null);

  const pulledForUser = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncing = useRef(false);
  const pendingConflictRef = useRef<PendingSyncConflict | null>(null);
  const signedIn = Boolean(isSignedIn);
  const [trackedSignedIn, setTrackedSignedIn] = useState(signedIn);

  // Clear conflict UI state when the session ends (adjust during render).
  if (signedIn !== trackedSignedIn) {
    setTrackedSignedIn(signedIn);
    if (!signedIn) setPendingConflict(null);
  }

  const setConflict = useCallback((conflict: PendingSyncConflict | null) => {
    pendingConflictRef.current = conflict;
    setPendingConflict(conflict);
  }, []);

  const pushLocal = useCallback(async () => {
    const localAt = useDexStore.getState().localUpdatedAt;
    const payload = exportData();
    const { updatedAt } = await putCloudSnapshot({
      data: { payload, updatedAt: localAt },
    });
    setLastSyncedAt(updatedAt);
    setStatus('ok');
  }, [exportData]);

  const takeCloud = useCallback(
    (cloud: ExportPayload, cloudAt: string, mode: 'replace' | 'merge') => {
      importData(cloud, mode);
      if (mode === 'replace') {
        useDexStore.setState({ localUpdatedAt: cloudAt });
        setLastSyncedAt(cloudAt);
        setStatus('ok');
        return Promise.resolve();
      }
      // Merge bumps localUpdatedAt — push so cloud gets the union.
      return pushLocal();
    },
    [importData, pushLocal],
  );

  const runSync = useCallback(
    async (reason: 'login' | 'manual' | 'auto') => {
      if (!isSignedIn || !userId || !hydrated) return;
      if (syncing.current) return;
      // Do not auto-push (or re-reconcile) while waiting on the user.
      if (pendingConflictRef.current && reason === 'auto') return;

      syncing.current = true;
      setStatus('syncing');
      setError(null);

      try {
        const cloud = await getCloudSnapshot();
        const localAt = useDexStore.getState().localUpdatedAt;
        const localPayload = exportData();

        if (!cloud) {
          await pushLocal();
          return;
        }

        if (cloud.updatedAt > localAt) {
          if (!hasMeaningfulLocalProgress(localPayload)) {
            await takeCloud(cloud.payload, cloud.updatedAt, 'replace');
            setConflict(null);
            return;
          }

          // Manual sync while a conflict is already open: refresh the pending snapshot.
          const conflict: PendingSyncConflict = {
            cloud: cloud.payload,
            localAt,
            cloudAt: cloud.updatedAt,
            diff: diffExportPayloads(localPayload, cloud.payload),
          };
          setConflict(conflict);
          setStatus('conflict');
          return;
        }

        if (cloud.updatedAt < localAt || reason === 'manual') {
          setConflict(null);
          await pushLocal();
          return;
        }

        // Equal timestamps — already in sync
        setConflict(null);
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
    [isSignedIn, userId, hydrated, exportData, pushLocal, takeCloud, setConflict],
  );

  const resolveConflict = useCallback(
    async (choice: SyncConflictResolution) => {
      const conflict = pendingConflictRef.current;
      if (!conflict) return;
      if (syncing.current) return;
      syncing.current = true;
      setStatus('syncing');
      setError(null);

      try {
        if (choice === 'cloud') {
          await takeCloud(conflict.cloud, conflict.cloudAt, 'replace');
        } else if (choice === 'local') {
          await pushLocal();
        } else {
          await takeCloud(conflict.cloud, conflict.cloudAt, 'merge');
        }
        setConflict(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed';
        setError(message);
        setStatus('error');
      } finally {
        syncing.current = false;
      }
    },
    [takeCloud, pushLocal, setConflict],
  );

  // Reset sync bookkeeping on sign-out; pull once per signed-in user after hydrate.
  useEffect(() => {
    if (!isSignedIn) {
      pulledForUser.current = null;
      pendingConflictRef.current = null;
      return;
    }
    if (!isLoaded || !userId || !hydrated) return;
    if (pulledForUser.current === userId) return;
    pulledForUser.current = userId;
    void runSync('login');
  }, [isLoaded, isSignedIn, userId, hydrated, runSync]);

  // Debounced push when local data changes after initial pull
  useEffect(() => {
    if (!isSignedIn || !userId || !hydrated) return;
    if (pulledForUser.current !== userId) return;
    if (pendingConflictRef.current) return;

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
    pendingConflict,
    syncNow: () => runSync('manual'),
    resolveConflict,
  };
}
