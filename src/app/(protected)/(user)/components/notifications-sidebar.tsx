'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useNotificationsInterest } from '@/hooks/use-notification-interest';
import { AlertCircle, Bell, BellRing, MessageCircleWarning, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function NotificationSidebar() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { notifications, clearNotifications, removeNotification } = useNotificationsInterest();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="relative" onClick={() => setIsOpen(true)}>
          {notifications.length > 0 ? (
            <>
            <BellRing className="w-7 h-7 text-red-500" />
            <span className="absolute -top-1 right-0 p-1 bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {notifications.length}
            </span>
          </>
          ):(
            <Bell className="w-7 h-7" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
  <SheetHeader className="">
    <SheetTitle>Notificaciones</SheetTitle>
    <SheetDescription>
      Acá se le notificará los intereses aplicados a los clientes los días 10, 20 y último día de cada mes.
    </SheetDescription>
  </SheetHeader>

  {notifications.length > 0 && (
    <div className="flex justify-end pr-2">
      <Button
        size="sm"
        variant="destructive"
        className="bg-transparent text-red-600 hover:bg-transparent"
        onClick={clearNotifications}
      >
        Limpiar
      </Button>
    </div>
  )}
  <Separator />


  {notifications.length === 0 && (
    <div className="p-4 text-sm text-gray-500">No hay Notificaciones</div>
  )}

  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto mt-2 pr-2">
  {notifications.map((notification) => (
  <div key={notification.id} className="relative p-2">
    {/* Botón de cerrar arriba a la derecha */}
    <Button
      className="absolute top-2 right-2 bg-transparent hover:text-red-600 hover:bg-transparent h-4 w-4 p-0"
      onClick={() => removeNotification(notification.id)}
    >
      <X className="h-4 w-4" />
    </Button>

    <p className="font-semibold mb-2 pr-5">{notification.title}</p>
    <p className="text-sm text-gray-500 pr-5">{notification.message}</p>

    <div className="mt-2 flex justify-end">
    <Button
      onClick={() => {
        removeNotification(notification.id);

        const typeMap: Record<string, string> = {
          OWNER: 'owners',
          RENTER: 'renters',
          PRIVATE: 'privates',
        };

        const routeType = typeMap[notification.customerType]; // valor por defecto

        router.push(`/${routeType}?lastName=${notification.lastName}&showSummary=true`);
        setIsOpen(false);
      }}
      className="bg-transparent hover:bg-transparent hover:text-white text-sm"
    >
      Ir a detalle
    </Button>

    </div>

    <Separator className="mt-2" />
  </div>
))}

  </div>
</SheetContent>

    </Sheet>
  );
}
