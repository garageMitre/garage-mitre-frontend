import { CheckCircle2 } from 'lucide-react';

interface FormSuccessProps {
  message?: string;
}

export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-[hsl(120_35%_55%/0.4)] bg-[hsl(120_35%_55%/0.10)] p-3 text-[13px] text-[#9AD588]"
    >
      <CheckCircle2 className="size-4 shrink-0 mt-px" />
      <span>{message}</span>
    </div>
  );
}
