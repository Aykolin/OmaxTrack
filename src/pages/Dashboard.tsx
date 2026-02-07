import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, AlertTriangle, CheckCircle2, ArrowRight, Clock, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ETAPAS_INTERNAS, ETAPAS_EXTERNAS } from "@/types";
import { differenceInHours, parseISO, isSameDay } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
  const [amostras, setAmostras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh para manter o dashboard vivo (opcional)
    const interval = setInterval(fetchDashboardData, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const { data, error } = await supabase
        .from('amostras')
        .select(`*, testes ( nome )`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAmostras(data || []);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const hoje = new Date();
    let totalAtivas = 0;
    let totalConcluidasHoje = 0;
    let totalAtrasadas = 0;
    const listaAtrasadas: any[] = [];

    amostras.forEach(a => {
      const etapas = a.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
      const totalEtapas = etapas.length;
      // Garante que o índice existe
      const etapaIndex = Math.min(a.etapa_atual, totalEtapas - 1);
      const etapaAtualInfo = etapas[etapaIndex];

      const isConcluido = a.etapa_atual >= totalEtapas - 1;
      
      if (isConcluido) {
        // Verifica se foi criado hoje (uma simplificação, idealmente usaria data de conclusão)
        if (isSameDay(parseISO(a.created_at), hoje)) {
           totalConcluidasHoje++; 
        }
      } else {
        totalAtivas++;
        
        // Lógica de Atraso: Se a amostra está no sistema há mais horas do que o prazo desta etapa permite
        // (Nota: Esta é uma lógica simplificada para MVP. A lógica real usaria o histórico de movimentação)
        if (etapaAtualInfo.prazoHoras > 0) {
            const horasCorridas = differenceInHours(hoje, parseISO(a.data_entrada));
            
            if (horasCorridas > etapaAtualInfo.prazoHoras) {
                totalAtrasadas++;
                listaAtrasadas.push({ 
                  ...a, 
                  horasAtraso: horasCorridas - etapaAtualInfo.prazoHoras, 
                  etapaNome: etapaAtualInfo.nome,
                  testeNome: a.testes?.nome 
                });
            }
        }
      }
    });

    return {
      totalAtivas,
      totalConcluidasHoje,
      totalAtrasadas,
      listaAtrasadas: listaAtrasadas.slice(0, 5) // Mostrar apenas top 5
    };
  }, [amostras]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Operacional</h1>
          <p className="text-muted-foreground">
            Visão geral em tempo real do laboratório.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          <Activity className="h-4 w-4 text-green-500" />
          <span>Sistema Online</span>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
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

        <Card className={stats.totalAtrasadas > 0 ? "border-red-200 bg-red-50 dark:bg-red-900/10" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Atenção Necessária</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalAtrasadas}</div>
            <p className="text-xs text-red-600/80">Amostras fora do prazo</p>
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

      {/* --- ALERTAS E DETALHES --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Prioridade Alta (Atrasos)
            </CardTitle>
            <CardDescription>
              Amostras que excederam o tempo estimado da etapa atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.listaAtrasadas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2 opacity-20" />
                <p>Nenhum atraso crítico no momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.listaAtrasadas.map((amostra) => (
                  <div key={amostra.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-lg shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-600">{amostra.codigo_interno}</span>
                        <Badge variant="outline" className="text-xs">{amostra.testeNome}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Parada em: <span className="font-medium text-foreground">{amostra.etapaNome}</span>
                      </p>
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        +{amostra.horasAtraso} horas do esperado
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate("/processamento")}>
                      Resolver <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Informativo */}
        <Card className="col-span-3 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Status do Laboratório</CardTitle>
            <CardDescription>Resumo da operação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-primary/10">
              <span className="text-sm">Capacidade Operacional</span>
              <span className="font-bold text-primary">Normal</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2 border-primary/10">
              <span className="text-sm">Total Cadastrado</span>
              <span className="font-bold">{amostras.length}</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-md text-sm text-muted-foreground">
              <p>💡 <strong>Dica:</strong> Use a aba "Processamento" para mover as amostras. Ao finalizar uma amostra (última etapa), ela sai da fila e conta como concluída.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}