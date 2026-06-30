import { useState } from 'react';
import { Settings, Database, FileText, AlertCircle, ToggleLeft, ChevronRight, Clock, Shield } from 'lucide-react';

const ADMIN_TABS = [
  { id: 'catalogo', label: 'Catálogo', icon: Database },
  { id: 'bitacora', label: 'Bitácora', icon: FileText },
  { id: 'dataset', label: 'Dataset de Proyecto', icon: Settings },
  { id: 'contingencia', label: 'Hospital / Contingencia', icon: AlertCircle },
];

const BITACORA_ENTRIES = [
  { id: 1, fecha: '11/05/2026 08:34', usuario: 'R. Torres', accion: 'EXPORT', modulo: 'Planilla', detalle: 'Exportación oficial — Estructuras semana 19', nivel: 'info' },
  { id: 2, fecha: '11/05/2026 07:52', usuario: 'M. Quispe', accion: 'CREATE', modulo: 'Metrados', detalle: 'Nuevo metrado — OE.1.2.3 Frente B x3 registros', nivel: 'success' },
  { id: 3, fecha: '10/05/2026 16:21', usuario: 'Sistema', accion: 'ALERT', modulo: 'Catálogo', detalle: 'Partida duplicada detectada: OE.1.1.1', nivel: 'warning' },
  { id: 4, fecha: '10/05/2026 14:05', usuario: 'A. Flores', accion: 'UPDATE', modulo: 'Metrados', detalle: 'Edición — AR.1.1.3 Tarrajeo Frente D', nivel: 'info' },
  { id: 5, fecha: '10/05/2026 10:30', usuario: 'Admin', accion: 'CONFIG', modulo: 'Admin', detalle: 'Criterio valorización actualizado a "SI"', nivel: 'warning' },
  { id: 6, fecha: '09/05/2026 17:45', usuario: 'J. Vargas', accion: 'CREATE', modulo: 'Personal', detalle: 'Nueva cuadrilla creada: IIEE-03 (5 obreros)', nivel: 'success' },
];

const DATASET_CONFIG = [
  { key: 'proyecto', label: 'Nombre del Proyecto', value: 'Hospital Nacional Norte — Sede Trujillo', type: 'text' },
  { key: 'expediente', label: 'Código Expediente', value: 'EXP-2024-003871', type: 'code' },
  { key: 'contrato', label: 'N° de Contrato', value: 'CON-2024-MTC-0187', type: 'code' },
  { key: 'inicio', label: 'Fecha de Inicio', value: '03/01/2024', type: 'date' },
  { key: 'plazo', label: 'Plazo (días)', value: '540', type: 'number' },
  { key: 'monto', label: 'Monto Contractual (S/)', value: '28,450,000.00', type: 'currency' },
  { key: 'residente', label: 'Ingeniero Residente', value: 'Ing. Roberto Torres Salas', type: 'text' },
  { key: 'supervisor', label: 'Supervisor de Obra', value: 'Ing. Carmen Paredes M.', type: 'text' },
];

const NIVEL_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  info: { bg: '#EEF4FF', text: '#1251BF', label: 'INFO' },
  success: { bg: '#ECFDF5', text: '#065F46', label: 'OK' },
  warning: { bg: '#FEF3C7', text: '#92400E', label: 'WARN' },
  error: { bg: '#FEF2F2', text: '#991B1B', label: 'ERR' },
};

const ACCION_COLORS: Record<string, string> = {
  EXPORT: '#8B5CF6', CREATE: '#22C55E', ALERT: '#F59E0B',
  UPDATE: '#1A6BFF', CONFIG: '#F59E0B', DELETE: '#EF4444',
};

export default function AdminMaestro() {
  const [activeTab, setActiveTab] = useState('catalogo');
  const [criterio, setCriterio] = useState<'ALL' | 'SI' | 'NO'>('ALL');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 flex-shrink-0"
        style={{ height: 56, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E9F0' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F1F5F9' }}>
            <Settings size={16} style={{ color: '#1A6BFF' }} />
          </div>
          <div>
            <h1 className="font-bold leading-tight" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif', fontSize: '15px' }}>
              Admin Studio
            </h1>
            <p className="text-xs leading-tight" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Management Console
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={14} style={{ color: '#22C55E' }} />
          <span className="text-xs font-medium" style={{ color: '#22C55E', fontFamily: 'IBM Plex Sans, sans-serif' }}>
            Acceso admin verificado
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ backgroundColor: '#F4F6FA' }}>
        {/* Sidebar tabs */}
        <div
          className="flex flex-col flex-shrink-0 border-r pt-4"
          style={{ width: 220, backgroundColor: '#FFFFFF', borderColor: '#E5E9F0' }}
        >
          {ADMIN_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg mb-1 transition-all"
                style={{
                  backgroundColor: isActive ? '#EEF4FF' : 'transparent',
                  color: isActive ? '#1A6BFF' : '#64748B',
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'left',
                }}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                {tab.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </button>
            );
          })}

          <div className="mx-4 my-4" style={{ height: 1, backgroundColor: '#F1F5F9' }} />

          {/* Filtro Criterio Valorización */}
          <div className="px-4">
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', letterSpacing: '0.1em' }}>
              Criterio Valorización
            </div>
            <div className="flex rounded-full p-0.5" style={{ backgroundColor: '#F1F5F9' }}>
              {(['ALL', 'SI', 'NO'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setCriterio(c)}
                  className="flex-1 py-1 rounded-full text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: criterio === c ? '#1A2B45' : 'transparent',
                    color: criterio === c ? '#FFFFFF' : '#64748B',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Catálogo tab */}
          {activeTab === 'catalogo' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: '#E5E9F0' }}>
                <h3 className="font-semibold text-sm mb-4" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
                  Configuración de Catálogo
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Versión del catálogo oficial', value: 'CAPECO 2024 — Rev. 3', badge: 'Activo', badgeColor: '#22C55E' },
                    { label: 'Partidas PC creadas', value: '224 ítems personalizados', badge: '1 duplicada', badgeColor: '#F59E0B' },
                    { label: 'Última sincronización', value: '09/05/2026 — 22:00 hrs', badge: 'Sync OK', badgeColor: '#22C55E' },
                    { label: 'Modo de edición', value: 'Restringido a admin+', badge: 'Bloqueado', badgeColor: '#EF4444' },
                  ].map(item => (
                    <div key={item.label} className="p-4 rounded-lg border" style={{ borderColor: '#F1F5F9', backgroundColor: '#FAFBFC' }}>
                      <div className="text-xs mb-1" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {item.label}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium" style={{ color: '#1A2B45', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                          {item.value}
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style={{ backgroundColor: item.badgeColor + '18', color: item.badgeColor, fontFamily: 'IBM Plex Sans' }}
                        >
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: '#E5E9F0' }}>
                <h3 className="font-semibold text-sm mb-4" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
                  Toggles de Configuración
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Permitir creación de partidas PC en campo', enabled: true },
                    { label: 'Validar duplicados automáticamente', enabled: true },
                    { label: 'Exportación requiere confirmación de residente', enabled: false },
                    { label: 'Mostrar precios unitarios en planilla', enabled: false },
                    { label: 'Sincronización automática con CAPECO', enabled: true },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: '#F1F5F9' }}>
                      <span className="text-sm" style={{ color: '#334155', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                        {item.label}
                      </span>
                      <div
                        className="w-10 h-5 rounded-full relative cursor-pointer flex-shrink-0 transition-colors"
                        style={{ backgroundColor: item.enabled ? '#1A6BFF' : '#E2E8F0' }}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                          style={{ left: item.enabled ? '22px' : '2px' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bitácora tab */}
          {activeTab === 'bitacora' && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E5E9F0' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#F1F5F9' }}>
                <h3 className="font-semibold text-sm" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
                  Bitácora del Sistema
                </h3>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  <Clock size={12} />
                  Últimas 24 horas
                </div>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['FECHA/HORA', 'USUARIO', 'ACCIÓN', 'MÓDULO', 'DETALLE', 'NIVEL'].map(col => (
                      <th key={col} className="px-4 py-2.5 text-left" style={{ backgroundColor: '#1A2B45', color: '#FFFFFF', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '9px', fontWeight: 600, letterSpacing: '0.07em', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BITACORA_ENTRIES.map((entry, idx) => {
                    const nivelCfg = NIVEL_CONFIG[entry.nivel];
                    return (
                      <tr key={entry.id} className="hover:bg-[#F8FAFC] transition-colors" style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFD', borderBottom: '1px solid #F1F5F9' }}>
                        <td className="px-4 py-2.5" style={{ borderRight: '1px solid #F1F5F9' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748B' }}>{entry.fecha}</span>
                        </td>
                        <td className="px-4 py-2.5" style={{ borderRight: '1px solid #F1F5F9' }}>
                          <span className="text-xs font-medium" style={{ color: '#1A2B45', fontFamily: 'IBM Plex Sans, sans-serif' }}>{entry.usuario}</span>
                        </td>
                        <td className="px-4 py-2.5" style={{ borderRight: '1px solid #F1F5F9' }}>
                          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: (ACCION_COLORS[entry.accion] || '#94A3B8') + '18', color: ACCION_COLORS[entry.accion] || '#94A3B8', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                            {entry.accion}
                          </span>
                        </td>
                        <td className="px-4 py-2.5" style={{ borderRight: '1px solid #F1F5F9' }}>
                          <span className="text-xs" style={{ color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif' }}>{entry.modulo}</span>
                        </td>
                        <td className="px-4 py-2.5" style={{ borderRight: '1px solid #F1F5F9' }}>
                          <span className="text-xs" style={{ color: '#334155', fontFamily: 'IBM Plex Sans, sans-serif' }}>{entry.detalle}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: nivelCfg.bg, color: nivelCfg.text, fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                            {nivelCfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Dataset tab */}
          {activeTab === 'dataset' && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E5E9F0' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: '#F1F5F9' }}>
                <h3 className="font-semibold text-sm" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
                  Dataset del Proyecto
                </h3>
                <p className="text-xs mt-0.5" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  Datos maestros del proyecto. Solo administradores pueden editar.
                </p>
              </div>
              <div className="p-5 space-y-4">
                {DATASET_CONFIG.map(field => (
                  <div key={field.key} className="grid grid-cols-3 gap-4 items-center py-2.5 border-b last:border-0" style={{ borderColor: '#F1F5F9' }}>
                    <label className="text-xs font-medium" style={{ color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '12px' }}>
                      {field.label}
                    </label>
                    <div className="col-span-2">
                      <div
                        className="px-3 py-2 rounded-lg border text-sm"
                        style={{
                          borderColor: '#E2E8F0',
                          backgroundColor: '#F8FAFC',
                          color: '#1A2B45',
                          fontFamily: field.type === 'code' || field.type === 'number' ? 'JetBrains Mono, monospace' : 'IBM Plex Sans, sans-serif',
                          fontSize: '13px',
                        }}
                      >
                        {field.value}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <button className="px-4 py-2 rounded-lg text-white text-xs font-semibold" style={{ backgroundColor: '#1A6BFF', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contingencia tab */}
          {activeTab === 'contingencia' && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl border" style={{ backgroundColor: '#FEF3C7', borderColor: '#FEF3C7' }}>
                <AlertCircle size={20} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#92400E', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    Módulo Hospital / Contingencia
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#B45309', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    Este módulo gestiona partidas de contingencia y adicionales de obra. Las modificaciones requieren aprobación del supervisor.
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: '#E5E9F0' }}>
                <h3 className="font-semibold text-sm mb-4" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
                  Partidas en Contingencia
                </h3>
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <AlertCircle size={32} className="mx-auto mb-2" style={{ color: '#CBD5E1' }} />
                    <div className="text-sm" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                      No hay partidas en contingencia activa
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
