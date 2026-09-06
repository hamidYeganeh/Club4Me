"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
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
    <Table className={className}>
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
      {pageCount > 1 ? (
        <Table.Footer>
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
              {pages.map((page) => (
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
        </Table.Footer>
      ) : null}
    </Table>
  );
}
