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
import { Plus, Search, Barcode, Calendar } from "lucide-react";
import { TipoProcessamento, Amostra, ETAPAS_INTERNAS, ETAPAS_EXTERNAS } from "@/types";

// Mock de testes disponíveis (na vida real viria do banco de dados)
const TESTES_DISPONIVEIS = [
  { id: "1", nome: "Sexagem Fetal", tipo: "INTERNO", prazo: 120 },
  { id: "2", nome: "NIPT Básico", tipo: "EXTERNO", prazo: 240 },
  { id: "3", nome: "Paternidade Duo", tipo: "INTERNO", prazo: 72 },
];

export default function Amostras() {
  // Estado inicial simulando dados, usando a interface correta de @/types
  const [amostras, setAmostras] = useState<Amostra[]>([
    { 
      id: "1", 
      codigoInterno: "AM-2024-001", 
      paciente: "Maria Silva", 
      testeSolicitado: "Sexagem Fetal", 
      tipo: "INTERNO", 
      dataEntrada: "2024-02-01", 
      etapaAtual: 2,
      historico: [] 
    },
    { 
      id: "2", 
      codigoInterno: "AM-2024-002", 
      paciente: "João Santos", 
      testeSolicitado: "NIPT Básico", 
      tipo: "EXTERNO", 
      dataEntrada: "2024-02-02", 
      etapaAtual: 1,
      historico: [] 
    },
  ]);

  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Estado do formulário
  const [novaAmostra, setNovaAmostra] = useState({
    codigoInterno: "",
    paciente: "",
    testeId: "",
  });

  const amostrasFiltradas = amostras.filter(
    (a) =>
      a.codigoInterno.toLowerCase().includes(busca.toLowerCase()) ||
      a.paciente.toLowerCase().includes(busca.toLowerCase())
  );

  const handleAdicionar = () => {
    if (!novaAmostra.codigoInterno || !novaAmostra.paciente || !novaAmostra.testeId) return;
    
    // Encontra o teste selecionado para pegar o Tipo automaticamente
    const testeSelecionado = TESTES_DISPONIVEIS.find(t => t.id === novaAmostra.testeId);
    if (!testeSelecionado) return;

    const nova: Amostra = {
      id: String(amostras.length + 1),
      codigoInterno: novaAmostra.codigoInterno,
      paciente: novaAmostra.paciente,
      testeSolicitado: testeSelecionado.nome,
      tipo: testeSelecionado.tipo as TipoProcessamento, // Define automaticamente se é Interno/Externo
      dataEntrada: new Date().toISOString().split("T")[0],
      etapaAtual: 0, // Começa na primeira etapa
      historico: []
    };
    
    setAmostras([nova, ...amostras]);
    setNovaAmostra({ codigoInterno: "", paciente: "", testeId: "" });
    setDialogOpen(false);
  };

  // Função auxiliar para pegar o nome da etapa atual
  const getNomeEtapa = (amostra: Amostra) => {
    const etapas = amostra.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;
    // Garante que o índice está dentro dos limites
    const etapa = etapas[amostra.etapaAtual] || etapas[etapas.length - 1];
    return etapa.nome;
  };

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
                Insira os dados da amostra recebida.
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
                    <SelectValue placeholder="Selecione o teste..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TESTES_DISPONIVEIS.map((teste) => (
                      <SelectItem key={teste.id} value={teste.id}>
                        {teste.nome} ({teste.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdicionar}>Cadastrar Amostra</Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código Interno</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Teste</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data Entrada</TableHead>
                <TableHead>Status Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {amostrasFiltradas.map((amostra) => (
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
                    {/* Badge dinâmico mostrando o nome da etapa atual */}
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                      {getNomeEtapa(amostra)}
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