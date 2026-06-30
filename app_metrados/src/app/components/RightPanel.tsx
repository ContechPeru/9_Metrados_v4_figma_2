import { useState } from 'react';
import { Search, ChevronDown, X, Plus, Save, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ESPECIALIDADES = ['Estructuras', 'Arquitectura', 'IIEE', 'IISS', 'HVAC'];
const FRENTES = ['Frente A', 'Frente B', 'Frente C', 'Frente D'];
const BLOQUES = ['Bloque 01', 'Bloque 02', 'Bloque 03', 'Bloque 04'];
const NIVELES = ['Sótano', 'Piso 01', 'Piso 02', 'Piso 03', 'Piso 04', 'Azotea'];
const CUADRILLAS = ['C-01 Estructuras', 'C-02 Instalaciones', 'C-03 Arquitectura', 'C-04 HVAC'];

function SelectFilter({
  label, options, value, onChange
}: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none text-xs px-2.5 py-1.5 rounded border bg-white pr-7 cursor-pointer outline-none focus:ring-1 focus:ring-[#1A6BFF]"
        style={{
          borderColor: '#E2E8F0',
          color: value ? '#1A2B45' : '#94A3B8',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '11px',
        }}
      >
        <option value="">{label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
    </div>
  );
}

export function RightPanel() {
  const { bdMode, setBdMode } = useAppContext();
  const [especialidad, setEspecialidad] = useState('');
  const [frente, setFrente] = useState('');
  const [bloque, setBloque] = useState('');
  const [nivel, setNivel] = useState('');
  const [searchPartida, setSearchPartida] = useState('');
  const [cuadrilla, setCuadrilla] = useState('');
  const [searchObrero, setSearchObrero] = useState('');
  const [elemento, setElemento] = useState('');
  const [detalle, setDetalle] = useState('');
  const [codigoObrero, setCodigoObrero] = useState('');

  const today = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div
      className="flex flex-col h-screen flex-shrink-0 overflow-hidden"
      style={{
        width: 380,
        backgroundColor: '#FFFFFF',
        borderLeft: '1px solid #E5E9F0',
      }}
    >
      {/* BD / PC Toggle */}
      <div
        className="flex items-center justify-center px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #F1F5F9' }}
      >
        <div
          className="relative flex rounded-full p-0.5 cursor-pointer"
          style={{ backgroundColor: '#F1F5F9', width: '100%', maxWidth: 320 }}
          onClick={() => setBdMode(bdMode === 'oficial' ? 'pc' : 'oficial')}
        >
          {/* Sliding indicator */}
          <div
            className="absolute top-0.5 bottom-0.5 w-1/2 rounded-full shadow-sm transition-all duration-300"
            style={{
              backgroundColor: bdMode === 'oficial' ? '#1A6BFF' : '#FF6B1A',
              left: bdMode === 'oficial' ? '2px' : '50%',
            }}
          />
          <div
            className="relative z-10 flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-colors duration-300"
            style={{
              color: bdMode === 'oficial' ? '#fff' : '#94A3B8',
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}
          >
            BD Oficial
          </div>
          <div
            className="relative z-10 flex-1 text-center py-1.5 rounded-full text-xs font-semibold transition-colors duration-300"
            style={{
              color: bdMode === 'pc' ? '#fff' : '#94A3B8',
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}
          >
            Partidas PC
          </div>
        </div>
      </div>

      {/* Header del panel */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid #F1F5F9', backgroundColor: '#FAFBFC' }}
      >
        <div>
          <div className="font-bold text-xs tracking-widest uppercase" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.08em' }}>
            Registro de Metrados
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
            {today}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded font-semibold"
            style={{ backgroundColor: '#EEF4FF', color: '#1A6BFF', fontFamily: 'JetBrains Mono, monospace' }}
          >
            v5.0
          </span>
          <button className="p-1 rounded hover:bg-[#F1F5F9] transition-colors" style={{ color: '#94A3B8' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Filtros en cascada */}
        <div className="px-4 pt-4 pb-3">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', letterSpacing: '0.1em' }}>
            Ubicación
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SelectFilter label="Especialidad" options={ESPECIALIDADES} value={especialidad} onChange={setEspecialidad} />
            <SelectFilter label="Frente" options={FRENTES} value={frente} onChange={v => { setFrente(v); setBloque(''); setNivel(''); }} />
            <SelectFilter label="Bloque" options={frente ? BLOQUES : []} value={bloque} onChange={v => { setBloque(v); setNivel(''); }} />
            <SelectFilter label="Nivel" options={bloque ? NIVELES : []} value={nivel} onChange={setNivel} />
          </div>
        </div>

        {/* Separador */}
        <div className="mx-4 mb-3" style={{ height: 1, backgroundColor: '#F1F5F9' }} />

        {/* Buscador de partida */}
        <div className="px-4 mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', letterSpacing: '0.1em' }}>
            Partida
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              value={searchPartida}
              onChange={e => setSearchPartida(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border outline-none focus:ring-1 focus:ring-[#1A6BFF]"
              style={{
                borderColor: '#E2E8F0',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: '12px',
                color: '#1A2B45',
              }}
            />
          </div>
          {/* Mode badge */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: bdMode === 'oficial' ? '#1A6BFF' : '#FF6B1A' }}
            />
            <span className="text-xs" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}>
              {bdMode === 'oficial' ? 'Base de datos oficial activa' : '224 partidas PC disponibles'}
            </span>
          </div>
        </div>

        <div className="mx-4 mb-3" style={{ height: 1, backgroundColor: '#F1F5F9' }} />

        {/* Cuadrilla / Personal */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', letterSpacing: '0.1em' }}>
              Cuadrilla / Personal
            </div>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}>
                Código
              </label>
              <input
                type="text"
                placeholder="OB-001"
                value={codigoObrero}
                onChange={e => setCodigoObrero(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border outline-none focus:ring-1 focus:ring-[#1A6BFF]"
                style={{ borderColor: '#E2E8F0', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#1A2B45' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}>
                Cuadrilla
              </label>
              <SelectFilter label="Selec." options={CUADRILLAS} value={cuadrilla} onChange={setCuadrilla} />
            </div>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Buscar obrero por nombre..."
              value={searchObrero}
              onChange={e => setSearchObrero(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border outline-none focus:ring-1 focus:ring-[#1A6BFF]"
              style={{
                borderColor: '#E2E8F0',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: '12px',
                color: '#1A2B45',
              }}
            />
          </div>
        </div>

        <div className="mx-4 mb-3" style={{ height: 1, backgroundColor: '#F1F5F9' }} />

        {/* Elemento / Agrupador */}
        <div className="px-4 mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', letterSpacing: '0.1em' }}>
            Elemento / Agrupador
          </div>
          <input
            type="text"
            placeholder="Ej: Columna C-01, Zapata Z-02..."
            value={elemento}
            onChange={e => setElemento(e.target.value)}
            className="w-full px-2.5 py-2 text-xs rounded-lg border outline-none focus:ring-1 focus:ring-[#1A6BFF] mb-2"
            style={{ borderColor: '#E2E8F0', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '12px', color: '#1A2B45' }}
          />
          <div className="relative">
            <span className="absolute left-3 top-2" style={{ color: '#CBD5E1', fontSize: '10px', fontFamily: 'JetBrains Mono' }}>↳</span>
            <input
              type="text"
              placeholder="Detalle específico..."
              value={detalle}
              onChange={e => setDetalle(e.target.value)}
              className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border outline-none focus:ring-1 focus:ring-[#1A6BFF]"
              style={{ borderColor: '#E2E8F0', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '12px', color: '#1A2B45', backgroundColor: '#FAFBFC' }}
            />
          </div>
        </div>

        {/* Dimensiones rápidas */}
        <div className="px-4 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px', letterSpacing: '0.1em' }}>
            Dimensiones
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {['Cant.', 'Long.', 'Ancho', 'Alt.'].map(dim => (
              <div key={dim}>
                <label className="block text-center mb-1" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans', fontSize: '10px' }}>
                  {dim}
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-2 py-1.5 text-center rounded border outline-none focus:ring-1 focus:ring-[#1A6BFF]"
                  style={{ borderColor: '#E2E8F0', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#1A2B45' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid #E5E9F0', backgroundColor: '#FAFBFC' }}
      >
        <button
          className="flex-shrink-0 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-[#FEF2F2] hover:border-[#EF4444] hover:text-[#EF4444]"
          style={{ borderColor: '#E2E8F0', color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif' }}
        >
          Limpiar
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-[#F8FAFC]"
          style={{ borderColor: '#E2E8F0', color: '#1A2B45', fontFamily: 'IBM Plex Sans, sans-serif' }}
        >
          <Save size={13} />
          Guardar
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-sm hover:shadow-md"
          style={{ backgroundColor: '#1A6BFF', fontFamily: 'IBM Plex Sans, sans-serif' }}
        >
          <Plus size={13} />
          Añadir Ítem
        </button>
      </div>
    </div>
  );
}
