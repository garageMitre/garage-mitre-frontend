import { useState, useRef, useEffect, startTransition } from "react";
import { startScanner } from "@/services/scanner.service";
import { toast } from '@/components/swipe-toast/toast';
import { getCustomerById } from "@/services/customers.service";
import { historialReceiptsAction } from "@/actions/receipts/create-receipt.action";
import { useSession } from "next-auth/react";
import { OpenScannerDialog } from "./open-scanner-dialog";
import { Customer } from "@/types/cutomer.type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReceiptSchemaType } from "@/schemas/receipt.schema";
import { Receipt } from "@/types/receipt.type";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Check, Keyboard, X } from "lucide-react";

export default function ScannerButton({ isDialogOpen }: { isDialogOpen: boolean }) {
  const [isScanning, setIsScanning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<"TRANSFER" | "CASH" | "CHECK" | "MIX" |null>(null);
  const session = useSession();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [barCode, setbarCode] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer>();
  const [receipt, setReceipt] = useState<Receipt>();
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [manualBarCode, setManualBarCode] = useState("");

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const dialogIsOpen = isDialogOpen || dialogOpen || manualInputVisible;
    if (!dialogIsOpen && !isScanning) {
      setIsScanning(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyUp = () => {
    setIsScanning(false);
  };

  const dialogIsOpen = isDialogOpen || dialogOpen || manualInputVisible;

  if (!dialogIsOpen) {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
  }

  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
  };
}, [isDialogOpen, dialogOpen, manualInputVisible]);

  const handleSubmit = async (barCode: string) => {
    startTransition(() => {
      startScanner({ barCode })
        .then(async (data) => {
          if (!data || "error" in data) {
            toast.error(data?.error || "Error desconocido");
          } else {
            if (data.type === "RECEIPT") {
              toast.success("🧾 Recibo detectado", { duration: 5000 });
              setCustomerId(data.id);
              setbarCode(data.barcode);
              setReceipt(data.receipt)
              setReceiptId(data.receiptId || "")
              try {
                const fetchedCustomer = await getCustomerById(data.id || "", session.data?.token);
                if (!fetchedCustomer) {
                  toast.error("No se encontró el cliente.");
                  return;
                }
                setCustomer(fetchedCustomer);
                setDialogOpen(true); // <-- abrir el diálogo cuando ya tengas los datos
              } catch (error) {
                console.error("Error al obtener cliente:", error);
                toast.error("Error al obtener los datos del cliente.");
              }
            } else {
              toast.success("🎫 Ticket detectado", { duration: 3000 });
              setTimeout(() => {
                window.location.reload();
              }, 1000); // un poquito más que la duración del toast
            }
          }
  
          setIsScanning(false);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error en la solicitud.");
          setIsScanning(false);
        });
    });
  };
  

const handleConfirm = async (data: ReceiptSchemaType) => {
  if (!data || !data.payments || !customerId) return;

  try {
    const updatedCustomer = await getCustomerById(customerId, session.data?.token);

    if (!updatedCustomer) {
      toast.error("No se pudieron obtener los datos actualizados del cliente.");
      return;
    }

    setCustomer(updatedCustomer);

    const fullData: ReceiptSchemaType = {
      ...data,
      barcode: barCode || undefined,
    };

    const result = await historialReceiptsAction(receiptId || '', customerId, fullData);

    if (result.error) {
      toast.error(result.error.message);
      return; // 👈🏽 No continuar, mantener el diálogo abierto
    }

    toast.success("Pago registrado exitosamente.", { duration: 5000 });
    setDialogOpen(false); // 👈🏽 Solo cerrar si todo fue bien
    setSelectedPaymentType(null);

  } catch (error) {
    console.error("Error al registrar el pago:", error);
    toast.error("Error al registrar el pago.");
    // no cerrar el diálogo aquí tampoco
  }
};


  
 return (
  <div className="flex flex-col items-center gap-4">
    {/* Estado del lector: solo aparece mientras escanea o con el ingreso manual abierto. */}
    {(manualInputVisible || isScanning) && (
      <p aria-live="polite" className="inline-flex items-center gap-2 rounded-full border border-yellow-400/35 bg-yellow-400/10 px-3 py-1 text-sm font-semibold text-yellow-400">
        <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-yellow-400" />
        {manualInputVisible ? "Ingreso manual activo" : "Escaneando..."}
      </p>
    )}

    {/* Solo mostrar el input invisible si no está activo el modo manual */}
    {!manualInputVisible && (
      <input
        ref={inputRef}
        type="text"
        autoFocus
        onBlur={() => setIsScanning(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
      />
    )}

    <Button
      variant={manualInputVisible ? "outline" : "default"}
      onClick={() => setManualInputVisible((prev) => !prev)}
      className={
        manualInputVisible
          ? "h-11 w-full max-w-[440px] gap-2.5 rounded-xl px-5 text-[15px] font-semibold sm:w-auto"
          : "h-12 w-full max-w-[440px] gap-2.5 rounded-xl bg-yellow-400 px-5 text-[15px] font-bold text-black shadow-[inset_0_-2px_0_rgba(0,0,0,0.18),0_8px_24px_-10px_rgba(250,204,21,0.45)] hover:bg-yellow-300 sm:w-auto"
      }
    >
      {manualInputVisible ? <X className="size-[18px]" /> : <Keyboard className="size-[18px]" />}
      {manualInputVisible
        ? "Cancelar ingreso manual"
        : "Ingresar código manualmente"}
    </Button>

    {manualInputVisible && (
      <div className="flex w-full max-w-[440px] flex-col items-stretch gap-3 rounded-2xl border bg-card p-4">
        <Input
          autoFocus
          aria-label="Código de barras"
          className="h-11 rounded-lg font-mono text-base tracking-wider"
          value={manualBarCode}
          onChange={(e) => setManualBarCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit(manualBarCode);
              setManualBarCode("");
              setManualInputVisible(false);
            }
          }}
          placeholder="Ingrese el código manualmente"
        />
        <Button
          onClick={() => {
            handleSubmit(manualBarCode);
            setManualBarCode("");
            setManualInputVisible(false);
          }}
          className="h-11 gap-2 rounded-xl bg-yellow-400 text-[15px] font-bold text-black hover:bg-yellow-300"
        >
          <Check className="size-[18px]" />
          Confirmar código
        </Button>
      </div>
    )}

    <OpenScannerDialog
      open={dialogOpen}
      onConfirm={handleConfirm}
      onClose={() => setDialogOpen(false)}
      customer={customer}
      receipt={receipt}
      customerType={customer?.customerType}
    />
  </div>
);

}
