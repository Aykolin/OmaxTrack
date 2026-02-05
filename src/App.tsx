import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Amostras from "./pages/Amostras";
import Testes from "./pages/Testes";
import Processamento from "./pages/Processamento";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

// Componente simples para proteger rotas
const RotaProtegida = ({ children }: { children: React.ReactNode }) => {
  // Verifica se existe o "token" no localStorage (simulação temporária)
  const isAutenticado = localStorage.getItem("omax_auth") === "true";

  if (!isAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rota Pública - Não tem Layout (Sidebar) */}
          <Route path="/login" element={<Login />} />

          {/* Rotas Protegidas - Têm Layout e exigem autenticação */}
          <Route
            path="/*"
            element={
              <RotaProtegida>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;