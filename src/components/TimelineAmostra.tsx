import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { ETAPAS_INTERNAS, ETAPAS_EXTERNAS, Amostra } from "@/types";
import { cn } from "@/lib/utils";

interface TimelineProps {
  amostra: Amostra;
}

export function TimelineAmostra({ amostra }: TimelineProps) {
  // Seleciona as etapas corretas baseado no tipo [cite: 9, 10]
  const etapas = amostra.tipo === 'INTERNO' ? ETAPAS_INTERNAS : ETAPAS_EXTERNAS;

  return (
    <div className="w-full overflow-x-auto p-4">
      <div className="flex items-center min-w-max">
        {etapas.map((etapa, index) => {
          const isConcluido = index < amostra.etapaAtual;
          const isAtual = index === amostra.etapaAtual;
          const isPendente = index > amostra.etapaAtual;

          return (
            <div key={etapa.id} className="flex flex-col items-center relative group">
              {/* Linha conectora */}
              {index !== 0 && (
                <div 
                  className={cn(
                    "absolute top-4 -left-[50%] w-full h-1",
                    index <= amostra.etapaAtual ? "bg-primary" : "bg-muted"
                  )} 
                />
              )}
              
              {/* Ícone da Etapa */}
              <div className={cn(
                "z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background transition-colors",
                isConcluido && "border-primary bg-primary text-primary-foreground",
                isAtual && "border-blue-500 text-blue-500 animate-pulse",
                isPendente && "border-muted text-muted-foreground"
              )}>
                {isConcluido && <CheckCircle2 className="w-5 h-5" />}
                {isAtual && <Clock className="w-5 h-5" />}
                {isPendente && <Circle className="w-5 h-5" />}
              </div>

              {/* Texto da Etapa */}
              <div className="mt-2 text-center w-32">
                <p className={cn(
                  "text-xs font-medium",
                  isAtual ? "text-blue-600 font-bold" : "text-muted-foreground"
                )}>
                  {etapa.nome}
                </p>
                {/* Mostra o prazo apenas se não estiver concluído */}
                {!isConcluido && etapa.prazoHoras > 0 && (
                  <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> 
                    {etapa.prazoHoras >= 24 
                      ? `${(etapa.prazoHoras / 24).toFixed(0)} dias` 
                      : `${etapa.prazoHoras}h`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}