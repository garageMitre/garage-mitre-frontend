'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  Table as TanstackTable,
  useReactTable,
} from '@tanstack/react-table';
import { Fragment, ReactNode, useState } from 'react';
import { Search, Inbox } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DataTableShellProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  filterColumn?: string;
  filterPlaceholder?: string;
  initialFilter?: string;
  initialSort?: SortingState;
  toolbarRight?: ReactNode | ((table: TanstackTable<TData>) => ReactNode);
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
  renderSubComponent?: (row: Row<TData>) => ReactNode;
}

export function DataTableShell<TData, TValue>({
  data,
  columns,
  filterColumn,
  filterPlaceholder = 'Filtrar...',
  initialFilter,
  initialSort = [],
  toolbarRight,
  pageSize = 10,
  emptyMessage = 'No hay resultados para mostrar.',
  className,
  renderSubComponent,
}: DataTableShellProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(initialSort);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialFilter && filterColumn
      ? [{ id: filterColumn, value: initialFilter }]
      : [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: renderSubComponent ? () => true : undefined,
    state: { columnFilters, sorting },
    initialState: { pagination: { pageSize }, sorting: initialSort },
    autoResetPageIndex: false,
  });

  return (
    <div className={cn('flex flex-col gap-3 pt-4', className)}>
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {filterColumn && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder={filterPlaceholder}
              value={
                (table.getColumn(filterColumn)?.getFilterValue() as string) ?? ''
              }
              onChange={(e) =>
                table.getColumn(filterColumn)?.setFilterValue(e.target.value)
              }
              className="pl-9 h-8 text-[13px]"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 sm:ml-auto">
          <DataTableViewOptions table={table} />
          {typeof toolbarRight === 'function'
            ? toolbarRight(table)
            : toolbarRight}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && 'selected'}
                      className={row.getIsExpanded() ? 'border-b-0 bg-gm-surface-2/20' : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && renderSubComponent && (
                      <TableRow className="hover:bg-transparent border-b border-border">
                        <TableCell
                          colSpan={row.getVisibleCells().length}
                          className="p-0"
                        >
                          {renderSubComponent(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleFlatColumns().length}
                    className="h-28 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                      <Inbox className="size-5 opacity-50" />
                      <span className="text-[12.5px]">{emptyMessage}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
