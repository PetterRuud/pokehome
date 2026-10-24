import type { JSX, SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

const WORDMARKS: Record<string, string> = {
  go: "/logos/go.svg",
  lgpe: "/logos/lgpe.png",
  swsh: "/logos/swsh.png",
  bdsp: "/logos/bdsp.png",
  pla: "/logos/pla.png",
  sv: "/logos/sv.png",
  za: "/logos/za.png",
  mega: "/logos/mega.png",
};

/** Game logos — official wordmarks when available; compact marks otherwise. */
export function GameLogo({
  logo,
  className,
  title,
  variant = "icon",
}: {
  logo: string;
  className?: string;
  title?: string;
  variant?: "icon" | "wordmark";
}) {
  const src = WORDMARKS[logo];

  if (variant === "wordmark" && src) {
    return (
      <img
        src={src}
        alt={title ?? ""}
        title={title}
        className={cn("h-8 w-auto max-w-[11rem] object-contain object-center", className)}
      />
    );
  }

  const Icon = ICONS[logo] ?? FallbackIcon;
  return (
    <Icon
      className={cn("size-5 shrink-0", className)}
      title={title}
      aria-hidden={title ? undefined : true}
    />
  );
}

function FallbackIcon({ className, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" className="fill-muted stroke-border" strokeWidth="1.5" />
      <text x="12" y="16" textAnchor="middle" className="fill-foreground text-[10px] font-bold">
        ?
      </text>
    </svg>
  );
}

function GoIcon({ className, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" className="fill-sky-500" />
      <circle cx="12" cy="12" r="6" className="fill-none stroke-sky-100" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" className="fill-sky-100" />
    </svg>
  );
}

function LgpeIcon({ className, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" className="fill-amber-400" />
      <path
        d="M12 5v4M9 7.5 12 9l3-1.5M12 9v7"
        className="stroke-amber-950"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="9" cy="11" r="1.1" className="fill-amber-950" />
      <circle cx="15" cy="11" r="1.1" className="fill-amber-950" />
    </svg>
  );
}

function SwshIcon({ className, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" className="fill-sky-600" />
      <path
        d="M8 17V8l4-2 4 2v9l-4 2-4-2Z"
        className="fill-sky-100 stroke-sky-950"
        strokeWidth="1"
      />
      <path d="M12 4v16" className="stroke-rose-300" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BdspIcon({ className, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" className="fill-blue-700" />
      <path d="M12 5 17 12l-5 7-5-7 5-7Z" className="fill-sky-200" />
      <path d="M12 8 14.5 12 12 16 9.5 12 12 8Z" className="fill-pink-300" />
    </svg>
  );
}

function PlaIcon({ className, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" className="fill-emerald-700" />
      <path d="M4 16 9 9l3 3 3-5 5 9H4Z" className="fill-emerald-200" />
      <circle cx="12" cy="7" r="1.5" className="fill-amber-300" />
    </svg>
  );
}

function SvIcon({ className, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" className="fill-violet-700" />
      <path d="M12 2a10 10 0 0 0 0 20Z" className="fill-rose-500" />
      <circle cx="12" cy="12" r="3" className="fill-background" />
    </svg>
  );
}

function ZaIcon({ className, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" className="fill-fuchsia-700" />
      <text x="12" y="15.5" textAnchor="middle" className="fill-fuchsia-50 text-[8px] font-bold">
        Z-A
      </text>
    </svg>
  );
}

function MegaIcon({ className, title, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" className="fill-violet-600" />
      <path
        d="M12 4 14.5 9.5 20 10l-4 4 1 5.5L12 17l-5 2.5 1-5.5-4-4 5.5-.5L12 4Z"
        className="fill-violet-100"
      />
    </svg>
  );
}

const ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  go: GoIcon,
  lgpe: LgpeIcon,
  swsh: SwshIcon,
  bdsp: BdspIcon,
  pla: PlaIcon,
  sv: SvIcon,
  za: ZaIcon,
  mega: MegaIcon,
};
