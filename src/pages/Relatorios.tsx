import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Eye, Calendar } from "lucide-react";

interface Relatorio {
  id: string;
  codigo: string;
  amostra: string;
  tipo: string;
  dataGeracao: string;
  status: "rascunho" | "revisao" | "aprovado" | "enviado";
}

const relatoriosIniciais: Relatorio[] = [
  { id: "1", codigo: "R-2024-001", amostra: "AM-2024-001", tipo: "Análise Completa", dataGeracao: "2024-01-16", status: "aprovado" },
  { id: "2", codigo: "R-2024-002", amostra: "AM-2024-002", tipo: "Laudo Parcial", dataGeracao: "2024-01-15", status: "revisao" },
  { id: "3", codigo: "R-2024-003", amostra: "AM-2024-003", tipo: "Certificado", dataGeracao: "2024-01-14", status: "enviado" },
  { id: "4", codigo: "R-2024-004", amostra: "AM-2024-001", tipo: "Laudo Técnico", dataGeracao: "2024-01-13", status: "rascunho" },
];

const statusLabels = {
  rascunho: { label: "Rascunho", variant: "secondary" as const },
  revisao: { label: "Em Revisão", variant: "default" as const },
  aprovado: { label: "Aprovado", variant: "outline" as const },
  enviado: { label: "Enviado", variant: "outline" as const },
};

export default function Relatorios() {
  const [relatorios] = useState<Relatorio[]>(relatoriosIniciais);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  const relatoriosFiltrados = relatorios.filter((r) => {
    const matchStatus = filtroStatus === "todos" || r.status === filtroStatus;
    const matchTipo = filtroTipo === "todos" || r.tipo === filtroTipo;
    return matchStatus && matchTipo;
  });

  const tiposUnicos = [...new Set(relatorios.map(r => r.tipo))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Gestão de laudos e certificados
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Gerar Relatório
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorios.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {relatorios.filter(r => r.status === "aprovado").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Revisão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {relatorios.filter(r => r.status === "revisao").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {relatorios.filter(r => r.status === "enviado").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="revisao">Em Revisão</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {tiposUnicos.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Amostra</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relatoriosFiltrados.map((relatorio) => (
                <TableRow key={relatorio.id}>
                  <TableCell className="font-medium">{relatorio.codigo}</TableCell>
                  <TableCell>{relatorio.amostra}</TableCell>
                  <TableCell>{relatorio.tipo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {relatorio.dataGeracao}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[relatorio.status].variant}>
                      {statusLabels[relatorio.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
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
