import {
  ArrowLeftFromLineIcon,
  ArrowRightFromLineIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { Table } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Button } from './button';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const total = table.getFilteredRowModel().rows.length;
  return (
    <div className="flex items-center justify-center px-2">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:gap-x-8">
        <p className="text-sm text-muted-foreground tabular-nums">
          {total} {total === 1 ? 'resultado' : 'resultados'}
        </p>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Filas por página</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="rounded-xl">
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem
                  key={pageSize}
                  value={`${pageSize}`}
                  className="rounded-xl"
                >
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir a la primera página</span>
            <ArrowLeftFromLineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ir a la página anterior</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          {/* Sin resultados la tabla tiene 0 páginas; se muestra «1 de 1» en vez de «1 de 0». */}
          <div className="flex min-w-[100px] items-center justify-center text-sm font-medium tabular-nums">
            Página {table.getState().pagination.pageIndex + 1} de{' '}
            {Math.max(1, table.getPageCount())}
          </div>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir a la página siguiente</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ir a la última página</span>
            <ArrowRightFromLineIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
