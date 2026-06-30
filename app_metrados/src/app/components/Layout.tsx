import { Outlet, useLocation } from 'react-router';
import { LeftSidebar } from './LeftSidebar';
import { RightPanel } from './RightPanel';
import { AppProvider, useAppContext } from '../context/AppContext';

function LayoutInner() {
  const location = useLocation();
  const { rightPanelVisible } = useAppContext();
  const isMetradosRoute = location.pathname === '/';
  const showRightPanel = isMetradosRoute && rightPanelVisible;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F4F6FA' }}>
      {/* ZONA A — Left Sidebar */}
      <LeftSidebar />

      {/* Main content wrapper */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {/* ZONA C — Central Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Outlet />
        </div>

        {/* ZONA B — Right Panel (planilla only, toggleable) */}
        {showRightPanel && <RightPanel />}
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <AppProvider>
      <LayoutInner />
    </AppProvider>
  );
}
