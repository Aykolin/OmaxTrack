import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";

interface Etapa {
  id: string;
  nome: string;
  status: "pendente" | "em_andamento" | "concluida";
  responsavel?: string;
  dataInicio?: string;
  dataFim?: string;
}

interface Processamento {
  id: string;
  amostra: string;
  etapas: Etapa[];
  progresso: number;
}

const processamentosIniciais: Processamento[] = [
  {
    id: "1",
    amostra: "AM-2024-001",
    progresso: 60,
    etapas: [
      { id: "1", nome: "Recepção", status: "concluida", responsavel: "João", dataInicio: "2024-01-15", dataFim: "2024-01-15" },
      { id: "2", nome: "Preparação", status: "concluida", responsavel: "Maria", dataInicio: "2024-01-15", dataFim: "2024-01-16" },
      { id: "3", nome: "Análise", status: "em_andamento", responsavel: "Pedro", dataInicio: "2024-01-16" },
      { id: "4", nome: "Validação", status: "pendente" },
      { id: "5", nome: "Liberação", status: "pendente" },
    ],
  },
  {
    id: "2",
    amostra: "AM-2024-002",
    progresso: 20,
    etapas: [
      { id: "1", nome: "Recepção", status: "concluida", responsavel: "Ana", dataInicio: "2024-01-14", dataFim: "2024-01-14" },
      { id: "2", nome: "Preparação", status: "em_andamento", responsavel: "Carlos", dataInicio: "2024-01-15" },
      { id: "3", nome: "Análise", status: "pendente" },
      { id: "4", nome: "Validação", status: "pendente" },
      { id: "5", nome: "Liberação", status: "pendente" },
    ],
  },
];

const StatusIcon = ({ status }: { status: Etapa["status"] }) => {
  switch (status) {
    case "concluida":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "em_andamento":
      return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function Processamento() {
  const [processamentos] = useState<Processamento[]>(processamentosIniciais);
  const [filtroAmostra, setFiltroAmostra] = useState<string>("todas");

  const processamentosFiltrados = filtroAmostra === "todas"
    ? processamentos
    : processamentos.filter(p => p.amostra === filtroAmostra);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Processamento</h1>
        <p className="text-muted-foreground">
          Acompanhamento das etapas de processamento
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Select value={filtroAmostra} onValueChange={setFiltroAmostra}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por amostra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as amostras</SelectItem>
            {processamentos.map(p => (
              <SelectItem key={p.id} value={p.amostra}>{p.amostra}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {processamentosFiltrados.map((proc) => (
          <Card key={proc.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{proc.amostra}</CardTitle>
                  <CardDescription>
                    {proc.etapas.filter(e => e.status === "concluida").length} de {proc.etapas.length} etapas concluídas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-2xl font-bold">{proc.progresso}%</span>
                    <p className="text-xs text-muted-foreground">Progresso</p>
                  </div>
                </div>
              </div>
              <Progress value={proc.progresso} className="mt-2" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {proc.etapas.map((etapa, index) => (
                  <div key={etapa.id} className="flex items-center">
                    <div className={`
                      flex flex-col items-center p-3 rounded-lg border min-w-[120px]
                      ${etapa.status === "em_andamento" ? "border-blue-500 bg-blue-50" : ""}
                      ${etapa.status === "concluida" ? "border-green-500 bg-green-50" : ""}
                      ${etapa.status === "pendente" ? "border-border bg-muted/30" : ""}
                    `}>
                      <StatusIcon status={etapa.status} />
                      <span className="text-sm font-medium mt-2">{etapa.nome}</span>
                      {etapa.responsavel && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {etapa.responsavel}
                        </span>
                      )}
                      {etapa.status === "em_andamento" && (
                        <Badge variant="default" className="mt-2 text-xs">
                          Em andamento
                        </Badge>
                      )}
                    </div>
                    {index < proc.etapas.length - 1 && (
                      <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
