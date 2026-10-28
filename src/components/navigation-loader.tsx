'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LoadingScreen } from './loading-screen';

const MIN_DISPLAY_MS = 3500;

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const showedAt = useRef(0);

  const url = pathname + searchParams.toString();

  useEffect(() => {
    if (!visible) return;

    const elapsed = Date.now() - showedAt.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const id = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(id);
  }, [url]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (
        !anchor?.href ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        e.ctrlKey || e.metaKey || e.shiftKey
      ) return;

      try {
        const dest = new URL(anchor.href, window.location.origin);
        if (dest.origin !== window.location.origin) return;
        if (dest.pathname === pathname && dest.search === window.location.search) return;
        showedAt.current = Date.now();
        setVisible(true);
      } catch {}
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  if (!visible) return null;
  return <LoadingScreen />;
}

export function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}
