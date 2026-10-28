'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Customer, CustomerType } from '@/types/cutomer.type';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Receipt } from '@/types/receipt.type';
import { FileSpreadsheet, FileText } from 'lucide-react';
import generateSimpleReport from '@/utils/generate-simple-report';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
  receipts: Receipt[];
  type: CustomerType;
}

type ExportRow = {
  Apellido: string;
  Nombre: string;
  '¿Pagó este mes?': string;
  'Monto Actual': string;
  Dueño: string;
};

const exportTypeLabel: Record<'all' | 'paid' | 'unpaid', string> = {
  all: 'Todos',
  paid: 'Solo los que pagaron',
  unpaid: 'Solo los que no pagaron',
};

export const ExportCustomersExcel = ({ receipts, type }: Props) => {
  const { data: session } = useSession();

  const [selectedYear, setSelectedYear] = useState<string>(
    dayjs().format('YYYY')
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    dayjs().format('MM')
  );
  const [exportType, setExportType] = useState<'all' | 'paid' | 'unpaid'>(
    'all'
  );
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Arma las filas ya filtradas/agrupadas — la usan tanto el export a Excel como el de PDF, para
  // no tener el mismo criterio de filtrado duplicado en dos lados.
  const buildRows = (): ExportRow[] | null => {
    const selectedMonthNum = parseInt(selectedMonth, 10) - 1; // 0-indexed
    const selectedYearNum = parseInt(selectedYear, 10);

    const filteredReceipts = receipts.filter((receipt) => {
      if (!receipt.customer) return false;
      const date = dayjs(receipt.startDate).tz('America/Argentina/Buenos_Aires');
      return (
        date.month() === selectedMonthNum &&
        date.year() === selectedYearNum &&
        receipt.customer.customerType === type
      );
    });
    if (filteredReceipts.length === 0) {
      toast.error('No hay recibos para el mes seleccionado.');
      return null;
    }

    const receiptTypeNames: Record<string, string> = {
      JOSE_RICARDO_AZNAR: 'Ricardo Aznar',
      CARLOS_ALBERTO_AZNAR: 'Carlos Aznar',
      NIDIA_ROSA_MARIA_FONTELA: 'Nidia Fontela',
      ALDO_RAUL_FONTELA: 'Aldo Fontela',
    };

    // Agrupar por cliente
    const customerMap = new Map<string, ExportRow>();

    for (const receipt of filteredReceipts) {
      const customer = receipt.customer;
      const fullNameKey = `${customer.firstName}_${customer.lastName}_${customer.id}`;

      if (!customerMap.has(fullNameKey)) {
        let ownerLabel = '';

        if (receipt.customer.customerType === 'PRIVATE') {
          const vehicleRenter = receipt.customer.vehicleRenters?.[0];
          if (vehicleRenter) {
            const manualOwners = [
              'JOSE_RICARDO_AZNAR',
              'CARLOS_ALBERTO_AZNAR',
              'NIDIA_ROSA_MARIA_FONTELA',
              'ALDO_RAUL_FONTELA',
            ];

            if (manualOwners.includes(vehicleRenter.owner)) {
              ownerLabel = receiptTypeNames[vehicleRenter.owner] ?? vehicleRenter.owner;
            } else if (vehicleRenter.vehicle?.customer) {
              ownerLabel = `${vehicleRenter.vehicle.customer.firstName} ${vehicleRenter.vehicle.customer.lastName}`;
            } else {
              ownerLabel = vehicleRenter.owner;
            }
          } else {
            ownerLabel = 'Sin owner asignado';
          }
        } else if (receipt.receiptTypeKey === 'OWNER') {
          ownerLabel = 'Garage Mitre';
        } else if (receipt.receiptTypeKey === 'GARAGE_MITRE') {
          const vehicleCustomer = receipt.customer.vehicleRenters?.[0]?.vehicle?.customer;
          ownerLabel = vehicleCustomer
            ? `${vehicleCustomer.firstName} ${vehicleCustomer.lastName}`
            : 'Garage Mitre';
        } else {
          ownerLabel = receiptTypeNames[receipt.receiptTypeKey] ?? receipt.receiptTypeKey;
        }

        customerMap.set(fullNameKey, {
          Apellido: customer.lastName,
          Nombre: customer.firstName,
          '¿Pagó este mes?': receipt.status === 'PAID' ? 'Si' : 'No',
          'Monto Actual': receipt.price.toString(),
          Dueño: ownerLabel,
        });
      }
    }

    const allRows = Array.from(customerMap.values());

    const finalRows = allRows.filter((row) => {
      if (exportType === 'paid') return row['¿Pagó este mes?'] === 'Si';
      if (exportType === 'unpaid') return row['¿Pagó este mes?'] === 'No';
      return true;
    });

    if (finalRows.length === 0) {
      toast.error('No hay datos que coincidan con el filtro.');
      return null;
    }

    finalRows.sort((a, b) => {
      const lastNameCompare = a.Apellido.localeCompare(b.Apellido, 'es', { sensitivity: 'base' });
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' });
    });

    return finalRows;
  };

  const handleExportExcel = () => {
    const finalRows = buildRows();
    if (!finalRows) return;

    const worksheet = XLSX.utils.json_to_sheet(finalRows);
    worksheet['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `clientes_pagos_${selectedYear}_${selectedMonth}.xlsx`);
    setIsDialogOpen(false);
  };

  const handleExportPdf = async () => {
    const finalRows = buildRows();
    if (!finalRows) return;

    const paidCount = finalRows.filter((r) => r['¿Pagó este mes?'] === 'Si').length;
    const monthLabel = dayjs().month(parseInt(selectedMonth, 10) - 1).format('MMMM');

    await generateSimpleReport({
      kicker: 'LISTADO DE CLIENTES',
      title: 'Listado de clientes',
      userName: session?.user.email ?? '',
      metaLine: `${monthLabel} ${selectedYear} · ${exportTypeLabel[exportType]}`,
      columns: [
        { header: 'Apellido', width: 115 },
        { header: 'Nombre', width: 115 },
        { header: '¿Pagó?', width: 70 },
        { header: 'Monto', width: 90, align: 'right' },
        { header: 'Dueño', width: 105 },
      ],
      rows: finalRows.map((r) => [
        r.Apellido,
        r.Nombre,
        r['¿Pagó este mes?'],
        `$ ${r['Monto Actual']}`,
        r.Dueño,
      ]),
      totals: [
        { label: 'Clientes', value: finalRows.length.toString() },
        { label: 'Pagaron', value: paidCount.toString() },
        { label: 'No pagaron', value: (finalRows.length - paidCount).toString() },
      ],
      filename: `clientes_pagos_${selectedYear}_${selectedMonth}.pdf`,
    });
    setIsDialogOpen(false);
  };

  const handleExportTypeChange = (value: string) => {
    if (value === 'all' || value === 'paid' || value === 'unpaid') {
      setExportType(value);
    } else {
      console.warn('Valor inválido para exportType:', value);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-md border-border bg-gm-surface-2 text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          <FileSpreadsheet className="size-3.5" />
          <span className="hidden sm:inline">Clientes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-gm-yellow/40 bg-gm-yellow/15 text-gm-yellow">
              <FileSpreadsheet className="size-4" />
            </span>
            <div>
              <DialogTitle>Exportar clientes</DialogTitle>
              <DialogDescription className="mt-0.5">
                Elegí el período y el filtro de pago.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Mes
              </label>
              <Select onValueChange={setSelectedMonth} defaultValue={selectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un mes" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthNumber = (i + 1).toString().padStart(2, '0');
                      return (
                        <SelectItem key={monthNumber} value={monthNumber}>
                          {dayjs().month(i).format('MMMM')}
                        </SelectItem>
                      );
                    })}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Año
              </label>
              <Select onValueChange={setSelectedYear} defaultValue={selectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => (
                    <SelectItem key={i} value={(dayjs().year() - i).toString()}>
                      {dayjs().year() - i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Filtro de pago
            </label>
            <Select value={exportType} onValueChange={handleExportTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Solo los que pagaron</SelectItem>
                <SelectItem value="unpaid">Solo los que no pagaron</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-gm-surface-2 py-5 text-foreground transition-all active:scale-95 hover:border-gm-yellow/60 hover:bg-gm-yellow/10"
          >
            <FileSpreadsheet className="size-6 text-gm-yellow" />
            <span className="text-[12.5px] font-bold uppercase tracking-[0.03em]">Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-gm-surface-2 py-5 text-foreground transition-all active:scale-95 hover:border-gm-yellow/60 hover:bg-gm-yellow/10"
          >
            <FileText className="size-6 text-gm-yellow" />
            <span className="text-[12.5px] font-bold uppercase tracking-[0.03em]">PDF</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
