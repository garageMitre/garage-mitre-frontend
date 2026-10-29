"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { BoxList } from "@/types/box-list.type";
import { findBoxByDate, updateBoxByDate } from "@/services/box-lists.service";
import generateBoxList from "@/utils/generate-box-list";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Edit2, Check, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { es } from "date-fns/locale";
import "dayjs/locale/es";
import { Loader } from "@/components/ui/loader";

dayjs.extend(utc);
dayjs.extend(timezone);

interface BoxListDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function BoxListDialog({ open, setOpen }: BoxListDialogProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [boxData, setBoxData] = useState<BoxList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTotal, setNewTotal] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { data: session } = useSession();

  // ✅ ROLE CHECK
  const isAdmin = session?.user?.role === "ADMIN";

  const fetchData = async (date: Date) => {
    try {
      const formattedDay = dayjs(date)
        .tz("America/Argentina/Buenos_Aires")
        .format("YYYY-MM-DD");

      const response = await findBoxByDate(formattedDay, session?.token);

      if (!response || !response.data) {
        setError("No hay datos disponibles para la fecha seleccionada.");
        setBoxData(null);
      } else {
        setError(null);
        setBoxData(response.data);
        setNewTotal(response.data.totalPrice.toString());
      }
    } catch (err) {
      console.error("Error fetching box data:", err);
      setError("Ocurrió un error al obtener los datos.");
      setBoxData(null);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (open) fetchData(selectedDate);
  }, [open]);

  // Guardar nuevo total
  const handleUpdateTotal = async () => {
    if (!boxData || !isAdmin) return; // ⛔ SOLO ADMIN
    setIsSaving(true);

    const formattedDate = dayjs(selectedDate)
      .tz("America/Argentina/Buenos_Aires")
      .format("YYYY-MM-DD");

    try {
      const parsedTotal = parseFloat(newTotal);
      const updated = await updateBoxByDate(
        formattedDate,
        parsedTotal,
        session?.token
      );

      if (updated) {
        setBoxData({ ...boxData, totalPrice: parsedTotal });
        setIsEditing(false);
        setError(null);
      } else {
        setError("No se pudo actualizar el total.");
      }
    } catch (err) {
      console.error("Error actualizando total:", err);
      setError("Ocurrió un error al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!boxData) {
      setError("No hay datos disponibles para generar el PDF.");
      return;
    }

    try {
      const pdfBytes = await generateBoxList(boxData, session?.user.email || "");
      console.log("PDF generado con éxito:", pdfBytes);
    } catch (err) {
      console.error("Error generating or sending PDF:", err);
      setError("Error al generar o enviar el PDF.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Planilla de caja</DialogTitle>
          <DialogDescription>Elegí el día que querés imprimir.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <Calendar
            mode="single"
            locale={es}
            selected={selectedDate}
            onSelect={(day) => {
              if (day && day <= new Date()) setSelectedDate(day);
            }}
            disabled={(day) => day > new Date()}
            modifiers={{ today: new Date() }}
            modifiersClassNames={{
              today: "border border-yellow-400/60 font-semibold text-yellow-400",
              selected: "!bg-yellow-400 !text-black font-semibold",
            }}
            // date-fns en español escribe el mes en minúscula («octubre 2026»).
            classNames={{ caption_label: "text-sm font-medium capitalize" }}
            className="rounded-lg border p-3"
          />

          {/* Qué día quedó elegido y si tiene caja: antes solo se veía el error. */}
          <div className="w-full rounded-lg border bg-secondary/40 px-4 py-3 text-sm" aria-live="polite">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Día seleccionado</p>
            <p className="mt-0.5 font-medium first-letter:uppercase">
              {dayjs(selectedDate).locale("es").format("dddd D [de] MMMM YYYY")}
            </p>
            {error ? (
              <p className="mt-1 text-xs text-red-400">{error}</p>
            ) : boxData ? (
              <p className="mt-1 text-xs text-muted-foreground">Caja N° {boxData.boxNumber}</p>
            ) : (
              <Loader size="sm" label="Buscando la caja del día…" className="mt-2 flex-row justify-start gap-2" />
            )}
          </div>

          <Button
            onClick={handlePrintPdf}
            disabled={!boxData}
            className="w-full gap-2 bg-yellow-400 text-black hover:bg-yellow-300"
          >
            <Printer className="size-4" />
            Imprimir planilla de caja
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
