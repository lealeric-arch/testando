// Modal para gerar e copiar o link de compartilhamento (somente leitura) de um imóvel.
import { useMemo, useState } from 'react';
import type { Gasto, Imovel } from '../types';
import { Modal } from './ui';
import { copiarParaAreaTransferencia, gerarLinkCompartilhamento } from '../utils/share';

export function CompartilharModal({
  aberto,
  onClose,
  imovel,
  gastos,
}: {
  aberto: boolean;
  onClose: () => void;
  imovel: Imovel;
  gastos: Gasto[];
}) {
  const [copiado, setCopiado] = useState(false);

  // Regenera o link a cada abertura (reflete o estado atual do imóvel).
  const link = useMemo(
    () => (aberto ? gerarLinkCompartilhamento(imovel, gastos) : ''),
    [aberto, imovel, gastos],
  );

  const muitoGrande = link.length > 12000; // navegadores/apps podem truncar links enormes

  async function copiar() {
    const ok = await copiarParaAreaTransferencia(link);
    setCopiado(ok);
    if (ok) setTimeout(() => setCopiado(false), 2500);
    else alert('Não foi possível copiar automaticamente. Selecione o link e copie manualmente.');
  }

  const mensagemWhatsApp = `Resumo do imóvel "${imovel.titulo}" (somente leitura):\n${link}`;
  const linkWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagemWhatsApp)}`;

  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Compartilhar com o sócio" largura="max-w-xl">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Este link contém <strong>apenas os dados deste imóvel</strong> e abre uma visualização
          <strong> somente leitura</strong> (resultado, partilha e gastos). O sócio não precisa instalar
          nada nem fazer login — basta abrir na versão web.
        </p>

        <div>
          <label className="label">Link de compartilhamento</label>
          <textarea
            className="input mono h-24 w-full resize-none text-xs"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={copiar}>
            {copiado ? '✓ Copiado!' : '📋 Copiar link'}
          </button>
          <a className="btn-ghost" href={linkWhatsApp} target="_blank" rel="noopener noreferrer">
            💬 Enviar por WhatsApp
          </a>
        </div>

        {muitoGrande && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Este imóvel tem muitos gastos e o link ficou grande — alguns aplicativos podem cortá-lo.
            Se o sócio tiver problemas para abrir, prefira enviar o link por e-mail (menos limitação de tamanho).
          </div>
        )}

        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">Como funciona (sobre o "token"):</p>
          <p className="mt-1">
            O app guarda os dados só no seu aparelho, sem nuvem. Por isso não há um servidor para emitir
            um token e sincronizar em tempo real. O próprio link já é o token: os dados viajam dentro dele
            (na parte após o <span className="mono">#</span>, que não é enviada a nenhum servidor) e mostram
            um <strong>retrato do momento</strong> em que você gerou. Para atualizar o que o sócio vê, gere e
            envie um novo link.
          </p>
        </div>
      </div>
    </Modal>
  );
}
