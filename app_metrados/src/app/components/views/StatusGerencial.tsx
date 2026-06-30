import { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { statusData } from '../../data/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

const COMP_TABS = ['Componente 1', 'Componente 2'];

const radarData = [
  { especialidad: 'Estructuras', avance: 68, meta: 75 },
  { especialidad: 'Arquitectura', avance: 55, meta: 60 },
  { especialidad: 'IIEE', avance: 71, meta: 70 },
  { especialidad: 'IISS', avance: 65, meta: 65 },
  { especialidad: 'HVAC', avance: 40, meta: 50 },
];

function fmt(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 0 });
}

function fmtS(n: number) {
  return `S/ ${(n / 1000).toFixed(1)}k`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3" style={{ borderColor: '#E5E9F0', fontFamily: 'IBM Plex Sans, sans-serif' }}>
        <p className="font-semibold mb-2 text-sm" style={{ color: '#1A2B45' }}>{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs mb-1">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.fill || entry.color }} />
            <span style={{ color: '#64748B' }}>{entry.name}:</span>
            <span className="font-semibold" style={{ color: '#1A2B45', fontFamily: 'JetBrains Mono, monospace' }}>
              {entry.dataKey === 'avance' || entry.dataKey === 'meta' ? `${entry.value}%` : `S/ ${Number(entry.value).toLocaleString('es-PE')}`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function StatusGerencial() {
  const [activeComp, setActiveComp] = useState('Componente 1');

  const rows = statusData.componente1;
  const totalPresupuesto = rows.reduce((s, r) => s + r.presupuesto, 0);
  const totalEjecutado = rows.reduce((s, r) => s + r.ejecutado, 0);
  const totalPct = (totalEjecutado / totalPresupuesto * 100).toFixed(1);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 flex-shrink-0"
        style={{ height: 56, backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E9F0' }}
      >
        <h1 className="font-bold" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif', fontSize: '15px' }}>
          Status Gerencial — Cuadro Comparativo
        </h1>
        <div className="flex rounded-full p-0.5" style={{ backgroundColor: '#F1F5F9' }}>
          {COMP_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveComp(tab)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                fontFamily: 'IBM Plex Sans, sans-serif',
                backgroundColor: activeComp === tab ? '#1A2B45' : 'transparent',
                color: activeComp === tab ? '#FFFFFF' : '#64748B',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6" style={{ backgroundColor: '#F4F6FA' }}>
        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Presupuesto Total', value: `S/ ${(totalPresupuesto / 1e6).toFixed(2)}M`, sub: 'Valorización del proyecto', color: '#1A6BFF', icon: TrendingUp },
            { label: 'Ejecutado a la Fecha', value: `S/ ${(totalEjecutado / 1e6).toFixed(2)}M`, sub: `${totalPct}% del presupuesto`, color: '#22C55E', icon: TrendingUp },
            { label: 'Saldo por Ejecutar', value: `S/ ${((totalPresupuesto - totalEjecutado) / 1e6).toFixed(2)}M`, sub: 'Pendiente de valorización', color: '#F59E0B', icon: TrendingDown },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: '#E5E9F0' }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: card.color + '15' }}
                >
                  <card.icon size={18} style={{ color: card.color }} strokeWidth={1.8} />
                </div>
                <div className="text-xs font-medium" style={{ color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  {card.label}
                </div>
              </div>
              <div className="font-bold" style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '22px', color: '#1A2B45' }}>
                {card.value}
              </div>
              <div className="text-xs mt-1" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-4">
          {/* Comparison Table */}
          <div className="col-span-3 bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E5E9F0' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#F1F5F9' }}>
              <h3 className="font-semibold text-sm" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
                Valorización por Especialidad
              </h3>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['ESPECIALIDAD', 'PRESUPUESTO (S/)', 'EJECUTADO (S/)', '% AVANCE', 'BARRA'].map(col => (
                    <th
                      key={col}
                      className="px-4 py-2.5 text-left"
                      style={{
                        backgroundColor: '#1A2B45',
                        color: '#FFFFFF',
                        fontFamily: 'IBM Plex Sans, sans-serif',
                        fontSize: '9px',
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
                {rows.map((row, idx) => {
                  const onTrack = row.pct >= 65;
                  return (
                    <tr
                      key={row.especialidad}
                      className="hover:bg-[#EEF4FF] transition-colors"
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      <td className="px-4 py-3" style={{ borderRight: '1px solid #F1F5F9' }}>
                        <span className="font-medium text-sm" style={{ color: '#1A2B45', fontFamily: 'IBM Plex Sans, sans-serif' }}>
                          {row.especialidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" style={{ borderRight: '1px solid #F1F5F9' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#475569' }}>
                          {fmt(row.presupuesto)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" style={{ borderRight: '1px solid #F1F5F9' }}>
                        <span className="font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#1A2B45' }}>
                          {fmt(row.ejecutado)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" style={{ borderRight: '1px solid #F1F5F9' }}>
                        <span
                          className="font-bold"
                          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: onTrack ? '#059669' : '#DC2626' }}
                        >
                          {row.pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ minWidth: 120 }}>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${row.pct}%`,
                              backgroundColor: onTrack ? '#22C55E' : '#F59E0B',
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Totals */}
                <tr style={{ backgroundColor: '#1A2B45', borderTop: '2px solid #1A6BFF' }}>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold" style={{ color: '#FFFFFF', fontFamily: 'IBM Plex Sans, sans-serif', letterSpacing: '0.06em' }}>
                      TOTAL PROYECTO
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#94A3B8' }}>
                      {fmt(totalPresupuesto)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#FFFFFF' }}>
                      {fmt(totalEjecutado)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#22C55E' }}>
                      {totalPct}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${totalPct}%`, backgroundColor: '#22C55E' }}
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Radar chart */}
          <div className="col-span-2 bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: '#E5E9F0' }}>
            <h3 className="font-semibold text-sm mb-1" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
              Radar de Avance vs Meta
            </h3>
            <p className="text-xs mb-4" style={{ color: '#94A3B8', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Por especialidad — semana actual
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#F1F5F9" />
                <PolarAngleAxis
                  dataKey="especialidad"
                  tick={{ fontSize: 10, fontFamily: 'IBM Plex Sans, sans-serif', fill: '#64748B' }}
                />
                <Radar name="Avance" dataKey="avance" stroke="#1A6BFF" fill="#1A6BFF" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Meta" dataKey="meta" stroke="#22C55E" fill="#22C55E" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 3" />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#1A6BFF' }} />
                <span className="text-xs" style={{ color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}>Avance real</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded" style={{ backgroundColor: '#22C55E' }} />
                <span className="text-xs" style={{ color: '#64748B', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}>Meta</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: '#E5E9F0' }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: '#1A2B45', fontFamily: 'DM Sans, sans-serif' }}>
            Comparativo Presupuesto vs Ejecutado (S/)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={rows} barGap={6} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="especialidad" tick={{ fontSize: 11, fontFamily: 'IBM Plex Sans, sans-serif', fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'IBM Plex Sans, sans-serif', paddingTop: 8 }} />
              <Bar dataKey="presupuesto" name="Presupuesto" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ejecutado" name="Ejecutado" fill="#1A6BFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
