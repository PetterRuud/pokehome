import { cn } from "@/lib/utils";

/** App mark — simple Poké Ball + wordmark. */
export function PokeballLogo({
  className,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const ball = size === "sm" ? "size-5" : size === "lg" ? "size-8" : "size-6";
  const text = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-lg";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <PokeballIcon className={ball} />
      {showWordmark ? <span className={cn("font-bold tracking-tight", text)}>Pokehome</span> : null}
    </span>
  );
}

export function PokeballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <circle
        cx="16"
        cy="16"
        r="15"
        className="fill-background stroke-foreground"
        strokeWidth="2"
      />
      <path d="M2 16a14 14 0 0 1 28 0" className="fill-destructive" />
      <path d="M2 16h28" className="stroke-foreground" strokeWidth="2" />
      <circle cx="16" cy="16" r="5" className="fill-background stroke-foreground" strokeWidth="2" />
      <circle cx="16" cy="16" r="2.25" className="fill-foreground" />
    </svg>
  );
}
