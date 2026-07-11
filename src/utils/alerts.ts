// Detecção de cenários operacionais críticos exibidos no Dashboard.
import type { Imovel } from '../types';
import { diasEntre } from './gcap';

export type AlertaTipo = 'estoque' | 'liminar';
export type AlertaSeveridade = 'alta' | 'media';

export interface Alerta {
  id: string; // chave única (usada também para dedupe de notificação)
  tipo: AlertaTipo;
  severidade: AlertaSeveridade;
  imovelId: string;
  titulo: string;
  descricao: string;
}

export const DIAS_ESTOQUE_PROLONGADO = 30;

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Gera os alertas críticos a partir da lista de imóveis.
export function gerarAlertas(imoveis: Imovel[]): Alerta[] {
  const alertas: Alerta[] = [];
  const hoje = hojeISO();

  for (const im of imoveis) {
    // Estoque prolongado: status "Estoque" há mais de 30 dias desde a criação.
    if (im.status === 'Estoque') {
      const dias = diasEntre(im.createdAt?.slice(0, 10), hoje);
      if (dias > DIAS_ESTOQUE_PROLONGADO) {
        alertas.push({
          id: `estoque:${im.id}`,
          tipo: 'estoque',
          severidade: 'media',
          imovelId: im.id,
          titulo: 'Estoque prolongado',
          descricao: `${im.titulo} está em estoque há ${dias} dias. Avalie estratégia de venda.`,
        });
      }
    }

    // Liminar crítica: etapa de desocupação em "Liminar / Mandado".
    if (im.etapaDesocupacao === 'Liminar / Mandado') {
      alertas.push({
        id: `liminar:${im.id}`,
        tipo: 'liminar',
        severidade: 'alta',
        imovelId: im.id,
        titulo: 'Liminar / Mandado ativo',
        descricao: `${im.titulo} está na etapa "Liminar / Mandado". Acompanhe o cumprimento judicial.`,
      });
    }
  }

  // Alertas de alta severidade primeiro.
  return alertas.sort((a, b) => (a.severidade === b.severidade ? 0 : a.severidade === 'alta' ? -1 : 1));
}
