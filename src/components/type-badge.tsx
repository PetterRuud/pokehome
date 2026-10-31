import { Badge } from '@/components/ui/badge';
import {
  parsePokemonType,
  typeBadgeClass,
  typeIconClass,
  typeIconUrl,
  type PokemonType,
} from '@/lib/move-types';
import { cn } from '@/lib/utils';

type TypeBadgeProps = {
  /** Display text (move name, `Ice (×4)`, or type name). */
  label: string;
  /** Explicit type; when omitted, parsed from `label`. */
  type?: PokemonType | null;
  title?: string;
  className?: string;
};

export function TypeBadge({ label, type: typeOverride, title, className }: TypeBadgeProps) {
  const type = typeOverride === undefined ? parsePokemonType(label) : typeOverride;
  if (!type) {
    return (
      <Badge variant="secondary" title={title} className={className}>
        {label}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn('gap-1 shadow-none', typeBadgeClass(type), className)}
      title={title ?? `${type} · ${label}`}
    >
      <img
        src={typeIconUrl(type)}
        alt=""
        data-icon="inline-start"
        className={cn('size-3', typeIconClass(type))}
      />
      {label}
    </Badge>
  );
}
