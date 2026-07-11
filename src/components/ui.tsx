// Componentes de UI reutilizáveis com micro-interações (motion/react).
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ImovelStatus, EtapaDesocupacao } from '../types';

// ---- Modal animado ----
export function Modal({
  aberto,
  onClose,
  titulo,
  children,
  largura = 'max-w-lg',
}: {
  aberto: boolean;
  onClose: () => void;
  titulo: string;
  children: ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (aberto) window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [aberto, onClose]);

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className={`card w-full ${largura} max-h-[88vh] overflow-y-auto p-6`}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-slate-800">{titulo}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---- Miniatura com fallback (imagem quebrada / offline) ----
export function Thumb({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  const [erro, setErro] = useState(false);
  if (!src || erro) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-slate-100 text-4xl text-slate-300 ${className}`}>
        🏠
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setErro(true)} />;
}

// ---- Badge de status do imóvel ----
const STATUS_CORES: Record<ImovelStatus, string> = {
  Arrematado: 'bg-sky-100 text-sky-700',
  Desocupação: 'bg-amber-100 text-amber-700',
  Reforma: 'bg-violet-100 text-violet-700',
  Estoque: 'bg-slate-200 text-slate-700',
  'À Venda': 'bg-caixa-orange/15 text-caixa-orange-dark',
  Vendido: 'bg-emerald-100 text-emerald-700',
};

export function StatusBadge({ status }: { status: ImovelStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CORES[status]}`}>
      {status}
    </span>
  );
}

export function EtapaBadge({ etapa }: { etapa: EtapaDesocupacao }) {
  const critico = etapa === 'Liminar / Mandado';
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
        critico ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {etapa}
    </span>
  );
}

// ---- Popover de confirmação (exclusão segura) ----
export function ConfirmPopover({
  children,
  onConfirm,
  mensagem = 'Confirmar exclusão? Esta ação não pode ser desfeita.',
}: {
  children: (abrir: (e: React.MouseEvent) => void) => ReactNode;
  onConfirm: () => void;
  mensagem?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    if (aberto) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [aberto]);

  return (
    <div className="relative inline-block" ref={ref}>
      {children((e) => {
        e.stopPropagation();
        setAberto((v) => !v);
      })}
      <AnimatePresence>
        {aberto && (
          <motion.div
            className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-xs text-slate-600">{mensagem}</p>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost !py-1 !text-xs" onClick={() => setAberto(false)}>
                Cancelar
              </button>
              <button
                className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                onClick={() => {
                  setAberto(false);
                  onConfirm();
                }}
              >
                Excluir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
