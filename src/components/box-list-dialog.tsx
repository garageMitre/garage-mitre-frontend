"use client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
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
import { Edit2, Check } from "lucide-react";

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
      <DialogContent className="max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg">
        <DialogHeader className="items-center mt-4">
          <DialogTitle>Elegir fecha</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(day) => {
              if (day && day <= new Date()) setSelectedDate(day);
            }}
            disabled={(day) => day > new Date()}
            modifiers={{ today: new Date() }}
            modifiersClassNames={{
              today: "bg-blue-400 text-white font-bold",
              selected: "bg-accent text-white border border-accent-foreground",
            }}
            className="rounded-lg border shadow-md p-4"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handlePrintPdf}
            disabled={!boxData}
            className={`block w-3/4 rounded-md p-3 text-white ${
              boxData
                ? "bg-accent hover:bg-accent-hover focus:bg-accent-focus"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Imprimir Planilla de caja
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
