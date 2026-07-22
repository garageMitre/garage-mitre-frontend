'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

export interface TourStep {
  key: string;
  title: string;
  desc: string;
}

interface Pos {
  top: number;
  left: number;
  width: number;
  height: number;
}

const DURATION = 4200;

function tooltipStyle(pos: Pos | null): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    width: 320,
    background: '#18181b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 18,
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
  };
  if (!pos) return { ...base, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  const spaceBelow = window.innerHeight - (pos.top + pos.height);
  const top = spaceBelow > 220 ? pos.top + pos.height + 14 : Math.max(14, pos.top - 14 - 260);
  const left = Math.min(Math.max(14, pos.left), window.innerWidth - 334);
  return { ...base, top, left };
}

export interface TourHandle {
  refFor: (key: string) => (el: HTMLElement | null) => void;
  isActive: (key: string) => boolean;
  node: React.ReactNode;
}

export function useTour(steps: TourStep[]): TourHandle {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState<Pos | null>(null);
  const [mounted, setMounted] = useState(false);
  const elsRef = useRef<Record<string, HTMLElement | null>>({});
  const pausedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // Reposition + resize
  useEffect(() => {
    if (!open) return;
    const snap = () => {
      const el = elsRef.current[steps[idx]?.key];
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    snap();
    window.addEventListener('resize', snap);
    return () => window.removeEventListener('resize', snap);
  }, [open, idx, steps]);

  // Auto-advance timer — restarts on each step
  useEffect(() => {
    if (!open) return;
    pausedRef.current = false;
    let tick = 0;
    const timer = setInterval(() => {
      if (pausedRef.current) return;
      tick += 100;
      if (tick >= DURATION) {
        tick = 0;
        setIdx(prev => {
          if (prev + 1 >= steps.length) { setOpen(false); return prev; }
          return prev + 1;
        });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [open, idx, steps.length]);

  const close = () => { setOpen(false); setPos(null); };
  const start = () => { setIdx(0); setOpen(true); };
  const next  = () => setIdx(i => { if (i + 1 >= steps.length) { close(); return i; } return i + 1; });
  const prev  = () => { if (idx > 0) setIdx(i => i - 1); };

  const refFor = (key: string) => (el: HTMLElement | null) => { elsRef.current[key] = el; };
  const isActive = (key: string) => open && steps[idx]?.key === key;

  const s = steps[idx] ?? steps[0];

  const node = (
    <>
      <button
        onClick={start}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-[13px] font-semibold text-[hsl(217_91%_72%)] transition-colors hover:border-white/30 hover:bg-white/5"
      >
        <HelpCircle size={14} />
        Ayuda
      </button>

      {mounted && open && createPortal(
        <>
          {/* Overlay */}
          <div
            onClick={close}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9990, cursor: 'pointer' }}
          />

          {/* Tooltip */}
          <div
            style={tooltipStyle(pos)}
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(217 91% 70%)', letterSpacing: '0.03em' }}>
                PASO {idx + 1} DE {steps.length}
              </span>
              <button
                onClick={close}
                style={{ background: 'transparent', border: 'none', color: 'hsl(0 0% 55%)', fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: 0 }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.title}</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13.5, lineHeight: 1.5, color: 'hsl(0 0% 75%)' }}>{s.desc}</p>

            {/* Progress bar */}
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 14 }}>
              <div
                key={`${idx}-${open}`}
                style={{
                  height: '100%',
                  background: 'hsl(217 91% 65%)',
                  animation: `gm-tour-progress ${DURATION}ms linear forwards`,
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={close}
                style={{ background: 'transparent', border: 'none', color: 'hsl(0 0% 55%)', fontSize: 13, cursor: 'pointer', padding: 0 }}
              >
                Saltar tour
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={prev}
                  disabled={idx === 0}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: idx === 0 ? 'hsl(0 0% 35%)' : '#e5e5e5',
                    fontSize: 13, fontWeight: 500,
                    padding: '6px 14px', borderRadius: 7,
                    cursor: idx === 0 ? 'default' : 'pointer',
                  }}
                >
                  Anterior
                </button>
                <button
                  onClick={next}
                  style={{
                    background: '#fafafa', border: 'none', color: '#111',
                    fontSize: 13, fontWeight: 600, padding: '6px 14px',
                    borderRadius: 7, cursor: 'pointer',
                  }}
                >
                  {idx === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );

  return { refFor, isActive, node };
}

/** Inline style for highlighted elements */
export const tourHighlight: React.CSSProperties = {
  boxShadow: '0 0 0 3px rgba(96,165,250,0.95), 0 0 32px 6px rgba(96,165,250,0.35)',
  zIndex: 9995,
  transform: 'scale(1.015)',
};

export const tourTransition: React.CSSProperties = {
  transition: 'box-shadow .25s ease, transform .25s ease',
  position: 'relative',
};
