"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Pagination, Spinner, Table } from "@heroui/react";
import {
  flexRender,
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { listTableFeatures } from "./features";
import { toSortDescriptor, toSortingState } from "./sort-bridge";

const DEFAULT_PAGE_SIZE = 10;
const desktopQuery = "(min-width: 768px)";
function subscribeViewport(callback: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const isDesktop = () => window.matchMedia(desktopQuery).matches;
const serverViewport = () => false;

type DataTableProps<TData extends RowData> = {
  data: TData[];
  columns: ColumnDef<typeof listTableFeatures, TData, unknown>[];
  getRowId: (row: TData) => string;
  ariaLabel: string;
  pageSize?: number;
  rowHeaderColumnId?: string;
  isLoading?: boolean;
  emptyContent?: ReactNode;
  className?: string;
};

export function DataTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  ariaLabel,
  pageSize = DEFAULT_PAGE_SIZE,
  rowHeaderColumnId,
  isLoading = false,
  emptyContent,
  className,
}: DataTableProps<TData>) {
  const desktop = useSyncExternalStore(subscribeViewport, isDesktop, serverViewport);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useTable(
    {
      features: listTableFeatures,
      columns,
      data,
      getRowId: (row) => getRowId(row),
      initialState: {
        pagination: { pageIndex: 0, pageSize },
      },
      onSortingChange: setSorting,
      state: { sorting },
    },
    (state) => ({ pagination: state.pagination }),
  );

  const sortDescriptor = useMemo(() => toSortDescriptor(sorting), [sorting]);
  const { pageIndex } = table.state.pagination;
  const pageCount = table.getPageCount();
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const total = data.length;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);
  const headerGroup = table.getHeaderGroups()[0];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (total === 0) {
    return (
      emptyContent ?? (
        <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          موردی برای نمایش نیست.
        </div>
      )
    );
  }

  return (
    <div className={className}>
      {!desktop ? <section className="business-mobile-list" aria-label={ariaLabel}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="min-w-0 flex-1 text-xs text-muted">مرتب‌سازی
            <select className="mt-1 w-full rounded-xl bg-surface-secondary px-3 py-2 text-sm text-foreground" value={sorting[0]?.id ?? ""} onChange={e => setSorting(e.target.value ? [{ id:e.target.value, desc:false }] : [])}>
              <option value="">ترتیب پیش‌فرض</option>
              {headerGroup?.headers.filter(h => h.column.getCanSort()).map(h => <option key={h.id} value={h.id}>{typeof h.column.columnDef.header === "string" ? h.column.columnDef.header : h.id}</option>)}
            </select>
          </label>
          {sorting[0] ? <button type="button" className="min-h-11 rounded-xl bg-surface-secondary px-3 text-sm" onClick={() => setSorting([{id:sorting[0]!.id,desc:!sorting[0]!.desc}])}>{sorting[0].desc ? "نزولی" : "صعودی"}</button> : null}
        </div>
        <div className="grid gap-3">{table.getRowModel().rows.map(row => <article key={row.id} className="rounded-3xl border border-border bg-surface p-4">
          <dl className="space-y-3">{row.getAllCells().map(cell => { const header = headerGroup?.headers.find(h => h.id === cell.column.id); return <div key={cell.id} className="min-w-0 border-b border-border/60 pb-3 last:border-0 last:pb-0">
            <dt className="mb-1 text-xs text-muted">{header ? flexRender(header.column.columnDef.header,header.getContext()) : cell.column.id}</dt>
            <dd className="min-w-0 break-words text-sm font-medium">{flexRender(cell.column.columnDef.cell,cell.getContext())}</dd>
          </div>; })}</dl>
        </article>)}</div>
      </section> : null}
    {desktop ? <Table className="business-desktop-table">
      <Table.ScrollContainer>
        <Table.Content
          aria-label={ariaLabel}
          className="min-w-[640px]"
          sortDescriptor={sortDescriptor}
          onSortChange={(descriptor) => setSorting(toSortingState(descriptor))}
        >
          <Table.Header>
            {headerGroup?.headers.map((header) => (
              <Table.Column
                key={header.id}
                allowsSorting={header.column.getCanSort()}
                id={header.id}
                isRowHeader={
                  rowHeaderColumnId
                    ? header.id === rowHeaderColumnId
                    : header.index === 0
                }
              >
                {({ sortDirection }) =>
                  header.column.getCanSort() ? (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </Table.SortableColumnHeader>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )
                  )
                }
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {table.getRowModel().rows.map((row) => (
              <Table.Row key={row.id} id={row.id}>
                {row.getAllCells().map((cell) => (
                  <Table.Cell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table> : null}
      {pageCount > 1 ? (
        <div className="mt-4 flex flex-wrap justify-center">
          <Pagination size="sm">
            <Pagination.Summary>
              {start} تا {end} از {total} مورد
            </Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={!table.getCanPreviousPage()}
                  onPress={() => table.previousPage()}
                >
                  <Pagination.PreviousIcon />
                  قبلی
                </Pagination.Previous>
              </Pagination.Item>
              {pages.filter(page => Math.abs(page - pageIndex - 1) <= 2).map((page) => (
                <Pagination.Item key={page}>
                  <Pagination.Link
                    isActive={page === pageIndex + 1}
                    onPress={() => table.setPageIndex(page - 1)}
                  >
                    {page}
                  </Pagination.Link>
                </Pagination.Item>
              ))}
              <Pagination.Item>
                <Pagination.Next
                  isDisabled={!table.getCanNextPage()}
                  onPress={() => table.nextPage()}
                >
                  بعدی
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
