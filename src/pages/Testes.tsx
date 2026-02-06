import { useState } from "react";
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
import { Plus, Search, MoreHorizontal, Play, CheckCircle, Clock, Trash2, CalendarClock } from "lucide-react";

interface Teste {
  id: string;
  codigo: string;
  nome: string; // Novo campo 
  amostra: string;
  tipo: "interno" | "externo";
  metodo: string;
  prazo: string; // Novo campo 
  status: "pendente" | "em_execucao" | "concluido";
  resultado?: string;
}

const statusLabels = {
  pendente: { label: "Pendente", variant: "secondary" as const, icon: Clock },
  em_execucao: { label: "Em Execução", variant: "default" as const, icon: Play },
  concluido: { label: "Concluído", variant: "outline" as const, icon: CheckCircle },
};

export default function Testes() {
  const [testes, setTestes] = useState<Teste[]>([]);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Estado do formulário atualizado com os novos campos
  const [novoTeste, setNovoTeste] = useState({
    codigo: "",
    nome: "",
    amostra: "",
    tipo: "" as "interno" | "externo",
    metodo: "",
    prazo: "",
  });

  const testesFiltrados = testes.filter(
    (t) =>
      t.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      t.nome.toLowerCase().includes(busca.toLowerCase()) ||
      t.amostra.toLowerCase().includes(busca.toLowerCase())
  );

  const testesInternos = testesFiltrados.filter(t => t.tipo === "interno");
  const testesExternos = testesFiltrados.filter(t => t.tipo === "externo");

  const handleAdicionar = () => {
    // Validação inclui os novos campos
    if (!novoTeste.codigo || !novoTeste.nome || !novoTeste.amostra || !novoTeste.tipo || !novoTeste.prazo) return;
    
    const novo: Teste = {
      id: String(testes.length + 1),
      codigo: novoTeste.codigo,
      nome: novoTeste.nome,
      amostra: novoTeste.amostra,
      tipo: novoTeste.tipo,
      metodo: novoTeste.metodo || "-",
      prazo: novoTeste.prazo,
      status: "pendente",
    };
    
    setTestes([novo, ...testes]);
    setNovoTeste({ codigo: "", nome: "", amostra: "", tipo: "" as "interno" | "externo", metodo: "", prazo: "" });
    setDialogOpen(false);
  };

  const handleExcluir = (id: string) => {
    setTestes(testes.filter(t => t.id !== id));
  };

  const handleStatusChange = (id: string, novoStatus: Teste["status"]) => {
    setTestes(testes.map(t => 
      t.id === id ? { ...t, status: novoStatus } : t
    ));
  };

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
              Nenhum teste encontrado.
            </TableCell>
          </TableRow>
        ) : (
          data.map((teste) => (
            <TableRow key={teste.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{teste.nome}</span>
                  <span className="text-xs text-muted-foreground">{teste.codigo}</span>
                </div>
              </TableCell>
              <TableCell>{teste.amostra}</TableCell>
              <TableCell>{teste.metodo}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <CalendarClock className="h-3 w-3" />
                  {teste.prazo}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusLabels[teste.status].variant} className="gap-1">
                  {statusLabels[teste.status].label}
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
                Preencha os dados obrigatórios do teste conforme o documento.
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
                  placeholder="Código da Amostra (AM-...)"
                  value={novoTeste.amostra}
                  onChange={(e) => setNovoTeste({ ...novoTeste, amostra: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Processamento</Label>
                  <Select 
                    value={novoTeste.tipo}
                    onValueChange={(value: "interno" | "externo") => setNovoTeste({ ...novoTeste, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interno">Interno</SelectItem>
                      <SelectItem value="externo">Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prazo">Prazo Resultado</Label>
                  <Input
                    id="prazo"
                    placeholder="Ex: 5 dias ou 48h"
                    value={novoTeste.prazo}
                    onChange={(e) => setNovoTeste({ ...novoTeste, prazo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metodo">Método (Opcional)</Label>
                <Input
                  id="metodo"
                  placeholder="Ex: PCR, Sequenciamento..."
                  value={novoTeste.metodo}
                  onChange={(e) => setNovoTeste({ ...novoTeste, metodo: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdicionar}>Salvar Teste</Button>
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