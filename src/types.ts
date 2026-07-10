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

export type GastoCategoria =
  | 'ITBI'
  | 'Registro / Cartório'
  | 'Reforma'
  | 'Condomínio'
  | 'IPTU'
  | 'Desocupação'
  | 'Comissão de Venda'
  | 'Leiloeiro'
  | 'Outros';

export const GASTO_CATEGORIAS: GastoCategoria[] = [
  'ITBI',
  'Registro / Cartório',
  'Reforma',
  'Condomínio',
  'IPTU',
  'Desocupação',
  'Comissão de Venda',
  'Leiloeiro',
  'Outros',
];

// Categorias dedutíveis do Ganho de Capital (custo de aquisição/benfeitoria).
export const CATEGORIAS_DEDUTIVEIS_GCAP: GastoCategoria[] = [
  'ITBI',
  'Registro / Cartório',
  'Reforma',
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
  fotoUrl?: string;
  status: ImovelStatus;
  etapaDesocupacao: EtapaDesocupacao;
  valorArrematacao: number;
  valorAvaliacao?: number;
  valorVenda?: number;
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
