import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './store/useAuthStore';

const Metrados = lazy(() => import('./components/views/Metrados'));
const Dashboard = lazy(() => import('./components/views/Dashboard'));
const DashboardEjecucion = lazy(() => import('./components/views/DashboardEjecucion'));
const Personal = lazy(() => import('./components/views/Personal'));
const Catalogo = lazy(() => import('./components/views/Catalogo'));
const StatusGerencial = lazy(() => import('./components/views/StatusGerencial'));
const AdminMaestro = lazy(() => import('./components/views/AdminMaestro'));
const AdminPersonal = lazy(() => import('./components/views/AdminPersonal'));
const ImportacionExcel = lazy(() => import('./components/views/ImportacionExcel'));
const ImportacionCatalogo = lazy(() => import('./components/views/ImportacionCatalogo'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando módulo...</div>}>
    {children}
  </Suspense>
);

function ProtectedRoute({ vista, children }: { vista: string; children: React.ReactNode }) {
  const { puedeVer } = useAuthStore();
  if (!puedeVer(vista)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, element: <SuspenseWrapper><Metrados /></SuspenseWrapper> },
      { path: 'dashboard', element: <SuspenseWrapper><Dashboard /></SuspenseWrapper> },
      { path: 'seguimiento-ejecucion', element: <SuspenseWrapper><DashboardEjecucion /></SuspenseWrapper> },
      { path: 'personal', element: <ProtectedRoute vista="personal"><SuspenseWrapper><Personal /></SuspenseWrapper></ProtectedRoute> },
      { path: 'catalogo', element: <ProtectedRoute vista="catalogo"><SuspenseWrapper><Catalogo /></SuspenseWrapper></ProtectedRoute> },
      { path: 'status', element: <SuspenseWrapper><StatusGerencial /></SuspenseWrapper> },
      { path: 'importacion-metrados', element: <SuspenseWrapper><ImportacionExcel /></SuspenseWrapper> },
      { path: 'importacion-catalogo', element: <SuspenseWrapper><ImportacionCatalogo /></SuspenseWrapper> },
      { path: 'admin', element: <ProtectedRoute vista="admin"><SuspenseWrapper><AdminMaestro /></SuspenseWrapper></ProtectedRoute> },
      { path: 'admin-personal', element: <ProtectedRoute vista="admin"><SuspenseWrapper><AdminPersonal /></SuspenseWrapper></ProtectedRoute> },
    ],
  },
]);
