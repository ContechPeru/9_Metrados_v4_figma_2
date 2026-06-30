import { useState, useEffect } from 'react';
import { Eye, EyeOff, CreditCard, Archive, ArrowRight, AlertCircle, HardHat } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const login = useAuthStore(state => state.login);

  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState([
    { label: 'Proyectos activos', value: '...' },
    { label: 'Partidas Maestras', value: '...' },
    { label: 'Metrados registros', value: '...' },
  ]);

  useEffect(() => {
    async function loadStats() {
      try {
        const { count: cProj } = await supabase.from('proyectos').select('*', { count: 'exact', head: true });
        const { count: cPart } = await supabase.from('catalogo_partidas').select('*', { count: 'exact', head: true });
        const { count: cMet } = await supabase.from('registro_metrados').select('*', { count: 'exact', head: true });
        
        setStats([
          { label: 'Proyectos activos', value: cProj?.toString() || '0' },
          { label: 'Partidas Maestras', value: cPart?.toLocaleString() || '0' },
          { label: 'Metrados registros', value: cMet?.toLocaleString() || '0' },
        ]);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }
    loadStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await login(dni, password);
    setLoading(false);
    if (err) { setError(err); return; }
    // No necesitamos navigate. Al cambiar isAuthenticated, App.tsx renderiza las rutas.
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: '#F4F6FA' }}>

      {/* ── LEFT PANEL — Branding ── */}
      <div
        className="hidden lg:flex flex-col justify-between flex-shrink-0"
        style={{
          width: '42%',
          backgroundColor: '#1B55CF',
          padding: '48px 52px',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Archive size={20} color="white" strokeWidth={2} />
          </div>
          <div>
            <div style={{ color: 'white', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px', letterSpacing: '0.06em' }}>
              METRADOS
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
              v4.0 · Perú
            </div>
          </div>
        </div>

        {/* Center illustration area */}
        <div className="flex flex-col gap-6">
          {/* Abstract grid decoration */}
          <div className="grid grid-cols-3 gap-2 w-fit opacity-20">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg"
                style={{
                  width: 48, height: 48,
                  background: 'white',
                  opacity: [0.3, 0.8, 0.5, 0.6, 1, 0.4, 0.7, 0.5, 0.9][i],
                }}
              />
            ))}
          </div>

          <div>
            <h1 style={{ color: 'white', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '32px', lineHeight: 1.2 }}>
              Seguimiento de ejecución<br />Belempampa
            </h1>
          </div>

          {/* Stat pills */}
          <div className="flex gap-3 flex-wrap">
            {stats.map(stat => (
              <div
                key={stat.label}
                className="flex flex-col gap-0.5 rounded-2xl px-4 py-2.5"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.14)' }}
              >
                <span style={{ color: 'white', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '18px' }}>{stat.value}</span>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '11px' }}>
          © 2026 Metrados · Sistema de control de obras
        </p>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex flex-1 items-center justify-center" style={{ backgroundColor: '#F4F6FA', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1A6BFF 0%, #0F4FC8 100%)' }}
            >
              <HardHat size={15} color="white" strokeWidth={2} />
            </div>
            <span style={{ color: '#1E3A5F', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '15px', letterSpacing: '0.05em' }}>
              METRADOS
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 style={{ color: '#0F1E3C', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '30px', lineHeight: 1.2, marginBottom: 10 }}>
              Ingresa a tu cuenta<br />
              <span style={{ color: '#1A6BFF' }}>de metrados</span>
            </h2>
            <p style={{ color: '#7A90A8', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '14px' }}>
              Accede al sistema y continúa con tu jornada sin interrupciones.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* DNI */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="dni"
                style={{ color: '#5E748A', fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                DNI
              </label>
              <div className="relative">
                <input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={dni}
                  onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ingresa tu DNI"
                  autoComplete="username"
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    border: `1.5px solid ${error ? '#EF4444' : '#DDE3EC'}`,
                    backgroundColor: 'white',
                    padding: '0 44px 0 16px',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '14px',
                    color: '#0F1E3C',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1A6BFF'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = error ? '#EF4444' : '#DDE3EC'; }}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <CreditCard size={16} color="#9BAFC4" />
                </div>
              </div>
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                style={{ color: '#5E748A', fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    border: `1.5px solid ${error ? '#EF4444' : '#DDE3EC'}`,
                    backgroundColor: 'white',
                    padding: '0 44px 0 16px',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '14px',
                    color: '#0F1E3C',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1A6BFF'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = error ? '#EF4444' : '#DDE3EC'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#9BAFC4', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
                style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
              >
                <AlertCircle size={14} color="#EF4444" />
                <span style={{ color: '#DC2626', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '13px' }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl transition-all"
              style={{
                height: 50,
                backgroundColor: loading ? '#A0BCFF' : '#1A6BFF',
                color: 'white',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 600,
                fontSize: '15px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(26,107,255,0.35)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#1558E0'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#1A6BFF'; }}
            >
              {loading ? (
                <span>Verificando...</span>
              ) : (
                <>
                  <span>Ingresar</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}

