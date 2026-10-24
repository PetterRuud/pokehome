import { useCloudSync, type CloudSyncState } from "@/hooks/use-cloud-sync";
import { createContext, useContext } from "react";

const CloudSyncContext = createContext<CloudSyncState | null>(null);

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const sync = useCloudSync();
  return <CloudSyncContext.Provider value={sync}>{children}</CloudSyncContext.Provider>;
}

export function useCloudSyncContext(): CloudSyncState {
  const ctx = useContext(CloudSyncContext);
  if (!ctx) {
    return {
      status: "idle",
      lastSyncedAt: null,
      error: null,
      syncNow: async () => {},
    };
  }
  return ctx;
}
