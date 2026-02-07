import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, BellOff, Volume2 } from "lucide-react";

interface AlertaAtrasoProps {
  atrasados: any[];
}

export function AlertaAtraso({ atrasados }: AlertaAtrasoProps) {
  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (atrasados.length > 0) {
      if (!open) {
        setOpen(true);
        tocarSom();
      }
    } else {
      setOpen(false);
      pararSom();
    }
  }, [atrasados]);

  useEffect(() => {
    return () => pararSom();
  }, []);

  const tocarSom = () => {
    if (!audioRef.current) {
      // CORREÇÃO: Agora aponta para .mp3
      audioRef.current = new Audio("/notificacao.mp3");
      audioRef.current.loop = true;
    }
    
    audioRef.current.play().catch((erro) => {
      console.warn("Autoplay bloqueado pelo navegador:", erro);
    });
  };

  const pararSom = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleResolver = () => {
    pararSom();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleResolver()}>
      <DialogContent className="sm:max-w-[500px] border-red-500 border-2 shadow-2xl shadow-red-500/20">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <div className="p-2 bg-red-100 rounded-full animate-pulse">
              <Volume2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold">ALERTA DE ATRASO</DialogTitle>
          </div>
          <DialogDescription className="text-base font-medium pt-2 text-foreground">
            Atenção: Existem {atrasados.length} amostra(s) fora do prazo (SLA).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-red-50 dark:bg-red-900/10">
            {atrasados.map((item) => (
              <div key={item.id} className="flex items-center gap-3 mb-3 last:mb-0 border-b pb-2 last:border-0 border-red-200 dark:border-red-800">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 animate-bounce" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm text-foreground">
                      {item.codigo_interno}
                    </p>
                    <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-mono">
                      -{Math.floor(item.segundosAtraso / 60)}m
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.testes?.nome}
                  </p>
                  <p className="text-xs text-red-600 font-medium mt-0.5">
                    Parada em: {item.etapaNome}
                  </p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button 
            variant="destructive" 
            size="lg" 
            className="w-full font-bold shadow-lg hover:bg-red-700 transition-all"
            onClick={handleResolver}
          >
            <BellOff className="mr-2 h-5 w-5" />
            Confirmar e Parar Alarme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}