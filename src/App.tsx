import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext"; // Importar o contexto
import { Layout } from "./components/Layout";
// ... (mantenha os imports das páginas Dashboard, Amostras, etc.)
import Dashboard from "./pages/Dashboard";
import Amostras from "./pages/Amostras";
import Testes from "./pages/Testes";
import Processamento from "./pages/Processamento";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

// Componente de proteção atualizado
const RotaProtegida = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) return <div>Carregando...</div>; // Ou um spinner bonito
  
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
      {/* Envolver tudo no AuthProvider */}
      <AuthProvider> 
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;