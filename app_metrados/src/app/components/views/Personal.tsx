import { useState } from 'react';
import { Search, Plus, Users, ChevronRight, X } from 'lucide-react';
import { personalData, type Personal } from '../../data/mockData';

const ESTADO_CONFIG = {
  Activo: { bg: '#ECFDF5', text: '#065F46', dot: '#22C55E' },
  Inactivo: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  Licencia: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
};

const ESPECIALIDADES_CUADRILLAS = [
  { id: 'C-01', nombre: 'C-01 Estructuras', color: '#1A6BFF', count: 4 },
  { id: 'C-02', nombre: 'C-02 Instalaciones', color: '#22C55E', count: 3 },
  { id: 'C-03', nombre: 'C-03 Arquitectura', color: '#F59E0B', count: 3 },
  { id: 'C-04', nombre: 'C-04 HVAC', color: '#8B5CF6', count: 1 },
];

function DetailPanel({ person, onClose }: { person: Personal; onClose: () => void }) {
  const estadoCfg = ESTADO_CONFIG[person.estado];
  return (
    <div
      className="flex flex-col h-full border-l"
      style={{ width: 300, backgroundColor: '#FFFFFF', borderColor: '#E5E9F0' }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#F1F5F9' }}>
        <span className="font-semibold text-sm" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
          Ficha del Obrero
        </span>
        <button onClick={onClose} className="p-1 rounded hover:bg-[#F1F5F9]" style={{ color: '#94A3B8' }}>
          <X size={14} />
        </button>
      </div>

      <div className="p-5 space-y-5 overflow-y-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: '#1A3A5C', fontFamily: 'DM Sans, sans-serif' }}
          >
            {person.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
              {person.nombre}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {person.especialidad}
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: estadoCfg.bg, color: estadoCfg.text }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: estadoCfg.dot }} />
            {person.estado}
          </span>
        </div>

        <div style={{ height: 1, backgroundColor: '#F1F5F9' }} />

        {/* Details */}
        {[
          { label: 'Código', value: person.id },
          { label: 'DNI', value: person.dni },
          { label: 'Cuadrilla', value: person.cuadrilla },
          { label: 'Especialidad', value: person.especialidad },
          { label: 'Ingreso', value: person.ingreso },
        ].map(item => (
          <div key={item.label}>
            <div className="text-xs mb-0.5" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {item.label}
            </div>
            <div className="text-sm font-medium" style={{ color: '#1A2B45', fontFamily: item.label === 'Código' || item.label === 'DNI' ? 'JetBrains Mono, monospace' : 'IBM Plex Sans, sans-serif' }}>
              {item.value}
            </div>
          </div>
        ))}

        <div style={{ height: 1, backgroundColor: '#F1F5F9' }} />

        <button
          className="w-full py-2.5 rounded-lg text-white text-xs font-semibold"
          style={{ backgroundColor: '#1A6BFF', fontFamily: 'IBM Plex Sans, sans-serif' }}
        >
          Editar ficha
        </button>
      </div>
    </div>
  );
}

export default function Personal() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Personal | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('Todos');

  const filtered = personalData.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.especialidad.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'Todos' || p.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 flex-shrink-0"
        style={{ height: 56, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E9F0' }}
      >
        <h1 className="font-bold" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif', fontSize: '15px' }}>
          Gestión de Personal y Cuadrillas
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-[#F8FAFC]"
            style={{ borderColor: '#E2E8F0', color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            <Users size={13} />
            + Nueva Cuadrilla
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm"
            style={{ backgroundColor: '#1A6BFF', fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            <Plus size={13} />
            + Nuevo Obrero
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ backgroundColor: '#F4F6FA' }}>
        {/* Left: Cuadrillas */}
        <div
          className="flex flex-col flex-shrink-0 border-r"
          style={{ width: 220, backgroundColor: '#FFFFFF', borderColor: '#E5E9F0' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: '#F1F5F9' }}>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', letterSpacing: '0.1em' }}>
              Cuadrillas
            </div>
          </div>
          <div className="p-3 space-y-1">
            {ESPECIALIDADES_CUADRILLAS.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <div className="flex-1">
                  <div className="text-xs font-medium" style={{ color: '#1A2B45', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    {c.nombre}
                  </div>
                </div>
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: c.color + '18', color: c.color, fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}
                >
                  {c.count}
                </span>
              </div>
            ))}
          </div>

          <div className="mx-4 my-2" style={{ height: 1, backgroundColor: '#F1F5F9' }} />
          <div className="px-4 py-2">
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', letterSpacing: '0.1em' }}>
              Filtrar Estado
            </div>
            {['Todos', 'Activo', 'Inactivo', 'Licencia'].map(e => (
              <button
                key={e}
                onClick={() => setFilterEstado(e)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors"
                style={{
                  backgroundColor: filterEstado === e ? '#EEF4FF' : 'transparent',
                  color: filterEstado === e ? '#1A6BFF' : '#64748B',
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontWeight: filterEstado === e ? 600 : 400,
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Table */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search bar */}
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E9F0' }}
            >
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Buscar obrero por nombre, código o especialidad..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-[#1A6BFF]"
                  style={{ borderColor: '#E2E8F0', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '13px' }}
                />
              </div>
              <span className="text-xs" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {filtered.length} obreros
              </span>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr>
                    {['CÓDIGO', 'NOMBRE COMPLETO', 'ESPECIALIDAD', 'CUADRILLA', 'DNI', 'INGRESO', 'ESTADO', ''].map(col => (
                      <th
                        key={col}
                        className="px-4 py-2.5 text-left"
                        style={{
                          backgroundColor: '#1A2B45',
                          color: '#FFFFFF',
                          fontFamily: 'IBM Plex Sans, sans-serif',
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.07em',
                          borderRight: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const estadoCfg = ESTADO_CONFIG[p.estado];
                    const isSelected = selected?.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelected(isSelected ? null : p)}
                        className="cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isSelected ? '#EEF4FF' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          borderBottom: '1px solid #F1F5F9',
                        }}
                      >
                        <td className="px-4 py-3">
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#1A6BFF', fontWeight: 500 }}>
                            {p.id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium" style={{ color: '#1A2B45', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                            {p.nombre}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                            {p.especialidad}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                            {p.cuadrilla}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#475569' }}>
                            {p.dni}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#94A3B8' }}>
                            {p.ingreso}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: estadoCfg.bg, color: estadoCfg.text, fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: estadoCfg.dot }} />
                            {p.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight size={14} style={{ color: isSelected ? '#1A6BFF' : '#CBD5E1' }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <DetailPanel person={selected} onClose={() => setSelected(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
