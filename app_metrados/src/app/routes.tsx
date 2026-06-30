import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import Metrados from './components/views/Metrados';
import Dashboard from './components/views/Dashboard';
import Personal from './components/views/Personal';
import Catalogo from './components/views/Catalogo';
import StatusGerencial from './components/views/StatusGerencial';
import AdminMaestro from './components/views/AdminMaestro';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Metrados },
      { path: 'dashboard', Component: Dashboard },
      { path: 'personal', Component: Personal },
      { path: 'catalogo', Component: Catalogo },
      { path: 'status', Component: StatusGerencial },
      { path: 'admin', Component: AdminMaestro },
    ],
  },
]);
