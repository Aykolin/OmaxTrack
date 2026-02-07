import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown,
  RotateCcw,
  FastForward,
  Clock,
  Timer as TimerIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Amostra, ETAPAS_INTERNAS, ETAPAS_EXTERNAS, TipoProcessamento } from "@/types";
import { differenceInSeconds, parseISO } from "date-fns";

// --- COMPONENTE DE CRONÓMETRO ---
function Cronometro({ dataInicio, prazoHoras }: { dataInicio: string, prazoHoras: number }) {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const start = parseISO(dataInicio);
    
    // Função de atualização
    const tick = () => setSegundos(differenceInSeconds(new Date(), start));
    
    tick(); // Primeira execução imediata
    const interval = setInterval(tick, 1000); // Atualiza a cada segundo

    return () => clearInterval(interval);
  }, [dataInicio]);

  // Formatação HH:MM:SS
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const secs = segundos % 60;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const tempoFormatado = `${pad(horas)}:${pad(minutos)}:${pad(secs)}`;

  // Cálculo de cor baseado no prazo
  // Se prazoHoras for 0, não tem prazo (fica cinza/azul)
  // Se passar do prazo, fica vermelho. Se estiver perto (80%), fica amarelo.
  let corTexto = "text-muted-foreground";
  let iconeCor = "text-muted-foreground";

  if (prazoHoras > 0) {
    const horasDecorridas = segundos / 3600;
    if (horasDecorridas > prazoHoras) {
      corTexto = "text-red-600 font-bold animate-pulse"; // Atrasado
      iconeCor = "text-red-600";
    } else if (horasDecorridas > prazoHoras * 0.8) {
      corTexto = "text-yellow-600 font-medium"; // Quase lá
      iconeCor = "text-yellow-600";
    } else {
      corTexto = "text-green-600 font-medium"; // No prazo
      iconeCor = "text-green-600";
    }
  }

  return (
    <div className={`flex items-center gap-1.5 text-sm font-mono ${corTexto} bg-background/50 px-2 py-1 rounded border`}>
      <TimerIcon className={`h-3.5 w-3.5 ${iconeCor}`} />
      <span>{tempoFormatado}</span>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function Processamento() {
  const [amostras, setAmostras] = useState<Amostra[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    fetchAmostrasEmAndamento();
    
    const canal = supabase
      .channel('mudancas-processamento')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'amostras' }, () => {
        fetchAmostrasEmAndamento();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

async function fetchAmostrasEmAndamento() {
  try {
    setLoading(true);
    const { data, error } = await supabase
      .from('amostras')
      .select(`*, testes ( nome )`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formatadas: Amostra[] = (data || []).map((a: any) => ({
      id: a.id,
      codigoInterno: a.codigo_interno,
      paciente: a.paciente,
      testeSolicitado: a.testes?.nome || "N/A",
      tipo: a.tipo as TipoProcessamento,
      dataEntrada: a.data_entrada,
      etapaAtual: a.etapa_atual,
      historico: []
    }));

    // --- CORREÇÃO DO FILTRO ---
    // Antes podia estar a ocultar a etapa 0. Agora garantimos que mostra tudo
    // exceto o que já foi estritamente "Concluído" (última etapa).
    const emAndamento = formatadas.filter(a => {
      const etapas = a.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
      const ultimaEtapaIndex = etapas.length - 1;
      
      // Mostra se a etapa atual for MENOR que a última etapa
      return a.etapaAtual < ultimaEtapaIndex; 
    });

    setAmostras(emAndamento);
  } catch (error: any) {
    toast.error("Erro ao carregar fila: " + error.message);
  } finally {
    setLoading(false);
  }
}

  const handleMudarEtapa = async (amostra: Amostra, novaEtapaIndex: number) => {
    const etapas = amostra.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
    
    if (novaEtapaIndex < 0 || novaEtapaIndex >= etapas.length) return;

    try {
      setProcessando(amostra.id);
      
      const { error } = await supabase
        .from('amostras')
        .update({ etapa_atual: novaEtapaIndex })
        .eq('id', amostra.id);

      if (error) throw error;

      const acao = novaEtapaIndex > amostra.etapaAtual ? "avançou" : "voltou";
      toast.success(`Status atualizado: ${etapas[novaEtapaIndex].nome}`);
      fetchAmostrasEmAndamento();

    } catch (error: any) {
      toast.error("Erro ao alterar etapa: " + error.message);
    } finally {
      setProcessando(null);
    }
  };

  const internos = amostras.filter(a => a.tipo === 'INTERNO');
  const externos = amostras.filter(a => a.tipo === 'EXTERNO');

  const CardAmostraProcessamento = ({ item }: { item: Amostra }) => {
    const etapas = item.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
    const etapaAtualInfo = etapas[item.etapaAtual];
    
    // Usamos o cronómetro para mostrar o tempo total
    return (
      <Card className="mb-4 border-l-4 border-l-primary hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">{item.codigoInterno}</span>
              <Badge variant="outline">{item.testeSolicitado}</Badge>
              
              {/* O CRONÓMETRO APARECE AQUI */}
              <Cronometro 
                dataInicio={item.dataEntrada} 
                prazoHoras={etapaAtualInfo.prazoHoras} 
              />
            </div>
            
            <p className="text-sm text-muted-foreground">
              Paciente: <span className="font-medium text-foreground">{item.paciente}</span>
            </p>
            
            <div className="flex items-center gap-2 text-sm mt-2">
              <Badge variant="secondary" className="px-2 py-1 bg-secondary text-secondary-foreground">
                Etapa Atual: {etapaAtualInfo.nome}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => handleMudarEtapa(item, item.etapaAtual + 1)} 
              disabled={!!processando}
              className={processando === item.id ? "opacity-50 cursor-not-allowed" : ""}
            >
              {processando === item.id ? "..." : "Próxima Etapa"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel>Mover para Etapa:</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {etapas.map((etapa, index) => (
                  <DropdownMenuItem 
                    key={etapa.id}
                    onClick={() => handleMudarEtapa(item, index)}
                    disabled={index === item.etapaAtual}
                    className="flex justify-between items-center cursor-pointer py-2"
                  >
                    <span className={index === item.etapaAtual ? "font-bold text-primary" : ""}>
                      {index + 1}. {etapa.nome}
                    </span>
                    {index < item.etapaAtual && <RotateCcw className="h-3 w-3 text-orange-500" />}
                    {index > item.etapaAtual && <FastForward className="h-3 w-3 text-green-500" />}
                    {index === item.etapaAtual && <CheckCircle2 className="h-3 w-3 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fila de Processamento</h1>
          <p className="text-muted-foreground">
            Gestão operacional com cronómetro em tempo real.
          </p>
        </div>
      </div>

      <Tabs defaultValue="internos" className="flex-1 overflow-hidden flex flex-col">
        <TabsList>
          <TabsTrigger value="internos">Internos ({internos.length})</TabsTrigger>
          <TabsTrigger value="externos">Externos ({externos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="internos" className="flex-1 overflow-hidden mt-4">
          <ScrollArea className="h-full pr-4">
            {internos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhuma amostra interna pendente.</p>
              </div>
            ) : (
              internos.map(amostra => (
                <CardAmostraProcessamento key={amostra.id} item={amostra} />
              ))
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="externos" className="flex-1 overflow-hidden mt-4">
          <ScrollArea className="h-full pr-4">
            {externos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhuma amostra externa pendente.</p>
              </div>
            ) : (
              externos.map(amostra => (
                <CardAmostraProcessamento key={amostra.id} item={amostra} />
              ))
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}