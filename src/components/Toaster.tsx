// Exibe os toasts empilhados no canto inferior, com auto-dismiss.
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { onToast, type ToastMsg } from '../utils/toast';

const CORES: Record<string, string> = {
  info: 'bg-slate-800 text-white',
  sucesso: 'bg-emerald-600 text-white',
  erro: 'bg-red-600 text-white',
};

export function Toaster() {
  const [itens, setItens] = useState<ToastMsg[]>([]);

  useEffect(() => {
    return onToast((t) => {
      setItens((prev) => [...prev, t]);
      setTimeout(() => setItens((prev) => prev.filter((x) => x.id !== t.id)), 3200);
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {itens.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            className={`pointer-events-auto max-w-sm rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${CORES[t.tipo] || CORES.info}`}
          >
            {t.texto}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
