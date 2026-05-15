import type { ReactNode } from "react";
import { Search } from "lucide-react";

interface ToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  selectionBar?: ReactNode;
  className?: string;
}

/**
 * Barre d'outils desktop : recherche large à gauche, filtres au centre, actions à droite.
 * Affichage conditionnel d'une selection bar si des items sont sélectionnés.
 */
export function Toolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  filters,
  actions,
  selectionBar,
  className = "",
}: ToolbarProps) {
  return (
    <div className={`lg-v2-panel px-4 py-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {onSearchChange ? (
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 lg-v2-text-subtle"
              aria-hidden
            />
            <input
              type="text"
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="lg-v2-input pl-9"
              aria-label={searchPlaceholder}
            />
          </div>
        ) : null}
        {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
        {actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {selectionBar ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t lg-v2-divider pt-3">
          {selectionBar}
        </div>
      ) : null}
    </div>
  );
}

interface ToggleGroupItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface ToggleGroupProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: ToggleGroupItem<T>[];
  ariaLabel?: string;
}

/**
 * Petit segmented control pour basculer entre vues (liste/kanban/etc.).
 */
export function ToggleGroup<T extends string>({
  value,
  onChange,
  items,
  ariaLabel,
}: ToggleGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-lg border lg-v2-divider lg-v2-panel-muted p-0.5"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(item.value)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              active
                ? "bg-[var(--v2-panel)] lg-v2-text-strong shadow-sm"
                : "lg-v2-text-muted hover:lg-v2-text"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
