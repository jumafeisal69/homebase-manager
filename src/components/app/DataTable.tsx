import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { EmptyState, ErrorNote, LoadingRows } from "@/components/app/Primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  /** Hidden on the mobile card layout when false. */
  primary?: boolean;
}

interface Props<T> {
  rows: T[] | undefined;
  columns: Column<T>[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  searchable?: (row: T) => string;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
  rowKey: (row: T) => string;
}

export function DataTable<T>({
  rows,
  columns,
  loading,
  error,
  onRetry,
  emptyMessage = "Nothing here yet.",
  emptyAction,
  searchable,
  searchPlaceholder = "Search…",
  pageSize = 10,
  onRowClick,
  toolbar,
  rowKey,
}: Props<T>) {
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; asc: boolean } | null>(null);

  const filtered = useMemo(() => {
    let list = rows ?? [];
    if (searchable && term.trim()) {
      const t = term.trim().toLowerCase();
      list = list.filter((r) => searchable(r).toLowerCase().includes(t));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        list = [...list].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (av === bv) return 0;
          return (av > bv ? 1 : -1) * (sort.asc ? 1 : -1);
        });
      }
    }
    return list;
  }, [rows, term, sort, columns, searchable]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <div>
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          {searchable && (
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      {loading ? (
        <LoadingRows />
      ) : error ? (
        <ErrorNote message={error} onRetry={onRetry} />
      ) : filtered.length === 0 ? (
        <EmptyState message={term ? "No matches for your search." : emptyMessage} action={term ? undefined : emptyAction} />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  {columns.map((c) => (
                    <th key={c.key} className={cn("whitespace-nowrap px-5 py-3 font-medium", c.className)}>
                      {c.sortValue ? (
                        <button
                          type="button"
                          className="transition-colors hover:text-foreground"
                          onClick={() =>
                            setSort((s) => (s?.key === c.key ? { key: c.key, asc: !s.asc } : { key: c.key, asc: true }))
                          }
                        >
                          {c.header}
                          {sort?.key === c.key ? (sort.asc ? " ↑" : " ↓") : ""}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-border/60 last:border-0",
                      onRowClick && "cursor-pointer transition-colors hover:bg-secondary/50",
                    )}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-5 py-3 align-middle", c.className)}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-border md:hidden">
            {visible.map((row) => (
              <div
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("space-y-2 p-4", onRowClick && "cursor-pointer active:bg-secondary/50")}
              >
                {columns.map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3 text-[13px]">
                    <span className="shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {c.header}
                    </span>
                    <span className="min-w-0 text-right">{c.cell(row)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-[12px] text-muted-foreground">
              <span>
                {current * pageSize + 1}–{Math.min(filtered.length, (current + 1) * pageSize)} of {filtered.length}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" disabled={current === 0} onClick={() => setPage(current - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={current >= pages - 1}
                  onClick={() => setPage(current + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
