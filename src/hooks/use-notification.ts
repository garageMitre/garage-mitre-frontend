'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/navigation';

// Estaba hardcodeado al backend de producción — en local nunca iba a recibir el evento
// de un aviso creado contra el backend local, por más que el socket "conectara" bien.
const socket = io(process.env.NEXT_PUBLIC_API_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000
});

// useNotifications.ts
export const useNotifications = () => {
  // Arrancan siempre en false/[] (igual en servidor y cliente) — leer localStorage acá
  // directamente causaba un mismatch de hidratación (SSR no tiene window, así que
  // siempre renderizaba "sin alerta" aunque el cliente sí tuviera una guardada), lo que
  // hacía que el puntito de aviso no se viera de forma confiable. Se lee recién en el
  // efecto de abajo, ya montado el componente.
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasNewNoteAlert, setHasNewNoteAlert] = useState<boolean>(false);

  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
    setHasNewNoteAlert(localStorage.getItem('hasNewNoteAlert') === 'true');
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      socket.on('connect', () => {
        console.log('🔌 Conectado al WebSocket');
      });

      socket.on('notification', (data) => {
        console.log('Notificación recibida:', data);
        if (data.type === 'NEW_NOTE') {
          setNotifications((prev) => {
            const updated = [...prev, data];
            localStorage.setItem('notifications', JSON.stringify(updated));
            return updated;
          });
          setHasNewNoteAlert(true);
          localStorage.setItem('hasNewNoteAlert', 'true');
        }
      });

      socket.on('disconnect', () => {
        console.log('⚠️ Desconectado del WebSocket');
      });

      return () => {
        socket.off('notification');
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  };

  const clearNoteAlert = () => {
    setHasNewNoteAlert(false);
    localStorage.setItem('hasNewNoteAlert', 'false');
  };

  return { notifications, hasNewNoteAlert, clearNotifications, clearNoteAlert };
};
