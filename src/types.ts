// Definições globais de interfaces de dados do sistema.

export type ImovelStatus =
  | 'Arrematado'
  | 'Desocupação'
  | 'Reforma'
  | 'Estoque'
  | 'À Venda'
  | 'Vendido';

export const IMOVEL_STATUS: ImovelStatus[] = [
  'Arrematado',
  'Desocupação',
  'Reforma',
  'Estoque',
  'À Venda',
  'Vendido',
];

export type EtapaDesocupacao =
  | 'Não iniciada'
  | 'Notificação Extrajudicial'
  | 'Ação de Imissão na Posse'
  | 'Liminar / Mandado'
  | 'Cumprimento de Mandado'
  | 'Desocupado';

export const ETAPAS_DESOCUPACAO: EtapaDesocupacao[] = [
  'Não iniciada',
  'Notificação Extrajudicial',
  'Ação de Imissão na Posse',
  'Liminar / Mandado',
  'Cumprimento de Mandado',
  'Desocupado',
];

// Categorias de despesa — espelham o modelo da planilha "Controle de Leilões".
export type GastoCategoria =
  // Custos de aquisição
  | 'Dívida de condomínio'
  | 'Escritura pública'
  | 'Ônus'
  | 'Obra'
  | 'Eletricista'
  | 'Registro'
  | 'IPTU'
  | 'Funesbom'
  | 'ITBI'
  | 'Chave'
  | 'Engenharia'
  | 'Leiloeiro'
  | 'Reforma'
  | 'Condomínio'
  | 'Desocupação'
  // Custos de venda
  | 'Certidões (venda)'
  | 'Escritura (venda)'
  | 'Registro (venda)'
  | 'Comissão de venda'
  | 'Custos de venda'
  | 'Outros';

export type FaseGasto = 'aquisicao' | 'venda';

// Custos que compõem o TOTAL INVESTIDO (fase de aquisição).
export const GASTOS_AQUISICAO: GastoCategoria[] = [
  'Dívida de condomínio',
  'Escritura pública',
  'Ônus',
  'Obra',
  'Eletricista',
  'Registro',
  'IPTU',
  'Funesbom',
  'ITBI',
  'Chave',
  'Engenharia',
  'Leiloeiro',
  'Reforma',
  'Condomínio',
  'Desocupação',
  'Outros',
];

// Custos abatidos do valor de venda (fase de venda).
export const GASTOS_VENDA: GastoCategoria[] = [
  'Certidões (venda)',
  'Escritura (venda)',
  'Registro (venda)',
  'Comissão de venda',
  'Custos de venda',
];

export const GASTO_CATEGORIAS: GastoCategoria[] = [...GASTOS_AQUISICAO, ...GASTOS_VENDA];

// Categorias dedutíveis do Ganho de Capital (custo de aquisição/benfeitoria).
export const CATEGORIAS_DEDUTIVEIS_GCAP: GastoCategoria[] = [
  'ITBI',
  'Registro',
  'Escritura pública',
  'Obra',
  'Engenharia',
  'Eletricista',
  'Leiloeiro',
];

export interface Gasto {
  id: string;
  imovelId: string;
  categoria: GastoCategoria;
  descricao: string;
  valor: number;
  data: string; // ISO (yyyy-mm-dd)
  responsavel?: string;
  dedutivelGCAP?: boolean; // sobrescreve o padrão da categoria
}

export interface Socio {
  id: string;
  nome: string;
  percentual: number; // participação societária (%)
  aporte?: number; // capital aportado (R$)
}

export interface Imovel {
  id: string;
  titulo: string;
  codigoCaixa?: string; // identificador do ativo (fonte mono)
  matricula?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  comprador?: string; // comprador na revenda
  fotoUrl?: string;
  status: ImovelStatus;
  etapaDesocupacao: EtapaDesocupacao;
  valorArrematacao: number;
  valorAvaliacao?: number;
  valorVenda?: number;
  aliquotaIR?: number; // % de IR sobre o lucro (premissa; padrão 15%)
  dataArrematacao?: string;
  dataVenda?: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  socios: Socio[];
  // Isenção de GCAP por reinvestimento residencial (art. 39, Lei 11.196/2005)
  reinvestimentoResidencial?: boolean;
  imovelResidencial?: boolean;
  observacoes?: string;
}

export type Aba = 'dashboard' | 'portfolio' | 'detalhe' | 'notificacoes';
