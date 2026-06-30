import { useNavigate, useLocation } from 'react-router';
import {
  TableProperties, LayoutDashboard, Users, BookOpen,
  BarChart2, Settings2, ChevronRight, LogOut, HardHat
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import * as Tooltip from '@radix-ui/react-tooltip';

const NAV_ITEMS = [
  { icon: TableProperties, label: 'Planilla', path: '/' },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Personal', path: '/personal' },
  { icon: BookOpen, label: 'Catálogo', path: '/catalogo', badge: '1', badgeColor: '#F59E0B' },
  { icon: BarChart2, label: 'Status', path: '/status' },
];

const ADMIN_ITEMS = [
  { icon: Settings2, label: 'Admin', path: '/admin' },
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
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="flex flex-col h-screen flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden"
      style={{
        width: sidebarExpanded ? 220 : 64,
        backgroundColor: SIDEBAR_BG,
        borderRight: `1px solid ${SIDEBAR_BORDER}`,
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{
          height: 56,
          borderBottom: `1px solid ${SIDEBAR_BORDER}`,
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #1A6BFF 0%, #0F4FC8 100%)',
            boxShadow: '0 2px 8px rgba(26,107,255,0.35)',
          }}
        >
          <HardHat size={15} className="text-white" strokeWidth={2} />
        </div>
        {sidebarExpanded && (
          <div className="min-w-0">
            <div
              className="font-bold leading-tight"
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', letterSpacing: '0.04em', color: LOGO_TEXT }}
            >
              METRADOS
            </div>
            <div style={{ color: VERSION_TEXT, fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
              v5.0 · Perú
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex flex-col gap-0.5 pt-3 pb-2 flex-1 overflow-hidden">
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.path}
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

        {/* Separator */}
        <div
          className="mx-3 my-2"
          style={{ height: 1, backgroundColor: SIDEBAR_BORDER }}
        />

        {ADMIN_ITEMS.map(item => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            expanded={sidebarExpanded}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div style={{ borderTop: `1px solid ${SIDEBAR_BORDER}` }}>
        {/* User */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #C8D8F0 0%, #A8BFE0 100%)',
              color: LOGO_TEXT,
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            RT
          </div>
          {sidebarExpanded && (
            <>
              <div className="flex-1 min-w-0">
                <div
                  className="leading-tight truncate"
                  style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '12px', fontWeight: 600, color: '#334155' }}
                >
                  Ing. R. Torres
                </div>
                <div style={{ color: VERSION_TEXT, fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}>
                  Jefe de Obra
                </div>
              </div>
              <button
                className="p-1.5 rounded-lg transition-all hover:bg-red-50"
                style={{ color: '#94A3B8' }}
                title="Cerrar sesión"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}
              >
                <LogOut size={13} />
              </button>
            </>
          )}
        </div>

        {/* Expand / collapse */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="w-full flex items-center justify-center py-2.5 transition-all rounded-b-none"
          style={{ color: VERSION_TEXT, borderTop: `1px solid ${SIDEBAR_BORDER}` }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = HOVER_BG;
            (e.currentTarget as HTMLElement).style.color = ICON_HOVER;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLElement).style.color = VERSION_TEXT;
          }}
        >
          <ChevronRight
            size={14}
            className="transition-transform duration-300"
            style={{ transform: sidebarExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>
    </div>
  );
}
