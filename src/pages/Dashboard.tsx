import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, AlertTriangle, CheckCircle2, ArrowRight, Activity, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { differenceInSeconds, parseISO, isSameDay } from "date-fns";
import { parsePrazoToSeconds } from "@/lib/utils";
import { ETAPAS_INTERNAS, ETAPAS_EXTERNAS } from "@/types";
// Importar o novo componente de Alarme
import { AlertaAtraso } from "@/components/AlertaAtraso";

export default function Dashboard() {
  const navigate = useNavigate();
  const [amostras, setAmostras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const { data, error } = await supabase
        .from('amostras')
        .select(`*, testes ( nome, prazo )`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAmostras(data || []);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  // Cálculos de KPI
  const stats = useMemo(() => {
    const hoje = new Date();
    let totalAtivas = 0;
    let totalConcluidasHoje = 0;
    let totalAtrasadas = 0;
    const listaAtrasadas: any[] = [];

    amostras.forEach(a => {
      const etapas = a.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
      const isConcluido = a.etapa_atual >= etapas.length - 1;

      if (isConcluido) {
        if (isSameDay(parseISO(a.created_at), hoje)) {
           totalConcluidasHoje++; 
        }
      } else {
        totalAtivas++;
        
        // Lógica de Atraso
        const prazoSegundos = parsePrazoToSeconds(a.testes?.prazo || "");
        
        if (prazoSegundos > 0) {
          const dataEntrada = parseISO(a.data_entrada);
          const segundosPassados = differenceInSeconds(hoje, dataEntrada);
          
          if (segundosPassados > prazoSegundos) {
            totalAtrasadas++;
            listaAtrasadas.push({
              ...a,
              segundosAtraso: segundosPassados - prazoSegundos,
              prazoTotal: prazoSegundos,
              etapaNome: etapas[a.etapa_atual]?.nome || "Desconhecido"
            });
          }
        }
      }
    });

    return {
      totalAtivas,
      totalConcluidasHoje,
      totalAtrasadas,
      listaAtrasadas: listaAtrasadas.sort((a, b) => b.segundosAtraso - a.segundosAtraso)
    };
  }, [amostras]);

  const formatarAtraso = (segundos: number) => {
    const d = Math.floor(segundos / 86400);
    const h = Math.floor((segundos % 86400) / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    
    if (d > 0) return `${d}d ${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* --- COMPONENTE DE ALARME (Invisível até ativar) --- */}
      <AlertaAtraso atrasados={stats.listaAtrasadas} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Operacional</h1>
          <p className="text-muted-foreground">
            Visão geral em tempo real do laboratório.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border">
          <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          <span>Monitoramento Ativo</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Processamento</CardTitle>
            <FlaskConical className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAtivas}</div>
            <p className="text-xs text-muted-foreground">Amostras na esteira</p>
          </CardContent>
        </Card>

        <Card className={stats.totalAtrasadas > 0 ? "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md shadow-red-100 dark:shadow-red-900/10" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${stats.totalAtrasadas > 0 ? "text-red-700 font-bold" : ""}`}>
              Fora do Prazo (SLA)
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.totalAtrasadas > 0 ? "text-red-600 animate-pulse" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalAtrasadas > 0 ? "text-red-700" : ""}`}>
              {stats.totalAtrasadas}
            </div>
            <p className={`text-xs ${stats.totalAtrasadas > 0 ? "text-red-600/80" : "text-muted-foreground"}`}>
              Excederam o tempo limite
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos (Hoje)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConcluidasHoje}</div>
            <p className="text-xs text-muted-foreground">Finalizados nas últimas 24h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-red-100 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              Prioridade Alta
            </CardTitle>
            <CardDescription>
              Amostras que já deveriam ter sido entregues.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.listaAtrasadas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2 opacity-50" />
                <p>Nenhum atraso crítico! Tudo dentro do prazo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.listaAtrasadas.slice(0, 5).map((amostra) => (
                  <div key={amostra.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-red-200 dark:border-red-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-700 dark:text-red-400">{amostra.codigo_interno}</span>
                        <Badge variant="outline" className="text-[10px]">{amostra.testes?.nome}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Parada em: <strong>{amostra.etapaNome}</strong></span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-1 animate-pulse">
                        Atraso: {formatarAtraso(amostra.segundosAtraso)}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-6 text-xs w-full" onClick={() => navigate("/processamento")}>
                        Resolver <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-slate-50 dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Saúde do Laboratório</CardTitle>
            <CardDescription>Resumo de performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taxa de Pontualidade</span>
                <span className="font-bold">
                  {stats.totalAtivas > 0 
                    ? Math.round(((stats.totalAtivas - stats.totalAtrasadas) / stats.totalAtivas) * 100) 
                    : 100}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${stats.totalAtrasadas > 0 ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${stats.totalAtivas > 0 ? ((stats.totalAtivas - stats.totalAtrasadas) / stats.totalAtivas) * 100 : 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
               <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total em Andamento</span>
                  <span className="font-mono font-bold">{stats.totalAtivas}</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Testes Concluídos (Hoje)</span>
                  <span className="font-mono font-bold text-green-600">+{stats.totalConcluidasHoje}</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}