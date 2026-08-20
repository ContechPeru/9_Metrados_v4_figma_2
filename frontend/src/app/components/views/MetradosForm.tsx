import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Calculator, Check, Plus, Trash2, Building2, X, ChevronsUpDown, PlusCircle, Lock, Unlock } from 'lucide-react';
import { Command } from 'cmdk';
import { useMetradosForm } from '../../hooks/useMetradosForm';
import { usePersonalStore } from '../../store/usePersonalStore';
import { useMetradosStore } from '../../store/useMetradosStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppContext } from '../../context/AppContext';
import { PersonalMultiSelect } from '../PersonalMultiSelect';
import { supabase } from '../../lib/supabase';
import { ModalNuevaPartida } from './ModalNuevaPartida';
import { toast } from 'sonner';
import { formulaRegistry } from '../../../utils/formulas/strategies';

// En lugar de diccionario matriz quemado en código,
// extraemos las opciones únicas directamente de los metrados de la base de datos.

const FALLBACK_ESP_ABBR: Record<string, string> = {
  "ARQUEOLOGÍA": "ARQL",
  "ARQUITECTURA": "ARQ",
  "COMUNICACIONES": "TIC",
  "ELÉCTRICAS": "IIEE",
  "ELECTROMECÁNICAS": "IMM",
  "EQUIPAMIENTO BIOMÉDICO": "EQB",
  "ESTRUCTURAS": "EST",
  "INSTALACIONES DE COMUNICACIONES": "ICS",
  "INSTALACIONES ELÉCTRICAS Y MECÁNICAS": "IEM",
  "INSTALACIONES SANITARIAS": "IISS",
  "OBRAS PROVISIONALES": "OP",
  "PLAN DE MANEJO AMBIENTAL": "PMA",
  "SEGURIDAD": "SEG"
};

const CONFIG_ESPECIALIDAD: Record<string, { label: string | null }> = {
  "ARQUEOLOGÍA": { label: null },
  "ARQUITECTURA": { label: "Ambiente" },
  "COMUNICACIONES": { label: "Sistema" },
  "ELECTROMECÁNICAS": { label: "Sistema" },
  "ELÉCTRICAS": { label: "Sistema" },
  "ESTRUCTURAS": { label: "Sistema" },
  "INSTALACIONES SANITARIAS": { label: "Sistema" },
  "OBRAS PROVISIONALES": { label: null },
  "PLAN DE MANEJO AMBIENTAL": { label: null },
  "SEGURIDAD": { label: null },
  "DEFAULT": { label: "Ambiente" }
};

const FRENTES_BLOQUES: Record<string, string[]> = {
  'F1': ['B1', 'B2', 'B3', 'B5', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'EXT1', 'EXT2', 'EXT3', 'EXT4', 'EXT5', 'EXT6', 'EXT7', 'EXT8', 'EXT9', 'ZZ'],
  'F2': ['B4', 'B6']
};

const NIVELES = ['S0', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'ZZ', 'AZ', 'FC'];

const DebouncedInput = ({ value, onChange, ...props }: any) => {
  const [localValue, setLocalValue] = useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <input
      {...props}
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          onChange(localValue);
        }
        if (props.onKeyDown) props.onKeyDown(e);
      }}
    />
  );
};

export function MetradosForm() {
  const { proyectos, especialidades, usuarios, metrados, factoresHvac, editingMetrado, partidas } = useMetradosStore();
  const { user, systemConfig, isReadOnlyMetrados, isGerencia, isAdminPresupuesto, isLiquidaciones } = useAuthStore();

  const isSuper = isGerencia() || isAdminPresupuesto();
  const lockedEspecialidad = !isSuper && user?.especialidad ? user.especialidad : null;

  const {
    values, updateValue,
    selectedPartida, setSelectedPartida,
    strategy,
    extraData,
    parcial,
    total,
    isSubmitting,
    procesarRegistro,
    cancelarEdicion,
    limpiarCamposNum,
    usarUltimoPlano
  } = useMetradosForm(editingMetrado, lockedEspecialidad);

  const { setRightPanelVisible } = useAppContext();
  const { cuadrillasUnicas, fetchPersonal, obreros } = usePersonalStore();
  const readOnly = isReadOnlyMetrados();


  useEffect(() => {
    if (obreros.length === 0) fetchPersonal();
  }, [fetchPersonal, obreros.length]);

  // Opciones únicas dinámicas de la base de datos (Removidas por UX)

  const [searchPartida, setSearchPartida] = useState('');
  const [showPartidaDropdown, setShowPartidaDropdown] = useState(false);
  const [openHvac, setOpenHvac] = useState(false);
  const [hvacSearch, setHvacSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isModalPartidaOpen, setIsModalPartidaOpen] = useState(false);
  const [soloLiberados, setSoloLiberados] = useState(false);
  const [isPartidaCreationLocked, setIsPartidaCreationLocked] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hvacDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPartidaDropdown(false);
      }
      if (hvacDropdownRef.current && !hvacDropdownRef.current.contains(event.target as Node)) {
        setOpenHvac(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const currentEsp = lockedEspecialidad || values.especialidad || '';
  const espConfig = CONFIG_ESPECIALIDAD[currentEsp.toUpperCase()] || CONFIG_ESPECIALIDAD["DEFAULT"];


  const lastEspRef = useRef(currentEsp);

  useEffect(() => {
    // Auto-fill planoEsp whenever the main specialty changes
    if (currentEsp && currentEsp !== 'TODAS' && currentEsp !== lastEspRef.current && !editingMetrado) {
      lastEspRef.current = currentEsp;
      const calcEsp = especialidades.find(e => e.nombre === currentEsp)?.codigo || FALLBACK_ESP_ABBR[currentEsp] || currentEsp.substring(0, 3).toUpperCase();
      if (calcEsp) {
        updateValue('planoEsp', calcEsp);
      }
    }
  }, [currentEsp, especialidades, editingMetrado, updateValue]);

  // Búsqueda Booleana Local Síncrona usando useMemo para máximo rendimiento
  const partidasOptions = useMemo(() => {
    if (!values.proyecto_id) return [];

    // Filtro base: mismo proyecto y no es agrupador
    let result = partidas.filter(p => p.proyecto_id === values.proyecto_id && !p.es_agrupador);

    // Filtro por especialidad
    if (currentEsp && currentEsp !== 'TODAS' && currentEsp !== 'Auto-calculado...') {
      result = result.filter(p => p.especialidad === currentEsp);
    }

    // Buscador Booleano
    if (searchPartida.trim().length >= 2) {
      const terms = searchPartida.toLowerCase().trim().split(/\s+/);
      result = result.filter(p => {
        const textToSearch = `${p.codigo_expediente} ${p.descripcion}`.toLowerCase();
        return terms.every(term => {
          if (term.startsWith('-')) {
            const word = term.substring(1);
            return word ? !textToSearch.includes(word) : true;
          } else {
            const word = term.startsWith('+') ? term.substring(1) : term;
            return word ? textToSearch.includes(word) : true;
          }
        });
      });
    }

    return result.slice(0, 50);
  }, [searchPartida, values.proyecto_id, currentEsp, partidas]);

  useEffect(() => {
    if (values.hvacItemId && factoresHvac.length > 0) {
      const match = factoresHvac.find(f => f.id === values.hvacItemId);
      if (match) setHvacSearch(match.label);
    } else if (!values.hvacItemId) {
      setHvacSearch('');
    }
  }, [values.hvacItemId, factoresHvac]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [partidasOptions]);



  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (!showPartidaDropdown || partidasOptions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev < partidasOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < partidasOptions.length) {
        handleSelectPartida(partidasOptions[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowPartidaDropdown(false);
    }
  };

  // Set default proyecto si no hay uno seleccionado (Fijado a Hospital por petición)
  useEffect(() => {
    if (!values.proyecto_id && proyectos.length > 0) {
      const hospitalProject = proyectos.find(p => p.nombre.toLowerCase().includes('hospital') || p.codigo === 'HOSP');
      if (hospitalProject) {
        updateValue('proyecto_id', hospitalProject.id);
      } else {
        updateValue('proyecto_id', proyectos[0].id);
      }
    }
  }, [proyectos, values.proyecto_id, updateValue]);

  useEffect(() => {
    if (editingMetrado) {
      setSearchPartida(`${editingMetrado.snapshot_codigo} - ${editingMetrado.snapshot_descripcion}`);
    } else if (!selectedPartida) {
      setSearchPartida('');
    }
  }, [editingMetrado, selectedPartida]);

  const handleSelectPartida = (p: any) => {
    setSelectedPartida(p);
    setSearchPartida(`${p.codigo_expediente} - ${p.descripcion}`);
    setShowPartidaDropdown(false);

    // Auto-clean solo si NO estamos editando un metrado existente
    if (!editingMetrado) {
      limpiarCamposNum();
    }

    // AUTO-ASIGNAR ESPECIALIDAD
    let encontrada = '';
    for (const esp of especialidades) {
      if (esp.codigo_prefijos && Array.isArray(esp.codigo_prefijos)) {
        if (esp.codigo_prefijos.some((pref: string) => p.codigo_expediente?.startsWith(pref))) {
          encontrada = esp.nombre;
          break;
        }
      }
    }

    if (lockedEspecialidad) {
      updateValue('especialidad', lockedEspecialidad);
    } else if (encontrada) {
      updateValue('especialidad', encontrada);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.getElementById(nextId);
      if (nextInput) nextInput.focus();
    }
  };
  const isAcero = strategy.getFieldLabel('long') === 'Long. Recta';
  const isHvac = selectedPartida?.tipo_calculo === 'HVAC';

  return (
    <>
      <div className="flex flex-col h-full bg-slate-100 border-l border-gray-200 relative" style={{ width: 400 }}>
        <div className={`p-4 border-b flex items-center justify-between text-white ${editingMetrado ? 'bg-orange-500' : 'bg-[#065f46]'}`}>
          <h2 className="text-sm font-bold flex items-center gap-2 tracking-wide uppercase">
            {editingMetrado ? 'Modo Edición' : 'Nuevo Metrado'}
          </h2>
          <div className="flex items-center gap-2">
            {editingMetrado && (
              <button
                onClick={cancelarEdicion}
                className="text-xs bg-slate-100 text-orange-600 px-2 py-1 rounded font-bold hover:bg-orange-50 transition-colors shadow-sm"
              >
                CANCELAR
              </button>
            )}
            <button
              onClick={() => setRightPanelVisible(false)}
              className="p-1 rounded hover:bg-slate-100/20 transition-colors"
              title="Cerrar panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {editingMetrado && (
          <div className="bg-yellow-100 border-b border-yellow-300 p-2.5 text-yellow-800 text-[11px] flex flex-col justify-center items-center text-center shadow-inner">
            <span className="font-black tracking-widest uppercase flex items-center gap-1">
              ⚠️ EDITANDO METRADO HISTÓRICO ⚠️
            </span>
            <span className="font-mono mt-0.5 opacity-80 text-[10px]">
              ID: {editingMetrado.id}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 bg-gray-50/50">
          {/* TARJETA 1: Cuándo y Qué */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paso 1: Contexto y Partida</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={values.fecha}
                  onChange={e => updateValue('fecha', e.target.value)}
                  className="text-[10px] border border-gray-300 rounded px-1.5 py-0.5 text-gray-600 bg-slate-100"
                />
                <button onClick={limpiarCamposNum} className="text-gray-400 hover:text-red-500" title="Limpiar Números">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Contexto de Obra</label>
                <div className="relative">
                  <Building2 size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={values.proyecto_id} onChange={e => { updateValue('proyecto_id', e.target.value); setSelectedPartida(null); setSearchPartida(''); }}
                    className="w-full text-[11px] pl-6 pr-2 py-1.5 border border-indigo-300 rounded bg-indigo-50 font-bold text-indigo-900"
                  >
                    <option value="" disabled>Seleccione Proyecto</option>
                    {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Autor (Ing. a Cargo)</label>
                <select
                  value={values.autor} onChange={e => updateValue('autor', e.target.value)}
                  disabled={!isSuper}
                  className={`w-full text-xs p-1.5 border border-gray-300 rounded ${!isSuper ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-slate-100 text-gray-800'}`}
                >
                  <option value="" disabled>Seleccione su firma...</option>
                  {usuarios.map((u: any) => <option key={u.id} value={u.nombre_completo}>{u.nombre_completo}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Especialidad</label>
                <select
                  value={lockedEspecialidad || values.especialidad}
                  onChange={e => updateValue('especialidad', e.target.value)}
                  disabled={!!lockedEspecialidad}
                  className={`w-full text-xs p-1.5 border border-gray-300 rounded ${lockedEspecialidad ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                >
                  {!lockedEspecialidad && <option value="">Auto-calculado...</option>}
                  {especialidades
                    .filter(e => !lockedEspecialidad || e.nombre === lockedEspecialidad)
                    .map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                </select>
              </div>
            </div>

            {/* Buscador de Partida */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-gray-500 block">Buscador Maestro de Partida</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsPartidaCreationLocked(!isPartidaCreationLocked)}
                    className={`text-[10px] p-1 rounded transition-colors ${isPartidaCreationLocked ? 'text-slate-400 hover:bg-slate-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}
                    title={isPartidaCreationLocked ? 'Desbloquear creación de partida' : 'Bloquear creación'}
                  >
                    {isPartidaCreationLocked ? <Lock size={12} strokeWidth={2.5} /> : <Unlock size={12} strokeWidth={2.5} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalPartidaOpen(true)}
                    disabled={isPartidaCreationLocked}
                    className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded font-bold transition-colors ${isPartidaCreationLocked
                        ? 'text-slate-400 bg-slate-50 cursor-not-allowed opacity-60'
                        : 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100'
                      }`}
                    title="Crear una nueva partida desde cero"
                  >
                    <Plus size={10} strokeWidth={3} /> Nuevo Ítem
                  </button>
                </div>
              </div>
              <div className="relative" ref={dropdownRef}>
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código o descripción... (+ PC)"
                  value={searchPartida}
                  onChange={e => { setSearchPartida(e.target.value); setShowPartidaDropdown(true); }}
                  onFocus={() => setShowPartidaDropdown(true)}
                  onKeyDown={handleDropdownKeyDown}
                  className="w-full pl-8 pr-8 py-2 text-xs border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 bg-blue-50/30"
                />
                {searchPartida && (
                  <button
                    onClick={() => { setSearchPartida(''); setShowPartidaDropdown(false); setSelectedPartida(null); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                )}
                {showPartidaDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-100 border border-gray-200 rounded shadow-xl z-50 max-h-56 overflow-y-auto">
                    {partidasOptions.length > 0 ? (
                      <div key="results" className="flex flex-col">
                        {partidasOptions.map((p, index) => {
                          const isDD = p.codigo_expediente?.toUpperCase().includes('DD');
                          return (
                            <div
                              key={p.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (isDD) return;
                                handleSelectPartida(p);
                              }}
                              onMouseEnter={() => !isDD && setHighlightIndex(index)}
                              className={`px-3 py-2 border-b border-gray-100 text-xs transition-colors ${isDD
                                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                                  : highlightIndex === index ? 'bg-blue-100 cursor-pointer' : 'hover:bg-blue-50 cursor-pointer'
                                }`}
                            >
                              <div className="flex justify-between gap-3">
                                <div className="flex flex-col flex-1 min-w-0">
                                  <div className="font-bold text-[#065f46] truncate">
                                    {p.codigo_expediente} {isDD && <span className="text-[9px] text-red-500 font-bold ml-1">(No admitido)</span>}
                                  </div>
                                  <div className="text-gray-600 text-[11px] leading-tight mt-1 line-clamp-2">
                                    {p.descripcion}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  {p.especialidad && (
                                    <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 uppercase">
                                      {p.especialidad}
                                    </span>
                                  )}
                                  {p.modificacion && (
                                    <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold border border-amber-200 shadow-sm">
                                      {p.modificacion}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div key="no-results" className="px-4 py-6 text-center text-gray-500 text-xs">
                        <p className="font-semibold text-gray-600 mb-2">Sin resultados</p>
                        <p className="mb-4">No encontramos partidas para "{searchPartida}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sub-Tarjeta Visor Financiero */}
            {selectedPartida && (() => {
              const cantTotal = selectedPartida.cantidad_presupuestada || 0;
              const isLiq = isLiquidaciones();
              const cantAcum = isLiq ? 0 : (selectedPartida.metrado_acumulado_anterior || 0);
              const cantMes = metrados.filter(m => m.partida_id === selectedPartida.id && (!soloLiberados || m.is_liberado !== false)).reduce((sum, m) => sum + (m.resultado_total || 0), 0);
              const cantSaldo = cantTotal - cantAcum - cantMes;
              const isMayorMetrado = cantSaldo < 0;

              // Calculamos % ejecutado (lo que ya se hizo sobre el total) o % saldo, pero es mejor mostrar % Ejecutado Total
              const pctEjecutado = cantTotal > 0 ? (((cantAcum + cantMes) / cantTotal) * 100) : 0;

              return (
                <div className={`relative border rounded p-2 flex justify-between items-center mt-2 shadow-sm ${isMayorMetrado ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex flex-1 justify-around items-center divide-x divide-slate-200/60">
                    <div className="flex flex-col items-center px-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{isLiq ? 'Expediente' : 'Total Exp.'}</span>
                      <span className="font-mono text-[11px] font-semibold text-slate-700">{cantTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {!isLiq && (
                      <div className="flex flex-col items-center px-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Acum. Ant.</span>
                        <span className="font-mono text-[11px] font-semibold text-slate-700">{cantAcum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center px-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{isLiq ? 'Total Liquidado' : 'Mes Actual'}</span>
                      <span className="font-mono text-[11px] font-bold text-blue-600">{cantMes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex flex-col items-center px-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isMayorMetrado ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isMayorMetrado ? 'Mayor Metrado' : (isLiq ? 'Diferencia' : 'Saldo Pendiente')}
                      </span>
                      <span className={`font-mono text-xs font-bold ${isMayorMetrado ? 'text-red-600' : 'text-emerald-600'}`}>
                        {Math.abs(cantSaldo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] opacity-70">{selectedPartida.unidad_medida}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-center pl-2">
                      <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex flex-col items-center justify-center min-w-[42px] ${isMayorMetrado ? 'bg-red-100 text-red-700 border-red-200' :
                          pctEjecutado >= 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            'bg-slate-200 text-slate-700 border-slate-300'
                        }`}>
                        <span>{pctEjecutado.toFixed(1)}%</span>
                        <span className="text-[7px] font-semibold uppercase opacity-70 leading-none mt-0.5 text-center">{isLiq ? 'Liquidado' : 'Ejecutado'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle para Solo Liberados */}
                  <div className="absolute -top-5 right-1 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-t-md border border-b-0 border-slate-200">
                    <input
                      type="checkbox"
                      id="soloLiberados"
                      checked={soloLiberados}
                      onChange={(e) => setSoloLiberados(e.target.checked)}
                      className="w-2.5 h-2.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="soloLiberados" className="text-[8px] font-bold text-slate-500 uppercase cursor-pointer select-none">
                      Solo Aprobados
                    </label>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* TARJETA 2: Dónde y Quién */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paso 2: Ubicación y Elemento</h3>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Bloque</label>
                <select 
                  value={values.bloque || ''} 
                  onChange={e => {
                    const b = e.target.value;
                    updateValue('bloque', b);
                    const f = Object.entries(FRENTES_BLOQUES).find(([_, bs]) => bs.includes(b))?.[0] || '';
                    updateValue('frente', f);
                  }} 
                  className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-slate-100" 
                >
                  <option value="">---</option>
                  {Object.values(FRENTES_BLOQUES).flat().sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Nivel</label>
                <select 
                  value={values.nivel || ''} 
                  onChange={e => updateValue('nivel', e.target.value)} 
                  className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-slate-100" 
                >
                  <option value="">---</option>
                  {NIVELES.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              {espConfig.label ? (
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">{espConfig.label}</label>
                  <input 
                    type="text"
                    value={values.ambiente || ''} 
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      updateValue('ambiente', val);
                      if (espConfig.label === 'Sistema') {
                        updateValue('planoSist', val);
                      }
                    }}
                    placeholder={`Escriba el ${espConfig.label.toLowerCase()}...`}
                    className="w-full text-xs p-1.5 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-blue-50/30 uppercase" 
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">UBI: OPCIONAL</label>
                  <input 
                    type="text"
                    value={values.ambiente || ''} 
                    onChange={e => updateValue('ambiente', e.target.value.toUpperCase())}
                    placeholder="Escriba la ubicación..."
                    className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-slate-100 uppercase" 
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Elemento / Eje</label>
                <DebouncedInput
                  type="text"
                  value={values.elemento}
                  onChange={(val: string) => updateValue('elemento', val)}
                  onFocus={(e: any) => e.target.select()}
                  className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Ej: Zapata Z-1"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Detalle Específico</label>
                {isHvac ? (
                  <div className="relative" ref={hvacDropdownRef}>
                    <Command shouldFilter={false} className="w-full relative">
                      <div className="relative flex items-center">
                        <Command.Input
                          value={hvacSearch}
                          onValueChange={(val) => {
                            setHvacSearch(val);
                            if (!openHvac) setOpenHvac(true);
                            if (values.hvacItemId) updateValue('hvacItemId', ''); // Limpiar el ID seleccionado si modifican el texto
                          }}
                          onFocus={(e) => {
                            setOpenHvac(true);
                            e.target.select();
                          }}
                          placeholder="Escriba dimensión (ej. 10x10)..."
                          className="w-full text-xs p-1.5 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-blue-50 pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setOpenHvac(!openHvac)}
                          className="absolute right-2 text-gray-500 hover:text-blue-600 focus:outline-none"
                        >
                          <ChevronsUpDown size={14} className="opacity-50" />
                        </button>
                      </div>

                      {openHvac && (
                        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-slate-100 border border-gray-200 rounded shadow-xl overflow-hidden">
                          <Command.List className="max-h-48 overflow-y-auto p-1">
                            {factoresHvac.filter(f => f.label.toLowerCase().includes(hvacSearch.toLowerCase())).length === 0 && (
                              <Command.Empty className="p-3 text-xs text-gray-500 text-center font-medium">No encontrado.</Command.Empty>
                            )}
                            {factoresHvac.filter(f => f.label.toLowerCase().includes(hvacSearch.toLowerCase())).map(f => (
                              <Command.Item
                                key={f.id}
                                value={f.label}
                                onSelect={() => {
                                  updateValue('hvacItemId', f.id);
                                  setHvacSearch(f.label);
                                  updateValue('elemento', f.label);
                                  setOpenHvac(false);
                                }}
                                className="px-2 py-1.5 text-xs rounded hover:bg-blue-50 cursor-pointer aria-selected:bg-blue-100 aria-selected:text-blue-800 transition-colors"
                              >
                                {f.label}
                              </Command.Item>
                            ))}
                          </Command.List>
                        </div>
                      )}
                    </Command>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold">Detalle / Nro.</label>
                      <button
                        type="button"
                        onClick={() => {
                          const { metrados } = useMetradosStore.getState();
                          const lastWithDet = [...metrados].reverse().find(m => m.detalle_desc && m.detalle_desc.trim() !== '');
                          if (lastWithDet) {
                            updateValue('detalle', lastWithDet.detalle_desc);
                          }
                        }}
                        className="text-[9px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 transition-colors"
                        title="Copiar detalle del último metrado registrado en la base de datos"
                      >
                      </button>
                    </div>
                    <DebouncedInput
                      type="text"
                      value={values.detalle}
                      onChange={(val: string) => updateValue('detalle', val)}
                      onFocus={(e: any) => e.target.select()}
                      className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="Detalle..."
                      autoComplete="off"
                    />
                  </>
                )}
              </div>
            </div>
          </div>



          {/* UBI: Ubicación */}
          <div className="flex items-center gap-2 mt-1">
            <label className="text-[10px] text-gray-500 font-semibold whitespace-nowrap">UBI: (opcional)</label>
            <select
              value={values.ubicacion || ''}
              onChange={e => updateValue('ubicacion', e.target.value)}
              className="text-xs p-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white min-w-[80px]"
            >
              <option value="">---</option>
              {values.ubicacion && !['PP', 'PN4', 'MM4', 'PN5', 'MM5', 'PN6', 'MM6'].includes(values.ubicacion) && (
                <option value={values.ubicacion}>{values.ubicacion}</option>
              )}
              <option value="PP">PP</option>
              <option value="PN4">PN4</option>
              <option value="MM4">MM4</option>
              <option value="PN5">PN5</option>
              <option value="MM5">MM5</option>
              <option value="PN6">PN6</option>
              <option value="MM6">MM6</option>
            </select>
          </div>

          {/* TARJETA 3: Cuánto (Matemática) */}
          <div className="bg-slate-100 border-2 border-dashed border-gray-300 rounded-lg p-3 space-y-3">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fila 4: Matemática</h3>

            {isAcero && (
              <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-2">
                <label className="text-[10px] text-orange-700 font-bold mb-1 block">Diámetro Acero</label>
                <select value={values.diametroAcero} onChange={e => updateValue('diametroAcero', e.target.value)} className="w-full text-xs p-1.5 border border-orange-300 rounded bg-slate-100 text-orange-900 font-bold">
                  <option value="">Seleccionar Ø...</option>
                  <option value="1/4">1/4"</option>
                  <option value="3/8">3/8"</option>
                  <option value="1/2">1/2"</option>
                  <option value="5/8">5/8"</option>
                  <option value="3/4">3/4"</option>
                  <option value="1">1"</option>
                </select>
              </div>
            )}

            <div className={`grid gap-1.5 ${isAcero ? 'grid-cols-5' : 'grid-cols-5'}`}>
              <div>
                <label className="block text-center text-[9px] text-gray-500 font-bold mb-0.5">CANT.</label>
                <input id="inp-cant" type="number" onKeyDown={e => handleKeyDown(e, 'inp-long')} value={values.cant} onChange={e => updateValue('cant', parseFloat(e.target.value) || 0)} onFocus={(e: any) => e.target.select()} className="w-full text-center text-xs p-1 border border-gray-300 rounded font-mono" />
              </div>
              <div>
                <label className="block text-center text-[9px] text-gray-500 font-bold mb-0.5 truncate">{strategy.getFieldLabel('long')}</label>
                <input id="inp-long" type="number" onKeyDown={e => handleKeyDown(e, 'inp-ancho')} value={values.long} onChange={e => updateValue('long', parseFloat(e.target.value) || 0)} onFocus={(e: any) => e.target.select()} disabled={strategy.isFieldLocked('long', extraData)} className={`w-full text-center text-xs p-1 border border-gray-300 rounded font-mono ${strategy.isFieldLocked('long', extraData) ? 'bg-gray-100 cursor-not-allowed text-gray-400' : ''}`} />
              </div>
              <div>
                <label className="block text-center text-[9px] text-gray-500 font-bold mb-0.5 truncate">{strategy.getFieldLabel('ancho')}</label>
                <input id="inp-ancho" type="number" onKeyDown={e => handleKeyDown(e, 'inp-alt')} value={values.ancho} onChange={e => updateValue('ancho', parseFloat(e.target.value) || 0)} onFocus={(e: any) => e.target.select()} disabled={strategy.isFieldLocked('ancho', extraData)} className={`w-full text-center text-xs p-1 border border-gray-300 rounded font-mono ${strategy.isFieldLocked('ancho', extraData) ? 'bg-gray-100 cursor-not-allowed text-gray-400' : ''}`} />
              </div>
              <div>
                <label className="block text-center text-[9px] text-gray-500 font-bold mb-0.5 truncate">{strategy.getFieldLabel('alt')}</label>
                <input id="inp-alt" type="number" onKeyDown={e => handleKeyDown(e, 'inp-veces')} value={values.alt} onChange={e => updateValue('alt', parseFloat(e.target.value) || 0)} onFocus={(e: any) => e.target.select()} disabled={strategy.isFieldLocked('alt', extraData)} className={`w-full text-center text-xs p-1 border border-gray-300 rounded font-mono ${strategy.isFieldLocked('alt', extraData) ? 'bg-gray-100 cursor-not-allowed text-gray-400' : ''}`} />
              </div>
              <div>
                <label className="block text-center text-[9px] text-gray-500 font-bold mb-0.5 text-blue-600">VECES</label>
                <input id="inp-veces" type="number" onFocus={(e: any) => e.target.select()} onKeyDown={async e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!isSubmitting && selectedPartida && total > 0) {
                      try {
                        await procesarRegistro();
                        toast.success("Metrado registrado con éxito");
                      } catch (err: any) {
                        toast.error(err.message);
                      }
                    }
                  }
                }} value={values.veces} onChange={e => updateValue('veces', parseFloat(e.target.value) || 0)} className="w-full text-center text-xs p-1 border border-blue-400 rounded font-mono bg-blue-50 font-bold text-blue-900" />
              </div>
            </div>

            <div className="bg-gray-800 rounded text-white p-2 flex justify-between items-center mt-2 shadow-inner">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 uppercase">Parcial Exacto</span>
                {strategy === formulaRegistry['HVAC'] ? (
                  <input type="number"
                    value={values.overrideParcial !== undefined ? values.overrideParcial : parcial}
                    onChange={e => updateValue('overrideParcial', parseFloat(e.target.value) || 0)}
                    onFocus={(e: any) => e.target.select()}
                    className="w-24 bg-gray-700 text-white font-mono text-lg border border-gray-600 rounded px-1 outline-none focus:border-blue-400" />
                ) : (
                  <span className="font-mono text-lg">{parcial.toFixed(3)}</span>
                )}
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[9px] text-green-400 font-bold uppercase">Total Integrado</span>
                {strategy === formulaRegistry['HVAC'] ? (
                  <input type="number"
                    value={values.overrideTotal !== undefined ? values.overrideTotal : total}
                    onChange={e => updateValue('overrideTotal', parseFloat(e.target.value) || 0)}
                    onFocus={(e: any) => e.target.select()}
                    className="w-24 bg-gray-700 text-green-400 font-mono text-xl font-bold border border-gray-600 rounded px-1 text-right outline-none focus:border-green-400" />
                ) : (
                  <span className="font-mono text-xl font-bold text-green-400">{total.toFixed(3)}</span>
                )}
              </div>
            </div>
          </div>
          {/* TARJETA 4: Código de Plano */}
          {!values.sinPlano ? (
            <div className="bg-slate-100 border border-gray-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Código de Plano</h3>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={usarUltimoPlano}
                    className="text-[10px] text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-2 py-0.5 transition-colors flex items-center gap-1 font-medium"
                    title="Cargar el último plano registrado en tu caché local">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Anterior
                  </button>
                  <button type="button" onClick={() => updateValue('sinPlano', true)}
                    className="text-[10px] text-gray-500 hover:text-orange-600 border border-gray-200 hover:border-orange-300 rounded px-2 py-0.5 transition-colors flex items-center gap-1 font-medium bg-slate-100">
                    <span>⚠</span> Sin plano
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5 overflow-x-auto pb-1">
                {[
                  { label: 'CUI', value: '2361679' },
                  { label: 'Entidad', value: 'GRC' },
                  { label: 'Bloque', value: values.bloque || 'B?' },
                  { label: 'Nivel', value: values.nivel || 'N?' },
                  { label: espConfig.label || 'Ambiente', value: values.ambiente || '?' }
                ].map((f, i) => (
                  <div key={i}>
                    <label className="block text-center text-[9px] text-gray-500 font-bold mb-0.5">{f.label}</label>
                    <input type="text" value={f.value} disabled className="w-full text-center text-xs p-1 border border-gray-300 rounded font-mono bg-gray-100 text-gray-500" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {/* Esp. (Select Editable con auto-relleno) */}
                <div>
                  <label className="block text-center text-[9px] text-blue-600 font-bold mb-0.5">Esp.</label>
                  <select
                    value={values.planoEsp || ''}
                    onChange={e => updateValue('planoEsp', e.target.value)}
                    className="w-full text-center text-xs p-1 border border-blue-300 rounded font-mono bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none font-bold"
                  >
                    <option value="" disabled>...</option>
                    {Array.from(new Set([
                      ...Object.values(FALLBACK_ESP_ABBR),
                      ...especialidades.map(e => e.codigo).filter(Boolean),
                      values.planoEsp
                    ])).filter(Boolean).sort().map(code => (
                      <option key={String(code)} value={String(code)}>{String(code)}</option>
                    ))}
                  </select>
                </div>
                {/* Sist. (Editable) */}
                <div>
                  <label className="block text-center text-[9px] text-blue-600 font-bold mb-0.5">Sist.</label>
                  <input
                    type="text"
                    list="sist-options"
                    value={values.planoSist ?? ''}
                    onChange={e => updateValue('planoSist', e.target.value.toUpperCase())}
                    placeholder="ACB"
                    className="w-full text-center text-xs p-1 border border-blue-300 rounded font-mono bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none uppercase"
                  />
                  <datalist id="sist-options">
                    <option value="ACB">ACABADOS</option>
                    <option value="ACO">ACERO</option>
                    <option value="DW">DRYWALL</option>
                    <option value="ISA">INSTALACIONES SANITARIAS</option>
                    <option value="EQB">BIOMEDICO</option>
                    <option value="CE">CABLEADO ESTRUCTURADO</option>
                    <option value="CI">CIMENTACION</option>
                    <option value="HVAC">HVAC</option>
                    <option value="VER">DETALLES DE ESCALERA METALICA</option>
                    <option value="GEN">GENERAL</option>
                  </datalist>
                </div>

                {/* Tipo doc. (No Editable) */}
                <div>
                  <label className="block text-center text-[9px] text-gray-500 font-bold mb-0.5">Tipo doc.</label>
                  <input type="text" value="PLN" disabled className="w-full text-center text-xs p-1 border border-gray-300 rounded font-mono bg-gray-100 text-gray-500" />
                </div>

                {/* Num (Editable) */}
                <div>
                  <label className="block text-center text-[9px] text-blue-600 font-bold mb-0.5">Num</label>
                  <input
                    type="text"
                    value={values.planoNum ?? ''}
                    onChange={e => updateValue('planoNum', e.target.value.toUpperCase())}
                    placeholder="276"
                    className="w-full text-center text-xs p-1 border border-blue-300 rounded font-mono bg-blue-50 focus:ring-1 focus:ring-blue-400 outline-none uppercase"
                  />
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded px-3 py-2 text-[11px] font-mono text-gray-600">
                <span className="font-bold text-gray-800">Código: </span>
                {['2361679', 'GRC', values.bloque || 'B?', values.nivel || 'N?', values.planoEsp || especialidades.find(e => e.nombre === currentEsp)?.codigo || FALLBACK_ESP_ABBR[currentEsp] || currentEsp?.substring(0, 3).toUpperCase() || 'E?', values.planoSist || '?', 'PLN', values.planoNum || '?'].join(' - ')}
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Sin Plano</h3>
                <button type="button" onClick={() => { updateValue('sinPlano', false); updateValue('motivoSinPlano', ''); updateValue('obsSinPlano', ''); }}
                  className="text-[10px] text-gray-400 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded px-2 py-0.5 transition-colors">
                  Tengo plano
                </button>
              </div>
              <p className="text-[10px] text-orange-700">Selecciona el motivo:</p>
              <div className="grid grid-cols-1 gap-1.5">
                {[{ value: 'extraviado', label: 'Plano no localizado en obra' }, { value: 'en_tramite', label: 'Plano en tramite / pendiente de emision' }, { value: 'sin_diseno', label: 'Elemento sin diseno formal' }].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer border transition-colors text-xs ${values.motivoSinPlano === opt.value ? 'bg-orange-100 border-orange-400 text-orange-900 font-semibold' : 'bg-slate-100 border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                    <input type="radio" name="motivoSinPlano" value={opt.value} checked={values.motivoSinPlano === opt.value} onChange={() => updateValue('motivoSinPlano', opt.value)} className="accent-orange-500" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}

        {/* Observaciones Generales */}
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between mb-0.5">
            <label className="block text-[10px] text-gray-700 font-bold">
              Observaciones
            </label>
            <button
              type="button"
              onClick={() => {
                // Buscar el último metrado registrado que tenga una observación (ignoramos los que solo tienen detalle)
                const { metrados } = useMetradosStore.getState();
                const lastWithObs = [...metrados].reverse().find(m => m.observacion && m.observacion.trim() !== '');
                if (lastWithObs) {
                  updateValue('observacion', lastWithObs.observacion);
                } else {
                  // Fallback a localStorage por si es el primer metrado de la sesión
                  const lastObs = localStorage.getItem('last_observacion');
                  if (lastObs) updateValue('observacion', lastObs);
                }
              }}
              className="text-[9px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 transition-colors"
              title="Copiar observación del último metrado registrado en la base de datos"
            >
              + Última Obs.
            </button>
          </div>
          <textarea
            rows={1}
            value={values.observacion ?? ''}
            onChange={e => updateValue('observacion', e.target.value)}
            placeholder="Añade detalles o sustento adicional aquí..."
            className="w-full text-[11px] p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-shadow"
          />
        </div>
        </div>

        {/* Footer Fijo */}
        <div className="p-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          {(() => {
            const lockDate = systemConfig?.metrados_lock?.activo ? systemConfig.metrados_lock.fecha_cierre : null;
            const isTimeLocked = lockDate && values.fecha <= lockDate && !isSuper;
            const readOnly = isReadOnlyMetrados();
            const formDisabled = isSubmitting || !selectedPartida || (total === 0 && !isAcero) || isTimeLocked || readOnly;

            let buttonText = isSubmitting ? 'GUARDANDO...' : (editingMetrado ? 'EDITAR METRADO' : 'REGISTRAR METRADO');
            if (readOnly) buttonText = 'MODO LECTURA';
            else if (isTimeLocked) buttonText = 'FECHA BLOQUEADA';

            return (
              <button
                onClick={async () => {
                  if (readOnly || isTimeLocked) return;
                  try {
                    await procesarRegistro();
                    toast.success("Metrado guardado con éxito");
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
                disabled={formDisabled}
                className={`w-full font-bold py-2 text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm ${readOnly || isTimeLocked ? 'bg-gray-400 text-gray-200 cursor-not-allowed' :
                    editingMetrado ? 'bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white' :
                      'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white'
                  }`}
              >
                {isSubmitting ? <Check size={16} /> : (editingMetrado ? <Check size={16} /> : <Plus size={16} />)}
                <span>{buttonText}</span>
              </button>
            );
          })()}
        </div>

        {isModalPartidaOpen && (
          <ModalNuevaPartida
            onClose={(newPartida) => {
              setIsModalPartidaOpen(false);
              if (newPartida) {
                handleSelectPartida(newPartida);
              }
            }}
          />
        )}
      </div>
    </>
  );
}
