// src/types/index.ts

export type TipoProcessamento = 'INTERNO' | 'EXTERNO';

export type StatusEtapa = 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';

export interface EtapaDefinicao {
  id: number;
  nome: string;
  prazoHoras: number;
}

// Definição das etapas baseadas no documento [cite: 11-27]
export const ETAPAS_INTERNAS: EtapaDefinicao[] = [
  { id: 1, nome: 'Recebido', prazoHoras: 17 },
  { id: 2, nome: 'Em Processo de Extração', prazoHoras: 3 },
  { id: 3, nome: 'Aguardando Análise', prazoHoras: 1 },
  { id: 4, nome: 'Em Análise', prazoHoras: 2 },
  { id: 5, nome: 'Aguardando Laudo', prazoHoras: 1 },
  { id: 6, nome: 'Aguardando Liberação RT', prazoHoras: 1 },
  { id: 7, nome: 'Liberado', prazoHoras: 0 },
];

export const ETAPAS_EXTERNAS: EtapaDefinicao[] = [
  { id: 1, nome: 'Aguardando Logística', prazoHoras: 48 },
  { id: 2, nome: 'Em Trânsito', prazoHoras: 0 }, // Depende do rastreio
  { id: 3, nome: 'Em Análise (Parceiro)', prazoHoras: 840 }, // 35 dias [cite: 16]
  { id: 4, nome: 'Aguardando Laudo Omax', prazoHoras: 48 },
  { id: 5, nome: 'Aguardando Liberação', prazoHoras: 24 },
  { id: 6, nome: 'Liberado', prazoHoras: 0 },
];

export interface Amostra {
  id: string;
  codigoInterno: string; // [cite: 4]
  paciente: string;
  testeSolicitado: string;
  tipo: TipoProcessamento; // [cite: 9]
  dataEntrada: string;
  etapaAtual: number; // Índice da etapa atual
  historico: {
    etapaId: number;
    dataInicio: string;
    dataFim?: string;
    usuario: string;
  }[];
}