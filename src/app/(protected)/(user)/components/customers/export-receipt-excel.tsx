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
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Receipt } from '@/types/receipt.type';
import { CustomerType } from '@/types/cutomer.type';
import { FileSpreadsheet, FileText, Receipt as ReceiptIcon } from 'lucide-react';
import generateSimpleReport from '@/utils/generate-simple-report';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
  receipts: Receipt[];
  type: CustomerType;
}

type ExportRow = {
  'Número Recibo': string;
  Estado: string;
  'Monto ($)': string;
  'Fecha Pago': string;
  Barcode: string;
  'Fecha de Creacion': string;
  Apellido: string;
  Nombre: string;
};

const exportTypeLabel: Record<'all' | 'paid' | 'unpaid', string> = {
  all: 'Todos',
  paid: 'Solo pagados',
  unpaid: 'Solo pendientes',
};

export const ExportReceiptsExcel = ({ receipts, type }: Props) => {
  const { data: session } = useSession();
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month());
  const [exportType, setExportType] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Mismo filtrado para Excel y PDF.
  const buildRows = (): ExportRow[] | null => {
    const selectedMonthNum = selectedMonth; // 0-based month

    const filteredReceipts = receipts.filter((receipt) => {
      if (!receipt.startDate || !receipt.customer) return false;
      const date = dayjs(receipt.startDate).tz('America/Argentina/Buenos_Aires');
      return date.month() === selectedMonthNum && receipt.customer.customerType === type;
    });

    if (filteredReceipts.length === 0) {
      toast.error('No hay recibos para el mes seleccionado.');
      return null;
    }

    const rows: ExportRow[] = filteredReceipts.map((receipt) => ({
      'Número Recibo': receipt.receiptNumber,
      Estado: receipt.status === 'PAID' ? 'Pagado' : 'Pendiente',
      'Monto ($)': receipt.price.toString(),
      'Fecha Pago': receipt.paymentDate ? dayjs(receipt.paymentDate).format('DD/MM/YYYY') : '-',
      Barcode: receipt.barcode ?? '-',
      'Fecha de Creacion': receipt.startDate ? dayjs(receipt.startDate).format('DD/MM/YYYY') : '-',
      Apellido: receipt.customer.lastName,
      Nombre: receipt.customer.firstName,
    }));

    const finalRows = rows.filter((row) => {
      if (exportType === 'paid') return row.Estado === 'Pagado';
      if (exportType === 'unpaid') return row.Estado === 'Pendiente';
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
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recibos');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    const monthName = dayjs().month(selectedMonth).format('MMMM');
    saveAs(blob, `recibos_${monthName}_${exportType}.xlsx`);
    setIsDialogOpen(false);
  };

  const handleExportPdf = async () => {
    const finalRows = buildRows();
    if (!finalRows) return;

    const monthName = dayjs().month(selectedMonth).format('MMMM');
    const paidCount = finalRows.filter((r) => r.Estado === 'Pagado').length;
    const totalAmount = finalRows.reduce((sum, r) => sum + Number(r['Monto ($)'] || 0), 0);

    await generateSimpleReport({
      kicker: 'LISTADO DE RECIBOS',
      title: 'Listado de recibos',
      userName: session?.user.email ?? '',
      metaLine: `${monthName} · ${exportTypeLabel[exportType]}`,
      columns: [
        { header: 'N° Recibo', width: 70 },
        { header: 'Apellido', width: 90 },
        { header: 'Nombre', width: 85 },
        { header: 'Estado', width: 55 },
        { header: 'Monto', width: 60, align: 'right' },
        { header: 'F. pago', width: 60 },
        { header: 'F. creación', width: 75 },
      ],
      rows: finalRows.map((r) => [
        r['Número Recibo'],
        r.Apellido,
        r.Nombre,
        r.Estado,
        `$ ${r['Monto ($)']}`,
        r['Fecha Pago'],
        r['Fecha de Creacion'],
      ]),
      totals: [
        { label: 'Recibos', value: finalRows.length.toString() },
        { label: 'Pagados', value: paidCount.toString() },
        { label: 'Monto total', value: `$ ${totalAmount.toLocaleString('es-AR')}` },
      ],
      filename: `recibos_${monthName}_${exportType}.pdf`,
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
          <ReceiptIcon className="size-3.5" />
          <span className="hidden sm:inline">Recibos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-gm-yellow/40 bg-gm-yellow/15 text-gm-yellow">
              <ReceiptIcon className="size-4" />
            </span>
            <div>
              <DialogTitle>Exportar recibos</DialogTitle>
              <DialogDescription className="mt-0.5">
                Elegí el mes y el filtro de pago.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Mes
            </label>
            <Select
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
              defaultValue={selectedMonth.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un mes" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-48">
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthName =
                      dayjs().month(i).format('MMMM').charAt(0).toUpperCase() +
                      dayjs().month(i).format('MMMM').slice(1);
                    return (
                      <SelectItem key={i} value={i.toString()}>
                        {monthName}
                      </SelectItem>
                    );
                  })}
                </ScrollArea>
              </SelectContent>
            </Select>
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
                <SelectItem value="paid">Solo Pagados</SelectItem>
                <SelectItem value="unpaid">Solo Pendientes</SelectItem>
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
