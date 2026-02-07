import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Importar o hook de autenticação
import { useAuth } from "@/contexts/AuthContext"; 
import { Search, MoreHorizontal, Trash2, FileBarChart, Clock, CheckCircle2, AlertTriangle, ArrowUpCircle, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ETAPAS_INTERNAS, ETAPAS_EXTERNAS } from "@/types";
import { differenceInHours, parseISO, format } from "date-fns";

export default function Relatorios() {
  // Aceder ao utilizador logado
  const { user } = useAuth();
  
  const [amostras, setAmostras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    concluidas: 0,
    mediaHoras: 0,
    atrasadas: 0
  });

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('amostras')
        .select(`
          *,
          testes ( nome, prazo )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setAmostras(data);
        calcularEstatisticas(data);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar relatórios: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function calcularEstatisticas(dados: any[]) {
    const total = dados.length;
    let somaHoras = 0;
    let concluidas = 0;
    let atrasadas = 0;

    dados.forEach(a => {
      const etapas = a.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
      const totalEtapas = etapas.length;

      if (a.etapa_atual >= totalEtapas - 1) {
        concluidas++;
        const horas = differenceInHours(new Date(), parseISO(a.data_entrada));
        somaHoras += horas;
      }

      const etapaAtualDef = etapas[a.etapa_atual] || etapas[totalEtapas - 1];
      if (etapaAtualDef.prazoHoras > 0) {
        const horasNaEtapa = differenceInHours(new Date(), parseISO(a.data_entrada));
        if (horasNaEtapa > etapaAtualDef.prazoHoras) {
          atrasadas++;
        }
      }
    });

    setStats({
      total,
      concluidas,
      mediaHoras: concluidas > 0 ? Math.round(somaHoras / concluidas) : 0,
      atrasadas
    });
  }

  const handleExcluir = async (id: string) => {
    if (!confirm("Tem certeza? Isso apagará todo o histórico desta amostra.")) return;

    try {
      const { error } = await supabase.from('amostras').delete().eq('id', id);
      if (error) throw error;
      
      toast.success("Amostra excluída do registro.");
      fetchDados(); 
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const handleAlterarEtapa = async (id: string, novaEtapaIndex: number) => {
    try {
      const { error } = await supabase
        .from('amostras')
        .update({ etapa_atual: novaEtapaIndex })
        .eq('id', id);

      if (error) throw error;

      toast.success("Status atualizado manualmente.");
      fetchDados();
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const dadosFiltrados = amostras.filter(
    (a) =>
      a.codigo_interno.toLowerCase().includes(busca.toLowerCase()) ||
      a.paciente.toLowerCase().includes(busca.toLowerCase())
  );

  const getEtapaNome = (amostra: any) => {
    const etapas = amostra.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
    const index = Math.min(amostra.etapa_atual, etapas.length - 1);
    return etapas[index].nome;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Indicadores e Relatórios</h1>
          <p className="text-muted-foreground">
            Monitoramento de performance e gestão completa do histórico.
          </p>
        </div>
        
        {/* --- EXIBIÇÃO DO UTILIZADOR --- */}
        <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-lg border">
          <div className="bg-primary/10 p-2 rounded-full">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Emitido por</p>
            <p className="text-sm font-medium leading-none">{user?.email || "Utilizador"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Amostras</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registradas no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio (Total)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mediaHoras}h</div>
            <p className="text-xs text-muted-foreground">Do recebimento à liberação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.concluidas}</div>
            <p className="text-xs text-muted-foreground">Laudos liberados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.atrasadas}</div>
            <p className="text-xs text-red-600/80">Estouraram o SLA da etapa</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Log Geral de Amostras</CardTitle>
              <CardDescription>
                Lista completa para auditoria e correções manuais.
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar código ou paciente..."
                className="pl-9"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Teste</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Status Atual</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                dadosFiltrados.map((amostra) => (
                  <TableRow key={amostra.id}>
                    <TableCell className="font-medium font-mono">
                      {amostra.codigo_interno}
                    </TableCell>
                    <TableCell>{amostra.paciente}</TableCell>
                    <TableCell>
                      {amostra.testes?.nome || "Teste Manual"}
                      <Badge variant="outline" className="ml-2 text-[10px] h-5">
                        {amostra.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(amostra.data_entrada), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getEtapaNome(amostra)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAlterarEtapa(amostra.id, 0)}>
                              <ArrowUpCircle className="mr-2 h-4 w-4" />
                              Reiniciar (Recebido)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAlterarEtapa(amostra.id, 3)}>
                              <Clock className="mr-2 h-4 w-4" />
                              Mover para Análise
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAlterarEtapa(amostra.id, 99)}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Forçar Conclusão
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() => handleExcluir(amostra.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}