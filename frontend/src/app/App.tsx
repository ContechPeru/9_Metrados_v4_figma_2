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

  // Carga masiva de catálogos cuando entra el usuario
  useEffect(() => {
    if (isAuthenticated) {
      const loadAll = async () => {
        // Asumiendo que useMetradosStore y usePersonalStore tienen fetchData
        // useMetradosStore.getState().fetchData();
        // usePersonalStore.getState().fetchData();
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
