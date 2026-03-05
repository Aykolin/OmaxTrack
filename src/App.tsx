import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Voltamos para o BrowserRouter para Web
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; 
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "./components/Layout"; 

import Dashboard from "./pages/Dashboard";
import Amostras from "./pages/Amostras";
import Testes from "./pages/Testes";
import Processamento from "./pages/Processamento";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

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
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;