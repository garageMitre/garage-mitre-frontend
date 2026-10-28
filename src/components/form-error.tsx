import { AlertTriangle } from 'lucide-react';

interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-[13px] text-[#F08775]"
    >
      <AlertTriangle className="size-4 shrink-0 mt-px" />
      <span>{message}</span>
    </div>
  );
}
