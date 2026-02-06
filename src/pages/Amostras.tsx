import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Barcode, Calendar, Loader2, MoreHorizontal, Trash2, ArrowRightCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { TipoProcessamento, Amostra, ETAPAS_INTERNAS, ETAPAS_EXTERNAS } from "@/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function Amostras() {
  const [amostras, setAmostras] = useState<Amostra[]>([]);
  const [testesDisponiveis, setTestesDisponiveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [novaAmostra, setNovaAmostra] = useState({
    codigoInterno: "",
    paciente: "",
    testeId: "",
  });

  useEffect(() => {
    fetchDados();
  }, []);

  async function fetchDados() {
    try {
      setLoading(true);
      
      const { data: dadosAmostras, error: errorAmostras } = await supabase
        .from('amostras')
        .select(`*, testes ( id, nome, tipo )`)
        .order('created_at', { ascending: false });

      if (errorAmostras) throw errorAmostras;

      const { data: dadosTestes, error: errorTestes } = await supabase
        .from('testes')
        .select('*')
        .eq('status', 'ativo');

      if (errorTestes) throw errorTestes;

      const amostrasFormatadas: Amostra[] = (dadosAmostras || []).map((a: any) => ({
        id: a.id,
        codigoInterno: a.codigo_interno,
        paciente: a.paciente,
        testeSolicitado: a.testes?.nome || "Desconhecido",
        tipo: a.tipo as TipoProcessamento,
        dataEntrada: format(parseISO(a.data_entrada), "yyyy-MM-dd"),
        etapaAtual: a.etapa_atual,
        historico: []
      }));

      setAmostras(amostrasFormatadas);
      setTestesDisponiveis(dadosTestes || []);

    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAdicionar = async () => {
    if (!novaAmostra.codigoInterno || !novaAmostra.paciente || !novaAmostra.testeId) {
      toast.warning("Preencha todos os campos obrigatórios.");
      return;
    }
    
    const testeSelecionado = testesDisponiveis.find(t => t.id === novaAmostra.testeId);
    if (!testeSelecionado) return;

    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from('amostras')
        .insert([{
            codigo_interno: novaAmostra.codigoInterno,
            paciente: novaAmostra.paciente,
            teste_id: novaAmostra.testeId,
            tipo: testeSelecionado.tipo,
            etapa_atual: 0,
            data_entrada: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      if (data) {
        toast.success("Amostra cadastrada com sucesso!");
        fetchDados();
        setNovaAmostra({ codigoInterno: "", paciente: "", testeId: "" });
        setDialogOpen(false);
      }

    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // --- NOVAS FUNÇÕES DE AÇÃO ---

  const handleExcluir = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta amostra?")) return;
    try {
      const { error } = await supabase.from('amostras').delete().eq('id', id);
      if (error) throw error;
      toast.success("Amostra excluída.");
      setAmostras(amostras.filter(a => a.id !== id));
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const handleAlterarStatus = async (id: string, novaEtapa: number) => {
    try {
      const { error } = await supabase
        .from('amostras')
        .update({ etapa_atual: novaEtapa })
        .eq('id', id);

      if (error) throw error;

      toast.success("Status atualizado.");
      fetchDados(); // Atualiza a lista para refletir a mudança
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  // --- AUXILIARES ---

  const getNomeEtapa = (amostra: Amostra) => {
    const etapas = amostra.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
    const index = Math.min(amostra.etapaAtual, etapas.length - 1);
    return etapas[index].nome;
  };

  const amostrasFiltradas = amostras.filter(
    (a) =>
      a.codigoInterno.toLowerCase().includes(busca.toLowerCase()) ||
      a.paciente.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Amostras</h1>
          <p className="text-muted-foreground">
            Cadastro e entrada de novas amostras
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Amostra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastro de Amostra</DialogTitle>
              <DialogDescription>
                Insira os dados da amostra recebida. O tipo (Interno/Externo) será definido pelo teste escolhido.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="codigo" className="flex items-center gap-2">
                  <Barcode className="h-4 w-4" /> Código Interno
                </Label>
                <Input
                  id="codigo"
                  placeholder="Escaneie ou digite o código de barras"
                  value={novaAmostra.codigoInterno}
                  onChange={(e) => setNovaAmostra({ ...novaAmostra, codigoInterno: e.target.value })}
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paciente">Paciente / Cliente</Label>
                <Input
                  id="paciente"
                  placeholder="Nome do paciente"
                  value={novaAmostra.paciente}
                  onChange={(e) => setNovaAmostra({ ...novaAmostra, paciente: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teste">Teste a ser realizado</Label>
                <Select 
                  value={novaAmostra.testeId}
                  onValueChange={(value) => setNovaAmostra({ ...novaAmostra, testeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Carregando testes..." : "Selecione o teste..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {testesDisponiveis.map((teste) => (
                      <SelectItem key={teste.id} value={teste.id}>
                        {teste.nome} ({teste.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleAdicionar} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cadastrar Amostra
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou paciente..."
                className="pl-9"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código Interno</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Teste</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data Entrada</TableHead>
                  <TableHead>Status Atual</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amostrasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma amostra encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  amostrasFiltradas.map((amostra) => (
                    <TableRow key={amostra.id}>
                      <TableCell className="font-medium font-mono">{amostra.codigoInterno}</TableCell>
                      <TableCell>{amostra.paciente}</TableCell>
                      <TableCell>{amostra.testeSolicitado}</TableCell>
                      <TableCell>
                        <Badge variant={amostra.tipo === "INTERNO" ? "secondary" : "outline"}>
                          {amostra.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {amostra.dataEntrada}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                          {getNomeEtapa(amostra)}
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
                              <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleAlterarStatus(amostra.id, amostra.etapaAtual + 1)}>
                                <ArrowRightCircle className="mr-2 h-4 w-4" />
                                Avançar Etapa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAlterarStatus(amostra.id, 0)}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reiniciar Processo
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleAlterarStatus(amostra.id, 99)} className="text-green-600">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}