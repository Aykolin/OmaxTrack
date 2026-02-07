import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown,
  RotateCcw,
  FastForward,
  Timer as TimerIcon,
  AlertTriangle
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
import { differenceInSeconds, parseISO, addSeconds } from "date-fns";

// --- FUNÇÃO AUXILIAR: CONVERTER PRAZO TEXTO EM SEGUNDOS ---
function parsePrazoToSeconds(prazoStr: string): number {
  if (!prazoStr) return 0;
  
  const clean = prazoStr.toLowerCase().trim();
  const parts = clean.split(' ');
  const valor = parseInt(parts[0]);
  
  if (isNaN(valor)) return 0;

  if (parts.length < 2) return valor * 3600;

  const unidade = parts[1];
  const u = unidade.endsWith('s') ? unidade.slice(0, -1) : unidade;

  switch (u) {
    case 'dia': return valor * 86400;
    case 'hora': return valor * 3600;
    case 'minuto': return valor * 60;
    case 'segundo': return valor;
    default: return valor * 3600;
  }
}

// --- COMPONENTE DE CONTAGEM REGRESSIVA (SLA) ---
function CountdownTimer({ dataEntrada, prazoStr }: { dataEntrada: string, prazoStr: string }) {
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const [totalPrazoSegundos, setTotalPrazoSegundos] = useState(0);

  useEffect(() => {
    const inicio = parseISO(dataEntrada);
    const prazoSegundos = parsePrazoToSeconds(prazoStr);
    setTotalPrazoSegundos(prazoSegundos);

    if (prazoSegundos === 0) return;

    const limite = addSeconds(inicio, prazoSegundos);

    const tick = () => {
      const agora = new Date();
      const diff = differenceInSeconds(limite, agora);
      setSegundosRestantes(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [dataEntrada, prazoStr]);

  if (totalPrazoSegundos === 0) {
    return <Badge variant="outline" className="text-muted-foreground">Sem Prazo</Badge>;
  }

  if (segundosRestantes === null) return null;

  const isAtrasado = segundosRestantes < 0;
  const absSegundos = Math.abs(segundosRestantes);
  
  const dias = Math.floor(absSegundos / 86400);
  const horas = Math.floor((absSegundos % 86400) / 3600);
  const minutos = Math.floor((absSegundos % 3600) / 60);
  const segundos = absSegundos % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  
  let tempoTexto = `${pad(horas)}:${pad(minutos)}:${pad(segundos)}`;
  if (dias > 0) tempoTexto = `${dias}d ${tempoTexto}`;

  if (isAtrasado) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded border bg-red-100 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 font-bold animate-pulse">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>-{tempoTexto} (Atrasado)</span>
      </div>
    );
  }

  const percentualRestante = (segundosRestantes / totalPrazoSegundos) * 100;
  
  let corClasses = "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"; 
  
  if (percentualRestante < 20) {
    corClasses = "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 font-bold";
  } else if (percentualRestante < 50) {
    corClasses = "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded border font-mono text-sm ${corClasses}`}>
      <TimerIcon className="h-3.5 w-3.5" />
      <span>{tempoTexto}</span>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function Processamento() {
  // AQUI ESTAVA O ERRO: Adicionei parênteses para agrupar o tipo corretamente
  const [amostras, setAmostras] = useState<(Amostra & { prazoTeste?: string })[]>([]); 
  
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
        .select(`*, testes ( nome, prazo )`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatadas = (data || []).map((a: any) => ({
        id: a.id,
        codigoInterno: a.codigo_interno,
        paciente: a.paciente,
        testeSolicitado: a.testes?.nome || "N/A",
        prazoTeste: a.testes?.prazo || "", 
        tipo: a.tipo as TipoProcessamento,
        dataEntrada: a.data_entrada,
        etapaAtual: a.etapa_atual,
        historico: []
      }));

      const emAndamento = formatadas.filter((a: any) => {
        const etapas = a.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
        return a.etapaAtual < etapas.length - 1; 
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
      toast.success(`Amostra avançou para: ${etapas[novaEtapaIndex].nome}`);
      fetchAmostrasEmAndamento();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setProcessando(null);
    }
  };

  const internos = amostras.filter(a => a.tipo === 'INTERNO');
  const externos = amostras.filter(a => a.tipo === 'EXTERNO');

  const CardAmostraProcessamento = ({ item }: { item: any }) => {
    const etapas = item.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
    const etapaAtualInfo = etapas[item.etapaAtual];
    
    return (
      <Card className="mb-4 border-l-4 border-l-primary hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">{item.codigoInterno}</span>
              <Badge variant="outline">{item.testeSolicitado}</Badge>
              
              <CountdownTimer 
                dataEntrada={item.dataEntrada} 
                prazoStr={item.prazoTeste} 
              />
            </div>
            
            <p className="text-sm text-muted-foreground">
              Paciente: <span className="font-medium text-foreground">{item.paciente}</span>
            </p>
            
            <div className="flex items-center gap-2 text-sm mt-2">
              <Badge variant="secondary" className="px-2 py-1">
                Etapa: {etapaAtualInfo.nome}
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
            Acompanhamento de prazos e fluxo operacional.
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
                <TimerIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
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
                <TimerIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
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