'use client';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { BoxList } from '@/types/box-list.type';
import { findBoxByDate } from '@/services/box-lists.service';
import generateBoxList from '@/utils/generate-box-list';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { FileText, Printer } from 'lucide-react';
import { es } from 'date-fns/locale';

dayjs.extend(utc);
dayjs.extend(timezone);

interface BoxListDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ars = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n);

export function BoxListDialog({ open, setOpen }: BoxListDialogProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [boxData, setBoxData] = useState<BoxList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchData = async (date: Date) => {
    try {
      const formattedDay = dayjs(date)
        .tz('America/Argentina/Buenos_Aires')
        .format('YYYY-MM-DD');
      const response = await findBoxByDate(formattedDay, session?.token);
      if (!response || !response.data) {
        setError('No hay datos disponibles para la fecha seleccionada.');
        setBoxData(null);
      } else {
        setError(null);
        setBoxData(response.data);
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al obtener los datos.');
      setBoxData(null);
    }
  };

  useEffect(() => { fetchData(selectedDate); }, [selectedDate]);
  useEffect(() => { if (open) fetchData(selectedDate); }, [open]);


  const handlePrintPdf = async () => {
    if (!boxData) {
      setError('No hay datos disponibles para generar el PDF.');
      return;
    }
    try {
      await generateBoxList(boxData, session?.user.email || '');
    } catch (err) {
      console.error(err);
      setError('Error al generar o enviar el PDF.');
    }
  };

  const formattedSelectedDate = dayjs(selectedDate)
    .tz('America/Argentina/Buenos_Aires')
    .format('DD/MM/YYYY');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto sm:max-h-[90dvh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md border border-gm-yellow/40 bg-gm-yellow/15 text-gm-yellow">
              <FileText className="size-4" />
            </span>
            <div>
              <DialogTitle>Planilla de caja</DialogTitle>
              <DialogDescription className="mt-0.5">
                Elegí el día para ver y exportar la planilla.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <Calendar
            mode="single"
            locale={es}
            selected={selectedDate}
            onSelect={(day) => { if (day && day <= new Date()) setSelectedDate(day); }}
            disabled={(day) => day > new Date()}
            modifiers={{ today: new Date() }}
            modifiersClassNames={{
              today:    'bg-gm-yellow/20 text-gm-yellow font-bold ring-1 ring-gm-yellow/40',
              selected: 'bg-gm-yellow text-gm-ink font-bold',
            }}
            className="rounded-md border border-border bg-gm-surface-2 p-2 w-full"
            classNames={{
              months:   'w-full',
              month:    'w-full space-y-2',
              caption:  'flex justify-center relative items-center pb-1',
              caption_label: 'text-[13px] font-bold capitalize',
              nav_button_previous: 'absolute left-0',
              nav_button_next: 'absolute right-0',
              table:    'w-full border-collapse',
              head_row: 'grid grid-cols-7',
              head_cell: 'text-[11px] font-medium text-muted-foreground text-center py-1',
              row:      'grid grid-cols-7 mt-0.5',
              cell:     'text-center text-[12.5px] p-0 relative aspect-square min-w-0 flex items-center justify-center',
              day:      'h-8 w-8 max-h-full max-w-full p-0 font-normal rounded-md hover:bg-white/[0.08] transition-colors mx-auto flex items-center justify-center',
            }}
          />

          {/* Selected date indicator */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border bg-gm-surface-2 px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Fecha seleccionada
            </span>
            <span className="gm-mono gm-tnum text-[13px] font-semibold text-foreground">
              {formattedSelectedDate}
            </span>
          </div>

          {boxData && (
            <div className="rounded-md border border-border bg-gm-surface-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Total recaudado
                </div>
                <span className="gm-mono text-[11px] text-muted-foreground">Caja #{boxData.boxNumber}</span>
              </div>
              <div className="gm-display gm-tnum mt-1 text-[24px] font-bold text-gm-yellow leading-none">
                {ars(boxData.totalPrice)}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-[#F08775]">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handlePrintPdf} disabled={!boxData}>
            <Printer className="size-4" />
            Imprimir planilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
