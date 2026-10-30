'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, Bell, CheckCircle2, Info, Trash2 } from 'lucide-react';
import SwipeToast from './SwipeToast';

// Carteles de abajo con SwipeToast (reactbits). Misma API que usaba la app con sonner
// (toast.success / toast.error / toast(...)), así los llamados existentes no cambian.

type ToastKind = 'default' | 'success' | 'error' | 'warning' | 'info';
type ToastOptions = { description?: ReactNode; duration?: number; id?: string | number };

interface ToastItem {
  id: string | number;
  kind: ToastKind;
  title: ReactNode;
  description?: ReactNode;
  duration: number;
  open: boolean;
}

// Más de este número a la vista: el más viejo se cierra solo.
const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;
// Un "éxito" que en realidad es una baja (eliminar, borrar, anular…) se marca en rojo.
const DELETE_WORDS = /elimin|borrad|borró|anulad|anuló|descartad|quitad|dad[oa] de baja/i;

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function push(kind: ToastKind, title: ReactNode, options: ToastOptions = {}) {
  const id = options.id ?? `t${++seq}`;
  const next: ToastItem = {
    id,
    kind,
    title,
    description: options.description,
    duration: options.duration ?? (kind === 'error' ? 6000 : DEFAULT_DURATION),
    open: true,
  };
  const others = items.filter((item) => item.id !== id);
  const open = others.filter((item) => item.open);
  const overflow = new Set(open.slice(0, Math.max(0, open.length - (MAX_VISIBLE - 1))).map((item) => item.id));
  items = [...others.map((item) => (overflow.has(item.id) ? { ...item, open: false } : item)), next];
  emit();
  return id;
}

function dismiss(id?: string | number) {
  items = items.map((item) => (id === undefined || item.id === id ? { ...item, open: false } : item));
  emit();
}

function remove(id: string | number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export const toast = Object.assign(
  (title: ReactNode, options?: ToastOptions) => push('default', title, options),
  {
    message: (title: ReactNode, options?: ToastOptions) => push('default', title, options),
    success: (title: ReactNode, options?: ToastOptions) => push('success', title, options),
    error: (title: ReactNode, options?: ToastOptions) => push('error', title, options),
    warning: (title: ReactNode, options?: ToastOptions) => push('warning', title, options),
    info: (title: ReactNode, options?: ToastOptions) => push('info', title, options),
    dismiss,
  },
);

// Color de la línea (y del ícono) según la acción.
function look(item: ToastItem): { fuse: string; icon: ReactNode } {
  const isDelete = item.kind !== 'error' && typeof item.title === 'string' && DELETE_WORDS.test(item.title);
  if (item.kind === 'error') return { fuse: '#ef4444', icon: <AlertCircle color="#f87171" /> };
  if (isDelete) return { fuse: '#ef4444', icon: <Trash2 color="#f87171" /> };
  if (item.kind === 'success') return { fuse: '#22c55e', icon: <CheckCircle2 color="#4ade80" /> };
  if (item.kind === 'warning') return { fuse: '#f59e0b', icon: <AlertTriangle color="#fbbf24" /> };
  if (item.kind === 'info') return { fuse: '#3b82f6', icon: <Info color="#60a5fa" /> };
  return { fuse: '#facc15', icon: <Bell color="#facc15" /> };
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => items;
// Siempre el mismo arreglo: React exige una referencia estable para el render del servidor.
const EMPTY: ToastItem[] = [];
const getServerSnapshot = () => EMPTY;

// Pila abajo a la derecha (los nuevos abajo); cada cartel se desliza hacia abajo para cerrarlo.
export function SwipeToaster() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!list.length) return null;

  return (
    <section
      aria-label="Notificaciones"
      className="pointer-events-none fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] right-4 z-[999999999] flex w-[min(356px,calc(100vw-32px))] flex-col sm:bottom-[calc(32px+env(safe-area-inset-bottom,0px))] sm:right-8"
    >
      {list.map((item) => {
        const { fuse, icon } = look(item);
        return (
          <div key={item.id} className="pointer-events-auto">
            <SwipeToast
              inline
              open={item.open}
              title={item.title}
              description={item.description}
              icon={icon}
              fuseColor={fuse}
              duration={item.duration}
              onClose={() => remove(item.id)}
            />
          </div>
        );
      })}
    </section>
  );
}
