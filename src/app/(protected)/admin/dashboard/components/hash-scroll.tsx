'use client';

import { useEffect } from 'react';

// Next.js no scrollea al hash en una navegación client-side entre rutas distintas
// (solo lo hace de forma confiable dentro de la misma página) — este efecto lo hace a mano
// para accesos directos como "Ver métricas" del menú de Clientes.
export function HashScroll() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  return null;
}
