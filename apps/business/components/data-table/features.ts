import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  type RowData,
} from "@tanstack/react-table";

export const listTableFeatures = tableFeatures({
  paginatedRowModel: createPaginatedRowModel(),
  rowPaginationFeature,
  rowSortingFeature,
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
  },
  sortedRowModel: createSortedRowModel(),
});

export type ListTableFeatures = typeof listTableFeatures;

export function createListColumnHelper<TData extends RowData>() {
  return createColumnHelper<ListTableFeatures, TData>();
}
