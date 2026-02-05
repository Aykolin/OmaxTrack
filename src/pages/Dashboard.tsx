import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, AlertTriangle, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Amostra, ETAPAS_INTERNAS, ETAPAS_EXTERNAS } from "@/types";
import { differenceInHours, parseISO, addHours, format } from "date-fns";
import { pt } from "date-fns/locale";

// --- MOCK DATA PARA SIMULAÇÃO ---
// Em produção, isto virá do Supabase
const AMOSTRAS_MOCK: Amostra[] = [
  {
    id: "1",
    codigoInterno: "AM-2024-001",
    paciente: "Ana Souza",
    testeSolicitado: "Sexagem Fetal",
    tipo: "INTERNO",
    dataEntrada: "2024-05-20T08:00:00",
    etapaAtual: 1, // "Em Processo de Extração" (Prazo: 3h)
    historico: [
      { etapaId: 0, dataInicio: "2024-05-20T08:00:00", usuario: "Recepcionista" },
      { etapaId: 1, dataInicio: "2024-05-20T14:00:00", usuario: "Técnico A" } 
      // Iniciou às 14h. Se agora forem 18h, já passaram 4h. Prazo é 3h -> ATRASADO
    ]
  },
  {
    id: "2",
    codigoInterno: "AM-2024-002",
    paciente: "Carlos Lima",
    testeSolicitado: "NIPT",
    tipo: "EXTERNO",
    dataEntrada: "2024-05-19T10:00:00",
    etapaAtual: 2, // "Em Trânsito" (Prazo: 0h/Variável)
    historico: [
      { etapaId: 0, dataInicio: "2024-05-19T10:00:00", usuario: "Recepcionista" },
      { etapaId: 1, dataInicio: "2024-05-19T12:00:00", usuario: "Logística" },
      { etapaId: 2, dataInicio: "2024-05-20T09:00:00", usuario: "Sistema" }
    ]
  },
  {
    id: "3",
    codigoInterno: "AM-2024-003",
    paciente: "Beatriz M.",
    testeSolicitado: "Paternidade",
    tipo: "INTERNO",
    dataEntrada: "2024-05-21T09:00:00",
    etapaAtual: 0, // "Recebido" (Prazo: 17h)
    historico: [
      { etapaId: 0, dataInicio: "2024-05-21T09:00:00", usuario: "Recepcionista" }
    ]
  }
];

export default function Dashboard() {
  const navigate = useNavigate();

  // --- LÓGICA DE CÁLCULO DE ATRASOS ---
  const { amostrasAtrasadas, estatisticas } = useMemo(() => {
    const agora = new Date("2024-05-20T18:00:00"); // Simulando uma data/hora atual fixa para teste visual
    // const agora = new Date(); // Em produção, usa a data real

    const atrasadas: { amostra: Amostra; atrasoHoras: number; etapaNome: string }[] = [];
    let totalEmAndamento = 0;
    let totalConcluidas = 0;

    AMOSTRAS_MOCK.forEach(amostra => {
      // 1. Identificar a etapa atual e o seu prazo
      const etapasDefinicao = amostra.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
      const etapaAtualDef = etapasDefinicao[amostra.etapaAtual];
      
      // Se já está na última etapa (Liberado), conta como concluída
      if (amostra.etapaAtual >= etapasDefinicao.length - 1) {
        totalConcluidas++;
        return;
      }
      
      totalEmAndamento++;

      // 2. Encontrar quando a etapa começou
      const historicoAtual = amostra.historico.find(h => h.etapaId === amostra.etapaAtual);
      // Se não tiver histórico (ex: cadastro manual direto), usa dataEntrada como fallback
      const dataInicioEtapa = historicoAtual ? parseISO(historicoAtual.dataInicio) : parseISO(amostra.dataEntrada);

      // 3. Calcular prazo limite
      const prazoHoras = etapaAtualDef.prazoHoras;
      
      // Se prazo for 0, é uma etapa sem limite fixo (ex: Em Trânsito), ignoramos atraso
      if (prazoHoras > 0) {
        const dataLimite = addHours(dataInicioEtapa, prazoHoras);
        
        // 4. Verificar se já passou
        if (agora > dataLimite) {
          const atraso = differenceInHours(agora, dataLimite);
          atrasadas.push({
            amostra,
            atrasoHoras: atraso,
            etapaNome: etapaAtualDef.nome
          });
        }
      }
    });

    return {
      amostrasAtrasadas: atrasadas,
      estatisticas: {
        total: AMOSTRAS_MOCK.length,
        emAndamento: totalEmAndamento,
        atrasadas: atrasadas.length,
        concluidas: totalConcluidas,
        taxaSucesso: totalEmAndamento > 0 
          ? Math.round(((totalEmAndamento - atrasadas.length) / totalEmAndamento) * 100) 
          : 100
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Operacional</h1>
          <p className="text-muted-foreground">
            Visão geral do fluxo de amostras e cumprimento de prazos (SLA)
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          <Clock className="h-4 w-4" />
          <span>Simulação: 20 Mai, 18:00</span>
        </div>
      </div>

      {/* --- CARTÕES DE KPI --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amostras Ativas</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.emAndamento}</div>
            <p className="text-xs text-muted-foreground">Em processamento no momento</p>
          </CardContent>
        </Card>

        <Card className={estatisticas.atrasadas > 0 ? "border-red-200 bg-red-50 dark:bg-red-900/10" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Atenção Necessária</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {estatisticas.atrasadas}
            </div>
            <p className="text-xs text-red-600/80">Amostras fora do prazo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Global</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.taxaSucesso}%</div>
            <p className="text-xs text-muted-foreground">Dentro do prazo estipulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos (Hoje)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.concluidas}</div>
            <p className="text-xs text-muted-foreground">Liberações nas últimas 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* --- ÁREA DE ALERTAS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Lista de Atrasos - Ocupa 4 colunas */}
        <Card className="col-span-4 border-l-4 border-l-red-500 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Notificações de Atraso
            </CardTitle>
            <CardDescription>
              Amostras que excederam o tempo limite da etapa atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {amostrasAtrasadas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2 opacity-20" />
                <p>Nenhum atraso detetado. Bom trabalho!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {amostrasAtrasadas.map(({ amostra, atrasoHoras, etapaNome }) => (
                  <div key={amostra.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-lg shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-600">{amostra.codigoInterno}</span>
                        <Badge variant="outline" className="text-xs">{amostra.testeSolicitado}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Parada em: <span className="font-medium text-foreground">{etapaNome}</span>
                      </p>
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Atrasado por {atrasoHoras} horas
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate("/processamento")}>
                      Ver <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo de Atividades Recentes - Ocupa 3 colunas */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Últimas Movimentações</CardTitle>
            <CardDescription>
              Histórico recente do laboratório
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                { time: "17:45", desc: "AM-2024-003 cadastrada", user: "Recepção" },
                { time: "16:30", desc: "Laudo liberado para AM-2023-998", user: "Dr. Silva" },
                { time: "14:00", desc: "AM-2024-001 iniciou Extração", user: "Técnico A" },
              ].map((item, i) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{item.desc}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.time} • {item.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}