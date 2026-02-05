import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search } from "lucide-react";

interface Amostra {
  id: string;
  codigo: string;
  cliente: string;
  tipo: string;
  dataEntrada: string;
  status: "pendente" | "em_analise" | "concluido";
}

const amostrasIniciais: Amostra[] = [
  { id: "1", codigo: "AM-2024-001", cliente: "Cliente A", tipo: "Água", dataEntrada: "2024-01-15", status: "em_analise" },
  { id: "2", codigo: "AM-2024-002", cliente: "Cliente B", tipo: "Solo", dataEntrada: "2024-01-14", status: "pendente" },
  { id: "3", codigo: "AM-2024-003", cliente: "Cliente C", tipo: "Alimento", dataEntrada: "2024-01-13", status: "concluido" },
];

const statusLabels = {
  pendente: { label: "Pendente", variant: "secondary" as const },
  em_analise: { label: "Em Análise", variant: "default" as const },
  concluido: { label: "Concluído", variant: "outline" as const },
};

export default function Amostras() {
  const [amostras, setAmostras] = useState<Amostra[]>(amostrasIniciais);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaAmostra, setNovaAmostra] = useState({
    codigo: "",
    cliente: "",
    tipo: "",
  });

  const amostrasFiltradas = amostras.filter(
    (a) =>
      a.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      a.cliente.toLowerCase().includes(busca.toLowerCase())
  );

  const handleAdicionar = () => {
    if (!novaAmostra.codigo || !novaAmostra.cliente || !novaAmostra.tipo) return;
    
    const nova: Amostra = {
      id: String(amostras.length + 1),
      codigo: novaAmostra.codigo,
      cliente: novaAmostra.cliente,
      tipo: novaAmostra.tipo,
      dataEntrada: new Date().toISOString().split("T")[0],
      status: "pendente",
    };
    
    setAmostras([nova, ...amostras]);
    setNovaAmostra({ codigo: "", cliente: "", tipo: "" });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Amostras</h1>
          <p className="text-muted-foreground">
            Gerenciamento de amostras do laboratório
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
              <DialogTitle>Cadastrar Nova Amostra</DialogTitle>
              <DialogDescription>
                Preencha os dados da nova amostra
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  placeholder="AM-2024-XXX"
                  value={novaAmostra.codigo}
                  onChange={(e) => setNovaAmostra({ ...novaAmostra, codigo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Input
                  id="cliente"
                  placeholder="Nome do cliente"
                  value={novaAmostra.cliente}
                  onChange={(e) => setNovaAmostra({ ...novaAmostra, cliente: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de Amostra</Label>
                <Select 
                  value={novaAmostra.tipo}
                  onValueChange={(value) => setNovaAmostra({ ...novaAmostra, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Água">Água</SelectItem>
                    <SelectItem value="Solo">Solo</SelectItem>
                    <SelectItem value="Alimento">Alimento</SelectItem>
                    <SelectItem value="Ar">Ar</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
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
                placeholder="Buscar por código ou cliente..."
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
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data de Entrada</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {amostrasFiltradas.map((amostra) => (
                <TableRow key={amostra.id}>
                  <TableCell className="font-medium">{amostra.codigo}</TableCell>
                  <TableCell>{amostra.cliente}</TableCell>
                  <TableCell>{amostra.tipo}</TableCell>
                  <TableCell>{amostra.dataEntrada}</TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[amostra.status].variant}>
                      {statusLabels[amostra.status].label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
