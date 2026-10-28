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
import { Fragment, ReactNode, useEffect, useRef, useState } from 'react';
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
  getRowId?: (row: TData) => string;
  /** Id (via getRowId) de una fila a la que hay que llegar al montar: se expande y se hace scroll hasta ella. */
  initialExpandedId?: string;
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
  getRowId,
  initialExpandedId,
}: DataTableShellProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(initialSort);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialFilter && filterColumn
      ? [{ id: filterColumn, value: initialFilter }]
      : [],
  );
  const scrolledToIdRef = useRef<string | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: renderSubComponent ? () => true : undefined,
    state: { columnFilters, sorting },
    initialState: {
      // Si venimos a buscar una fila puntual (link "ver cliente" desde otra pantalla),
      // mostramos todo sin paginar para garantizar que esa fila exista en el DOM y se pueda scrollear.
      pagination: { pageSize: initialExpandedId ? data.length || pageSize : pageSize },
      sorting: initialSort,
      expanded: initialExpandedId ? { [initialExpandedId]: true } : {},
    },
    autoResetPageIndex: false,
  });

  useEffect(() => {
    if (!initialExpandedId || scrolledToIdRef.current === initialExpandedId) return;
    const el = document.getElementById(`table-row-${initialExpandedId}`);
    if (!el) return;
    scrolledToIdRef.current = initialExpandedId;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedRowId(initialExpandedId);
    const timeout = setTimeout(() => setHighlightedRowId(null), 2200);
    return () => clearTimeout(timeout);
  }, [initialExpandedId, data]);

  return (
    <div className={cn('flex flex-col gap-3 pt-4', className)}>
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {filterColumn && (
          <div data-tour="customer-filter" className="relative w-full sm:max-w-xs">
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
                      id={`table-row-${row.id}`}
                      data-state={row.getIsSelected() && 'selected'}
                      className={cn(
                        row.getIsExpanded() && 'border-b-0 bg-gm-surface-2/20',
                        highlightedRowId === row.id && 'bg-gm-yellow/10 transition-colors duration-1000',
                      )}
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
