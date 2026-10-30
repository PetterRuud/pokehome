import { useCloudSync, type CloudSyncState } from '@/hooks/use-cloud-sync';
import { SyncConflictDialog } from '@/components/sync-conflict-dialog';
import { createContext, useContext } from 'react';

const CloudSyncContext = createContext<CloudSyncState | null>(null);

const idleSync: CloudSyncState = {
  status: 'idle',
  lastSyncedAt: null,
  error: null,
  pendingConflict: null,
  syncNow: async () => {},
  resolveConflict: async () => {},
};

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const sync = useCloudSync();
  return (
    <CloudSyncContext.Provider value={sync}>
      {children}
      <SyncConflictDialog />
    </CloudSyncContext.Provider>
  );
}

export function useCloudSyncContext(): CloudSyncState {
  const ctx = useContext(CloudSyncContext);
  return ctx ?? idleSync;
}
