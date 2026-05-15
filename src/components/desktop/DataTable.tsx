"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  /** rendu de cellule par défaut (a accès à la row complète) */
  cell: (row: T) => ReactNode;
  /** pour le tri local : valeur primitive comparable */
  sortValue?: (row: T) => string | number;
  /** classe utilitaire pour aligner / ajuster la largeur */
  className?: string;
  align?: "left" | "right" | "center";
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  rowHref?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  rowActions?: (row: T) => ReactNode;
  emptyState?: ReactNode;
  pageSize?: number;
  className?: string;
  ariaLabel?: string;
  /** clé de colonne par défaut pour le tri initial */
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
}

/**
 * Tableau de données desktop avec tri client, sélection, pagination et actions inline.
 * À utiliser exclusivement dans des blocs `hidden lg:block` — la version mobile reste en cards.
 */
export function DataTable<T>({
  data,
  columns,
  getRowKey,
  rowHref,
  onRowClick,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  rowActions,
  emptyState,
  pageSize = 25,
  className = "",
  ariaLabel,
  defaultSortKey,
  defaultSortDirection = "desc",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [page, setPage] = useState(1);

  const sortable = useMemo(() => {
    const map = new Map<string, (row: T) => string | number>();
    columns.forEach((c) => {
      if (c.sortValue) map.set(c.key, c.sortValue);
    });
    return map;
  }, [columns]);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const getter = sortable.get(sortKey);
    if (!getter) return data;
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      if (va === vb) return 0;
      return va > vb ? factor : -factor;
    });
  }, [data, sortKey, sortDirection, sortable]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedData, currentPage, pageSize],
  );

  const allKeys = useMemo(() => paginated.map(getRowKey), [paginated, getRowKey]);
  const allSelected =
    selectedKeys != null && allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k));
  const someSelected =
    selectedKeys != null && allKeys.some((k) => selectedKeys.has(k)) && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys ?? []);
    if (allSelected) {
      allKeys.forEach((k) => next.delete(k));
    } else {
      allKeys.forEach((k) => next.add(k));
    }
    onSelectionChange(next);
  };

  const toggleOne = (key: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys ?? []);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  const onHeaderClick = (key: string) => {
    if (!sortable.has(key)) return;
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
    setPage(1);
  };

  if (data.length === 0 && emptyState) {
    return <div className={`lg-v2-panel ${className}`}>{emptyState}</div>;
  }

  return (
    <div className={`lg-v2-panel overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left" aria-label={ariaLabel}>
          <thead>
            <tr>
              {selectable ? (
                <th className="lg-v2-table-header w-10 pl-4">
                  <input
                    type="checkbox"
                    aria-label={allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[var(--v2-primary)] focus:ring-[var(--v2-primary)]"
                  />
                </th>
              ) : null}
              {columns.map((col) => {
                const canSort = sortable.has(col.key);
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={`lg-v2-table-header ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : ""
                    } ${col.className ?? ""}`}
                    style={col.width ? { width: col.width } : undefined}
                    aria-sort={
                      isSorted ? (sortDirection === "asc" ? "ascending" : "descending") : undefined
                    }
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={() => onHeaderClick(col.key)}
                        className="inline-flex items-center gap-1 text-inherit hover:lg-v2-text"
                      >
                        {col.header}
                        {isSorted ? (
                          sortDirection === "asc" ? (
                            <ArrowUp size={11} aria-hidden />
                          ) : (
                            <ArrowDown size={11} aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown size={11} aria-hidden className="opacity-40" />
                        )}
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
              {rowActions ? <th className="lg-v2-table-header w-12" aria-label="Actions" /> : null}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => {
              const key = getRowKey(row);
              const selected = selectedKeys?.has(key) ?? false;
              const href = rowHref?.(row);
              const clickable = href != null || onRowClick != null;
              return (
                <tr
                  key={key}
                  className={`lg-v2-table-row ${selected ? "bg-[var(--v2-primary-soft)]" : ""}`}
                  data-row-clickable={clickable || undefined}
                >
                  {selectable ? (
                    <td className="lg-v2-table-cell w-10 pl-4">
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner la ligne ${key}`}
                        checked={selected}
                        onChange={() => toggleOne(key)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[var(--v2-primary)] focus:ring-[var(--v2-primary)]"
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => {
                    const align =
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "";
                    const interactive = clickable
                      ? "cursor-pointer"
                      : "";
                    const handleClick = () => {
                      if (href) {
                        window.location.assign(href);
                      } else if (onRowClick) {
                        onRowClick(row);
                      }
                    };
                    return (
                      <td
                        key={col.key}
                        className={`lg-v2-table-cell ${align} ${interactive} ${col.className ?? ""}`}
                        onClick={clickable ? handleClick : undefined}
                      >
                        {col.cell(row)}
                      </td>
                    );
                  })}
                  {rowActions ? (
                    <td className="lg-v2-table-cell w-12 pr-2 text-right">
                      <div onClick={(e) => e.stopPropagation()}>{rowActions(row)}</div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t lg-v2-divider px-4 py-3">
          <p className="text-xs lg-v2-text-muted">
            Page {currentPage} / {totalPages} · {sortedData.length} entrées
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="lg-v2-btn lg-v2-btn-ghost h-8 w-8 !p-0 disabled:opacity-40"
              aria-label="Page précédente"
            >
              <ChevronLeft size={14} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="lg-v2-btn lg-v2-btn-ghost h-8 w-8 !p-0 disabled:opacity-40"
              aria-label="Page suivante"
            >
              <ChevronRight size={14} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
