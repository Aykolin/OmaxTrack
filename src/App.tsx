import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// MUDANÇA 1: HashRouter para Electron
import { HashRouter, Routes, Route, Navigate } from "react-router-dom"; 
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
// MUDANÇA 2: Importação com chaves { }
import { Layout } from "./components/Layout"; 

import Dashboard from "./pages/Dashboard";
import Amostras from "./pages/Amostras";
import Testes from "./pages/Testes";
import Processamento from "./pages/Processamento";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

// Movi para fora do componente App para melhor performance
const RotaProtegida = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        {/* HashRouter é essencial para o executável .exe funcionar sem tela branca */}
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Estrutura aninhada para passar 'children' ao Layout corretamente */}
            <Route
              path="/*"
              element={
                <RotaProtegida>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/amostras" element={<Amostras />} />
                      <Route path="/testes" element={<Testes />} />
                      <Route path="/processamento" element={<Processamento />} />
                      <Route path="/relatorios" element={<Relatorios />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </RotaProtegida>
              }
            />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;