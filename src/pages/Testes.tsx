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
import { Plus, Search, MoreHorizontal, CheckCircle, Trash2, CalendarClock, Loader2, Archive, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TipoProcessamento } from "@/types";

interface Teste {
  id: string;
  codigo: string;
  nome: string;
  amostra?: string;
  tipo: TipoProcessamento;
  metodo: string;
  prazo: string;
  status: "ativo" | "inativo"; 
}

const statusLabels = {
  ativo: { label: "Ativo", variant: "default" as const, icon: CheckCircle, className: "bg-green-600 hover:bg-green-700" },
  inativo: { label: "Inativo", variant: "secondary" as const, icon: Archive, className: "text-muted-foreground" },
  // Fallback para não quebrar com dados antigos
  pendente: { label: "Pendente (Ativar)", variant: "outline" as const, icon: Activity, className: "text-yellow-600 border-yellow-600" },
};

export default function Testes() {
  const [testes, setTestes] = useState<Teste[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [novoTeste, setNovoTeste] = useState({
    codigo: "",
    nome: "",
    amostra: "",
    tipo: "INTERNO" as "INTERNO" | "EXTERNO",
    metodo: "",
    prazo: "",
  });

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
      setTestes(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar testes: " + error.message);
    } finally {
      setLoading(false);
    }
  }

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
            status: 'ativo' // <--- CORREÇÃO: Agora nasce ATIVO
          }
        ])
        .select();

      if (error) throw error;

      if (data) {
        setTestes([data[0], ...testes]);
        toast.success("Teste salvo e ativo!");
        setNovoTeste({ codigo: "", nome: "", amostra: "", tipo: "INTERNO", metodo: "", prazo: "" });
        setDialogOpen(false);
      }
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

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

  // Função para ativar/inativar
  const handleToggleStatus = async (id: string, statusAtual: string) => {
    const novoStatus = statusAtual === 'ativo' ? 'inativo' : 'ativo';
    
    const backup = [...testes];
    setTestes(testes.map(t => t.id === id ? { ...t, status: novoStatus as any } : t));

    try {
      const { error } = await supabase
        .from('testes')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Teste marcado como ${novoStatus}`);
    } catch (error: any) {
      setTestes(backup);
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const testesFiltrados = testes.filter(
    (t) =>
      t.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      t.nome.toLowerCase().includes(busca.toLowerCase())
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
          data.map((teste) => {
            // Tratamento para status antigos
            const statusConfig = statusLabels[teste.status] || statusLabels.pendente;
            const Icon = statusConfig.icon;

            return (
              <TableRow key={teste.id} className={teste.status === 'inativo' ? 'opacity-60 bg-muted/50' : ''}>
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
                  <Badge className={`gap-1 ${statusConfig.className}`} variant={statusConfig.variant}>
                    <Icon className="h-3 w-3" />
                    {statusConfig.label}
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
                        <DropdownMenuItem onClick={() => handleToggleStatus(teste.id, teste.status)}>
                          {teste.status === 'ativo' ? (
                            <>
                              <Archive className="mr-2 h-4 w-4" />
                              Arquivar (Inativar)
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Ativar Teste
                            </>
                          )}
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
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Testes</h1>
          <p className="text-muted-foreground">
            Gerenciamento dos exames oferecidos pelo laboratório.
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
                Este teste ficará disponível imediatamente para seleção.
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
                Salvar e Ativar
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