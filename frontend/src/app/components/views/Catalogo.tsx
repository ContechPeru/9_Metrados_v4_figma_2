import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Download, ChevronRight, ChevronDown, AlertTriangle, Loader2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CatalogoItem } from '../../data/mockData';
import { ModalNuevaPartida } from './ModalNuevaPartida';
import { ModalEditarPartida } from './ModalEditarPartida';
import { useAuthStore } from '../../store/useAuthStore';
import { useMetradosStore } from '../../store/useMetradosStore';

const TIPO_CONFIG: Record<string, { bg: string; text: string }> = {
  PC: { bg: '#FFF0E6', text: '#C04D00' },
  MM: { bg: '#EEF4FF', text: '#1251BF' },
  PN: { bg: '#ECFDF5', text: '#065F46' },
  DD: { bg: '#FEF3C7', text: '#92400E' },
  ET: { bg: '#F3E8FF', text: '#5B21B6' },
  'ESTÁNDAR': { bg: '#F1F5F9', text: '#475569' },
};

const TIPO_FILTERS = ['TODOS', 'ESTÁNDAR', 'ACERO', 'DUCTOS HVAC'];

export default function Catalogo() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('TODOS');
  const [filterEspecialidad, setFilterEspecialidad] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['OE', 'OE.1', 'AR', 'IE', 'IS', 'HVAC']));
  const [catalogoData, setCatalogoData] = useState<CatalogoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const isAdmin = useAuthStore(state => state.isAdminPresupuesto());
  const isMetrador = useAuthStore(state => state.isMetrador());
  const canEdit = isAdmin || isMetrador;
  const user = useAuthStore(state => state.user);
  const fetchCatalogosGlobales = useMetradosStore(state => state.fetchCatalogosGlobales);

  useEffect(() => {
    fetchCatalogo();
    fetchCatalogosGlobales();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset page on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tipoFilter, filterEspecialidad]);

  async function fetchCatalogo() {
    setIsLoading(true);
    let allData: any[] = [];
    let page = 0;
    const size = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('catalogo_partidas')
        .select('*')
        .eq('estado_activo', true)
        .order('codigo_expediente', { ascending: true })
        .range(page * size, (page + 1) * size - 1);

      if (error) {
        console.error('Error fetching catalogo:', error);
        hasMore = false;
      } else if (data && data.length > 0) {
        allData = [...allData, ...data];
        page++;
        if (data.length < size) hasMore = false;
      } else {
        hasMore = false;
      }
    }

    // Map DB to UI expected structure
    const mapped: CatalogoItem[] = allData.map((row: any) => ({
      id: row.id,
      wbs: row.codigo_expediente || '---',
      descripcion: row.descripcion || '---',
      und: row.unidad_medida || '—',
      tipo: row.tipo_calculo || 'ESTÁNDAR',
      precio: row.precio_unitario_base,
      level: row.nivel_arbol || 1,
      modificacion: row.modificacion || '—',
      especialidad: row.especialidad ? row.especialidad.trim() : '',
      se_valoriza: row.se_valoriza
    }));
    setCatalogoData(mapped);
    setIsLoading(false);
  }

  const handleDeletePartida = async (item: any) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la partida "${item.descripcion}"?\n\nEsto no se puede deshacer y fallará si la partida ya tiene metrados registrados.`)) return;

    try {
      const { error } = await supabase.from('catalogo_partidas').delete().eq('id', item.id);
      if (error) {
        if (error.code === '23503') {
           alert('No se puede eliminar la partida porque ya tiene metrados registrados.');
        } else {
           alert('Error al eliminar: ' + error.message);
        }
      } else {
        alert('Partida eliminada correctamente.');
        fetchCatalogo();
      }
    } catch (e: any) {
      alert('Error inesperado: ' + e.message);
    }
  };

  const toggleExpand = (wbs: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(wbs)) next.delete(wbs);
      else next.add(wbs);
      return next;
    });
  }

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    catalogoData.forEach(p => {
      let key = p.especialidad;
      if (!key || key.toLowerCase() === 'sin especialidad' || key.toLowerCase() === 'null') {
        key = 'SIN ETIQUETA';
      }
      counts[key] = (counts[key] || 0) + 1;
    });

    const colors = ['#1A6BFF', '#22C55E', '#F59E0B', '#F97316', '#EC4899', '#8B5CF6', '#14B8A6'];
    
    const items = Object.entries(counts).map(([nombre, count], idx) => ({
      id: nombre,
      nombre,
      count,
      color: nombre === 'SIN ETIQUETA' ? '#94A3B8' : colors[idx % colors.length]
    })).sort((a, b) => b.count - a.count);

    const sinEtiqueta = items.find(i => i.nombre === 'SIN ETIQUETA');
    const otros = items.filter(i => i.nombre !== 'SIN ETIQUETA');
    
    return sinEtiqueta ? [...otros, sinEtiqueta] : otros;
  }, [catalogoData]);

  const filteredData = useMemo(() => {
    return catalogoData.filter(item => {
      const matchSearch = !debouncedSearch || item.descripcion.toLowerCase().includes(debouncedSearch.toLowerCase()) || item.wbs.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchTipo = tipoFilter === 'TODOS' || item.tipo === tipoFilter || (tipoFilter === 'ACERO' && item.descripcion.toLowerCase().includes('acero'));
      
      let matchEsp = true;
      if (filterEspecialidad && filterEspecialidad !== 'Todos') {
        if (filterEspecialidad === 'SIN ETIQUETA') {
          matchEsp = !item.especialidad || item.especialidad.toLowerCase() === 'sin especialidad' || item.especialidad.toLowerCase() === 'null';
        } else {
          matchEsp = item.especialidad === filterEspecialidad;
        }
      }

      return matchSearch && matchTipo && matchEsp;
    });
  }, [catalogoData, debouncedSearch, tipoFilter, filterEspecialidad]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const hasChildren = (wbs: string) => catalogoData.some(item => {
    const parts = item.wbs.split('.');
    const parentParts = wbs.split('.');
    return item.wbs !== wbs && item.wbs.startsWith(wbs + '.') && parts.length === parentParts.length + 1;
  });

  return (
    <div className="flex h-full bg-[#FAFAFA]">
      {/* Sidebar Left (Especialidades) */}
      <div
        className="flex flex-col flex-shrink-0 border-r"
        style={{ width: 220, backgroundColor: '#FFFFFF', borderColor: '#E5E9F0' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: '#F1F5F9' }}>
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', letterSpacing: '0.1em' }}>
            Especialidades
          </div>
        </div>
        <div className="p-3 space-y-1 overflow-y-auto">
          {stats.map(c => (
            <div
              key={c.id}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${filterEspecialidad === c.nombre ? 'bg-[#EEF2FF]' : 'hover:bg-[#F8FAFC]'}`}
              onClick={() => setFilterEspecialidad(filterEspecialidad === c.nombre ? '' : c.nombre)}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
              <span className="flex-1 text-xs truncate" style={{ color: filterEspecialidad === c.nombre ? '#1E40AF' : '#1A2B45', fontFamily: 'IBM Plex Sans, sans-serif' }} title={c.nombre}>
                {c.nombre}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${c.color}15`,
                  color: c.color,
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                {c.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FAFAFA]">
        {/* Header */}
      <div
        className="flex items-center justify-between px-6 flex-shrink-0"
        style={{ height: 56, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E9F0' }}
      >
        <div>
          <h1 className="font-bold" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif', fontSize: '15px' }}>
            Catálogo Maestro de Partidas
          </h1>
          <p className="text-xs" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
            Base de datos oficial + Partidas personalizadas (PC)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#FFF0E6', color: '#C04D00', fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            224 PC creadas
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            <AlertTriangle size={11} />
            1 duplicada
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-[#F8FAFC] transition-colors"
            style={{ borderColor: '#E2E8F0', color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            <Download size={13} />
            Export Excel
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm"
            style={{ backgroundColor: '#1A6BFF', fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            <Plus size={13} />
            + Nuevo Ítem
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        className="flex items-center gap-3 px-6 flex-shrink-0"
        style={{ height: 48, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E9F0' }}
      >
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Buscar por WBS o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border outline-none focus:ring-1 focus:ring-[#1A6BFF]"
            style={{ borderColor: '#E2E8F0', fontFamily: 'IBM Plex Sans, sans-serif' }}
          />
        </div>

        <div className="flex rounded-full p-0.5" style={{ backgroundColor: '#F1F5F9' }}>
          {TIPO_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setTipoFilter(t)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap"
              style={{
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: '11px',
                backgroundColor: tipoFilter === t ? '#1A2B45' : 'transparent',
                color: tipoFilter === t ? '#FFFFFF' : '#64748B',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#E2E8F0' }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              {[
                { label: 'WBS CODE', w: 140 },
                { label: 'DESCRIPCIÓN', w: undefined },
                { label: 'UNID.', w: 70 },
                { label: 'TIPO', w: 90 },
                { label: 'PRECIO UNIT. (S/)', w: 130 },
                { label: 'MODIFICACIÓN', w: 180 },
              ].map(col => (
                <th
                  key={col.label}
                  className="px-4 py-2.5 text-left"
                  style={{
                    backgroundColor: '#1A2B45',
                    color: '#FFFFFF',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.07em',
                    width: col.w,
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {col.label}
                </th>
              ))}
              {canEdit && (
                <th
                  className="px-4 py-2.5 text-center"
                  style={{
                    backgroundColor: '#1A2B45',
                    color: '#FFFFFF',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.07em',
                    width: '60px',
                  }}
                >
                  ACCIONES
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                    <Loader2 size={24} className="animate-spin mb-2 text-[#1A6BFF]" />
                    <span className="font-medium text-sm">Cargando catálogo oficial desde Supabase...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="py-12 text-center text-[#94A3B8] text-sm">
                  No se encontraron partidas que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
            paginatedData.map((item, idx) => {
              const isParent = item.precio === null;
              const isExpanded = expanded.has(item.wbs);
              const tipoCfg = TIPO_CONFIG[item.tipo] || TIPO_CONFIG['ESTÁNDAR'];
              const indent = (item.level - 1) * 20;

              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-[#EEF4FF]"
                  style={{
                    backgroundColor: isParent ? '#F8FAFC' : idx % 2 === 0 ? '#FFFFFF' : '#FAFBFD',
                    borderBottom: '1px solid #F1F5F9',
                  }}
                >
                  {/* WBS Code */}
                  <td className="px-4 py-2.5" style={{ borderRight: '1px solid #F1F5F9' }}>
                    <div className="flex items-center gap-1" style={{ paddingLeft: indent }}>
                      {hasChildren(item.wbs) ? (
                        <button
                          onClick={() => toggleExpand(item.wbs)}
                          className="p-0.5 rounded hover:bg-[#E2E8F0] transition-colors flex-shrink-0"
                          style={{ color: '#94A3B8' }}
                        >
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      ) : (
                        <span className="w-4 flex-shrink-0" />
                      )}
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '12px',
                          color: isParent ? '#1A2B45' : '#1A6BFF',
                          fontWeight: isParent ? 600 : 500,
                        }}
                      >
                        {item.wbs}
                      </span>
                    </div>
                  </td>

                  {/* Descripcion */}
                  <td className="px-4 py-2.5" style={{ borderRight: '1px solid #F1F5F9' }}>
                    <span
                      className="text-sm"
                      style={{
                        color: isParent ? '#1A2B45' : '#334155',
                        fontFamily: 'IBM Plex Sans, sans-serif',
                        fontWeight: isParent ? 600 : 400,
                        fontSize: isParent ? '13px' : '12px',
                        paddingLeft: indent,
                      }}
                    >
                      {item.descripcion}
                    </span>
                  </td>

                  {/* Unidad */}
                  <td className="px-4 py-2.5 text-center" style={{ borderRight: '1px solid #F1F5F9' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748B' }}>
                      {item.und}
                    </span>
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-2.5" style={{ borderRight: '1px solid #F1F5F9' }}>
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ backgroundColor: tipoCfg.bg, color: tipoCfg.text, fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}
                    >
                      {item.tipo}
                    </span>
                  </td>

                  {/* Precio */}
                  <td className="px-4 py-2.5 text-right" style={{ borderRight: '1px solid #F1F5F9' }}>
                    {item.precio !== null ? (
                      <span className="font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#1A2B45' }}>
                        S/ {item.precio.toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: '#CBD5E1', fontSize: '12px' }}>—</span>
                    )}
                  </td>

                  {/* Modificacion */}
                  <td className="px-4 py-2.5 text-left text-xs truncate max-w-[180px]">
                    <span style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: '#64748B' }} title={item.modificacion}>
                      {item.modificacion}
                    </span>
                  </td>

                  {/* Acciones */}
                  {canEdit && (
                    <td className="px-4 py-2.5 text-center border-l" style={{ borderColor: '#F1F5F9' }}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Editar Partida"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePartida(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Eliminar Partida"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

        {/* Pagination Controls */}
        {!isLoading && filteredData.length > itemsPerPage && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-100 flex-shrink-0" style={{ borderColor: '#F1F5F9' }}>
            <span className="text-xs text-gray-500 font-medium">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} partidas
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 text-xs font-medium border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#E2E8F0', color: '#475569' }}
              >
                Anterior
              </button>
              <span className="text-xs font-semibold px-2" style={{ color: '#1A2B45' }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 text-xs font-medium border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#E2E8F0', color: '#475569' }}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Modal Nueva Partida Original */}
        {isModalOpen && (
          <ModalNuevaPartida onClose={() => {
            setIsModalOpen(false);
            fetchCatalogo();
          }} />
        )}
        {/* Modal Editar Partida */}
        {editingItem && (
          <ModalEditarPartida
            partida={{
              id: editingItem.id,
              codigo_expediente: editingItem.wbs,
              descripcion: editingItem.descripcion,
              unidad_medida: editingItem.und,
              precio_unitario_base: editingItem.precio || 0,
              especialidad: editingItem.especialidad || 'GENERAL',
              tipo_calculo: editingItem.tipo,
              se_valoriza: editingItem.se_valoriza !== false,
              modificacion: editingItem.modificacion === '—' ? null : editingItem.modificacion,
              es_agrupador: hasChildren(editingItem.wbs)
            }}
            onClose={() => {
              setEditingItem(null);
              fetchCatalogo();
            }}
            isSuper={canEdit}
            userEspecialidad={user?.especialidad || null}
          />
        )}
      </div>
    </div>
  );
}
