// Dados de exemplo carregados no primeiro acesso (modo local/demonstração).
import type { Gasto, Imovel } from '../types';
import { novoId, store } from './storage';

function diasAtras(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
}

export async function semearSeVazio(): Promise<void> {
  const { imoveis } = store.snapshot();
  if (imoveis.length > 0) return;

  const im1: Imovel = {
    id: novoId('imv'),
    titulo: 'Apartamento 302 — Ed. Solar das Palmeiras',
    codigoCaixa: '8444555123456',
    matricula: '45.678',
    endereco: 'Rua das Acácias, 120, Bloco B',
    cidade: 'Campinas',
    uf: 'SP',
    fotoUrl:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=60',
    status: 'Estoque',
    etapaDesocupacao: 'Desocupado',
    valorArrematacao: 210000,
    valorAvaliacao: 320000,
    dataArrematacao: diasAtras(120).slice(0, 10),
    createdAt: diasAtras(95),
    updatedAt: diasAtras(10),
    imovelResidencial: true,
    socios: [
      { id: novoId('soc'), nome: 'Investidor Principal', percentual: 70, aporte: 150000 },
      { id: novoId('soc'), nome: 'Sócio Minoritário', percentual: 30, aporte: 60000 },
    ],
  };

  const im2: Imovel = {
    id: novoId('imv'),
    titulo: 'Casa Térrea — Jardim Bela Vista',
    codigoCaixa: '8444555987654',
    matricula: '12.334',
    endereco: 'Av. Central, 998',
    cidade: 'Ribeirão Preto',
    uf: 'SP',
    fotoUrl:
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=60',
    status: 'Desocupação',
    etapaDesocupacao: 'Liminar / Mandado',
    valorArrematacao: 165000,
    valorAvaliacao: 250000,
    dataArrematacao: diasAtras(60).slice(0, 10),
    createdAt: diasAtras(58),
    updatedAt: diasAtras(3),
    imovelResidencial: true,
    socios: [{ id: novoId('soc'), nome: 'Investidor Principal', percentual: 100 }],
  };

  const gastos: Gasto[] = [
    {
      id: novoId('gst'),
      imovelId: im1.id,
      categoria: 'ITBI',
      descricao: 'ITBI municipal',
      valor: 6300,
      data: diasAtras(90).slice(0, 10),
      responsavel: 'Investidor Principal',
    },
    {
      id: novoId('gst'),
      imovelId: im1.id,
      categoria: 'Registro / Cartório',
      descricao: 'Registro da matrícula',
      valor: 4200,
      data: diasAtras(88).slice(0, 10),
    },
    {
      id: novoId('gst'),
      imovelId: im1.id,
      categoria: 'Reforma',
      descricao: 'Pintura e reparos gerais',
      valor: 18500,
      data: diasAtras(40).slice(0, 10),
    },
    {
      id: novoId('gst'),
      imovelId: im2.id,
      categoria: 'Desocupação',
      descricao: 'Custas processuais e advogado',
      valor: 9800,
      data: diasAtras(30).slice(0, 10),
    },
  ];

  await store.salvarImovel(im1);
  await store.salvarImovel(im2);
  for (const g of gastos) await store.salvarGasto(g);
}
