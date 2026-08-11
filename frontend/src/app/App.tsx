import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './components/views/LoginPage';

import { Toaster } from 'sonner';

export default function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Auto-verificación de sesión guardada
  useEffect(() => {
    checkAuth();
    setIsInitializing(false);
  }, [checkAuth]);

  // Carga masiva de catálogos y metrados desde la base de datos Supabase cuando entra el usuario
  useEffect(() => {
    if (isAuthenticated) {
      const loadAll = async () => {
        try {
          const { fetchCatalogosGlobales, fetchMetrados } = (await import('./store/useMetradosStore')).useMetradosStore.getState();
          const { fetchPersonal } = (await import('./store/usePersonalStore')).usePersonalStore.getState();

          await Promise.all([
            fetchCatalogosGlobales(),
            fetchMetrados(),
            fetchPersonal()
          ]);
        } catch (error) {
          console.error("Error al cargar datos desde la base de datos:", error);
        }
      };
      loadAll();
    }
  }, [isAuthenticated]);

  if (isInitializing) {
    return <div className="flex h-screen w-screen items-center justify-center bg-gray-50">Cargando...</div>;
  }

  // La gran barrera
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}
