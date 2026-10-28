'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getTariffPlanAction, saveTariffPlanAction } from '@/actions/tickets/tariff-plan.action';
import { TARIFF_VEHICLES, type TariffDraft, type TariffPlan } from '@/types/tariff-plan.type';
import { changeMethod, tariffMethod, validateTariffDraft } from '@/utils/tariff-plan.utils';
import { TariffEditor } from './tariff-editor';
import { TariffConfirmDialog } from './tariff-confirm-dialog';
import { TariffSummary } from './tariff-summary';
import { TariffSimulator } from './tariff-simulator';
import { TariffCard, TariffCardHeader } from './tariff-ui';

const vehicles = TARIFF_VEHICLES;
const copyDraft = (plan: TariffPlan): TariffDraft => structuredClone({ schedule: plan.schedule, brackets: plan.brackets });

// Tarifas de los tickets por tiempo: lo vigente, un borrador que se aplica entero y un simulador
// que compara ambos. Se monta siempre (aunque su pestaña esté oculta) para no perder el borrador.
export function TariffsBody({ initialPlan, loadError, onDraftChange }: { initialPlan: TariffPlan | null; loadError?: string; onDraftChange?: (editing: boolean) => void }) {
  const router = useRouter();
  const [current, setCurrent] = useState(initialPlan);
  const [draft, setDraft] = useState<TariffDraft | null>(null);
  const [baseRevision, setBaseRevision] = useState(initialPlan?.revision ?? '');
  const [baseDraft, setBaseDraft] = useState('');
  const [error, setError] = useState(loadError ?? '');
  const [conflict, setConflict] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [pending, startTransition] = useTransition();
  const previousInitial = useRef(initialPlan?.revision);
  const dirty = draft !== null && JSON.stringify(draft) !== baseDraft;
  const retiredMethod = draft !== null && !['CUSTOM', 'STARTED'].includes(tariffMethod(draft));
  const errors = draft ? [...(retiredMethod ? ['Elegí Por hora o fracción o Lista de precios para continuar.'] : []), ...validateTariffDraft(draft, vehicles)] : [];
  const hasPrices = current && (current.schedule.pricingOptions.charging.enabled ? current.schedule.pricingOptions.charging.rates.length : current.brackets.length) > 0;

  useEffect(() => { onDraftChange?.(draft !== null); }, [draft, onDraftChange]);
  useEffect(() => {
    if (initialPlan && previousInitial.current !== initialPlan.revision) {
      previousInitial.current = initialPlan.revision;
      setCurrent(initialPlan);
      if (draft && initialPlan.revision !== baseRevision) setConflict(true);
      else if (!draft) setBaseRevision(initialPlan.revision);
    }
  }, [initialPlan, draft, baseRevision]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const target = new URL(anchor.href, window.location.href);
      if (target.pathname === window.location.pathname && target.search === window.location.search) return;
      if (!window.confirm('Tenés cambios de tarifas sin aplicar. Si salís, se perderá este borrador. ¿Salir de todos modos?')) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigate, true); };
  }, [dirty]);
  const edit = () => {
    if (!current) return;
    const saved = copyDraft(current);
    // Sin precios cargados se arranca por hora o fracción, la forma de cobro predeterminada.
    const next = !saved.brackets.length && !saved.schedule.pricingOptions.charging.rates.length ? changeMethod(saved, 'STARTED') : saved;
    setDraft(next); setBaseDraft(JSON.stringify(next)); setBaseRevision(current.revision); setConflict(false); setError('');
  };
  const discard = () => {
    if (dirty) { setConfirmDiscard(true); return; }
    setDraft(null); setError(''); setConflict(false);
  };
  const reload = () => startTransition(async () => {
    const result = await getTariffPlanAction();
    if (result.error) setError(result.error);
    else if (result.plan) {
      setCurrent(result.plan); setError('');
      if (draft && result.plan.revision !== baseRevision) setConflict(true);
      else if (!draft) setBaseRevision(result.plan.revision);
    }
  });
  const save = () => {
    if (!draft || errors.length || conflict) return;
    startTransition(async () => {
      setError('');
      const result = await saveTariffPlanAction(baseRevision, draft);
      if (result.error) {
        setError(result.error);
        if (result.conflict) {
          setConflict(true);
          const latest = await getTariffPlanAction();
          if (latest.plan) setCurrent(latest.plan);
        }
        return;
      }
      if (result.plan) {
        setCurrent(result.plan); setBaseRevision(result.plan.revision); setDraft(null); setConflict(false);
        toast.success('Tarifas aplicadas. Se usan desde la próxima salida.'); router.refresh();
      }
    });
  };
  if (!current) return <TariffCard className="space-y-3 p-5"><h2 className="text-base font-semibold">No se pudieron cargar las tarifas</h2><p className="text-sm text-destructive" role="alert">{error || 'Intentá nuevamente.'}</p><Button size="sm" variant="outline" disabled={pending} onClick={reload}>Volver a intentar</Button></TariffCard>;
  return <div className="space-y-5">
    <TariffSummary plan={current} vehicles={vehicles} actions={!draft && <Button size="sm" onClick={edit} disabled={pending}><Pencil className="mr-1.5 size-3.5" aria-hidden="true" />{hasPrices ? 'Editar tarifas' : 'Configurar tarifas'}</Button>} />
    {draft && <TariffCard aria-labelledby="tariff-draft-heading">
      <TariffCardHeader id="tariff-draft-heading" eyebrow={<span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-gm-yellow" aria-hidden="true" />Borrador · todavía no se cobra</span>} title="Editar tarifas" description="Los cambios se aplican todos juntos." />
      <fieldset disabled={pending} className="min-w-0"><TariffEditor draft={draft} onChange={next => { setDraft(next); setError(''); }} vehicles={vehicles} /></fieldset>
      {errors.length > 0 && <div className="border-t border-border px-5 py-4 text-sm" role="status"><p className="text-xs font-semibold text-foreground">Para poder aplicar</p><ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">{errors.map(message => <li key={message}>{message}</li>)}</ul></div>}
      {conflict && <div role="alert" className="space-y-2 border-t border-border bg-gm-yellow/[0.05] px-5 py-4 text-sm">
        <p className="font-semibold">Las tarifas cambiaron mientras editabas.</p>
        <p className="text-muted-foreground">Tu borrador se conserva. Compará con las tarifas vigentes de arriba antes de continuar; si alguien vuelve a modificarlas, te avisamos de nuevo.</p>
        {current.revision !== baseRevision ? <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => { setBaseRevision(current.revision); setDraft(previous => previous ? { ...previous, brackets: previous.brackets.map(row => { if (!row.id || current.brackets.some(saved => saved.id === row.id)) return row; const { id: _obsoleteId, ...fields } = row; return fields; }) } : previous); setBaseDraft(JSON.stringify(copyDraft(current))); setConflict(false); setError(''); }}>Revisé la versión vigente: conservar mi borrador</Button> : <Button size="sm" variant="outline" disabled={pending} onClick={reload}>Cargar la versión vigente</Button>}
      </div>}
      {error && <p role="alert" className="border-t border-border px-5 py-3 text-sm text-destructive">{error}</p>}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-border bg-card/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{dirty ? 'Cambios sin aplicar.' : 'Sin cambios todavía.'}</span> Se usan en las salidas desde que apliques, también para los tickets que ya están adentro.</p>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={discard}><X className="mr-1 size-3.5" aria-hidden="true" />{dirty ? 'Descartar' : 'Cancelar'}</Button>
          <Button type="button" size="sm" onClick={save} disabled={pending || !dirty || errors.length > 0 || conflict}><Save className="mr-1.5 size-3.5" aria-hidden="true" />{pending ? 'Aplicando…' : 'Aplicar tarifas'}</Button>
        </div>
      </div>
    </TariffCard>}
    <TariffSimulator draft={draft} revision={current.revision} invalid={retiredMethod} vehicles={vehicles} />
    <TariffConfirmDialog open={confirmDiscard} onOpenChange={setConfirmDiscard} title="¿Descartar los cambios?" description="Se perderán los cambios de este borrador. Tus tarifas vigentes se conservan." confirmLabel="Descartar borrador" onConfirm={() => { setDraft(null); setError(''); setConflict(false); }} />
  </div>;
}
