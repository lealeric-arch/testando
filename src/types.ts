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

// Identifica quem pagou uma despesa: o próprio investidor ('Voce') ou o id de um sócio.
export type PagoPor = 'Voce' | string;

export interface Gasto {
  id: string;
  imovelId: string;
  categoria: GastoCategoria;
  descricao: string;
  valor: number;
  data: string; // ISO (yyyy-mm-dd)
  responsavel?: string;
  pagoPor?: PagoPor; // quem desembolsou (alimenta a partilha)
  dedutivelGCAP?: boolean; // sobrescreve o padrão da categoria
}

export type PapelSocio = 'Investidor' | 'Operacional' | 'Visualizador';

export const PAPEIS_SOCIO: PapelSocio[] = ['Investidor', 'Operacional', 'Visualizador'];

export interface Socio {
  id: string;
  nome: string;
  percentual: number; // participação societária (%) — mantido p/ compatibilidade
  participacaoImovel?: number; // % do capital do imóvel (arrematação)
  participacaoLucro?: number; // % do lucro
  papel?: PapelSocio;
  aporte?: number; // capital aportado (R$)
}

// Modalidade de aquisição do imóvel (Caixa).
export type ModalidadeAquisicao =
  | 'Leilão SFI'
  | 'Venda Direta Online'
  | 'Licitação Aberta'
  | 'Concorrência Pública'
  | 'Venda Online'
  | 'Outra';

export const MODALIDADES: ModalidadeAquisicao[] = [
  'Leilão SFI',
  'Venda Direta Online',
  'Licitação Aberta',
  'Concorrência Pública',
  'Venda Online',
  'Outra',
];

export interface Imovel {
  id: string;
  titulo: string;
  codigoCaixa?: string; // identificador do ativo (fonte mono)
  matricula?: string;
  modalidade?: ModalidadeAquisicao;
  endereco?: string;
  cidade?: string;
  uf?: string;
  comprador?: string; // comprador na revenda
  fotoUrl?: string; // foto principal (= fotos[0])
  fotos?: string[]; // galeria completa
  status: ImovelStatus;
  etapaDesocupacao: EtapaDesocupacao;
  valorArrematacao: number;
  valorAvaliacao?: number;
  valorVenda?: number;
  aliquotaIR?: number; // % de IR sobre o lucro (premissa; padrão 15%)
  comissaoCorretorPct?: number; // % de comissão do corretor na venda (padrão 5%)
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

// Documento anexado a um imóvel (armazenado localmente como data URL base64).
export type DocumentoCategoria =
  | 'Matrícula'
  | 'Edital'
  | 'Auto de arrematação'
  | 'ITBI'
  | 'Escritura'
  | 'Contrato'
  | 'Foto'
  | 'Outros';

export const DOC_CATEGORIAS: DocumentoCategoria[] = [
  'Matrícula',
  'Edital',
  'Auto de arrematação',
  'ITBI',
  'Escritura',
  'Contrato',
  'Foto',
  'Outros',
];

export interface Documento {
  id: string;
  imovelId: string;
  nome: string; // nome do arquivo
  tipo: string; // mime type
  tamanho: number; // bytes
  categoria: DocumentoCategoria;
  dataUrl: string; // conteúdo em base64 (data URL)
  createdAt: string;
}

// Simulação de viabilidade pré-lance (não persiste no imóvel).
export interface ViabilidadeSimulacao {
  titulo: string;
  endereco?: string;
  valorMercado: number;
  margemDesejadaPct: number;
  custoReformaEst: number;
  outrosCustosEst: number;
}

export type Aba = 'dashboard' | 'portfolio' | 'detalhe' | 'viabilidade' | 'notificacoes';
