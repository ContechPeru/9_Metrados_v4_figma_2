import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Users, BookOpen, Activity, AlertTriangle, XCircle, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { actividadReciente, alertas } from '../../data/mockData';
import { supabase } from '../../lib/supabase';

const TIPO_COLORS: Record<string, string> = {
  PC: '#FF6B1A', MM: '#1A6BFF', PN: '#22C55E', DD: '#F59E0B', ET: '#8B5CF6',
};

function KpiCard({
  icon: Icon, label, value, sub, color, trend
}: {
  icon: any; label: string; value: string | number; sub: string; color: string; trend?: string;
}) {
  return (
    <div
      className="flex flex-col p-5 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow"
      style={{ borderColor: '#E5E9F0' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '18' }}
        >
          <Icon size={20} style={{ color }} strokeWidth={1.8} />
        </div>
        {trend && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ECFDF5', color: '#059669', fontFamily: 'IBM Plex Sans, sans-serif' }}>
            {trend}
          </span>
        )}
      </div>
      <div className="font-bold mb-1" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '24px', color: '#1A2B45' }}>
        {value}
      </div>
      <div className="text-sm font-medium mb-0.5" style={{ color: '#1A2B45', fontFamily: 'IBM Plex Sans, sans-serif' }}>
        {label}
      </div>
      <div className="text-xs" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
        {sub}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3" style={{ borderColor: '#E5E9F0', fontFamily: 'IBM Plex Sans, sans-serif' }}>
        <p className="font-semibold mb-2 text-sm" style={{ color: '#1A2B45' }}>{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.fill || entry.color }} />
            <span style={{ color: '#64748B' }}>{entry.name}:</span>
            <span className="font-semibold" style={{ color: '#1A2B45', fontFamily: 'JetBrains Mono, monospace' }}>
              {Number(entry.value).toLocaleString('es-PE')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalMetrado: 0,
    avancePct: 0,
    partidasActivas: 0,
    cuadrillasCampo: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        // Fetch KPIs globales desde la nueva vista de Supabase
        const { data: kpiData } = await supabase.from('vw_kpis_dashboard').select('*').single();
        // Fetch datos para la gráfica desde la nueva vista de Supabase
        const { data: chartEspecialidades } = await supabase.from('vw_resumen_metrados_especialidad').select('*');

        if (kpiData) {
          const kpi = kpiData as any;
          setKpis({
            totalMetrado: kpi.metrado_total || 0,
            avancePct: Math.min(100, Math.round(((kpi.metrado_total || 0) / 5000) * 100)), // dummy meta
            partidasActivas: kpi.partidas_activas || 0,
            cuadrillasCampo: kpi.cuadrillas_activas || 0,
          });
        }

        if (chartEspecialidades && chartEspecialidades.length > 0) {
          const newChart = chartEspecialidades.map((row: any) => ({
            name: row.especialidad_nombre,
            metrado: row.total_ejecutado || 0,
            presupuesto: (row.total_ejecutado || 0) * 1.5, // Dummy presupuesto
          }));
          setChartData(newChart);
        } else {
          setChartData([{ name: 'Estructuras', metrado: 0, presupuesto: 1000 }]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#94A3B8]" style={{ backgroundColor: '#F4F6FA' }}>
        <Loader2 size={32} className="animate-spin mb-4 text-[#1A6BFF]" />
        <span className="font-medium">Calculando métricas globales desde Supabase...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ backgroundColor: '#F4F6FA' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 flex-shrink-0"
        style={{ height: 56, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E9F0' }}
      >
        <h1 className="font-bold" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif', fontSize: '15px' }}>
          Dashboard — Vista General
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#F1F5F9', color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif' }}>
            Semana 19 · 2026
          </span>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm"
            style={{ backgroundColor: '#1A6BFF', fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            <Plus size={12} />
            Nuevo metrado
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            icon={TrendingUp}
            label="Total Metrado"
            value={kpis.totalMetrado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            sub="Unidades acumuladas"
            color="#1A6BFF"
            trend="+12.4%"
          />
          <KpiCard
            icon={Activity}
            label="Avance General"
            value={`${kpis.avancePct}%`}
            sub="Meta: 75% esta semana"
            color="#22C55E"
            trend="+3.2%"
          />
          <KpiCard
            icon={BookOpen}
            label="Partidas Activas"
            value={kpis.partidasActivas}
            sub="En ejecución actual"
            color="#F59E0B"
          />
          <KpiCard
            icon={Users}
            label="Cuadrillas en Campo"
            value={kpis.cuadrillasCampo}
            sub="4 especialidades activas"
            color="#8B5CF6"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Chart */}
          <div className="col-span-2 bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: '#E5E9F0' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
                  Metrado vs Presupuesto por Especialidad
                </h3>
                <p className="text-xs mt-0.5" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  Semana actual — unidades acumuladas
                </p>
              </div>
              <button className="text-xs flex items-center gap-1" style={{ color: '#1A6BFF', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                Ver detalle <ArrowRight size={12} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fontFamily: 'IBM Plex Sans, sans-serif', fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontFamily: 'IBM Plex Sans, sans-serif', paddingTop: 12 }}
                />
                <Bar dataKey="metrado" name="Metrado" fill="#1A6BFF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="presupuesto" name="Presupuesto" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Actividad reciente */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E5E9F0' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#F1F5F9' }}>
              <h3 className="font-semibold text-sm" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
                Actividad Reciente
              </h3>
            </div>
            <div className="divide-y">
              {actividadReciente.map(item => (
                <div key={item.id} className="px-5 py-3 hover:bg-[#FAFBFC] transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: 'var(--primary)', height: '200px' }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TIPO_COLORS[item.tipo] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: '#1A2B45', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                        {item.autor}
                      </div>
                      <div className="text-xs truncate mt-0.5" style={{ color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                        {item.accion}
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#CBD5E1', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '10px' }}>
                        {item.tiempo}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="grid grid-cols-2 gap-4">
          {alertas.map(alerta => (
            <div
              key={alerta.id}
              className="flex items-start gap-4 p-4 rounded-xl border"
              style={{
                backgroundColor: alerta.tipo === 'warning' ? '#FFFBEB' : '#FEF2F2',
                borderColor: alerta.tipo === 'warning' ? '#FEF3C7' : '#FECACA',
              }}
            >
              {alerta.tipo === 'warning' ? (
                <AlertTriangle size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
              ) : (
                <XCircle size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
              )}
              <div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: alerta.tipo === 'warning' ? '#92400E' : '#991B1B', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  {alerta.mensaje}
                </div>
                <div className="text-xs" style={{ color: alerta.tipo === 'warning' ? '#B45309' : '#B91C1C', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  {alerta.detalle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
