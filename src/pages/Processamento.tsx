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
  Play, 
  Box, 
  TestTube2, 
  FileText, 
  UserCheck, 
  ChevronDown,
  RotateCcw,
  FastForward
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
import { differenceInHours, parseISO } from "date-fns";

export default function Processamento() {
  const [amostras, setAmostras] = useState<Amostra[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    fetchAmostrasEmAndamento();
    
    const canal = supabase
      .channel('mudancas-amostras')
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

      // Filtra visualmente as concluídas se necessário, ou mostra todas
      // Aqui mostramos todas que não estão na última etapa absoluta
      const emAndamento = formatadas.filter(a => {
        const totalEtapas = a.tipo === 'INTERNO' ? ETAPAS_INTERNAS.length : ETAPAS_EXTERNAS.length;
        return a.etapaAtual < totalEtapas - 1; 
      });

      setAmostras(emAndamento);
    } catch (error: any) {
      toast.error("Erro ao carregar fila: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Função Genérica para Mudar Etapa (Avançar ou Voltar)
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
      toast.success(`Amostra ${amostra.codigoInterno} ${acao} para: ${etapas[novaEtapaIndex].nome}`);
      
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
    
    // Cálculo de atraso
    const horasDesdeEntrada = differenceInHours(new Date(), parseISO(item.dataEntrada));
    const estaAtrasado = etapaAtualInfo.prazoHoras > 0 && horasDesdeEntrada > etapaAtualInfo.prazoHoras;

    return (
      <Card className={`mb-4 border-l-4 ${estaAtrasado ? 'border-l-red-500' : 'border-l-blue-500'}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{item.codigoInterno}</span>
              <Badge variant="outline">{item.testeSolicitado}</Badge>
              {estaAtrasado && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Atraso
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Paciente: <span className="font-medium text-foreground">{item.paciente}</span>
            </p>
            <div className="flex items-center gap-2 text-sm mt-2">
              <Badge variant="secondary" className="px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20">
                {etapaAtualInfo.nome}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Principal: Avançar 1 Etapa */}
            <Button 
              onClick={() => handleMudarEtapa(item, item.etapaAtual + 1)} 
              disabled={!!processando}
              className={processando === item.id ? "opacity-50 cursor-not-allowed" : ""}
            >
              {processando === item.id ? "Salvando..." : "Próxima Etapa"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {/* Menu Dropdown: Controle Fino (Voltar/Saltar) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mover para Etapa:</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {etapas.map((etapa, index) => (
                  <DropdownMenuItem 
                    key={etapa.id}
                    onClick={() => handleMudarEtapa(item, index)}
                    disabled={index === item.etapaAtual}
                    className="flex justify-between items-center cursor-pointer"
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
            Gestão operacional e avanço de etapas das amostras.
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
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
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
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
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