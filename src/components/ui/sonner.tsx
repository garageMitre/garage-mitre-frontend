'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)] group-[.toaster]:rounded-xl group-[.toaster]:overflow-hidden group-[.toaster]:border',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-gm-yellow group-[.toast]:text-gm-ink group-[.toast]:font-semibold group-[.toast]:text-[12px]',
          cancelButton:
            'group-[.toast]:bg-gm-surface-2 group-[.toast]:text-muted-foreground group-[.toast]:text-[12px]',
          success:
            'group-[.toaster]:!border-[hsl(120_35%_55%/0.35)] group-[.toaster]:!bg-[hsl(120_35%_55%/0.1)]',
          error:
            'group-[.toaster]:!border-destructive/35 group-[.toaster]:!bg-destructive/10',
          warning:
            'group-[.toaster]:!border-gm-orange/35 group-[.toaster]:!bg-gm-orange/10',
          info:
            'group-[.toaster]:!border-gm-yellow/35 group-[.toaster]:!bg-gm-yellow/10',
          title: 'group-[.toast]:text-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
