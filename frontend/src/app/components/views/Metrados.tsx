import { useEffect, useMemo, useState, useRef } from 'react';
import type { MetradoRecord } from '../../store/useMetradosStore';
import { useMetradosStore } from '../../store/useMetradosStore';
import { 
  Search, ChevronDown, FileSpreadsheet, Loader2,
  Download, Calendar, X, PanelRightOpen, PanelRightClose,
  FileText, FileCode2, ClipboardList, Printer, LayoutList, ArrowUp, ArrowDown, AlertCircle, Check
} from 'lucide-react';

import { useAppContext } from '../../context/AppContext';
import { useAuthStore } from '../../store/useAuthStore';
import { exportarMetradosExcel } from '../../lib/exportMetrados';
import { exportarValorizadosExcel } from '../../lib/exportValorizados';
import { exportarFormato1Excel } from '../../lib/export1';
import { exportarResumenExcel } from '../../lib/exportResumen';
import { exportarSaldosExcel } from '../../lib/exportSaldos';
import MetradosTreeGrid from './MetradosTreeGrid';
import { ActiveUsers } from '../ActiveUsers';

type TipoMetrado = 'PC' | 'MM' | 'PN' | 'DD' | 'ET';
type SortDir = 'asc' | 'desc' | null;

const TIPO_CONFIG: Record<TipoMetrado, { bg: string; text: string; dot: string }> = {
  PC: { bg: '#FFF0E6', text: '#C04D00', dot: '#FF6B1A' },
  MM: { bg: '#EEF4FF', text: '#1251BF', dot: '#1A6BFF' },
  PN: { bg: '#ECFDF5', text: '#065F46', dot: '#22C55E' },
  DD: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  ET: { bg: '#F3E8FF', text: '#5B21B6', dot: '#8B5CF6' },
};

function getTipo(codigo: string): TipoMetrado {
  if (!codigo) return 'PC';
  if (codigo.startsWith('OE')) return 'MM';
  if (codigo.startsWith('IS')) return 'PN';
  if (codigo.startsWith('IE')) return 'ET';
  if (codigo.startsWith('AR')) return 'DD';
  return 'PC';
}



const EXPORT_OPTIONS = [
  { icon: FileText, label: 'Exportar PDF', color: '#EF4444' },
  { icon: FileSpreadsheet, label: 'Exportar Excel', color: '#22C55E' },
  { icon: FileSpreadsheet, label: 'Exportar Valorizado', color: '#0EA5E9' },
  { icon: FileSpreadsheet, label: 'Exportar Saldos de Presupuesto', color: '#8B5CF6' },
  { icon: FileSpreadsheet, label: 'Exportar_1 (Resumen Trimble)', color: '#059669' },
  { icon: FileCode2, label: 'Exportar CSV', color: '#F59E0B' },
  { icon: ClipboardList, label: 'Metrados completos', color: '#1A6BFF' },
  { icon: LayoutList, label: 'Exportar resumen', color: '#8B5CF6' },
  { icon: Printer, label: 'Imprimir', color: '#64748B' },
];

function ExportDropdown({ onExportExcel, onExportValorizado, onExport1, onExportResumen, onExportSaldos, loading }: { onExportExcel: () => void; onExportValorizado: () => void; onExport1: () => void; onExportResumen: () => void; onExportSaldos: () => void; loading?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !loading && setOpen(o => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
          boxShadow: open ? '0 0 0 3px rgba(34,197,94,0.2)' : '0 1px 3px rgba(34,197,94,0.3)',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        {loading
          ? <Loader2 size={13} className="animate-spin" />
          : <Download size={13} />
        }
        <span className="hidden sm:inline">{loading ? 'Exportando...' : 'Exportar'}</span>
        {!loading && <ChevronDown size={11} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden"
          style={{ width: 220, backgroundColor: '#FFFFFF', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #E5E9F0' }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: '#F1F5F9', backgroundColor: '#FAFBFC' }}>
            <span style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Formato de exportación
            </span>
          </div>
          <div className="py-1">
            {EXPORT_OPTIONS.map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                onClick={() => { 
                  setOpen(false); 
                  if (label === 'Exportar Excel') onExportExcel(); 
                  if (label === 'Exportar Valorizado') onExportValorizado(); 
                  if (label === 'Exportar Saldos de Presupuesto') onExportSaldos();
                  if (label === 'Exportar_1 (Resumen Trimble)') onExport1();
                  if (label === 'Exportar resumen') onExportResumen();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 transition-colors hover:bg-[#F8FAFC]"
              >
                <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '12px', color: '#334155' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterDropdownProps {
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  locked?: boolean;
}

function FilterDropdown({ label, options, value, onChange, locked }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isActive = Boolean(value);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => !locked && setOpen(o => !o)}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-md border whitespace-nowrap transition-all ${locked ? 'cursor-not-allowed opacity-75' : ''}`}
        style={{
          borderColor: isActive ? '#1A6BFF' : '#E2E8F0',
          backgroundColor: isActive ? '#EEF4FF' : open ? '#F8FAFC' : 'transparent',
          color: isActive ? '#1A6BFF' : '#64748B',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '11px',
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {isActive ? `${label}: ${value}` : label}
        {!locked && isActive && <X size={9} onClick={e => { e.stopPropagation(); onChange(''); }} style={{ marginLeft: 2 }} />}
        {!locked && !isActive && <ChevronDown size={10} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden py-1 max-h-48 overflow-y-auto"
          style={{ minWidth: 160, backgroundColor: '#FFFFFF', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', border: '1px solid #E5E9F0' }}
        >
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-xs text-gray-700"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const FALLBACK_ESP_ABBR: Record<string, string> = {
  "ARQUEOLOGÍA": "ARQL",
  "ARQUITECTURA": "ARQ",
  "COMUNICACIONES": "TIC",
  "ELÉCTRICAS": "IIEE",
  "ELECTROMECÁNICAS": "IMM",
  "EQUIPAMIENTO BIOMÉDICO": "EQB",
  "ESTRUCTURAS": "EST",
  "INSTALACIONES DE COMUNICACIONES": "TIC",
  "INSTALACIONES ELÉCTRICAS Y MECÁNICAS": "IEM",
  "INSTALACIONES SANITARIAS": "IISS",
  "OBRAS PROVISIONALES": "OP",
  "PLAN DE MANEJO AMBIENTAL": "PMA",
  "SEGURIDAD": "SEG"
};

function GroupDateDropdown({ value, onChange }: { value: 'none' | 'desc' | 'asc', onChange: (val: 'none' | 'desc' | 'asc') => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isActive = value !== 'none';
  const label = value === 'desc' ? 'Días (Nuevos)' : value === 'asc' ? 'Días (Antiguos)' : 'Agrupar Día';

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2.5 py-1 rounded-md border whitespace-nowrap transition-all"
        style={{
          borderColor: isActive ? '#1A6BFF' : '#E2E8F0',
          backgroundColor: isActive ? '#EEF4FF' : open ? '#F8FAFC' : 'transparent',
          color: isActive ? '#1A6BFF' : '#64748B',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '11px',
          fontWeight: isActive ? 600 : 400,
        }}
      >
        <Calendar size={11} />
        {label}
        {isActive && <X size={9} onClick={e => { e.stopPropagation(); onChange('none'); }} style={{ marginLeft: 2 }} className="hover:text-red-500" />}
        {!isActive && <ChevronDown size={10} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden py-1 shadow-lg border border-gray-200"
          style={{ minWidth: 180, backgroundColor: '#FFFFFF' }}
        >
          <button onClick={() => { onChange('desc'); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-2">
            <ArrowDown size={12} className="text-blue-500" /> Más recientes primero
          </button>
          <button onClick={() => { onChange('asc'); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-2">
            <ArrowUp size={12} className="text-blue-500" /> Más antiguos primero
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <button onClick={() => { onChange('none'); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-xs text-red-600">
            No agrupar (Vista plana)
          </button>
        </div>
      )}
    </div>
  );
}

function UnifiedDateFilter({ 
  period, setPeriod, 
  dateRange, setDateRange 
}: { 
  period: 'esta_semana' | 'semana_anterior' | 'mes_actual' | 'mes_anterior' | 'todo', 
  setPeriod: (val: any) => void,
  dateRange: { start: string, end: string },
  setDateRange: (val: any) => void
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const labels: Record<string, string> = {
    'esta_semana': 'Esta Semana',
    'semana_anterior': 'Semana Anterior',
    'mes_actual': 'Mes Actual',
    'mes_anterior': 'Mes Anterior',
    'todo': 'Todas las Fechas'
  };

  // Determine button text
  const isCustomDate = dateRange.start || dateRange.end;
  let displayText = '';
  if (isCustomDate) {
    if (dateRange.start && dateRange.end) {
      displayText = `${dateRange.start.slice(8,10)}/${dateRange.start.slice(5,7)} - ${dateRange.end.slice(8,10)}/${dateRange.end.slice(5,7)}`;
    } else if (dateRange.start) {
      displayText = `Desde ${dateRange.start.slice(8,10)}/${dateRange.start.slice(5,7)}`;
    } else {
      displayText = `Hasta ${dateRange.end.slice(8,10)}/${dateRange.end.slice(5,7)}`;
    }
  } else {
    displayText = labels[period] || 'Todas las Fechas';
  }

  const isActive = isCustomDate || period !== 'todo';

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full whitespace-nowrap transition-all select-none border shadow-sm"
        style={{
          borderColor: isActive ? '#1A6BFF' : '#E5E9F0',
          backgroundColor: isActive ? '#1A6BFF' : open ? '#F8FAFC' : '#FFFFFF',
          color: isActive ? '#FFFFFF' : '#334155',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '11px',
          fontWeight: isActive ? 600 : 500,
        }}
      >
        <Calendar size={13} style={{ color: isActive ? '#FFFFFF' : '#94A3B8' }} />
        <span>{displayText}</span>
        {isActive ? (
          <X size={12} className="hover:scale-125 transition-transform cursor-pointer ml-1" onClick={(e) => { 
            e.stopPropagation(); 
            setDateRange({start: '', end: ''}); 
            setPeriod('todo'); 
          }} />
        ) : (
          <ChevronDown size={12} className={`transition-transform duration-200 ml-1 ${open ? 'rotate-180' : ''}`} style={{ opacity: 0.8 }} />
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 rounded-[1.2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex p-2.5 gap-3"
          style={{ backgroundColor: '#FFFFFF', minWidth: '280px', transformOrigin: 'top left', animation: 'fadeIn 0.15s ease-out' }}
        >
          {/* Quick Selects */}
          <div className="flex flex-col min-w-[125px] border-r border-gray-100 pr-3 gap-0.5">
            <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 mb-1 ml-2">Periodos Rápidos</span>
            {(Object.keys(labels) as Array<keyof typeof labels>).map(k => (
              <button
                key={k}
                onClick={() => { 
                  setDateRange({start: '', end: ''}); 
                  setPeriod(k); 
                  setOpen(false); 
                }}
                className={`text-left px-2.5 py-1.5 rounded-md text-[11px] transition-all ${
                  (!isCustomDate && period === k) 
                  ? 'bg-blue-50 text-blue-600 font-bold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                {labels[k]}
              </button>
            ))}
          </div>

          {/* Custom Dates */}
          <div className="flex flex-col min-w-[125px] justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 mb-0.5">Rango Específico</span>
              <div>
                <label className="text-[9px] font-semibold text-gray-500 mb-0.5 block">Desde</label>
                <input 
                  type="date" 
                  value={dateRange.start} 
                  onChange={e => {
                    setPeriod('todo');
                    setDateRange({...dateRange, start: e.target.value});
                  }} 
                  className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500 text-gray-700 bg-gray-50 focus:bg-white transition-colors" 
                />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-gray-500 mb-0.5 block">Hasta</label>
                <input 
                  type="date" 
                  value={dateRange.end} 
                  onChange={e => {
                    setPeriod('todo');
                    setDateRange({...dateRange, end: e.target.value});
                  }} 
                  className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500 text-gray-700 bg-gray-50 focus:bg-white transition-colors" 
                />
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 w-full bg-[#1A6BFF] hover:bg-blue-600 text-white text-[11px] py-1.5 rounded-md font-medium transition-colors"
            >
              Aplicar Filtro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PlanoDropdownProps {
  value: string;
  onChange: (val: string) => void;
  metrados: any[];
  filterEspecialidad: string;
}

function PlanoDropdown({ value, onChange, metrados, filterEspecialidad }: PlanoDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const options = useMemo(() => {
    let base = metrados;
    if (filterEspecialidad) {
      base = base.filter(m => m.especialidad === filterEspecialidad);
    }
    
    const uniqueOptions = new Map<string, string>(); // value -> label
    const sinPlanoMotivos = new Set<string>();

    base.forEach(m => {
      if (m.sin_plano) {
        sinPlanoMotivos.add(m.obs_motivo || 'otros');
      } else if (m.plano_num) {
        const esp = m.plano_esp || (m.especialidad ? (FALLBACK_ESP_ABBR[m.especialidad.toUpperCase()] || m.especialidad.substring(0,3).toUpperCase()) : '---');
        const sist = m.plano_sist || 'GEN';
        const val = JSON.stringify({ s: m.plano_sist || '', n: String(m.plano_num) });
        const label = `[${esp}] - [${sist}] - ${m.plano_num}`;
        if (!uniqueOptions.has(val)) {
          uniqueOptions.set(val, label);
        }
      }
    });

    let result = Array.from(uniqueOptions.entries()).map(([val, label]) => ({ val, label }));
    
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o => o.label.toLowerCase().includes(q));
    }

    // Sort alphabetically by label
    result.sort((a, b) => a.label.localeCompare(b.label));

    // Add "No presenta" motifs at the top
    const sinPlanoLabels: Record<string, string> = {
      'extraviado': 'Plano no localizado en obra',
      'en_tramite': 'Plano en tramite / pendiente de emision',
      'sin_diseno': 'Elemento sin diseno formal',
      'otros': 'Sin plano (Otros)'
    };

    const sinPlanoOptions = Array.from(sinPlanoMotivos).map(motivo => {
      return { 
        val: JSON.stringify({ sinPlano: true, motivo }), 
        label: `⚠️ ${sinPlanoLabels[motivo] || sinPlanoLabels['otros']}` 
      };
    });
    
    // Sort sin planos
    sinPlanoOptions.sort((a, b) => a.label.localeCompare(b.label));

    sinPlanoOptions.reverse().forEach(opt => {
      if (!search.trim() || opt.label.toLowerCase().includes(search.toLowerCase())) {
        result.unshift(opt);
      }
    });

    return result;
  }, [metrados, filterEspecialidad, search]);

  const isActive = Boolean(value);

  // Derive display label
  let displayLabel = 'Planos';
  if (isActive) {
    try {
      const parsed = JSON.parse(value);
      if (parsed.sinPlano) {
        const sinPlanoLabels: Record<string, string> = {
          'extraviado': 'No localizado',
          'en_tramite': 'En trámite',
          'sin_diseno': 'Sin diseño',
          'otros': 'Sin plano'
        };
        displayLabel = `⚠️ ${sinPlanoLabels[parsed.motivo] || 'Sin plano'}`;
      } else {
        displayLabel = parsed.n || 'Plano';
      }
    } catch (e) {
      displayLabel = 'Plano';
    }
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-1 px-3 py-1.5 rounded-md border whitespace-nowrap transition-all shadow-sm"
        style={{
          borderColor: isActive ? '#1A6BFF' : '#E2E8F0',
          backgroundColor: isActive ? '#EEF4FF' : open ? '#FFFFFF' : '#FFFFFF',
          color: isActive ? '#1A6BFF' : '#475569',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '11px',
          fontWeight: isActive ? 600 : 500,
          minWidth: '100px'
        }}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {isActive ? <X size={11} className="hover:text-red-500 flex-shrink-0" onClick={e => { e.stopPropagation(); onChange(''); }} /> : <Search size={11} className="text-gray-400 flex-shrink-0" />}
          <span className="truncate max-w-[120px]">{displayLabel}</span>
        </div>
        <ChevronDown size={11} className={`transition-transform duration-150 ml-1 flex-shrink-0 ${open ? 'rotate-180' : ''}`} style={{ opacity: 0.6 }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden shadow-xl border border-gray-200 flex flex-col"
          style={{ minWidth: 260, maxHeight: 320, backgroundColor: '#FFFFFF' }}
        >
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por sistema o N° plano..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 py-1">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs text-gray-500">No se encontraron planos</div>
            ) : (
              options.map(opt => (
                <button 
                  key={opt.val}
                  onClick={() => { onChange(opt.val); setOpen(false); setSearch(''); }} 
                  className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors flex items-center gap-2 ${value === opt.val ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {value === opt.val ? <Check size={12} className="text-blue-600 flex-shrink-0" /> : <div className="w-3 flex-shrink-0" />}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
          {isActive && (
            <div className="p-1 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                className="w-full py-1.5 text-center text-[10px] font-bold text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                Limpiar Filtro
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Metrados() {
  const { metrados, partidas, isLoading, fetchMetrados, deleteMetrado, fetchCatalogosGlobales } = useMetradosStore();
  const { rightPanelVisible, setRightPanelVisible } = useAppContext();

  const [contextoTab, setContextoTab] = useState<'Todo' | 'Expediente' | 'ACT/PC'>('Todo');
  const [estadoTab, setEstadoTab] = useState<'Todos' | 'Liberados' | 'No Liberados'>('Todos');
  const [viewMode, setViewMode] = useState<'Detallada' | 'Resumida' | 'Valorizada'>('Detallada');
  const [period, setPeriod] = useState<'esta_semana' | 'semana_anterior' | 'todo'>('esta_semana');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupByDate, setGroupByDate] = useState<'none' | 'desc' | 'asc'>('none');
  
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmittingMasivo, setIsSubmittingMasivo] = useState(false);

  const handleLiberarMasivo = async (estado: boolean) => {
    setIsSubmittingMasivo(true);
    const res = await useMetradosStore.getState().liberarMetradosMasivo(Array.from(selectedIds), estado);
    setIsSubmittingMasivo(false);
    if (res.success) setSelectedIds(new Set());
    else alert("Error: " + res.error);
  };

  const { isReadOnlyMetrados, canEditMetrado, user, isGerencia, isAdminPresupuesto } = useAuthStore();
  const isSuper = isGerencia() || isAdminPresupuesto();
  const canSeeAll = isSuper || (user?.especialidades?.includes('TODAS'));
  
  // Si no puede ver todas y solo tiene 1 especialidad asignada, bloqueamos el combo a esa única especialidad
  const isSingleSpecialty = !canSeeAll && user?.especialidades?.length === 1;
  const lockedEspecialidad = isSingleSpecialty ? user.especialidades[0] : '';
  const initialEspecialidad = isSingleSpecialty ? user.especialidades[0] : '';

  const [filterEspecialidad, setFilterEspecialidad] = useState(initialEspecialidad);
  const [filterAutor, setFilterAutor] = useState('');
  const [filterFrente, setFilterFrente] = useState('');
  const [filterBloque, setFilterBloque] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [filterCuadrilla, setFilterCuadrilla] = useState('');
  const [filterPlano, setFilterPlano] = useState('');
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    fetchCatalogosGlobales();
  }, []);


  const activeFilterCount = [filterEspecialidad, filterAutor, filterFrente, filterBloque, filterNivel, filterCuadrilla, filterPlano].filter(Boolean).length;

  const uniqueOptions = (key: keyof MetradoRecord) => {
    if (key === 'especialidad') {
      const vals = new Set<string>();
      metrados.forEach(m => { if (m.especialidad) vals.add(m.especialidad); });
      let opts = Array.from(vals);
      if (!canSeeAll && user?.especialidades) {
        opts = opts.filter(opt => user.especialidades.includes(opt));
      }
      return opts.sort();
    }
    if (key === 'cuadrilla') {
      const vals = new Set<string>();
      metrados.forEach(m => {
        const val = m.cuadrilla;
        if (!val || val === '-') vals.add('Sin cuadrilla');
        else vals.add(val);

        if (!m.obrero_nombre || m.obrero_nombre.trim() === '' || m.obrero_nombre === '-') {
          vals.add('Sin obreros');
        }
      });
      const arr = Array.from(vals);
      arr.sort((a, b) => {
        const aSin = a.startsWith('Sin ');
        const bSin = b.startsWith('Sin ');
        if (aSin && !bSin) return -1;
        if (!aSin && bSin) return 1;
        return a.localeCompare(b);
      });
      return arr;
    }

    const vals = new Set(metrados.map(m => m[key]).filter(Boolean));
    const arr = Array.from(vals) as string[];
    arr.sort((a, b) => a.localeCompare(b));
    return arr;
  };

  const FILTER_CONFIG = [
    { label: 'Especialidad', options: uniqueOptions('especialidad'), value: filterEspecialidad, onChange: setFilterEspecialidad, locked: !!lockedEspecialidad },
    { label: 'Autor', options: uniqueOptions('firma_ingeniero'), value: filterAutor, onChange: setFilterAutor },
    { label: 'Cuadrilla', options: uniqueOptions('cuadrilla'), value: filterCuadrilla, onChange: setFilterCuadrilla },
    { label: 'Frentes', options: uniqueOptions('frente_trabajo'), value: filterFrente, onChange: setFilterFrente },
    { label: 'Bloques', options: uniqueOptions('bloque_sector'), value: filterBloque, onChange: setFilterBloque },
    { label: 'Niveles', options: uniqueOptions('nivel_piso'), value: filterNivel, onChange: setFilterNivel },
  ];

  const { setEditingMetrado } = useMetradosStore();

  const startEditing = (row: any) => {
    if (!canEditMetrado(row.fechaFull, row.autor)) return;
    const metradoOriginal = metrados.find(m => String(m.id) === String(row.id));
    if (metradoOriginal) {
      setEditingMetrado(metradoOriginal);
      setRightPanelVisible(true);
    }
  };

  const handleDelete = (id: string, fechaFull: string, autor: string) => {
    if (isReadOnlyMetrados() || !canEditMetrado(fechaFull, autor)) return;
    if (window.confirm("⚠️ ADVERTENCIA: ¿Estás seguro de eliminar este metrado? Esta acción no se puede deshacer.")) {
      if (window.confirm("⚠️ ESTE CAMBIO NO SE PODRÁ REVERTIR ⚠️\n¿DESEA BORRAR?")) {
        deleteMetrado(id);
      }
    }
  };

  const effectiveDateRange = useMemo(() => {
    if (dateRange.start || dateRange.end) {
      return { startStr: dateRange.start || '', endStr: dateRange.end || '' };
    }
    
    if (['esta_semana', 'semana_anterior', 'mes_actual', 'mes_anterior'].includes(period)) {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      let startStr = '';
      let endStr = '';

      if (period === 'esta_semana' || period === 'semana_anterior') {
        const day = now.getDay();
        const diffToMonday = day === 0 ? 6 : day - 1;
        
        const monday = new Date(now);
        monday.setDate(now.getDate() - diffToMonday);
        
        if (period === 'semana_anterior') {
          monday.setDate(monday.getDate() - 7);
        }
        
        const saturday = new Date(monday);
        saturday.setDate(monday.getDate() + 5);
        
        startStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
        endStr = `${saturday.getFullYear()}-${pad(saturday.getMonth() + 1)}-${pad(saturday.getDate())}`;
      } else if (period === 'mes_actual') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startStr = `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`;
        endStr = `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`;
      } else if (period === 'mes_anterior') {
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        startStr = `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}-${pad(firstDay.getDate())}`;
        endStr = `${lastDay.getFullYear()}-${pad(lastDay.getMonth() + 1)}-${pad(lastDay.getDate())}`;
      }
      return { startStr, endStr };
    }
    return { startStr: '', endStr: '' };
  }, [dateRange, period]);

  // Memoizamos el mapa de partidas para que no se re-construya en cada tipeo de búsqueda
  const partidasMap = useMemo(() => new Map(partidas.map(p => [p.id, p])), [partidas]);

  const filteredMetrados = useMemo(() => {
    const searchLower = searchTerm?.toLowerCase() || '';
    
    // Parseo del filtro de plano una sola vez
    let parsedPlano = null;
    if (filterPlano) {
      try { parsedPlano = JSON.parse(filterPlano); } 
      catch (e) { console.error('Plano filter parse error', e); }
    }

    let baseData = metrados;
    // 0. Base filtering (Security): Only show allowed specialties
    if (!canSeeAll && user?.especialidades) {
      baseData = baseData.filter(m => user.especialidades.includes(m.especialidad));
    }

    return baseData.filter(m => {
      // 1. Search term
      if (searchLower) {
        const matches = m.snapshot_codigo?.toLowerCase().includes(searchLower) ||
                        m.snapshot_descripcion?.toLowerCase().includes(searchLower) ||
                        m.cuadrilla?.toLowerCase().includes(searchLower) ||
                        m.obrero_nombre?.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      // 2. Especialidad
      if (filterEspecialidad && m.especialidad !== filterEspecialidad) return false;

      // 3. Estado (Liberado / No Liberado)
      if (estadoTab === 'Liberados' && m.is_liberado !== true) return false;
      if (estadoTab === 'No Liberados' && m.is_liberado === true) return false;

      // 4. Contexto (Expediente / Adicionales)
      if (contextoTab === 'Expediente' || contextoTab === 'ACT/PC') {
        const p = partidasMap.get(m.partida_id);
        const isPC = p?.es_adicional || p?.modificacion === 'PC' || m.snapshot_codigo?.startsWith('PC');
        if (contextoTab === 'Expediente' && isPC) return false;
        if (contextoTab === 'ACT/PC' && !isPC) return false;
      }

      // 5. Filtros exactos
      if (filterAutor && m.firma_ingeniero !== filterAutor) return false;
      if (filterFrente && m.frente_trabajo !== filterFrente) return false;
      if (filterBloque && m.bloque_sector !== filterBloque) return false;
      if (filterNivel && m.nivel_piso !== filterNivel) return false;

      // 6. Cuadrilla
      if (filterCuadrilla) {
        if (filterCuadrilla === 'Sin cuadrilla') {
          if (m.cuadrilla && m.cuadrilla !== '-') return false;
        } else if (filterCuadrilla === 'Sin obreros') {
          if (m.obrero_nombre && m.obrero_nombre.trim() !== '' && m.obrero_nombre !== '-') return false;
        } else {
          if (m.cuadrilla !== filterCuadrilla) return false;
        }
      }

      // 7. Plano
      if (parsedPlano) {
        if (parsedPlano.sinPlano) {
          if (!m.sin_plano || (m.obs_motivo || 'otros') !== parsedPlano.motivo) return false;
        } else {
          if (m.sin_plano || String(m.plano_num) !== parsedPlano.n || (m.plano_sist || '') !== parsedPlano.s) return false;
        }
      }

      // 8. Rango de fechas (usando effectiveDateRange)
      if (effectiveDateRange.startStr && m.fecha_ejecucion < effectiveDateRange.startStr) return false;
      if (effectiveDateRange.endStr && m.fecha_ejecucion > effectiveDateRange.endStr) return false;

      return true;
    });
  }, [metrados, partidasMap, searchTerm, estadoTab, contextoTab, filterEspecialidad, filterAutor, filterFrente, filterBloque, filterNivel, filterCuadrilla, filterPlano, effectiveDateRange]);

  useEffect(() => {
    if (period === 'todo' && !dateRange.start && !dateRange.end) {
      fetchMetrados(true);
    } else {
      fetchMetrados(false, effectiveDateRange.startStr, effectiveDateRange.endStr);
    }
  }, [effectiveDateRange, period, dateRange]);

  const displayData = useMemo(() => {
    const mapped = filteredMetrados.map(m => {
      // FIX: Parsea manualmente el string YYYY-MM-DD para evitar el desfase de zona horaria de JS
      const [, mm, dd] = (m.fecha_ejecucion || '').split('-');
      const fechaLocalStr = dd && mm ? `${dd}/${mm}` : '-';

      return {
        id: m.id,
        fechaFull: m.fecha_ejecucion,
        fecha: fechaLocalStr,
        frente: m.frente_trabajo || '-',
        bloque: m.bloque_sector || '-',
        nivel: m.nivel_piso || '-',
        item: m.snapshot_codigo || '-',
        descripcion: m.snapshot_descripcion || '-',
        und: m.unidad || '-',
        cant: m.cantidad_elementos || 0,
        long: m.medida_largo_area || 0,
        ancho: m.medida_ancho_empalme || 0,
        alt: m.medida_alto_gancho || 0,
        parcial: m.resultado_parcial || 0,
        veces: m.nro_repeticiones || 0,
        autor: m.firma_ingeniero || '-',
        total: m.resultado_total || 0,
        precio: (m as any).precio_unitario || 0,
        monto: (m as any).monto_total || 0,
        tipo: getTipo(m.snapshot_codigo || ''),
        cuadrilla: m.cuadrilla || '-',
        obrero_nombre: m.obrero_nombre || '-',
        elemento: m.elemento_desc || '-',
        detalle: m.detalle_desc || '-',
      };
    });

    return mapped;
  }, [filteredMetrados]);

  const grandTotal = displayData.reduce((s, r) => s + r.total, 0);
  // const grandMonto = displayData.reduce((s, r) => s + r.monto, 0);

  const BASE_COLS: { key: string; label: string; width?: number; align?: 'right' | 'center' | 'left' }[] = [
    { key: 'fecha', label: 'FECHA', width: 68, align: 'center' },
    { key: 'frente', label: 'FR', width: 40, align: 'center' },
    { key: 'bloque', label: 'BL', width: 40, align: 'center' },
    { key: 'nivel', label: 'NL', width: 40, align: 'center' },
    { key: 'item', label: 'ÍTEM', width: 90 },
    { key: 'descripcion', label: 'DESCRIPCIÓN', width: 260 },
    { key: 'und', label: 'UND', width: 52, align: 'center' },
    { key: 'cant', label: 'CANT.', width: 52, align: 'right' },
  ];

  const DIMENSION_COLS: { key: string; label: string; width?: number; align?: 'right' | 'center' | 'left' }[] = [
    { key: 'long', label: 'LONG/ÁREA', width: 65, align: 'right' },
    { key: 'ancho', label: 'ANCHO', width: 55, align: 'right' },
    { key: 'alt', label: 'ALT/GAN.', width: 52, align: 'right' },
    { key: 'parcial', label: 'PARCIAL', width: 60, align: 'right' },
    { key: 'veces', label: 'VECES', width: 52, align: 'right' },
  ];

  const VALOR_COLS: { key: string; label: string; width?: number; align?: 'right' | 'center' | 'left' }[] = [
    { key: 'precio', label: 'PRECIO U. (S/)', width: 88, align: 'right' },
    { key: 'monto', label: 'MONTO (S/)', width: 96, align: 'right' },
  ];

  const END_COLS: { key: string; label: string; width?: number; align?: 'right' | 'center' | 'left' }[] = [
    { key: 'autor', label: 'AUTOR', width: 60, align: 'center' },
    { key: 'total', label: 'TOTAL MET.', width: 88, align: 'right' },
  ];


  const exportToExcel = async () => {
    setExportando(true);
    try {
      await exportarMetradosExcel({
        especialidad: filterEspecialidad || undefined,
        frente:       filterFrente       || undefined,
        bloque:       filterBloque       || undefined,
        fechaDesde:   effectiveDateRange.startStr || undefined,
        fechaHasta:   effectiveDateRange.endStr || undefined,
      }, filteredMetrados);
    } catch (e: any) {
      alert(`Error al exportar: ${e.message}`);
    } finally {
      setExportando(false);
    }
  };

  const exportToValorizadoExcel = async () => {
    setExportando(true);
    try {
      await exportarValorizadosExcel({
        especialidad: filterEspecialidad || undefined,
        frente:       filterFrente       || undefined,
        bloque:       filterBloque       || undefined,
        fechaDesde:   effectiveDateRange.startStr || undefined,
        fechaHasta:   effectiveDateRange.endStr || undefined,
      }, filteredMetrados);
    } catch (e: any) {
      alert(`Error al exportar valorizado: ${e.message}`);
    } finally {
      setExportando(false);
    }
  };
  const exportToFormato1 = async () => {
    setExportando(true);
    try {
      await exportarFormato1Excel({
        especialidad: filterEspecialidad || undefined,
        frente:       filterFrente       || undefined,
        bloque:       filterBloque       || undefined,
        fechaDesde:   effectiveDateRange.startStr || undefined,
        fechaHasta:   effectiveDateRange.endStr || undefined,
      }, filteredMetrados);
    } catch (e: any) {
      alert(`Error al exportar Formato 1: ${e.message}`);
    } finally {
      setExportando(false);
    }
  };

  const exportToResumen = async () => {
    setExportando(true);
    try {
      await exportarResumenExcel({
        especialidad: filterEspecialidad || undefined,
        frente:       filterFrente       || undefined,
        bloque:       filterBloque       || undefined,
        fechaDesde:   effectiveDateRange.startStr || undefined,
        fechaHasta:   effectiveDateRange.endStr || undefined,
      }, filteredMetrados);
    } catch (e: any) {
      alert(`Error al exportar Resumen: ${e.message}`);
    } finally {
      setExportando(false);
    }
  };

  const exportToSaldos = async () => {
    setExportando(true);
    try {
      await exportarSaldosExcel({
        especialidad: filterEspecialidad || undefined,
        frente:       filterFrente       || undefined,
        bloque:       filterBloque       || undefined,
        fechaDesde:   effectiveDateRange.startStr || undefined,
        fechaHasta:   effectiveDateRange.endStr || undefined,
      }, filteredMetrados);
    } catch (e: any) {
      alert(`Error al exportar Saldos: ${e.message}`);
    } finally {
      setExportando(false);
    }
  };

  const headerCellStyle = {
    background: 'linear-gradient(180deg, #EAEDF2 0%, #D3D6DB 100%)',
    color: '#2D3748',
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.07em',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 3px rgba(0,0,0,0.06)',
    borderBottom: '1.5px solid #B8BCC6',
    borderRight: '1px solid #C8CCD4',
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F6FA] min-w-0">
      
      {/* ── TOPBAR 1 ──────────────────────────────────────── */}
      <div className="flex items-center px-4 flex-shrink-0 gap-3 2xl:gap-5" style={{ height: 56, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E9F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <h1 className="font-bold whitespace-nowrap" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif', fontSize: '15px' }}>
            Planilla de Metrados Dinámica
          </h1>
        </div>

        {/* ── CENTRAL TABS (CONTEXTO) ────────────────────── */}
        <div className="flex items-center flex-shrink-0">
          <div className="flex bg-[#F1F5F9] p-0.5 rounded-full shadow-inner border border-[#E2E8F0]">
            {(['Todo', 'Expediente', 'ACT/PC'] as const).map(tab => {
              const isActive = contextoTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setContextoTab(tab)}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-all flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-white text-[#1A2B45] font-bold shadow-sm ring-1 ring-black/5' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                  style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                >
                  {tab === 'Expediente' && <FileText size={12} className={isActive ? 'text-blue-600' : 'text-gray-400'} />}
                  {tab === 'ACT/PC' && <AlertCircle size={12} className={isActive ? 'text-orange-500' : 'text-gray-400'} />}
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center flex-shrink-0">
          <div className="flex rounded-full p-0.5" style={{ backgroundColor: '#F1F5F9' }}>
            {(['Todos', 'Liberados', 'No Liberados'] as const).map(tab => {
              const isActive = estadoTab === tab;
              const bgColors: Record<string, string> = {
                'Todos': '#1A6BFF',
                'Liberados': '#16A34A',
                'No Liberados': '#F59E0B'
              };
              const shadowColors: Record<string, string> = {
                'Todos': 'rgba(26,107,255,0.3)',
                'Liberados': 'rgba(22,163,74,0.3)',
                'No Liberados': 'rgba(245,158,11,0.3)'
              };

              return (
                <button
                  key={tab}
                  onClick={() => {
                    setEstadoTab(tab);
                  }}
                  className="px-2.5 py-1 rounded-full transition-all"
                  style={{
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '11px',
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive ? bgColors[tab] : 'transparent',
                    color: isActive ? '#FFFFFF' : '#64748B',
                    boxShadow: isActive ? `0 1px 4px ${shadowColors[tab]}` : 'none',
                  }}
                >
                  {tab === 'Todos' ? 'Registro General' : tab === 'Liberados' ? 'Liberados' : 'No Liberados'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center rounded-full border border-gray-200 bg-white p-0.5 shadow-sm flex-shrink-0">
          <UnifiedDateFilter period={period} setPeriod={setPeriod} dateRange={dateRange} setDateRange={setDateRange} />
        </div>

        <div className="flex-1 max-w-[280px] min-w-[180px]">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar frente, código, obrero..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 w-full bg-gray-50 hover:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <ActiveUsers />
          
          {!isReadOnlyMetrados() && (
            <button
              onClick={() => setRightPanelVisible(!rightPanelVisible)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all"
              style={{
                borderColor: rightPanelVisible ? '#93C5FD' : '#D4D8DE',
                backgroundColor: rightPanelVisible ? '#EEF4FF' : '#F6F8FA',
                color: rightPanelVisible ? '#1A6BFF' : '#4A5568',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              {rightPanelVisible ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              <span className="hidden sm:inline">{rightPanelVisible ? 'Cerrar panel' : 'Insertar'}</span>
            </button>
          )}



          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mr-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
              <span className="text-[11px] font-bold text-blue-800 whitespace-nowrap">{selectedIds.size} selec.</span>
              <button
                onClick={() => handleLiberarMasivo(true)}
                disabled={isSubmittingMasivo}
                className="flex items-center justify-center gap-1 px-3 py-1.5 min-w-[70px] min-h-[32px] rounded text-white bg-green-600 hover:bg-green-700 transition-colors text-[11px] font-bold disabled:opacity-50"
              >
                Aprobar
              </button>
              <button
                onClick={() => handleLiberarMasivo(false)}
                disabled={isSubmittingMasivo}
                className="flex items-center justify-center gap-1 px-3 py-1.5 min-w-[70px] min-h-[32px] rounded text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors text-[11px] font-bold disabled:opacity-50"
              >
                Revertir
              </button>
            </div>
          )}

          <ExportDropdown 
            onExportExcel={exportToExcel} 
            onExportValorizado={exportToValorizadoExcel}
            onExport1={exportToFormato1}
            onExportResumen={exportToResumen}
            onExportSaldos={exportToSaldos}
            loading={exportando} 
          />
        </div>
      </div>

      {/* ── FILTER BAR 2 ──────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-5 flex-shrink-0 overflow-visible relative z-20" style={{ height: 44, backgroundColor: '#FAFBFC', borderBottom: '1px solid #E5E9F0' }}>
        {FILTER_CONFIG.map(fc => <FilterDropdown key={fc.label} label={fc.label} options={fc.options} value={fc.value} onChange={fc.onChange} locked={fc.locked} />)}

        <div className="flex items-center rounded-md border p-0.5 flex-shrink-0" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
          {(['Detallada', 'Resumida', 'Valorizada'] as const).map(mode => {
            const isActive = viewMode === mode;
            const isDisabled = false;
            return (
              <button
                key={mode}
                onClick={() => !isDisabled && setViewMode(mode)}
                disabled={isDisabled}
                className={`px-2 py-1 text-[11px] rounded transition-all whitespace-nowrap ${isActive ? 'bg-slate-100 font-bold text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                title={""}
              >
                Vista {mode}
              </button>
            );
          })}
        </div>

        <GroupDateDropdown value={groupByDate} onChange={setGroupByDate} />

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#EEF4FF', color: '#1A6BFF', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700 }}>
              {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { 
                if (!lockedEspecialidad) setFilterEspecialidad(''); 
                setFilterAutor(''); setFilterFrente(''); setFilterBloque(''); setFilterNivel(''); setFilterCuadrilla(''); setFilterPlano(''); 
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md whitespace-nowrap transition-all hover:bg-red-50"
              style={{ color: '#EF4444', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}
            >
              <X size={9} />
              Limpiar filtros
            </button>
          </div>
        )}

        <div className="flex-1" />

        <PlanoDropdown value={filterPlano} onChange={setFilterPlano} metrados={metrados} filterEspecialidad={filterEspecialidad} />

        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {(Object.entries(TIPO_CONFIG) as [TipoMetrado, { dot: string }][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
              <span style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTENIDO TABLA ───────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-white relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        )}
        <MetradosTreeGrid 
          metrados={filteredMetrados} 
          partidas={useMetradosStore.getState().partidas} 
          onEdit={startEditing} 
          onDelete={(m) => handleDelete(String(m.id), m.fecha_ejecucion, m.firma_ingeniero || '')} 
          selectedIds={selectedIds}
          onToggleSelection={(id) => {
            const newSet = new Set(selectedIds);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            setSelectedIds(newSet);
          }}
          onSelectAll={(ids) => {
            if (ids.length === 0) setSelectedIds(new Set());
            else setSelectedIds(new Set(ids));
          }}
          groupByDate={groupByDate}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}
