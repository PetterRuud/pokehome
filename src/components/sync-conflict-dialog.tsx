import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCloudSyncContext } from '@/components/cloud-sync-provider';
import type { SyncDiffSummary } from '@/lib/sync-diff';

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function DiffRows({ diff }: { diff: SyncDiffSummary }) {
  const rows = [
    ...diff.maps.map((m) => ({
      label: m.label,
      local: m.localCount,
      cloud: m.cloudCount,
      onlyLocal: m.onlyLocal,
      onlyCloud: m.onlyCloud,
    })),
    {
      label: 'Claimed gifts',
      local: diff.claimedGifts.localCount,
      cloud: diff.claimedGifts.cloudCount,
      onlyLocal: diff.claimedGifts.onlyLocal,
      onlyCloud: diff.claimedGifts.onlyCloud,
    },
  ].filter((r) => r.local > 0 || r.cloud > 0 || r.onlyLocal > 0 || r.onlyCloud > 0);

  const gameNote =
    diff.gameCaughtOnlyLocal +
      diff.gameCaughtOnlyCloud +
      diff.gameHomeOnlyLocal +
      diff.gameHomeOnlyCloud >
    0
      ? `Game marks: ${diff.gameCaughtOnlyLocal + diff.gameHomeOnlyLocal} only here · ${diff.gameCaughtOnlyCloud + diff.gameHomeOnlyCloud} only in cloud`
      : null;

  if (rows.length === 0 && !gameNote) {
    return <p className="text-sm text-muted-foreground">Counts look similar — timestamps still differ.</p>;
  }

  return (
    <div className="flex w-full flex-col gap-2 text-left">
      <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-xs">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 border-b border-border/60 py-1 last:border-0"
          >
            <span className="font-medium text-foreground">{row.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {row.local} here · {row.cloud} cloud
              {row.onlyLocal > 0 || row.onlyCloud > 0
                ? ` · +${row.onlyLocal}/+${row.onlyCloud}`
                : ''}
            </span>
          </li>
        ))}
      </ul>
      {gameNote ? <p className="text-xs text-muted-foreground">{gameNote}</p> : null}
      <p className="text-xs text-muted-foreground">+only here / +only cloud</p>
    </div>
  );
}

export function SyncConflictDialog() {
  const { pendingConflict, status, resolveConflict } = useCloudSyncContext();
  const open = Boolean(pendingConflict);
  const resolving = status === 'syncing';

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Require an explicit choice — closing without resolving keeps the conflict open.
        if (!next && pendingConflict) return;
      }}
    >
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Cloud sync conflict</AlertDialogTitle>
          <AlertDialogDescription>
            Cloud progress is newer than this browser. Choose how to continue — nothing is overwritten until you pick.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {pendingConflict ? (
          <div className="flex flex-col gap-3">
            <div className="grid gap-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">This device:</span>{' '}
                {formatWhen(pendingConflict.localAt)}
              </p>
              <p>
                <span className="font-medium text-foreground">Cloud:</span>{' '}
                {formatWhen(pendingConflict.cloudAt)}
              </p>
            </div>
            <DiffRows diff={pendingConflict.diff} />
          </div>
        ) : null}

        <AlertDialogFooter className="sm:flex-col sm:items-stretch">
          <AlertDialogAction
            disabled={resolving}
            onClick={() => {
              void resolveConflict('cloud');
            }}
          >
            Use cloud
          </AlertDialogAction>
          <AlertDialogAction
            variant="outline"
            disabled={resolving}
            onClick={() => {
              void resolveConflict('local');
            }}
          >
            Keep this device
          </AlertDialogAction>
          <AlertDialogAction
            variant="secondary"
            disabled={resolving}
            onClick={() => {
              void resolveConflict('merge');
            }}
          >
            Merge both
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
