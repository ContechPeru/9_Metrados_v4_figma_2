import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, FileSpreadsheet, HardHat, RefreshCw, Edit2, UserCog, UserMinus, ShieldAlert, Users, ChevronRight, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Personal } from '../../data/mockData';
import PersonalFormDialog from './PersonalFormDialog';
import CuadrillaFormDialog from './CuadrillaFormDialog';
import { usePersonalStore } from '../../store/usePersonalStore';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';

const ESTADO_CONFIG = {
  Activo: { bg: '#ECFDF5', text: '#065F46', dot: '#22C55E' },
  Inactivo: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  Licencia: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
};


function DetailPanel({ person, onClose, onEdit, onDelete }: { person: Personal; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const estadoCfg = ESTADO_CONFIG[person.estado];
  return (
    <div
      className="flex flex-col h-full border-l bg-white border-slate-200 w-full md:w-[300px]"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <span className="font-semibold text-sm text-slate-800">
          Ficha del Obrero
        </span>
        <button onClick={onClose} className="p-3 rounded hover:bg-slate-100 text-slate-400" aria-label="Cerrar panel">
          <X size={14} />
        </button>
      </div>

      <div className="p-5 space-y-5 overflow-y-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold bg-slate-900"
          >
            {person.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm text-slate-800">
              {person.nombre}
            </div>
            <div className="text-xs mt-0.5 text-slate-500">
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
            <div className="text-[11px] mb-0.5 text-slate-500 font-medium">
              {item.label}
            </div>
            <div className="text-sm font-medium text-slate-800">
              {item.value}
            </div>
          </div>
        ))}

        <div style={{ height: 1, backgroundColor: '#F1F5F9' }} />

        <button
          onClick={onEdit}
          className="w-full py-3 rounded-lg text-white text-xs font-semibold bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Editar ficha
        </button>
        <button
          onClick={onDelete}
          className="w-full py-3 rounded-lg text-xs font-semibold border bg-white border-red-500 text-red-500 hover:bg-red-50 transition-colors"
        >
          Dar de baja
        </button>
      </div>
    </div>
  );
}

export default function Personal() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Personal | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [activeTab, setActiveTab] = useState<'Obreros' | 'Cuadrillas'>('Obreros');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCuadrillaFormOpen, setIsCuadrillaFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Personal | null>(null);
  const [editingCuadrilla, setEditingCuadrilla] = useState<{ id: string; nombre: string; especialidades?: string[] } | null>(null);

  const { obreros, cuadrillasList, isLoading, fetchPersonal } = usePersonalStore();
  const { canGestionarObreros } = useAuthStore();
  if (!canGestionarObreros()) return null;

  const personalData = useMemo<Personal[]>(() => {
    return obreros.map(o => ({
      id: o.id,
      nombre: o.nombres_completos || 'Sin nombre',
      especialidad: o.especialidad || 'Operario',
      cuadrilla: o.cuadrillas_asignadas && o.cuadrillas_asignadas.length > 0 
        ? o.cuadrillas_asignadas.join(', ') 
        : (o.cuadrilla || 'Sin asignar'),
      estado: 'Activo', // Simplified for mapping, or you can map from o
      dni: o.dni || '---',
      ingreso: '---'
    }));
  }, [obreros]);

  useEffect(() => {
    fetchPersonal();
  }, []);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    personalData.forEach(p => {
      const key = p.especialidad || 'Sin Especialidad';
      counts[key] = (counts[key] || 0) + 1;
    });

    const colors = ['#1A6BFF', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
    
    return Object.entries(counts).map(([nombre, count], idx) => ({
      id: nombre,
      nombre,
      count,
      color: colors[idx % colors.length]
    })).sort((a, b) => b.count - a.count);
  }, [personalData]);

  const statsCuadrillas = useMemo(() => {
    const counts: Record<string, number> = {};
    cuadrillasList.forEach(c => {
      if (!c.especialidades || c.especialidades.length === 0) {
        counts['Sin Especialidad'] = (counts['Sin Especialidad'] || 0) + 1;
      } else {
        c.especialidades.forEach(esp => {
          counts[esp] = (counts[esp] || 0) + 1;
        });
      }
    });

    const colors = ['#1A6BFF', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
    
    return Object.entries(counts).map(([nombre, count], idx) => ({
      id: nombre,
      nombre,
      count,
      color: colors[idx % colors.length]
    })).sort((a, b) => b.count - a.count);
  }, [cuadrillasList]);

  const activeStats = activeTab === 'Obreros' ? stats : statsCuadrillas;

  const filtered = personalData.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.especialidad.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === 'Todos' || p.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const filteredCuadrillas = cuadrillasList.filter(c => {
    const term = search.toLowerCase();
    if (!term) return true;
    
    // Explicitly handle the "Sin Especialidad" case from the sidebar
    if (term === 'sin especialidad' && (!c.especialidades || c.especialidades.length === 0)) {
      return true;
    }

    const matchSearch = c.nombre.toLowerCase().includes(term) || 
      (c.especialidades && c.especialidades.some(esp => esp.toLowerCase().includes(term)));
    return matchSearch;
  });

  const handleEdit = (p: Personal) => {
    setEditingPerson(p);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingPerson(null);
    setIsFormOpen(true);
  };

  const handleEditCuadrilla = (c: { id: string; nombre: string; especialidades?: string[] }) => {
    setEditingCuadrilla(c);
    setIsCuadrillaFormOpen(true);
  };

  const handleCreateCuadrilla = () => {
    setEditingCuadrilla(null);
    setIsCuadrillaFormOpen(true);
  };

  const handleDelete = async (p: Personal) => {
    if (!confirm(`¿Está seguro de dar de baja a ${p.nombre}?`)) return;
    
    try {
      const { error } = await (supabase.from('personal_obrero') as any)
        .update({ estado_activo: false })
        .eq('id', p.id);
      
      if (error) throw error;
      toast.success('El obrero fue dado de baja correctamente.');
      if (selected?.id === p.id) setSelected(null);
      fetchPersonal();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al dar de baja: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 flex-shrink-0 h-14 bg-white border-b border-slate-200"
      >
        <div className="flex items-center gap-4">
          <h1 className="font-bold mr-4 text-slate-800 text-[15px]">
            Gestión de Personal
          </h1>
          <div className="flex bg-[#F1F5F9] rounded-lg p-1">
            <button
              onClick={() => setActiveTab('Obreros')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'Obreros' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Obreros
            </button>
            <button
              onClick={() => setActiveTab('Cuadrillas')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'Cuadrillas' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Cuadrillas
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === 'Obreros' && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-sm transition-colors bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={13} />
              + Nuevo Obrero
            </button>
          )}
          {activeTab === 'Cuadrillas' && (
            <button
              onClick={handleCreateCuadrilla}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-[#F8FAFC]"
              style={{ borderColor: '#E2E8F0', color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif' }}
            >
              <Users size={13} />
              + Crear Cuadrilla
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ backgroundColor: '#F4F6FA' }}>
        {/* SHARED SIDEBAR */}
        <div
          className="hidden md:flex flex-col flex-shrink-0 border-r overflow-y-auto bg-white border-slate-200 w-[220px]"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="text-xs font-semibold text-slate-500">
              Especialidades
            </div>
          </div>
          <div className="p-3 space-y-1">
            {activeStats.map(c => (
              <div
                key={c.id}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${search === c.nombre ? 'bg-blue-50/50 border border-blue-100 shadow-sm' : 'hover:bg-[#F8FAFC]'}`}
                onClick={() => setSearch(search === c.nombre ? '' : c.nombre)}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                <div className="flex-1">
                  <div className="text-xs font-medium" style={{ color: search === c.nombre ? '#1A6BFF' : '#1A2B45', fontFamily: 'IBM Plex Sans, sans-serif' }}>
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

          {activeTab === 'Obreros' && (
            <>
              <div className="mx-4 my-2" style={{ height: 1, backgroundColor: '#F1F5F9' }} />
              <div className="px-4 py-2">
                <div className="text-xs font-semibold text-slate-500 mb-2">
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
            </>
          )}
        </div>

        {/* Center: Main Content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search bar */}
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b bg-white border-slate-200"
            >
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder={`Buscar ${activeTab === 'Obreros' ? 'obrero' : 'cuadrilla'} por nombre o especialidad...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-[13px] rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <span className="text-xs font-medium" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {activeTab === 'Obreros' ? `${filtered.length} obreros` : `${filteredCuadrillas.length} cuadrillas`}
              </span>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto relative">
              {activeTab === 'Cuadrillas' ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredCuadrillas.map(c => {
                      const members = obreros.filter(o => o.cuadrillas_asignadas?.includes(c.nombre));
                      return (
                        <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleEditCuadrilla(c)}>
                          <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
                            <div>
                              <h3 className="font-bold text-gray-800 text-[15px] group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                {c.nombre}
                                <Edit2 size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </h3>
                              {c.especialidades && c.especialidades.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {c.especialidades.map(esp => (
                                    <span key={esp} className="text-[9px] font-bold bg-blue-50/80 text-blue-700 border border-blue-100/50 px-2 py-0.5 rounded-md" style={{fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '0.02em'}}>{esp}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">{members.length} obreros</span>
                          </div>
                          <div className="flex-1 flex flex-col gap-2">
                            {members.slice(0, 5).map(m => (
                              <div key={m.id} className="text-[12px] font-medium text-slate-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm"></div>
                                {m.nombres_completos}
                              </div>
                            ))}
                            {members.length > 5 && (
                              <div className="text-[11px] font-medium text-slate-400 mt-1 pl-3">
                                + {members.length - 5} obreros más...
                              </div>
                            )}
                            {members.length === 0 && <span className="text-[12px] text-slate-400 italic">Sin personal asignado</span>}
                          </div>
                        </div>
                      );
                    })}
                    {filteredCuadrillas.length === 0 && (
                      <div className="col-span-full py-12 text-center text-[#94A3B8] text-sm">
                        No se encontraron cuadrillas con los filtros actuales.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      {['CÓDIGO', 'NOMBRE COMPLETO', 'ESPECIALIDAD', 'CUADRILLA', 'DNI', 'INGRESO', 'ESTADO', ''].map(col => (
                        <th
                          key={col}
                          className="px-4 py-3 text-left bg-slate-900 text-white text-[11px] font-semibold border-r border-white/5"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                          <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                          <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                          <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                          <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                          <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                          <td className="px-4 py-4"><div className="h-5 bg-gray-200 rounded-full w-16"></div></td>
                          <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-4"></div></td>
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#94A3B8] text-sm">
                          No se encontró personal con los filtros actuales.
                        </td>
                      </tr>
                    ) : (
                    filtered.map((p, idx) => {
                      const estadoCfg = ESTADO_CONFIG[p.estado];
                      const isSelected = selected?.id === p.id;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelected(isSelected ? null : p)}
                          className={`cursor-pointer transition-colors border-b border-slate-100 ${isSelected ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-[11px] text-blue-600 font-medium">
                              {p.id}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-slate-800">
                              {p.nombre}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500">
                              {p.especialidad}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500">
                              {p.cuadrilla}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[11px] text-slate-600">
                              {p.dni}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[11px] text-slate-400">
                              {p.ingreso}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                              style={{ backgroundColor: estadoCfg.bg, color: estadoCfg.text, fontFamily: 'IBM Plex Sans, sans-serif' }}
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
                    }))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Detail panel for Obreros */}
          {activeTab === 'Obreros' && selected && (
            <DetailPanel 
              person={selected} 
              onClose={() => setSelected(null)} 
              onEdit={() => handleEdit(selected)}
              onDelete={() => handleDelete(selected)}
            />
          )}
        </div>
      </div>
      
      <PersonalFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchPersonal}
        personToEdit={editingPerson}
      />
      <CuadrillaFormDialog
        isOpen={isCuadrillaFormOpen}
        onClose={() => setIsCuadrillaFormOpen(false)}
        cuadrillaToEdit={editingCuadrilla}
      />
    </div>
  );
}
