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
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MoreHorizontal, Play, CheckCircle, Clock, Trash2, CalendarClock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Importante: Conexão com o banco
import { toast } from "sonner";
import { TipoProcessamento } from "@/types";

// Interface alinhada com o banco de dados
interface Teste {
  id: string;
  codigo: string;
  nome: string;
  amostra?: string; // Campo opcional no banco
  tipo: TipoProcessamento;
  metodo: string;
  prazo: string;
  status: "pendente" | "em_execucao" | "concluido";
}

const statusLabels = {
  pendente: { label: "Pendente", variant: "secondary" as const, icon: Clock },
  em_execucao: { label: "Em Execução", variant: "default" as const, icon: Play },
  concluido: { label: "Concluído", variant: "outline" as const, icon: CheckCircle },
  ativo: { label: "Ativo", variant: "secondary" as const, icon: CheckCircle }, // Fallback para status antigo
};

export default function Testes() {
  const [testes, setTestes] = useState<Teste[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estado do formulário
  const [novoTeste, setNovoTeste] = useState({
    codigo: "",
    nome: "",
    amostra: "",
    tipo: "INTERNO" as "INTERNO" | "EXTERNO",
    metodo: "",
    prazo: "",
  });

  // 1. CARREGAR DO SUPABASE (O segredo para não sumir!)
  useEffect(() => {
    fetchTestes();
  }, []);

  async function fetchTestes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('testes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Normalização simples dos dados vindos do banco
      const dadosFormatados = (data || []).map(t => ({
        ...t,
        status: t.status === 'ativo' ? 'pendente' : t.status // Converte status legado se necessário
      }));

      setTestes(dadosFormatados);
    } catch (error: any) {
      toast.error("Erro ao carregar testes: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // 2. SALVAR NO SUPABASE
  const handleAdicionar = async () => {
    if (!novoTeste.codigo || !novoTeste.nome || !novoTeste.tipo || !novoTeste.prazo) {
      toast.warning("Preencha os campos obrigatórios.");
      return;
    }
    
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('testes')
        .insert([
          {
            codigo: novoTeste.codigo,
            nome: novoTeste.nome,
            amostra: novoTeste.amostra,
            tipo: novoTeste.tipo,
            metodo: novoTeste.metodo || "-",
            prazo: novoTeste.prazo,
            status: 'pendente'
          }
        ])
        .select();

      if (error) throw error;

      if (data) {
        setTestes([data[0], ...testes]); // Atualiza lista local
        toast.success("Teste salvo no banco de dados!");
        setNovoTeste({ codigo: "", nome: "", amostra: "", tipo: "INTERNO", metodo: "", prazo: "" });
        setDialogOpen(false);
      }
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // 3. EXCLUIR NO SUPABASE
  const handleExcluir = async (id: string) => {
    if (!confirm("Tem certeza? Isso pode afetar amostras vinculadas.")) return;

    try {
      const { error } = await supabase.from('testes').delete().eq('id', id);
      if (error) throw error;

      setTestes(testes.filter(t => t.id !== id));
      toast.success("Teste excluído.");
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  // 4. ALTERAR STATUS NO SUPABASE
  const handleStatusChange = async (id: string, novoStatus: Teste["status"]) => {
    // Atualização Otimista (Muda na tela antes do banco responder para ser rápido)
    const backup = [...testes];
    setTestes(testes.map(t => t.id === id ? { ...t, status: novoStatus } : t));

    try {
      const { error } = await supabase
        .from('testes')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success("Status atualizado.");
    } catch (error: any) {
      setTestes(backup); // Reverte se der erro
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const testesFiltrados = testes.filter(
    (t) =>
      t.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      t.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (t.amostra && t.amostra.toLowerCase().includes(busca.toLowerCase()))
  );

  const testesInternos = testesFiltrados.filter(t => t.tipo === "INTERNO");
  const testesExternos = testesFiltrados.filter(t => t.tipo === "EXTERNO");

  const TesteTable = ({ data }: { data: Teste[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Teste</TableHead>
          <TableHead>Amostra</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Prazo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "Nenhum teste encontrado."}
            </TableCell>
          </TableRow>
        ) : (
          data.map((teste) => (
            <TableRow key={teste.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{teste.nome}</span>
                  <span className="text-xs text-muted-foreground font-mono">{teste.codigo}</span>
                </div>
              </TableCell>
              <TableCell>{teste.amostra || "-"}</TableCell>
              <TableCell>{teste.metodo}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <CalendarClock className="h-3 w-3" />
                  {teste.prazo}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusLabels[teste.status]?.variant || "secondary"} className="gap-1">
                  {statusLabels[teste.status]?.label || teste.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(teste.id, "pendente")}>
                        <Clock className="mr-2 h-4 w-4" />
                        Marcar como Pendente
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(teste.id, "em_execucao")}>
                        <Play className="mr-2 h-4 w-4" />
                        Iniciar Execução
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(teste.id, "concluido")}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Concluir Teste
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleExcluir(teste.id)}
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
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testes</h1>
          <p className="text-muted-foreground">
            Gerenciamento de testes internos e externos
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Teste
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Teste</DialogTitle>
              <DialogDescription>
                Este teste ficará disponível para seleção na entrada de amostras.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="codigo">Código Interno</Label>
                  <Input
                    id="codigo"
                    placeholder="Ex: T-001"
                    value={novoTeste.codigo}
                    onChange={(e) => setNovoTeste({ ...novoTeste, codigo: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome do Teste</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Sexagem Fetal"
                    value={novoTeste.nome}
                    onChange={(e) => setNovoTeste({ ...novoTeste, nome: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="amostra">Amostra Vinculada</Label>
                <Input
                  id="amostra"
                  placeholder="Ex: Sangue Periférico"
                  value={novoTeste.amostra}
                  onChange={(e) => setNovoTeste({ ...novoTeste, amostra: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Processamento</Label>
                  <Select 
                    value={novoTeste.tipo}
                    onValueChange={(value: "INTERNO" | "EXTERNO") => setNovoTeste({ ...novoTeste, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNO">Interno</SelectItem>
                      <SelectItem value="EXTERNO">Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prazo">Prazo Resultado</Label>
                  <Input
                    id="prazo"
                    placeholder="Ex: 5 dias"
                    value={novoTeste.prazo}
                    onChange={(e) => setNovoTeste({ ...novoTeste, prazo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metodo">Método</Label>
                <Input
                  id="metodo"
                  placeholder="Ex: PCR"
                  value={novoTeste.metodo}
                  onChange={(e) => setNovoTeste({ ...novoTeste, metodo: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleAdicionar} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
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
                placeholder="Buscar por nome, código ou amostra..."
                className="pl-9"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todos">
            <TabsList>
              <TabsTrigger value="todos">Todos ({testesFiltrados.length})</TabsTrigger>
              <TabsTrigger value="internos">Internos ({testesInternos.length})</TabsTrigger>
              <TabsTrigger value="externos">Externos ({testesExternos.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="todos" className="mt-4">
              <TesteTable data={testesFiltrados} />
            </TabsContent>
            <TabsContent value="internos" className="mt-4">
              <TesteTable data={testesInternos} />
            </TabsContent>
            <TabsContent value="externos" className="mt-4">
              <TesteTable data={testesExternos} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}