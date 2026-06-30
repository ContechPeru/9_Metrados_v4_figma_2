import { useState, useRef, useEffect, Fragment } from 'react';
import {
  Download, Calendar, ChevronDown, Trash2,
  ArrowUpDown, ArrowUp, ArrowDown,
  Check, X, PencilLine, PanelRightOpen, PanelRightClose,
  FileText, FileSpreadsheet, FileCode2, ClipboardList, Printer,
  LayoutList, Plus,
} from 'lucide-react';
import { metradosData, type MetradoRow, type TipoMetrado } from '../../data/mockData';
import { useAppContext } from '../../context/AppContext';

type ViewTab = 'Detallada' | 'Resumida' | 'Valorizada';
type SortDir = 'asc' | 'desc' | null;

const TIPO_CONFIG: Record<TipoMetrado, { bg: string; text: string; dot: string }> = {
  PC: { bg: '#FFF0E6', text: '#C04D00', dot: '#FF6B1A' },
  MM: { bg: '#EEF4FF', text: '#1251BF', dot: '#1A6BFF' },
  PN: { bg: '#ECFDF5', text: '#065F46', dot: '#22C55E' },
  DD: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  ET: { bg: '#F3E8FF', text: '#5B21B6', dot: '#8B5CF6' },
};

const UND_OPTIONS = ['m³', 'm²', 'm', 'ml', 'kg', 'ton', 'pza', 'pto', 'glb', 'und', 'lta', 'bls'];

const DESC_DATABASE = [
  'Excavación masiva de suelos sueltos con equipo',
  "Concreto f'c=210 kg/cm² para zapatas aisladas",
  "Acero fy=4200 kg/cm² grado 60 en zapatas Ø5/8\"",
  'Encofrado y desencofrado de muros de contención',
  'Salida de techo para centro de luz con cable NHX-90',
  'Tubería PVC SAP Ø4\" agua fría tendido horizontal',
  'Tarrajeo rayado o primario en muros interiores',
  "Concreto f'c=280 kg/cm² para columnas estructurales",
  "Acero fy=4200 kg/cm² en columnas Ø3/4\" (fierrería)",
  'Ducto rectangular 400×200mm plancha galvanizada',
  "Losa aligerada e=0.20m f'c=210 kg/cm² viguetas",
  'Piso porcelanato importado 60×60 alto tráfico',
  'Inodoro losa vitrificada tanque bajo color blanco',
  'Tablero distribución TD-01 12 circuitos c/llave ther.',
  'Relleno compactado c/material préstamo c/equipo',
  'Acero corrugado fy=4200 kg/cm² barras principales',
  'Acabado pulido de pisos con helicóptero mecánico',
  'Anclaje metálico expansible 3/8"×3"',
  'Carpintería metálica puerta LAF e=2mm',
  'Pintura látex lavable 2 manos en muros interiores',
  "Concreto f'c=175 kg/cm² para sobrecimientos",
  'Solado de concreto e=4" para cimentación corrida',
  'Malla de acero corrugado electrosoldada 4/150',
  'Tubería CPVC para agua caliente Ø1/2"',
  'Vidrio templado 8mm doble hoja perfil aluminio',
  'Canaleta de concreto e=10cm para desagüe pluvial',
  'Murete de ladrillo King Kong 18 huecos e=15cm',
  'Impermeabilización de cisterna con membrana',
];

const EXPORT_OPTIONS = [
  { icon: FileText, label: 'Exportar PDF', color: '#EF4444' },
  { icon: FileSpreadsheet, label: 'Exportar Excel', color: '#22C55E' },
  { icon: FileCode2, label: 'Exportar CSV', color: '#F59E0B' },
  { icon: ClipboardList, label: 'Metrados completos', color: '#1A6BFF' },
  { icon: LayoutList, label: 'Exportar resumen', color: '#8B5CF6' },
  { icon: Printer, label: 'Imprimir', color: '#64748B' },
];

// ──────────────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────────────
function TipoBadge({ tipo }: { tipo: TipoMetrado }) {
  const cfg = TIPO_CONFIG[tipo];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
      style={{ backgroundColor: cfg.bg, color: cfg.text, fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 600 }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
      {tipo}
    </span>
  );
}

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc') return <ArrowUp size={10} className="ml-0.5 flex-shrink-0 opacity-70" />;
  if (dir === 'desc') return <ArrowDown size={10} className="ml-0.5 flex-shrink-0 opacity-70" />;
  return <ArrowUpDown size={9} className="ml-0.5 flex-shrink-0 opacity-30" />;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <svg width="120" height="96" viewBox="0 0 120 96" fill="none" className="mb-6 opacity-40">
        <rect x="8" y="8" width="104" height="80" rx="4" stroke="#1A6BFF" strokeWidth="1.5" fill="none" />
        <line x1="8" y1="24" x2="112" y2="24" stroke="#1A6BFF" strokeWidth="1.5" />
        <line x1="32" y1="8" x2="32" y2="88" stroke="#1A6BFF" strokeWidth="1" strokeDasharray="3 2" />
        <line x1="64" y1="8" x2="64" y2="88" stroke="#1A6BFF" strokeWidth="1" strokeDasharray="3 2" />
        <line x1="8" y1="40" x2="112" y2="40" stroke="#CBD5E1" strokeWidth="0.75" />
        <line x1="8" y1="56" x2="112" y2="56" stroke="#CBD5E1" strokeWidth="0.75" />
        <circle cx="60" cy="62" r="12" stroke="#1A6BFF" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
        <line x1="56" y1="62" x2="64" y2="62" stroke="#1A6BFF" strokeWidth="1.5" />
        <line x1="60" y1="58" x2="60" y2="66" stroke="#1A6BFF" strokeWidth="1.5" />
      </svg>
      <div className="font-semibold mb-1.5" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
        Sin metrados registrados
      </div>
      <div className="text-sm mb-4 text-center" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
        No hay datos para el período y filtros seleccionados
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
//  EXPORT DROPDOWN
// ──────────────────────────────────────────────────────
function ExportDropdown() {
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
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white transition-all"
        style={{
          background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
          boxShadow: open ? '0 0 0 3px rgba(34,197,94,0.2)' : '0 1px 3px rgba(34,197,94,0.3)',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        <Download size={13} />
        <span className="hidden sm:inline">Exportar</span>
        <ChevronDown size={11} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden"
          style={{
            width: 220,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid #E5E9F0',
          }}
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
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 transition-colors hover:bg-[#F8FAFC]"
              >
                <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '12px', color: '#334155' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
//  FILTER DROPDOWN
// ──────────────────────────────────────────────────────
function FilterDropdown({
  label, options, value, onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isActive = Boolean(value);

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
        {isActive ? `${label}: ${value}` : label}
        {isActive
          ? <X size={9} onClick={e => { e.stopPropagation(); onChange(''); }} style={{ marginLeft: 2 }} />
          : <ChevronDown size={10} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
          style={{ minWidth: 160, backgroundColor: '#FFFFFF', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', border: '1px solid #E5E9F0' }}
        >
          <div className="py-1">
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-[#F8FAFC] transition-colors"
            >
              <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px', color: '#94A3B8' }}>Todos</span>
            </button>
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#EEF4FF] transition-colors"
              >
                <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px', color: value === opt ? '#1A6BFF' : '#334155', fontWeight: value === opt ? 600 : 400 }}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
//  DESCRIPTION AUTOCOMPLETE
// ──────────────────────────────────────────────────────
function DescAutocomplete({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = value.length >= 2
    ? DESC_DATABASE.filter(d => d.toLowerCase().includes(value.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 min-w-48">
      <input
        autoFocus={autoFocus}
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        placeholder="Descripción de la partida..."
        className="w-full px-2.5 py-1.5 rounded-lg border outline-none transition-all"
        style={{ borderColor: '#93C5FD', backgroundColor: '#FFFFFF', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '12px', color: '#1A2B45', boxShadow: '0 0 0 3px rgba(59,130,246,0.1)' }}
      />
      {show && suggestions.length > 0 && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
          style={{ width: 'max-content', minWidth: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0' }}
        >
          {suggestions.map(s => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); onChange(s); setShow(false); }}
              className="w-full text-left px-3 py-2 hover:bg-[#EEF4FF] transition-colors"
            >
              <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11.5px', color: '#334155' }}>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
//  INLINE EDIT BAR
// ──────────────────────────────────────────────────────
interface EditBarProps {
  data: Partial<MetradoRow>;
  activeCell: keyof MetradoRow | null;
  onDataChange: (k: keyof MetradoRow, v: string | number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function InlineEditBar({ data, activeCell, onDataChange, onConfirm, onCancel }: EditBarProps) {
  const numField = (key: keyof MetradoRow, label: string) => (
    <div key={String(key)} className="flex flex-col gap-0.5">
      <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '9px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <input
        autoFocus={activeCell === key}
        type="number"
        step="any"
        value={(data[key] as number) ?? ''}
        onChange={e => onDataChange(key, parseFloat(e.target.value) || 0)}
        className="rounded-lg border outline-none transition-all text-right"
        style={{
          width: 72,
          padding: '4px 8px',
          borderColor: activeCell === key ? '#93C5FD' : '#CBD5E1',
          backgroundColor: activeCell === key ? '#FFFFFF' : '#F8FAFC',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '12px',
          color: '#1A2B45',
          boxShadow: activeCell === key ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
        }}
      />
    </div>
  );

  return (
    <tr style={{ backgroundColor: '#F0F7FF' }}>
      <td
        colSpan={14}
        style={{ padding: '8px 12px', borderBottom: '2px solid #93C5FD', borderTop: '1px solid #BFDBFE' }}
      >
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex flex-col gap-0.5 flex-1 min-w-48">
            <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '9px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Descripción
            </span>
            <DescAutocomplete
              value={String(data.descripcion ?? '')}
              onChange={v => onDataChange('descripcion', v)}
              autoFocus={activeCell === 'descripcion' || activeCell === null}
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '9px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              UND
            </span>
            <div className="relative">
              <select
                value={String(data.und ?? '')}
                onChange={e => onDataChange('und', e.target.value)}
                className="appearance-none rounded-lg border outline-none cursor-pointer pr-6"
                style={{ width: 72, padding: '5px 8px', borderColor: activeCell === 'und' ? '#93C5FD' : '#CBD5E1', backgroundColor: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#1A2B45' }}
              >
                {UND_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
            </div>
          </div>

          <div className="w-px h-8 self-center" style={{ backgroundColor: '#BFDBFE' }} />

          {numField('cant', 'Cant.')}
          {numField('long', 'Long/Área')}
          {numField('ancho', 'Ancho')}
          {numField('alt', 'Alt/Gan.')}
          {numField('veces', 'Veces')}

          <div className="w-px h-8 self-center" style={{ backgroundColor: '#BFDBFE' }} />

          <div className="flex items-center gap-1.5 self-end pb-0.5">
            <button
              onClick={onConfirm}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white transition-all"
              style={{ backgroundColor: '#22C55E', boxShadow: '0 1px 3px rgba(34,197,94,0.3)', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px', fontWeight: 600 }}
            >
              <Check size={13} />
              <span>Confirmar</span>
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all"
              style={{ borderColor: '#E2E8F0', color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FEF2F2'; (e.currentTarget as HTMLElement).style.borderColor = '#FCA5A5'; (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}
            >
              <X size={13} />
              <span>Cancelar</span>
            </button>
          </div>

          <div className="self-end pb-1 ml-auto hidden lg:block">
            <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', color: '#94A3B8' }}>
              Doble clic en celda • Enter confirma • Esc cancela
            </span>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ──────────────────────────────────────────────────────
//  MAIN COMPONENT
// ──────────────────────────────────────────────────────
export default function Metrados() {
  const { rightPanelVisible, setRightPanelVisible } = useAppContext();
  const [activeTab, setActiveTab] = useState<ViewTab>('Detallada');
  const [period, setPeriod] = useState<'semana' | 'todo'>('semana');
  const [sortCol, setSortCol] = useState<keyof MetradoRow | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [valorView, setValorView] = useState(false);

  // Filtros activos
  const [filterEspecialidad, setFilterEspecialidad] = useState('');
  const [filterAutor, setFilterAutor] = useState('');
  const [filterFrente, setFilterFrente] = useState('');
  const [filterBloque, setFilterBloque] = useState('');
  const [filterNivel, setFilterNivel] = useState('');

  // Edición inline
  const [localData, setLocalData] = useState<MetradoRow[]>(metradosData);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<MetradoRow> | null>(null);
  const [activeCell, setActiveCell] = useState<keyof MetradoRow | null>(null);

  // Opciones únicas para filtros (derivadas de datos)
  const uniqueEspecialidades = [...new Set(localData.map(r => r.especialidad))].sort();
  const uniqueAutores = [...new Set(localData.map(r => r.autor))].sort();
  const uniqueFrente = [...new Set(localData.map(r => r.frente))].sort();
  const uniqueBloque = [...new Set(localData.map(r => r.bloque))].sort();
  const uniqueNivel = [...new Set(localData.map(r => r.nivel))].sort();

  const FILTER_CONFIG = [
    { label: 'Especialidad', options: uniqueEspecialidades, value: filterEspecialidad, onChange: setFilterEspecialidad },
    { label: 'Autor', options: uniqueAutores, value: filterAutor, onChange: setFilterAutor },
    { label: 'Frentes', options: uniqueFrente, value: filterFrente, onChange: setFilterFrente },
    { label: 'Bloques', options: uniqueBloque, value: filterBloque, onChange: setFilterBloque },
    { label: 'Niveles', options: uniqueNivel, value: filterNivel, onChange: setFilterNivel },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!editingRowId) return;
      if (e.key === 'Enter') handleConfirmEdit();
      if (e.key === 'Escape') handleCancelEdit();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [editingRowId, editingData]);

  function handleSort(col: keyof MetradoRow) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  function handleRowClick(row: MetradoRow) {
    if (editingRowId === row.id) return;
    setSelectedRowId(row.id);
    setEditingRowId(row.id);
    setEditingData({ ...row });
    setActiveCell(null);
  }

  function handleCellDoubleClick(row: MetradoRow, col: keyof MetradoRow) {
    setSelectedRowId(row.id);
    setEditingRowId(row.id);
    setEditingData({ ...row });
    setActiveCell(col);
  }

  function handleConfirmEdit() {
    if (!editingData || !editingRowId) return;
    const updated = { ...editingData } as MetradoRow;
    const parcial = (updated.cant || 1) * (updated.long || 1) * (updated.ancho || 1) * (updated.alt || 1);
    updated.parcial = parseFloat(parcial.toFixed(3));
    updated.total = parseFloat((updated.parcial * (updated.veces || 1)).toFixed(3));
    setLocalData(prev => prev.map(r => r.id === editingRowId ? updated : r));
    setEditingRowId(null);
    setEditingData(null);
    setActiveCell(null);
    setSelectedRowId(null);
  }

  function handleCancelEdit() {
    setEditingRowId(null);
    setEditingData(null);
    setActiveCell(null);
    setSelectedRowId(null);
    // If the row was newly added with empty description, remove it
    if (editingData && !editingData.descripcion) {
      setLocalData(prev => prev.filter(r => r.id !== editingRowId));
    }
  }

  function handleDeleteRow(id: number) {
    setLocalData(prev => prev.filter(r => r.id !== id));
    if (editingRowId === id) { setEditingRowId(null); setEditingData(null); setActiveCell(null); setSelectedRowId(null); }
  }

  // Agrega nueva fila vacía y entra en modo edición inmediatamente
  function handleAddNew() {
    const newId = Math.max(...localData.map(r => r.id), 0) + 1;
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const newRow: MetradoRow = {
      id: newId,
      fecha: `${dd}/${mm}`,
      item: `NEW.${newId}.0`,
      descripcion: '',
      und: 'm²',
      cant: 1,
      long: 0,
      ancho: 0,
      alt: 0,
      parcial: 0,
      veces: 1,
      autor: 'R. Torres',
      total: 0,
      tipo: 'PC',
      especialidad: filterEspecialidad || 'Estructuras',
      frente: filterFrente || 'Frente A',
      bloque: filterBloque || 'Bloque 01',
      nivel: filterNivel || 'Piso 01',
    };
    setLocalData(prev => [newRow, ...prev]);
    setSelectedRowId(newId);
    setEditingRowId(newId);
    setEditingData({ ...newRow });
    setActiveCell('descripcion');
    // Switch to todo period so new row is visible
    setPeriod('todo');
  }

  // Filtros de período: semana = fechas 09/05 en adelante
  const SEMANA_DATES = ['09/05', '10/05', '11/05', '12/05', '13/05'];

  const displayData = [...localData]
    .filter(r => period === 'todo' || SEMANA_DATES.includes(r.fecha))
    .filter(r => !filterEspecialidad || r.especialidad === filterEspecialidad)
    .filter(r => !filterAutor || r.autor === filterAutor)
    .filter(r => !filterFrente || r.frente === filterFrente)
    .filter(r => !filterBloque || r.bloque === filterBloque)
    .filter(r => !filterNivel || r.nivel === filterNivel)
    .sort((a, b) => {
      if (!sortCol || !sortDir) return 0;
      const va = a[sortCol] as any;
      const vb = b[sortCol] as any;
      if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  // Columnas según vista activa
  const ALL_COLS: { key: keyof MetradoRow; label: string; width?: number; align?: 'right' | 'center' | 'left' }[] = [
    { key: 'fecha', label: 'FECHA', width: 68, align: 'center' },
    { key: 'item', label: 'ÍTEM / CÓDIGO', width: 120 },
    { key: 'descripcion', label: 'DESCRIPCIÓN', width: 260 },
    { key: 'und', label: 'UND', width: 52, align: 'center' },
    { key: 'cant', label: 'CANT.', width: 52, align: 'right' },
    { key: 'long', label: 'LONG/ÁREA', width: 80, align: 'right' },
    { key: 'ancho', label: 'ANCHO', width: 68, align: 'right' },
    { key: 'alt', label: 'ALT/GAN.', width: 68, align: 'right' },
    { key: 'parcial', label: 'PARCIAL', width: 80, align: 'right' },
    { key: 'veces', label: 'VECES', width: 52, align: 'right' },
    { key: 'autor', label: 'AUTOR', width: 100 },
    { key: 'total', label: 'TOTAL', width: 88, align: 'right' },
  ];
  const RESUMIDA_KEYS: (keyof MetradoRow)[] = ['fecha', 'item', 'descripcion', 'und', 'cant', 'autor', 'total'];
  const COLS = activeTab === 'Resumida' ? ALL_COLS.filter(c => RESUMIDA_KEYS.includes(c.key)) : ALL_COLS;
  const NUMERIC_KEYS = (activeTab === 'Resumida'
    ? ['cant']
    : ['cant', 'long', 'ancho', 'alt', 'parcial', 'veces']
  ) as (keyof MetradoRow)[];

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

  const grandTotal = displayData.reduce((s, r) => s + r.total, 0);
  const activeFilterCount = [filterEspecialidad, filterAutor, filterFrente, filterBloque, filterNivel].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── TOPBAR ──────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0 gap-3"
        style={{
          height: 56,
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E9F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Title */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <h1 className="font-bold whitespace-nowrap" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif', fontSize: '15px' }}>
            Planilla de Metrados Dinámica
          </h1>
          {activeFilterCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: '#EEF4FF', color: '#1A6BFF', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700 }}
            >
              {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* View tabs */}
        <div className="flex items-center flex-shrink-0">
          <div className="flex rounded-full p-0.5" style={{ backgroundColor: '#F1F5F9' }}>
            {(['Detallada', 'Resumida', 'Valorizada'] as ViewTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1.5 rounded-full transition-all"
                style={{
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontSize: '12px',
                  fontWeight: activeTab === tab ? 600 : 400,
                  backgroundColor: activeTab === tab ? '#1A6BFF' : 'transparent',
                  color: activeTab === tab ? '#FFFFFF' : '#64748B',
                  boxShadow: activeTab === tab ? '0 1px 4px rgba(26,107,255,0.3)' : 'none',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer flex-shrink-0 transition-all"
          style={{ borderColor: '#E2E8F0' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F8FAFC'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          <Calendar size={13} style={{ color: '#94A3B8' }} />
          <span style={{ color: '#334155', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
            11/05 — 17/05
          </span>
          <ChevronDown size={12} style={{ color: '#CBD5E1' }} />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">

          {/* Panel toggle: "Insertar" cuando cerrado, "Cerrar panel" cuando abierto */}
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
              boxShadow: rightPanelVisible ? '0 0 0 3px rgba(26,107,255,0.08)' : 'none',
            }}
          >
            {rightPanelVisible ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            <span className="hidden sm:inline">
              {rightPanelVisible ? 'Cerrar panel' : 'Insertar'}
            </span>
          </button>

          {/* Nuevo — agrega fila vacía en modo edición */}
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all"
            style={{
              borderColor: '#D4D8DE',
              backgroundColor: '#F6F8FA',
              color: '#4A5568',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#F0FDF4';
              (e.currentTarget as HTMLElement).style.borderColor = '#86EFAC';
              (e.currentTarget as HTMLElement).style.color = '#15803D';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#F6F8FA';
              (e.currentTarget as HTMLElement).style.borderColor = '#D4D8DE';
              (e.currentTarget as HTMLElement).style.color = '#4A5568';
            }}
          >
            <Plus size={13} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>

          <ExportDropdown />
        </div>
      </div>

      {/* ── FILTER BAR ──────────────────────────────────── */}
      <div
        className="flex items-center gap-1.5 px-5 flex-shrink-0 overflow-x-auto"
        style={{
          height: 44,
          backgroundColor: '#FAFBFC',
          borderBottom: '1px solid #E5E9F0',
        }}
      >
        {FILTER_CONFIG.map(fc => (
          <FilterDropdown
            key={fc.label}
            label={fc.label}
            options={fc.options}
            value={fc.value}
            onChange={fc.onChange}
          />
        ))}

        <button
          onClick={() => setValorView(!valorView)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md border whitespace-nowrap transition-all flex-shrink-0"
          style={{
            borderColor: valorView ? '#1A6BFF' : '#E2E8F0',
            backgroundColor: valorView ? '#EEF4FF' : 'transparent',
            color: valorView ? '#1A6BFF' : '#64748B',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: '11px',
            fontWeight: valorView ? 600 : 400,
          }}
        >
          V.Valor
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={() => { setFilterEspecialidad(''); setFilterAutor(''); setFilterFrente(''); setFilterBloque(''); setFilterNivel(''); }}
            className="flex items-center gap-1 px-2 py-1 rounded-md whitespace-nowrap transition-all flex-shrink-0 hover:bg-red-50"
            style={{ color: '#EF4444', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}
          >
            <X size={9} />
            Limpiar filtros
          </button>
        )}

        <div className="flex-1" />

        {/* Period */}
        <div className="flex rounded-full p-0.5 flex-shrink-0" style={{ backgroundColor: '#F1F5F9' }}>
          {[['semana', 'SEMANA'], ['todo', 'TODO']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val as any)}
              className="px-2.5 py-0.5 rounded-full transition-all whitespace-nowrap"
              style={{
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: '11px',
                fontWeight: period === val ? 600 : 400,
                backgroundColor: period === val ? '#1A6BFF' : 'transparent',
                color: period === val ? '#fff' : '#64748B',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tipo legend */}
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {(Object.entries(TIPO_CONFIG) as [TipoMetrado, { dot: string }][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
              <span style={{ color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>{key}</span>
            </div>
          ))}
        </div>

        {editingRowId && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full ml-2 flex-shrink-0"
            style={{ backgroundColor: '#DBEAFE', border: '1px solid #93C5FD' }}
          >
            <PencilLine size={11} style={{ color: '#1D4ED8' }} />
            <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', color: '#1D4ED8', fontWeight: 600 }}>
              Editando
            </span>
          </div>
        )}
      </div>

      {/* ── TABLE ───────────────────────────────────────── */}
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#F4F6FA' }}>
        {displayData.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full border-collapse" style={{ minWidth: activeTab === 'Resumida' ? 700 : 1100 }}>
            <thead className="sticky top-0 z-10">
              <tr>
                {COLS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-3 py-2.5 cursor-pointer select-none transition-all hover:brightness-105"
                    style={{ ...headerCellStyle, textAlign: col.align || 'left', minWidth: col.width, width: col.width }}
                  >
                    <span
                      className="flex items-center gap-0.5"
                      style={{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}
                    >
                      {col.label}
                      <SortIcon dir={sortCol === col.key ? sortDir : null} />
                    </span>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-center" style={{ ...headerCellStyle, width: 64 }}>
                  ACC.
                </th>
              </tr>
            </thead>

            <tbody>
              {displayData.map((row, idx) => {
                const isHovered = hoveredRow === row.id;
                const isSelected = selectedRowId === row.id;
                const isEditing = editingRowId === row.id;
                const isEven = idx % 2 === 0;
                let rowBg = isEven ? '#FFFFFF' : '#F8FAFC';
                if (isSelected || isEditing) rowBg = '#EBF4FF';
                else if (isHovered) rowBg = '#F0F7FF';

                return (
                  <Fragment key={row.id}>
                    <tr
                      onClick={() => handleRowClick(row)}
                      onMouseEnter={() => setHoveredRow(row.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        backgroundColor: rowBg,
                        transition: 'background-color 120ms ease',
                        borderBottom: isSelected ? '1px solid #BFDBFE' : '1px solid #F1F5F9',
                        cursor: 'pointer',
                        outline: isSelected ? '1.5px solid #93C5FD' : 'none',
                        outlineOffset: '-1px',
                      }}
                    >
                      {/* FECHA */}
                      <td onDoubleClick={() => handleCellDoubleClick(row, 'fecha')} className="px-3 py-2 text-center" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748B', borderRight: '1px solid #EEF2F7' }}>
                        {row.fecha}
                      </td>

                      {/* ITEM */}
                      <td className="px-3 py-2" style={{ borderRight: '1px solid #EEF2F7' }}>
                        <div className="flex items-center gap-2">
                          <TipoBadge tipo={row.tipo} />
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#1A6BFF', fontWeight: 500 }}>
                            {row.item}
                          </span>
                        </div>
                      </td>

                      {/* DESCRIPCION */}
                      <td onDoubleClick={() => handleCellDoubleClick(row, 'descripcion')} className="px-3 py-2" style={{ borderRight: '1px solid #EEF2F7', maxWidth: 260 }}>
                        <span className="block truncate" title={row.descripcion} style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: row.descripcion ? '#334155' : '#CBD5E1', fontSize: '12px', fontStyle: row.descripcion ? 'normal' : 'italic' }}>
                          {row.descripcion || 'Sin descripción — doble clic para editar'}
                        </span>
                      </td>

                      {/* UND */}
                      <td onDoubleClick={() => handleCellDoubleClick(row, 'und')} className="px-3 py-2 text-center" style={{ borderRight: '1px solid #EEF2F7' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#64748B', fontSize: '11px', fontWeight: 500 }}>
                          {row.und}
                        </span>
                      </td>

                      {/* Numeric cols (variable per tab) */}
                      {NUMERIC_KEYS.map(k => (
                        <td key={k} onDoubleClick={() => handleCellDoubleClick(row, k)} className="px-3 py-2 text-right" style={{ borderRight: '1px solid #EEF2F7' }}>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#334155' }}>
                            {(row[k] as number) > 0
                              ? (row[k] as number).toLocaleString('es-PE', { minimumFractionDigits: (row[k] as number) % 1 !== 0 ? 2 : 0 })
                              : <span style={{ color: '#D1D5DB' }}>—</span>}
                          </span>
                        </td>
                      ))}

                      {/* AUTOR */}
                      <td className="px-3 py-2" style={{ borderRight: '1px solid #EEF2F7' }}>
                        <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: '#64748B', fontSize: '11px' }}>
                          {row.autor}
                        </span>
                      </td>

                      {/* TOTAL */}
                      <td className="px-3 py-2 text-right" style={{ backgroundColor: isSelected ? '#FEF9C3' : isHovered ? '#FFFBEA' : '#FFFBEB', borderRight: '1px solid #FEF3C7', transition: 'background-color 120ms' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#92400E', fontWeight: 700 }}>
                          {row.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-2 py-2 text-center" style={{ width: 64 }}>
                        <div className="flex items-center justify-center gap-1 transition-opacity duration-150" style={{ opacity: isHovered || isSelected ? 1 : 0 }}>
                          <button
                            onClick={e => { e.stopPropagation(); handleRowClick(row); setActiveCell('descripcion'); }}
                            title="Editar fila"
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: '#1A6BFF' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#DBEAFE'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                          >
                            <PencilLine size={12} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteRow(row.id); }}
                            title="Eliminar fila"
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: '#EF4444' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#FEE2E2'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── INLINE EDIT BAR ── */}
                    {isEditing && editingData && (
                      <InlineEditBar
                        data={editingData}
                        activeCell={activeCell}
                        onDataChange={(k, v) => setEditingData(prev => prev ? { ...prev, [k]: v } : prev)}
                        onConfirm={handleConfirmEdit}
                        onCancel={handleCancelEdit}
                      />
                    )}
                  </Fragment>
                );
              })}
            </tbody>

            <tfoot className="sticky bottom-0">
              <tr style={{ background: 'linear-gradient(180deg, #D8DCE5 0%, #C8CDD8 100%)', borderTop: '2px solid #1A6BFF', boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}>
                <td colSpan={4} className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#4A5568', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>TOTALES</span>
                    <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(26,107,255,0.12)', color: '#1A4FA0', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700 }}>
                      {displayData.length} reg.
                    </span>
                  </div>
                </td>
                {NUMERIC_KEYS.map(k => (
                  <td key={k} className="px-3 py-2.5 text-right">
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#4A5568' }}>
                      {displayData.reduce((s, r) => s + (r[k] as number), 0) > 0
                        ? displayData.reduce((s, r) => s + (r[k] as number), 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                        : ''}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-2.5" />
                <td className="px-3 py-2.5 text-right" style={{ background: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)', borderLeft: '2px solid #F59E0B' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#78350F', fontWeight: 800 }}>
                    {grandTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td style={{ backgroundColor: 'rgba(0,0,0,0.04)' }} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
