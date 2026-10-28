'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function TariffConfirmDialog({ open, onOpenChange, title, description, children, cancelLabel = 'Seguir editando', confirmLabel, onConfirm }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children?: ReactNode;
  cancelLabel?: string; confirmLabel: string; onConfirm: () => void;
}) {
  const cancel = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md" onOpenAutoFocus={event => { event.preventDefault(); previousFocus.current = document.activeElement as HTMLElement | null; cancel.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); previousFocus.current?.focus(); }}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {children}
      <DialogFooter className="gap-2 sm:gap-0">
        <Button ref={cancel} type="button" size="sm" variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
        <Button type="button" size="sm" onClick={() => { onOpenChange(false); onConfirm(); }}>{confirmLabel}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
