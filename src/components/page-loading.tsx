import { Loader } from '@/components/ui/loader';

// Lo que se ve mientras una página trae sus datos del servidor (lo usan los loading.tsx).
export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader size="lg" label="Cargando…" />
    </div>
  );
}
