export type TipoProcessamento = 'INTERNO' | 'EXTERNO';

export interface Etapa {
  id: number;
  nome: string;
  status: 'pendente' | 'andamento' | 'concluido';
}

export const ETAPAS_INTERNAS: Etapa[] = [
  { id: 0, nome: 'Receção', status: 'pendente' },
  { id: 1, nome: 'Triagem', status: 'pendente' },
  { id: 2, nome: 'Análise', status: 'pendente' },
  { id: 3, nome: 'Validação', status: 'pendente' },
  { id: 4, nome: 'Liberação', status: 'pendente' },
];

export const ETAPAS_EXTERNAS: Etapa[] = [
  { id: 0, nome: 'Receção', status: 'pendente' },
  { id: 1, nome: 'Envio (Logística)', status: 'pendente' },
  { id: 2, nome: 'Análise Externa', status: 'pendente' },
  { id: 3, nome: 'Retorno de Resultados', status: 'pendente' },
  { id: 4, nome: 'Validação', status: 'pendente' },
  { id: 5, nome: 'Liberação', status: 'pendente' },
];

export interface Teste {
  id: string;
  codigo: string;
  nome: string;
  amostra?: string;
  tipo: TipoProcessamento;
  metodo: string;
  prazo: string; // Prazo Total (ex: "2 dias")
  prazos_etapas?: Record<string, number>; // AGORA: Segundos (ex: { "0": 3600 })
  status: "ativo" | "inativo";
  created_at: string;
}

export interface Amostra {
  id: string;
  codigo_interno: string;
  paciente_nome: string;
  teste_id: string;
  data_entrada: string;
  data_inicio_etapa?: string; 
  etapa_atual: number;
  status: 'ativo' | 'concluido' | 'cancelado';
  testes?: Teste;
}

export interface Usuario {
  id: string;
  email: string;
  nome?: string;
  role?: 'admin' | 'usuario';
}