import { useState } from 'react';
import { Search, Plus, Download, ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import { catalogoData, type CatalogoItem } from '../../data/mockData';

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
  const [tipoFilter, setTipoFilter] = useState('TODOS');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['OE', 'OE.1', 'AR', 'IE', 'IS', 'HVAC']));

  function toggleExpand(wbs: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(wbs)) next.delete(wbs);
      else next.add(wbs);
      return next;
    });
  }

  const filteredData = catalogoData.filter(item => {
    const matchSearch = !search || item.descripcion.toLowerCase().includes(search.toLowerCase()) || item.wbs.toLowerCase().includes(search.toLowerCase());
    const matchTipo = tipoFilter === 'TODOS' || item.tipo === tipoFilter || (tipoFilter === 'ACERO' && item.descripcion.toLowerCase().includes('acero'));
    return matchSearch && matchTipo;
  });

  const hasChildren = (wbs: string) => catalogoData.some(item => {
    const parts = item.wbs.split('.');
    const parentParts = wbs.split('.');
    return item.wbs !== wbs && item.wbs.startsWith(wbs + '.') && parts.length === parentParts.length + 1;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
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
      <div className="flex-1 overflow-auto" style={{ backgroundColor: '#F4F6FA' }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              {[
                { label: 'WBS CODE', w: 140 },
                { label: 'DESCRIPCIÓN', w: undefined },
                { label: 'UNID.', w: 70 },
                { label: 'TIPO', w: 90 },
                { label: 'PRECIO UNIT. (S/)', w: 130 },
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
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => {
              const isParent = item.precio === null;
              const isExpanded = expanded.has(item.wbs);
              const tipoCfg = TIPO_CONFIG[item.tipo] || TIPO_CONFIG['ESTÁNDAR'];
              const indent = (item.level - 1) * 20;

              return (
                <tr
                  key={item.wbs}
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
                  <td className="px-4 py-2.5 text-right">
                    {item.precio !== null ? (
                      <span className="font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#1A2B45' }}>
                        S/ {item.precio.toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: '#CBD5E1', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
