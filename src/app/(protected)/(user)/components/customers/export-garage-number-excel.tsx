'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileSpreadsheet, FileText, ParkingSquare } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Customer } from '@/types/cutomer.type';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { toast } from 'sonner';
import generateSimpleReport from '@/utils/generate-simple-report';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
  customers: Customer[];
}

type GarageRow = { Garage: string; Apellido: string; Nombre: string; Dueño: string };

export const ExportGarageNumberExcel = ({ customers }: Props) => {
  const { data: session } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Misma agrupación para Excel y PDF — evita repetir el recorrido de customers en dos lados.
  const buildRows = (): GarageRow[] | null => {
    const rows: GarageRow[] = [];

    customers.forEach((customer) => {
      if (customer.customerType === 'OWNER') {
        customer.vehicles.forEach((vehicle) => {
          rows.push({
            Garage: vehicle.garageNumber,
            Apellido: customer.lastName,
            Nombre: customer.firstName,
            Dueño: '—',
          });
        });
      } else if (customer.customerType === 'RENTER') {
        customer.vehicleRenters.forEach((vehicleRenter) => {
          rows.push({
            Garage: vehicleRenter.garageNumber,
            Apellido: customer.lastName,
            Nombre: customer.firstName,
            Dueño: vehicleRenter.vehicle
              ? `${vehicleRenter.vehicle.customer.firstName} ${vehicleRenter.vehicle.customer.lastName}`
              : 'Garage Mitre',
          });
        });
      }
    });

    if (rows.length === 0) {
      toast.error('No hay cocheras para exportar.');
      return null;
    }
    return rows;
  };

  const handleExportExcel = () => {
    const rows = buildRows();
    if (!rows) return;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Garages');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `garages_registrados.xlsx`);
    setIsDialogOpen(false);
  };

  const handleExportPdf = async () => {
    const rows = buildRows();
    if (!rows) return;

    await generateSimpleReport({
      kicker: 'LISTADO DE COCHERAS',
      title: 'Listado de cocheras',
      userName: session?.user.email ?? '',
      columns: [
        { header: 'Garage', width: 70 },
        { header: 'Apellido', width: 130 },
        { header: 'Nombre', width: 130 },
        { header: 'Dueño', width: 165 },
      ],
      rows: rows.map((r) => [r.Garage, r.Apellido, r.Nombre, r.Dueño]),
      totals: [{ label: 'Cocheras registradas', value: rows.length.toString() }],
      filename: 'garages_registrados.pdf',
    });
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-md border-border bg-gm-surface-2 text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ParkingSquare className="size-3.5" />
          <span className="hidden sm:inline">Cocheras</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-gm-yellow/40 bg-gm-yellow/15 text-gm-yellow">
              <ParkingSquare className="size-4" />
            </span>
            <div>
              <DialogTitle>Exportar cocheras</DialogTitle>
              <DialogDescription className="mt-0.5">
                Se exportan todas las cocheras registradas, con su dueño y su inquilino actual.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

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
