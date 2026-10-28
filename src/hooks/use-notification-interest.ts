'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/navigation';

const socket = io('http://localhost:3030', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000
});

export const useNotificationsInterest = () => {
  const [notifications, setNotifications] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const storedNotifications = localStorage.getItem('notifications-interest');
      return storedNotifications ? JSON.parse(storedNotifications) : [];
    }
    return [];
  });

  useEffect(() => {
    // Solo ejecutar el código en el cliente
    if (typeof window !== 'undefined') {
      socket.on('connect', () => {
        console.log('🔌 Conectado al WebSocket');
      });

      socket.on('notification-interest', (data) => {
        console.log('Notificación recibida:', data);
        // Solo agregar la notificación si es de tipo 'INSUFFICIENT_FUNDS'
        if (data.type === 'INTEREST_PROCESSED') {
          setNotifications((prev) => {
            const updatedNotifications = [...prev, data];
            localStorage.setItem('notifications-interest', JSON.stringify(updatedNotifications));
            return updatedNotifications;
          });
        }
      });

      socket.on('disconnect', () => {
        console.log('⚠️ Desconectado del WebSocket');
      });

      return () => {
        socket.off('notification-interest');
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, []); // Se ejecuta solo una vez al montar el componente, asegurando que no se ejecute en SSR.

  const clearNotifications = () => {
    setNotifications([]); // Borra del estado
    localStorage.removeItem('notifications-interest'); // Borra de localStorage
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => {
      const filteredNotifications = prev.filter((notification) => notification.id !== id);
      localStorage.setItem('notifications-interest', JSON.stringify(filteredNotifications));
      return filteredNotifications;
    });
  };

  return { notifications, clearNotifications, removeNotification };
};
