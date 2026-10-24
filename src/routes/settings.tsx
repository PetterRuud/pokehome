import { createFileRoute, Link } from "@tanstack/react-router";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/tanstack-react-start";
import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FieldDescription, FieldTitle } from "@/components/ui/field";
import {
  ConfirmAlertDialog,
  type ConfirmRequest,
} from "@/components/confirm-alert-dialog";
import { useCloudSyncContext } from "@/components/cloud-sync-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDexStore } from "@/lib/store";
import type { AnyExportPayload, SpriteStyle } from "@/lib/types";
import { toast } from "sonner";
import { BoxIcon, CloudIcon, SparklesIcon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { isLoaded, isSignedIn } = useAuth();
  const prefs = useDexStore((s) => s.prefs);
  const setPref = useDexStore((s) => s.setPref);
  const exportData = useDexStore((s) => s.exportData);
  const importData = useDexStore((s) => s.importData);
  const resetAll = useDexStore((s) => s.resetAll);
  const { status, lastSyncedAt, error, syncNow } = useCloudSyncContext();
  const signedIn = isLoaded && isSignedIn;
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  function downloadExport() {
    const payload = exportData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pokehome-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  async function onImportFile(file: File, mode: "merge" | "replace") {
    try {
      const text = await file.text();
      const json = JSON.parse(text) as AnyExportPayload;
      if (
        json.version !== 1 &&
        json.version !== 2 &&
        json.version !== 3 &&
        json.version !== 4 &&
        json.version !== 5
      ) {
        throw new Error("Unsupported backup version");
      }
      importData(json, mode);
      toast.success(mode === "merge" ? "Backup merged" : "Backup restored");
    } catch {
      toast.error("Could not import that file");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Local-first IndexedDB — optional cloud backup when signed in
          (last-write-wins).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudIcon className="size-4" />
            Account & sync
          </CardTitle>
          <CardDescription>
            Sign in to sync progress across devices. If cloud data is newer, it
            replaces this browser. Export a file backup first if unsure.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!signedIn ? (
            <div className="flex flex-wrap gap-2">
              <SignInButton mode="modal">
                <Button>Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="outline">Create account</Button>
              </SignUpButton>
              <Button
                variant="ghost"
                render={<Link to="/sign-in/$" params={{ _splat: "" }} />}
                nativeButton={false}
              >
                Full page sign-in
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <UserButton />
                <Button
                  variant="outline"
                  disabled={status === "syncing"}
                  onClick={() => {
                    void syncNow().then(() => toast.success("Sync finished"));
                  }}
                >
                  {status === "syncing" ? "Syncing…" : "Sync now"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {lastSyncedAt
                  ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
                  : status === "syncing"
                    ? "Syncing with cloud…"
                    : "Not synced yet"}
                {status === "ok" ? " · up to date" : null}
                {error ? ` · ${error}` : null}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Theme and Pokémon art style (pixel sprites or HOME 3D renders from PokeAPI).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <FieldTitle>Theme</FieldTitle>
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-2">
            <FieldTitle>Sprite style</FieldTitle>
            <ToggleGroup
              variant="outline"
              size="sm"
              value={[prefs.spriteStyle]}
              onValueChange={(next) => {
                const value = next[0] as SpriteStyle | undefined;
                if (value) setPref("spriteStyle", value);
              }}
              className="w-full justify-stretch sm:w-auto sm:justify-start"
              aria-label="Sprite style"
            >
              <ToggleGroupItem
                value="pixel"
                aria-label="Pixel"
                className="flex-1 gap-1.5 px-3 sm:flex-none"
              >
                <BoxIcon />
                <span>Pixel</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="home"
                aria-label="HOME 3D"
                className="flex-1 gap-1.5 px-3 sm:flex-none"
              >
                <SparklesIcon />
                <span>HOME 3D</span>
              </ToggleGroupItem>
            </ToggleGroup>
            <FieldDescription>
              HOME uses Pokémon HOME renders; missing art falls back to official artwork, then pixel
              sprites.
            </FieldDescription>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
          <CardDescription>Export JSON to move progress between devices manually.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={downloadExport}>Export backup</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void onImportFile(file, "merge");
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Import & merge
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "application/json,.json";
              input.onchange = () => {
                const file = input.files?.[0];
                if (file) void onImportFile(file, "replace");
              };
              input.click();
            }}
          >
            Import & replace
          </Button>
        </CardContent>
        <CardFooter className="flex-col items-stretch border-t">
          <Button
            variant="destructive"
            onClick={() => {
              setConfirm({
                title: "Reset local data?",
                description:
                  "This clears all catch progress and gift claims stored in this browser. Cloud backup is not deleted.",
                confirmLabel: "Reset",
                onConfirm: () => {
                  resetAll();
                  toast.success("Local data cleared");
                },
              });
            }}
          >
            Reset local data
          </Button>
        </CardFooter>
      </Card>

      <ConfirmAlertDialog
        request={confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      />
    </div>
  );
}
