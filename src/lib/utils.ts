import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- FUNÇÃO DE CONVERSÃO DE TEMPO ---
// Converte "5 dias", "48 horas", "30 minutos" em segundos totais
export function parsePrazoToSeconds(prazoStr: string): number {
  if (!prazoStr) return 0;
  
  // Limpa e normaliza a string
  const clean = prazoStr.toLowerCase().trim();
  const parts = clean.split(' ');
  
  // Tenta ler o número (ex: 5)
  const valor = parseInt(parts[0]);
  if (isNaN(valor)) return 0;

  // Se não tiver unidade (ex: apenas "48"), assume HORAS por segurança
  if (parts.length < 2) {
    return valor * 3600; 
  }

  // Remove o 's' do final se existir (dias -> dia)
  const unidade = parts[1];
  const u = unidade.endsWith('s') ? unidade.slice(0, -1) : unidade;

  switch (u) {
    case 'dia': return valor * 86400;
    case 'hora': return valor * 3600;
    case 'minuto': return valor * 60;
    case 'segundo': return valor;
    default: return valor * 3600; // Fallback para horas
  }
}