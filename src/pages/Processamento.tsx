import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Activity, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ETAPAS_INTERNAS, ETAPAS_EXTERNAS, Amostra } from "@/types";
import { differenceInSeconds, parseISO, addSeconds } from "date-fns";
import { parsePrazoToSeconds } from "@/lib/utils";

const TimerDisplay = ({ label, segundosRestantes, isCritico }: { label: string, segundosRestantes: number, isCritico: boolean }) => {
    const isAtrasado = segundosRestantes < 0;
    const absSegundos = Math.abs(segundosRestantes);
    
    const d = Math.floor(absSegundos / 86400);
    const h = Math.floor((absSegundos % 86400) / 3600);
    const m = Math.floor((absSegundos % 3600) / 60);
    const s = absSegundos % 60;
    
    // Formatação inteligente: Mostra dias se houver, senão HH:MM:SS
    let timeStr = "";
    if (d > 0) {
        timeStr = `${d}d ${h}h ${m}m`;
    } else {
        timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    let containerClass = "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
    
    if (isAtrasado) {
        containerClass = "bg-red-50 border-red-200 text-red-700 animate-pulse dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
    } else if (isCritico) {
        containerClass = "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400";
    }

    return (
        <div className={`flex flex-col items-center justify-center px-2 py-1 rounded border ${containerClass} min-w-[85px]`}>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 flex items-center gap-1">
                {isAtrasado && <AlertTriangle className="h-3 w-3" />}
                {label}
            </span>
            <span className="font-mono text-sm font-bold leading-none mt-0.5">
                {isAtrasado ? "-" : ""}{timeStr}
            </span>
        </div>
    );
};

export default function Processamento() {
  const [amostras, setAmostras] = useState<Amostra[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [timers, setTimers] = useState<Record<string, { total: number, etapa: number | null }>>({});

  useEffect(() => {
    fetchAmostras();
    const intervalData = setInterval(fetchAmostras, 10000);
    return () => clearInterval(intervalData);
  }, []);

  useEffect(() => {
    const intervalTimer = setInterval(() => {
        const now = new Date();
        const newTimers: any = {};

        amostras.forEach(amostra => {
            // 1. Cálculo Total (String -> Segundos)
            const prazoTotalSegundos = parsePrazoToSeconds(amostra.testes?.prazo || "");
            const dataEntrada = parseISO(amostra.data_entrada);
            const dataLimiteTotal = addSeconds(dataEntrada, prazoTotalSegundos);
            const diffTotal = differenceInSeconds(dataLimiteTotal, now);

            // 2. Cálculo Etapa (Já está em Segundos no Banco)
            let diffEtapa = null;
            const prazosEtapas = amostra.testes?.prazos_etapas as Record<string, number> | undefined;
            
            if (prazosEtapas && prazosEtapas[amostra.etapa_atual]) {
                const segundosEtapa = prazosEtapas[amostra.etapa_atual]; // LÊ SEGUNDOS DIRETAMENTE
                
                const dataInicioEtapa = amostra.data_inicio_etapa ? parseISO(amostra.data_inicio_etapa) : dataEntrada;
                
                // NÃO MULTIPLICA POR 60
                const dataLimiteEtapa = addSeconds(dataInicioEtapa, segundosEtapa);
                diffEtapa = differenceInSeconds(dataLimiteEtapa, now);
            }

            newTimers[amostra.id] = { total: diffTotal, etapa: diffEtapa };
        });
        setTimers(newTimers);
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [amostras]);

  async function fetchAmostras() {
    try {
      const { data, error } = await supabase
        .from('amostras')
        .select(`*, testes ( * )`)
        .neq('status', 'concluido')
        .order('data_inicio_etapa', { ascending: true });

      if (error) throw error;
      setAmostras(data || []);
    } catch (error) {
      console.error("Erro ao buscar amostras:", error);
    } finally {
      setLoading(false);
    }
  }

  const avancarEtapa = async (amostra: Amostra) => {
    const etapas = amostra.testes?.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
    const proximaEtapa = amostra.etapa_atual + 1;

    try {
        if (proximaEtapa >= etapas.length) {
            const { error } = await supabase
                .from('amostras')
                .update({ status: 'concluido', etapa_atual: proximaEtapa })
                .eq('id', amostra.id);
            
            if (error) throw error;
            toast.success(`Amostra ${amostra.codigo_interno} finalizada!`);
        } else {
            const { error } = await supabase
                .from('amostras')
                .update({ 
                    etapa_atual: proximaEtapa,
                    data_inicio_etapa: new Date().toISOString() 
                })
                .eq('id', amostra.id);

            if (error) throw error;
            toast.success(`Avançado para: ${etapas[proximaEtapa].nome}`);
        }
        fetchAmostras();
    } catch (error: any) {
        toast.error("Erro ao processar: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Esteira de Processamento</h1>
        <div className="flex items-center gap-2">
            <Badge variant="outline" className="animate-pulse text-green-600 border-green-600 bg-green-50 dark:bg-green-900/20">
                <Activity className="h-3 w-3 mr-1" /> Tempo Real
            </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {amostras.map((amostra) => {
          const timer = timers[amostra.id] || { total: 0, etapa: null };
          
          const etapas = amostra.testes?.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
          const etapaAtual = etapas[amostra.etapa_atual];
          const progresso = ((amostra.etapa_atual) / etapas.length) * 100;

          const totalCritico = timer.total < 3600; 
          const etapaCritico = timer.etapa !== null && timer.etapa < 300; 

          return (
            <Card key={amostra.id} className="overflow-hidden border-l-4 border-l-blue-500 hover:shadow-lg transition-all dark:border-l-blue-400">
              <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {amostra.codigo_interno}
                    </CardTitle>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-1">
                        {amostra.testes?.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {amostra.paciente_nome}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                      <TimerDisplay 
                        label="Total" 
                        segundosRestantes={timer.total} 
                        isCritico={totalCritico} 
                      />
                      {timer.etapa !== null && (
                          <TimerDisplay 
                            label="Etapa" 
                            segundosRestantes={timer.etapa} 
                            isCritico={etapaCritico} 
                          />
                      )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-5">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {etapaAtual?.nome || "Concluído"}
                        </span>
                        <span>{Math.round(progresso)}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                        <div 
                            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                            style={{ width: `${progresso}%` }} 
                        />
                    </div>
                </div>

                <Button 
                    className="w-full font-bold h-10 shadow-sm" 
                    onClick={() => avancarEtapa(amostra)}
                    disabled={loading}
                >
                    {amostra.etapa_atual >= etapas.length - 1 ? (
                        <><CheckCircle2 className="mr-2 h-4 w-4" /> Concluir Processo</>
                    ) : (
                        <><ArrowRight className="mr-2 h-4 w-4" /> Avançar Etapa</>
                    )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
        
        {amostras.length === 0 && !loading && (
             <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground opacity-60 border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                <CheckCircle2 className="h-16 w-16 mb-4 text-slate-300 dark:text-slate-700" />
                <p className="text-lg font-medium">Nenhuma amostra na esteira.</p>
                <p className="text-sm">Novas amostras cadastradas aparecerão aqui.</p>
             </div>
        )}
      </div>
    </div>
  );
}