import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, TestTubes, Cog, CheckCircle } from "lucide-react";

const stats = [
  {
    title: "Amostras Ativas",
    value: "24",
    description: "Em processamento",
    icon: FlaskConical,
  },
  {
    title: "Testes Pendentes",
    value: "12",
    description: "Aguardando execução",
    icon: TestTubes,
  },
  {
    title: "Em Processamento",
    value: "8",
    description: "Etapas em andamento",
    icon: Cog,
  },
  {
    title: "Concluídos Hoje",
    value: "15",
    description: "Finalizados",
    icon: CheckCircle,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de rastreabilidade OmaxLab
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas atualizações do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Amostra AM-2024-001 registrada", time: "Há 5 min" },
                { action: "Teste T-001 concluído", time: "Há 15 min" },
                { action: "Etapa de extração iniciada", time: "Há 30 min" },
                { action: "Relatório R-045 gerado", time: "Há 1 hora" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <span className="text-sm">{item.action}</span>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>Indicadores de performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Amostras no prazo", value: "95%", color: "bg-green-500" },
                { label: "Testes aprovados", value: "88%", color: "bg-blue-500" },
                { label: "Capacidade utilizada", value: "72%", color: "bg-yellow-500" },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full`} 
                      style={{ width: item.value }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
