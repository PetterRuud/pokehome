import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { canGmax, canMega, canRegional } from "@/lib/form-variants";
import type { DexSlot, FormView, SpriteStyle } from "@/lib/types";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { InfoIcon } from "lucide-react";

export function DexSlotButton({
  slot,
  caught,
  formView,
  flagged,
  spriteStyle,
  selected,
  searchHit,
  searchActive,
  onSelectedChange,
}: {
  slot: DexSlot;
  caught: boolean;
  formView: FormView;
  /** Whether this species has the currently selected form flag. */
  flagged: boolean;
  spriteStyle: SpriteStyle;
  selected: boolean;
  /** Matched by in-app dex search. */
  searchHit?: boolean;
  /** Current active search match. */
  searchActive?: boolean;
  onSelectedChange: (selected: boolean) => void;
}) {
  const trackingForm = formView !== "default";
  const showShiny = formView === "shiny";
  const showAlpha = formView === "alpha" && flagged;
  const showMega = formView === "mega" && flagged;
  const showGmax = formView === "gmax" && flagged;
  const showRegional = formView === "regional" && flagged;
  /** In form views, “owned” means flagged; in All, it means caught. */
  const active = trackingForm ? flagged : caught;
  const spriteVariant =
    formView === "mega" && canMega(slot.id)
      ? "mega"
      : formView === "gmax" && canGmax(slot.id)
        ? "gmax"
        : formView === "regional" && canRegional(slot.id)
          ? "regional"
          : "default";
  const label =
    formView === "default"
      ? `${slot.name}: ${caught ? "caught" : "missing"}. Tap to select.`
      : `${slot.name}: ${flagged ? `has ${formView}` : `no ${formView}`}. Tap to select.`;

  const variant = selected ? "secondary" : active ? "primary" : "muted";

  return (
    <div className="relative">
      <Checkbox
        checked={selected}
        onCheckedChange={(v) => onSelectedChange(v === true)}
        aria-label={`Select ${slot.name}`}
        className="absolute top-2 left-2 z-10"
      />
      <Item
        variant={variant}
        size="sm"
        render={
          <button
            type="button"
            onClick={() => onSelectedChange(!selected)}
            aria-label={label}
            aria-pressed={selected}
          />
        }
        className={cn(
          "flex-col items-center pt-8",
          searchActive && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          searchHit &&
            !searchActive &&
            !selected &&
            "ring-2 ring-ring/50 ring-offset-1 ring-offset-background",
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
            "size-16 sm:size-20",
            !active && "opacity-35 grayscale",
            (formView === "alpha" || formView === "gmax") && active && "scale-110",
          )}
        />
        <ItemContent className="w-full items-center text-center">
          <ItemTitle className="w-full justify-center tabular-nums">
            #{String(slot.id).padStart(3, "0")}
          </ItemTitle>
          <ItemDescription className="w-full text-center">{slot.name}</ItemDescription>
          {showAlpha || showMega || showGmax || showRegional ? (
            <div className="flex flex-wrap justify-center gap-1">
              {showAlpha ? <Badge variant="secondary">α</Badge> : null}
              {showMega ? <Badge variant="secondary">M</Badge> : null}
              {showGmax ? <Badge variant="secondary">G</Badge> : null}
              {showRegional ? <Badge variant="secondary">R</Badge> : null}
            </div>
          ) : null}
        </ItemContent>
      </Item>

      <Button
        variant="outline"
        size="icon-sm"
        className="absolute top-1 right-1 z-10"
        render={
          <Link
            to="/pokemon/$id"
            params={{ id: String(slot.id) }}
            aria-label={`${slot.name} details`}
            onClick={(e) => e.stopPropagation()}
          />
        }
        nativeButton={false}
      >
        <InfoIcon />
      </Button>
    </div>
  );
}
