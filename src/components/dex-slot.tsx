import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { canGmax, canMega } from "@/lib/form-variants";
import type { DexSlot, FormView, SpriteStyle } from "@/lib/types";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoIcon } from "lucide-react";

export function DexSlotButton({
  slot,
  caught,
  formView,
  flagged,
  spriteStyle,
  selected,
  onSelectedChange,
}: {
  slot: DexSlot;
  caught: boolean;
  formView: FormView;
  /** Whether this species has the currently selected form flag. */
  flagged: boolean;
  spriteStyle: SpriteStyle;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
}) {
  const trackingForm = formView !== "default";
  const showShiny = formView === "shiny";
  const showAlpha = formView === "alpha" && flagged;
  const showMega = formView === "mega" && flagged;
  const showGmax = formView === "gmax" && flagged;
  const showForm = (showShiny && flagged) || showAlpha || showMega || showGmax;
  /** In form views, “owned” means flagged; in All, it means caught. */
  const active = trackingForm ? flagged : caught;
  const spriteVariant =
    formView === "mega" && canMega(slot.id)
      ? "mega"
      : formView === "gmax" && canGmax(slot.id)
        ? "gmax"
        : "default";
  const label =
    formView === "default"
      ? `${slot.name}: ${caught ? "caught" : "missing"}. Tap to select.`
      : `${slot.name}: ${flagged ? `has ${formView}` : `no ${formView}`}. Tap to select.`;

  return (
    <div
      className={cn(
        "relative rounded-md",
        selected && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={(v) => onSelectedChange(v === true)}
        aria-label={`Select ${slot.name}`}
        className="absolute top-1.5 left-1.5 z-10"
      />
      <button
        type="button"
        onClick={() => onSelectedChange(!selected)}
        aria-label={label}
        aria-pressed={selected}
        className={cn(
          "flex min-h-20 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-md border-2 p-1.5 pt-7 transition active:scale-[0.97] sm:min-h-24 sm:p-2 sm:pt-7",
          !active && "border-border/60 bg-muted/80 text-muted-foreground",
          active && !showForm && !selected && "border-primary/50 bg-primary/10 text-foreground",
          selected && "border-primary bg-primary/15 text-foreground",
          showShiny &&
            flagged &&
            "border-amber-400 bg-gradient-to-b from-amber-200/30 via-fuchsia-200/20 to-sky-200/30 text-foreground shadow-[0_0_0_1px_rgba(251,191,36,0.45),0_0_12px_rgba(232,121,249,0.35)] dark:border-amber-300 dark:from-amber-400/20 dark:via-fuchsia-400/15 dark:to-sky-400/20",
          showAlpha &&
            "border-red-500 bg-gradient-to-b from-red-500/20 to-rose-900/10 text-foreground shadow-[0_0_10px_rgba(239,68,68,0.35)]",
          showMega &&
            "border-violet-500 bg-gradient-to-b from-violet-400/25 to-fuchsia-500/10 text-foreground shadow-[0_0_10px_rgba(139,92,246,0.35)]",
          showGmax &&
            "border-rose-500 bg-gradient-to-b from-rose-400/25 to-red-900/15 text-foreground shadow-[0_0_10px_rgba(244,63,94,0.35)]",
        )}
      >
        <PokemonSprite
          id={slot.id}
          style={spriteStyle}
          shiny={showShiny}
          variant={spriteVariant}
          slug={slot.slug}
          width={80}
          height={80}
          className={cn(
            "size-16 sm:size-[4.5rem] md:size-20",
            !active && "opacity-35 grayscale",
            (formView === "alpha" || formView === "gmax") && active && "scale-110",
          )}
        />
        <span
          className={cn(
            "w-full truncate text-center text-[10px] font-medium leading-tight sm:text-xs",
            !active && "text-muted-foreground/70",
          )}
        >
          {slot.name}
        </span>
        {(showAlpha || showMega || showGmax) && (
          <span className="flex gap-0.5">
            {showAlpha ? (
              <span className="rounded bg-red-500/90 px-0.5 text-[8px] font-bold text-white">
                α
              </span>
            ) : null}
            {showMega ? (
              <span className="rounded bg-violet-600/90 px-0.5 text-[8px] font-bold text-white">
                M
              </span>
            ) : null}
            {showGmax ? (
              <span className="rounded bg-rose-600/90 px-0.5 text-[8px] font-bold text-white">
                G
              </span>
            ) : null}
          </span>
        )}
      </button>

      <Link
        to="/pokemon/$id"
        params={{ id: String(slot.id) }}
        aria-label={`${slot.name} details`}
        className="absolute top-1 right-1 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm transition hover:text-foreground sm:size-7"
        onClick={(e) => e.stopPropagation()}
      >
        <InfoIcon className="size-3.5" />
      </Link>
    </div>
  );
}
