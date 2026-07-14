import React, { useEffect, useMemo, useState } from 'react';
import { useMetradosStore } from '../../store/useMetradosStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, parseISO, getWeekOfMonth, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function DashboardEjecucion() {
  const { metrados, fetchMetrados, isLoading } = useMetradosStore();
  const { puedeVer } = useAuthStore();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<string>('Todas');
  const [selectedWeek, setSelectedWeek] = useState<string>('Todas');

  useEffect(() => {
    fetchMetrados(true); // Cargar todos para el dashboard histórico
  }, [fetchMetrados]);

  // Si no tiene permisos, no mostrar (usamos 'metrados' temporalmente o 'acceso_admin')
  if (!puedeVer('metrados') && !puedeVer('admin')) { 
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        No tienes permisos para ver este módulo.
      </div>
    );
  }

  // Filtrado de Datos Base
  const datosFiltrados = useMemo(() => {
    return metrados.filter((m) => {
      if (!m.fecha_ejecucion) return false;
      try {
        const fecha = parseISO(m.fecha_ejecucion);
        if (getMonth(fecha) !== selectedMonth || getYear(fecha) !== selectedYear) return false;
        if (selectedEspecialidad !== 'Todas' && m.especialidad !== selectedEspecialidad) return false;
        if (selectedWeek !== 'Todas') {
          const semana = getWeekOfMonth(fecha, { weekStartsOn: 1 });
          if (`Semana ${semana}` !== selectedWeek) return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    });
  }, [metrados, selectedMonth, selectedYear, selectedEspecialidad, selectedWeek]);

  // KPIs
  const montoValorizado = useMemo(() => {
    return datosFiltrados.reduce((sum, m) => sum + (m.monto_total || 0), 0);
  }, [datosFiltrados]);

  const montoAcumuladoTotal = useMemo(() => {
    // Todo lo histórico hasta el fin del mes seleccionado
    return metrados.reduce((sum, m) => {
      if (!m.fecha_ejecucion) return sum;
      try {
        const fecha = parseISO(m.fecha_ejecucion);
        const mesMetrado = getMonth(fecha);
        const anioMetrado = getYear(fecha);
        if (anioMetrado < selectedYear || (anioMetrado === selectedYear && mesMetrado <= selectedMonth)) {
          return sum + (m.monto_total || 0);
        }
        return sum;
      } catch (e) {
        return sum;
      }
    }, 0);
  }, [metrados, selectedMonth, selectedYear]);

  // Datos para Especialidad (Dona)
  const dataEspecialidad = useMemo(() => {
    const map = new Map<string, number>();
    datosFiltrados.forEach(m => {
      const esp = m.especialidad || 'Sin Especialidad';
      map.set(esp, (map.get(esp) || 0) + (m.monto_total || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [datosFiltrados]);

  const topEspecialidad = dataEspecialidad.length > 0 ? dataEspecialidad[0].name : 'N/A';

  // Datos para Curva S (Semanas)
  const dataCurvaSemanal = useMemo(() => {
    const semanasMap = new Map<number, number>();
    datosFiltrados.forEach(m => {
      if (!m.fecha_ejecucion) return;
      const semana = getWeekOfMonth(parseISO(m.fecha_ejecucion), { weekStartsOn: 1 });
      semanasMap.set(semana, (semanasMap.get(semana) || 0) + (m.monto_total || 0));
    });

    const maxSemana = Math.max(...Array.from(semanasMap.keys()), 4);
    const data = [];
    let acumulado = 0;
    
    for (let i = 1; i <= maxSemana; i++) {
      const valorizado = semanasMap.get(i) || 0;
      acumulado += valorizado;
      data.push({
        name: `S ${i}`,
        valorizado,
        acumulado
      });
    }
    return data;
  }, [datosFiltrados]);

  // Opciones de Filtros
  const especialidadesOptions = ['Todas', ...Array.from(new Set(metrados.map(m => m.especialidad).filter(Boolean)))];
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const anios = Array.from(new Set(metrados.map(m => m.fecha_ejecucion ? getYear(parseISO(m.fecha_ejecucion)) : new Date().getFullYear()))).sort();
  if (anios.length === 0) anios.push(new Date().getFullYear());

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Seguimiento de Ejecución</h1>
          <p className="text-slate-500 text-sm">Resumen dinámico del avance físico y financiero valorizado</p>
        </div>
        
        {/* Barra de Filtros */}
        <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg border border-slate-200 shadow-sm">
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="text-sm border-0 focus:ring-0 cursor-pointer text-slate-700 bg-transparent font-medium"
          >
            {meses.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="text-sm border-0 focus:ring-0 cursor-pointer text-slate-700 bg-transparent font-medium"
          >
            {anios.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="w-px h-5 bg-slate-300 mx-1"></div>
          <select 
            value={selectedEspecialidad} 
            onChange={e => setSelectedEspecialidad(e.target.value)}
            className="text-sm border-0 focus:ring-0 cursor-pointer text-slate-700 bg-transparent font-medium max-w-[150px] truncate"
          >
            {especialidadesOptions.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <div className="w-px h-5 bg-slate-300 mx-1"></div>
          <select 
            value={selectedWeek} 
            onChange={e => setSelectedWeek(e.target.value)}
            className="text-sm border-0 focus:ring-0 cursor-pointer text-slate-700 bg-transparent font-medium"
          >
            <option value="Todas">Semanas: Todas</option>
            <option value="Semana 1">Semana 1</option>
            <option value="Semana 2">Semana 2</option>
            <option value="Semana 3">Semana 3</option>
            <option value="Semana 4">Semana 4</option>
            <option value="Semana 5">Semana 5</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-100 rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-center transition-transform hover:scale-[1.02]">
              <span className="text-slate-500 text-sm font-medium">Valorizado del Mes ({meses[selectedMonth]})</span>
              <span className="text-3xl font-bold text-slate-800 mt-1">S/ {montoValorizado.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="bg-slate-100 rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-center transition-transform hover:scale-[1.02]">
              <span className="text-slate-500 text-sm font-medium">Valorizado Acumulado Histórico</span>
              <span className="text-3xl font-bold text-blue-600 mt-1">S/ {montoAcumuladoTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="bg-slate-100 rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-center transition-transform hover:scale-[1.02]">
              <span className="text-slate-500 text-sm font-medium">Top Especialidad del Mes</span>
              <span className="text-3xl font-bold text-emerald-600 mt-1 truncate" title={topEspecialidad}>{topEspecialidad}</span>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Curva S Semanal */}
            <div className="bg-slate-100 rounded-xl border border-slate-200 shadow-sm p-5 col-span-2">
              <h3 className="text-slate-700 font-semibold mb-4">Evolución de Ejecución Semanal (Curva S Real)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataCurvaSemanal} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis 
                      yAxisId="left" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b'}} 
                      tickFormatter={(value) => `S/ ${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b'}}
                      tickFormatter={(value) => `S/ ${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`S/ ${value.toLocaleString('en-US', {minimumFractionDigits:2})}`, '']}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" />
                    <Line yAxisId="left" type="monotone" dataKey="valorizado" name="Valorizado Semanal" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                    <Line yAxisId="right" type="monotone" dataKey="acumulado" name="Acumulado Semanal (Curva S)" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dona de Especialidades */}
            <div className="bg-slate-100 rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-slate-700 font-semibold mb-4">Distribución por Especialidad</h3>
              <div className="h-72">
                {dataEspecialidad.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataEspecialidad}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dataEspecialidad.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `S/ ${value.toLocaleString('en-US', {minimumFractionDigits:2})}`}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No hay datos valorizados para mostrar en este filtro.
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
