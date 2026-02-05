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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";

interface Teste {
  id: string;
  codigo: string;
  amostra: string;
  tipo: "interno" | "externo";
  metodo: string;
  status: "pendente" | "em_execucao" | "concluido";
  resultado?: string;
}

const testesIniciais: Teste[] = [
  { id: "1", codigo: "T-001", amostra: "AM-2024-001", tipo: "interno", metodo: "Cromatografia", status: "em_execucao" },
  { id: "2", codigo: "T-002", amostra: "AM-2024-001", tipo: "externo", metodo: "Espectrometria", status: "pendente" },
  { id: "3", codigo: "T-003", amostra: "AM-2024-002", tipo: "interno", metodo: "Microbiologia", status: "concluido", resultado: "Aprovado" },
  { id: "4", codigo: "T-004", amostra: "AM-2024-003", tipo: "interno", metodo: "pH", status: "concluido", resultado: "7.2" },
];

const statusLabels = {
  pendente: { label: "Pendente", variant: "secondary" as const },
  em_execucao: { label: "Em Execução", variant: "default" as const },
  concluido: { label: "Concluído", variant: "outline" as const },
};

export default function Testes() {
  const [testes, setTestes] = useState<Teste[]>(testesIniciais);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoTeste, setNovoTeste] = useState({
    codigo: "",
    amostra: "",
    tipo: "" as "interno" | "externo",
    metodo: "",
  });

  const testesFiltrados = testes.filter(
    (t) =>
      t.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      t.amostra.toLowerCase().includes(busca.toLowerCase())
  );

  const testesInternos = testesFiltrados.filter(t => t.tipo === "interno");
  const testesExternos = testesFiltrados.filter(t => t.tipo === "externo");

  const handleAdicionar = () => {
    if (!novoTeste.codigo || !novoTeste.amostra || !novoTeste.tipo || !novoTeste.metodo) return;
    
    const novo: Teste = {
      id: String(testes.length + 1),
      codigo: novoTeste.codigo,
      amostra: novoTeste.amostra,
      tipo: novoTeste.tipo,
      metodo: novoTeste.metodo,
      status: "pendente",
    };
    
    setTestes([novo, ...testes]);
    setNovoTeste({ codigo: "", amostra: "", tipo: "" as "interno" | "externo", metodo: "" });
    setDialogOpen(false);
  };

  const TesteTable = ({ data }: { data: Teste[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Amostra</TableHead>
          <TableHead>Método</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Resultado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((teste) => (
          <TableRow key={teste.id}>
            <TableCell className="font-medium">{teste.codigo}</TableCell>
            <TableCell>{teste.amostra}</TableCell>
            <TableCell>{teste.metodo}</TableCell>
            <TableCell>
              <Badge variant={statusLabels[teste.status].variant}>
                {statusLabels[teste.status].label}
              </Badge>
            </TableCell>
            <TableCell>{teste.resultado || "-"}</TableCell>
          </TableRow>
        ))}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Teste</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo teste
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="codigo">Código do Teste</Label>
                <Input
                  id="codigo"
                  placeholder="T-XXX"
                  value={novoTeste.codigo}
                  onChange={(e) => setNovoTeste({ ...novoTeste, codigo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amostra">Amostra</Label>
                <Input
                  id="amostra"
                  placeholder="AM-2024-XXX"
                  value={novoTeste.amostra}
                  onChange={(e) => setNovoTeste({ ...novoTeste, amostra: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de Teste</Label>
                <Select 
                  value={novoTeste.tipo}
                  onValueChange={(value: "interno" | "externo") => setNovoTeste({ ...novoTeste, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interno">Interno</SelectItem>
                    <SelectItem value="externo">Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="metodo">Método</Label>
                <Input
                  id="metodo"
                  placeholder="Nome do método"
                  value={novoTeste.metodo}
                  onChange={(e) => setNovoTeste({ ...novoTeste, metodo: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdicionar}>Cadastrar</Button>
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
                placeholder="Buscar por código ou amostra..."
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