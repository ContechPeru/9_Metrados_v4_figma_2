import { useNavigate, useLocation } from 'react-router';
import {
  TableProperties, LayoutDashboard, Users, BookOpen,
  BarChart2, Settings2, ChevronRight, LogOut, FileUp, TrendingUp
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuthStore } from '../store/useAuthStore';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AppIcon } from './ui/AppIcon';

const NAV_ITEMS = [
  { icon: TableProperties, label: 'Planilla', path: '/', id: 'metrados' },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', id: 'dashboard' },
  { icon: TrendingUp, label: 'Seguimiento', path: '/seguimiento-ejecucion', id: 'dashboard' },
  { icon: Users, label: 'Obreros', path: '/personal', id: 'personal' },
  { icon: BookOpen, label: 'Catálogo', path: '/catalogo', badge: '1', badgeColor: '#F59E0B', id: 'catalogo' },
  { icon: BarChart2, label: 'Status', path: '/status', id: 'status' },
  { icon: FileUp, label: 'Importar Excel', path: '/importacion-metrados', id: 'metrados' },
];

const ADMIN_ITEMS = [
  { icon: FileUp, label: 'Importar Catálogo (Master)', path: '/importacion-catalogo', id: 'admin' },
  { icon: Settings2, label: 'Admin', path: '/admin', id: 'admin' },
  { icon: Users, label: 'Personal Sistema', path: '/admin-personal', id: 'admin' },
];

// ── Color tokens for light metallic sidebar ──
const SIDEBAR_BG      = '#EEF1F5';
const SIDEBAR_BORDER  = '#DDE3EC';
const ICON_DEFAULT    = '#7A90A8';
const ICON_HOVER      = '#1E3A5F';
const TEXT_DEFAULT    = '#5E748A';
const HOVER_BG        = '#E0E9F4';
const ACTIVE_BG       = '#1A6BFF';
const ACTIVE_TEXT     = '#FFFFFF';
const LOGO_TEXT       = '#1E3A5F';
const VERSION_TEXT    = '#9BAFC4';

interface NavItemProps {
  icon: any;
  label: string;
  path: string;
  badge?: string;
  badgeColor?: string;
  expanded: boolean;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, badge, badgeColor, expanded, active, onClick }: NavItemProps) {
  const button = (
    <button
      onClick={onClick}
      className="relative flex items-center gap-3 rounded-xl transition-all duration-150"
      style={{
        width: expanded ? 'calc(100% - 16px)' : 40,
        margin: expanded ? '0 8px' : '0 12px',
        padding: expanded ? '8px 12px' : '8px 0',
        justifyContent: expanded ? 'flex-start' : 'center',
        backgroundColor: active ? ACTIVE_BG : 'transparent',
        color: active ? ACTIVE_TEXT : ICON_DEFAULT,
        boxShadow: active ? '0 2px 8px rgba(26,107,255,0.25)' : 'none',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.backgroundColor = HOVER_BG;
          (e.currentTarget as HTMLElement).style.color = ICON_HOVER;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLElement).style.color = ICON_DEFAULT;
        }
      }}
    >
      <div className="relative flex-shrink-0">
        <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
        {badge && (
          <span
            className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white"
            style={{ fontSize: '8px', backgroundColor: badgeColor || '#EF4444', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {badge}
          </span>
        )}
      </div>
      {expanded && (
        <span
          className="text-sm whitespace-nowrap overflow-hidden"
          style={{
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontWeight: active ? 600 : 400,
            fontSize: '13px',
            color: active ? ACTIVE_TEXT : TEXT_DEFAULT,
          }}
        >
          {label}
        </span>
      )}
      {/* Active left accent bar */}
      {active && !expanded && (
        <div
          className="absolute -right-0.5 top-1.5 bottom-1.5 w-0.5 rounded-full"
          style={{ backgroundColor: ACTIVE_TEXT, opacity: 0.6 }}
        />
      )}
    </button>
  );

  if (expanded) return <div className="px-0">{button}</div>;

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={10}
            className="z-50 px-3 py-1.5 rounded-lg text-white shadow-xl"
            style={{
              backgroundColor: '#1E3A5F',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {label}
            <Tooltip.Arrow style={{ fill: '#1E3A5F' }} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export function LeftSidebar() {
  const { sidebarExpanded, setSidebarExpanded } = useAppContext();
  const { puedeVer, logout, user, canGestionarObreros } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.label === 'Obreros') {
      return canGestionarObreros();
    }
    return puedeVer(item.id);
  });
  const visibleAdminItems = ADMIN_ITEMS.filter(item => puedeVer(item.id));

  return (
    <Tooltip.Provider delayDuration={150}>
      <aside
        className="h-full flex flex-col transition-all duration-300 flex-shrink-0"
        style={{
          width: sidebarExpanded ? 240 : 64,
          backgroundColor: SIDEBAR_BG,
          borderRight: `1px solid ${SIDEBAR_BORDER}`,
          zIndex: 40,
        }}
      >
        {/* Header / Logo */}
        <div
          className={`h-[60px] flex items-center ${
            sidebarExpanded ? 'justify-between px-3' : 'justify-center'
          } border-b`}
          style={{ borderColor: SIDEBAR_BORDER }}
        >
          {sidebarExpanded ? (
            <div
              className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap cursor-pointer select-none"
              onClick={() => navigate('/')}
              title="Ir a inicio · Planilla de Metrados"
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-white shadow-sm border hover:shadow transition-all"
                style={{ borderColor: '#DDE3EC' }}
              >
                <AppIcon size={20} />
              </div>
              <div className="flex flex-col">
                <span
                  style={{
                    color: LOGO_TEXT,
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: '15px',
                    letterSpacing: '0.04em',
                    lineHeight: 1.1,
                  }}
                >
                  METRADOS
                </span>
                <span
                  style={{
                    color: VERSION_TEXT,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '9px',
                    letterSpacing: '0.02em',
                  }}
                >
                  v4.0 · Belempampa
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setSidebarExpanded(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm border hover:scale-105 hover:shadow-md transition-all cursor-pointer"
              style={{ borderColor: '#DDE3EC' }}
              title="Expandir menú · Metrados"
              aria-label="Expandir menú"
            >
              <AppIcon size={22} />
            </button>
          )}
          {sidebarExpanded && (
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-1.5 rounded-md hover:bg-slate-100 transition-colors border shadow-sm bg-gray-50 cursor-pointer"
              style={{ color: ICON_DEFAULT, borderColor: '#DDE3EC' }}
              title="Colapsar menú"
            >
              <ChevronRight size={16} className="rotate-180" />
            </button>
          )}
        </div>

        {/* Main Nav */}
        <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {visibleNavItems.map(item => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              path={item.path}
              badge={item.badge}
              badgeColor={item.badgeColor}
              expanded={sidebarExpanded}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}

          {visibleAdminItems.length > 0 && (
            <>
              <div className="mt-4 mb-2 mx-4" style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />
              {sidebarExpanded && (
                <div className="px-5 mb-1" style={{ color: VERSION_TEXT, fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Administración
                </div>
              )}
              {visibleAdminItems.map(item => (
                <NavItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  expanded={sidebarExpanded}
                  active={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer / User / Logout */}
        <div className="p-3 border-t" style={{ borderColor: SIDEBAR_BORDER, backgroundColor: 'rgba(255,255,255,0.4)' }}>
          {sidebarExpanded ? (
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  {user?.iniciales || 'U'}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate" style={{ color: LOGO_TEXT, fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '13px', fontWeight: 600 }}>
                    {user?.nombre_completo || 'Usuario'}
                  </span>
                  <span className="truncate" style={{ color: TEXT_DEFAULT, fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}>
                    {user?.cargo_rol || 'Rol'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="p-1.5 rounded-lg transition-all hover:bg-red-50 text-gray-400 hover:text-red-500"
                title="Cerrar sesión"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-blue-200 transition-colors" title={user?.nombre_completo}>
                {user?.iniciales || 'U'}
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="p-1.5 rounded-lg transition-all hover:bg-red-50 text-gray-400 hover:text-red-500"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </Tooltip.Provider>
  );
}
