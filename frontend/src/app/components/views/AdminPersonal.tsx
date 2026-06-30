import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Key,
  X,
  Check,
  Minus,
  Shield,
  UserCheck,
  Eye,
  FileText,
  Lock,
  Upload,
  Loader2,
  HardHat,
  Trash2,
  KeyRound,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import bcrypt from "bcryptjs";
import { useAuthStore } from "../../store/useAuthStore";
import * as XLSX from "xlsx";

export type RolSistema =
  | "RESIDENTE"
  | "METRADOR"
  | "VEEDOR"
  | "JEFE ESPECIALIDAD"
  | "CALIDAD"
  | "SUPERVISOR"
  | "COORDINADOR"
  | "LIQUIDACIONES"
  | "ADMIN";

export interface PermisosSistema {
  ver_metrados: boolean;
  crear_metrados: boolean;
  editar_metrados: boolean;
  liberar_metrados: boolean;
  exportar_planilla: boolean;
  editar_catalogo: boolean;
  acceso_admin: boolean;
  acceso_liquidaciones: boolean;
  gestionar_obreros: boolean;
  ver_dashboard: boolean;
}

export interface UsuarioSistema {
  id: string;
  nombre: string;
  email: string;
  rol: RolSistema;
  especialidades: string[];
  permisos: PermisosSistema;
  activo: boolean;
  created_at: string;
  dni_username?: string;
  nombres?: string;
  ap_paterno?: string;
  ap_materno?: string;
  es_administrador_presupuesto?: boolean;
  es_gerencia?: boolean;
  area?: string;
  last_login?: string;
}

export function formatRol(rol: RolSistema | string): string {
  const especiales: Record<string, string> = {
    "JEFE ESPECIALIDAD": "Jefe Especialidad",
  };
  if (especiales[rol]) return especiales[rol];
  return rol.charAt(0) + rol.slice(1).toLowerCase();
}

const ROL_STYLE: Record<RolSistema, { bg: string; color: string }> = {
  RESIDENTE: { bg: "#FAECE7", color: "#993C1D" },
  METRADOR: { bg: "#EEF4FF", color: "#1A6BFF" },
  VEEDOR: { bg: "#E1F5EE", color: "#0F6E56" },
  "JEFE ESPECIALIDAD": { bg: "#EEEDFE", color: "#3C3489" },
  CALIDAD: { bg: "#FEF3C7", color: "#92400E" },
  SUPERVISOR: { bg: "#FCE7F3", color: "#9D174D" },
  COORDINADOR: { bg: "#E0F2FE", color: "#075985" },
  LIQUIDACIONES: { bg: "#FFEDD5", color: "#9A3412" },
  ADMIN: { bg: "#F1F5F9", color: "#1A2B45" },
};

const AVATAR_COLORS = [
  { bg: "#EEF4FF", color: "#1A6BFF" },
  { bg: "#E1F5EE", color: "#0F6E56" },
  { bg: "#FAEEDA", color: "#854F0B" },
  { bg: "#FAECE7", color: "#993C1D" },
  { bg: "#EEEDFE", color: "#3C3489" },
  { bg: "#FCE7F3", color: "#9D174D" },
];

function formatFecha(fecha?: string): string {
  if (!fecha) return "—";
  const ahora = new Date();
  const d = new Date(fecha);
  const diffMs = ahora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHrs / 24);

  if (diffMin < 1) return "Ahora mismo";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  if (diffDias < 7) return `Hace ${diffDias}d`;

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

function getAvatarColor(nombre: string) {
  const idx = nombre.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitials(nombre: string) {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

const PREFIJO_ROL: Record<RolSistema, string> = {
  RESIDENTE: "res",
  METRADOR: "ast",
  VEEDOR: "vee",
  "JEFE ESPECIALIDAD": "esp",
  CALIDAD: "cal",
  SUPERVISOR: "sup",
  COORDINADOR: "coo",
  LIQUIDACIONES: "liq",
  ADMIN: "adm",
};

function normalizar(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/gi, "n")
    .toLowerCase();
}

function generarCorreo(
  nombres: string,
  apPaterno: string,
  apMaterno: string,
  rol: RolSistema,
  codigoEsp: string,
): string {
  const partes = nombres.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "";

  const inicialesNombres = partes.map((p) => normalizar(p)[0] ?? "").join("");
  const inicialPat = normalizar(apPaterno.trim())[0] ?? "";
  const inicialMat = normalizar(apMaterno.trim())[0] ?? "";

  const prefijo = PREFIJO_ROL[rol] ?? "ast";
  const esp = codigoEsp ? `.${codigoEsp.toLowerCase()}` : "";

  if (rol === "ADMIN") {
    return `${inicialesNombres}${inicialPat}${inicialMat}${esp}@gmail.com`;
  }

  return `${inicialesNombres}${inicialPat}${inicialMat}.${prefijo}${esp}@gmail.com`;
}

const PERMISOS_DEFAULT: Record<RolSistema, PermisosSistema> = {
  ADMIN: {
    ver_metrados: true,
    crear_metrados: true,
    editar_metrados: true,
    liberar_metrados: true,
    exportar_planilla: true,
    editar_catalogo: true,
    acceso_admin: true,
    acceso_liquidaciones: false,
    gestionar_obreros: true,
    ver_dashboard: true,
  },
  RESIDENTE: {
    ver_metrados: true,
    crear_metrados: true,
    editar_metrados: true,
    liberar_metrados: true,
    exportar_planilla: true,
    editar_catalogo: false,
    acceso_admin: false,
    acceso_liquidaciones: false,
    gestionar_obreros: true,
    ver_dashboard: true,
  },
  "JEFE ESPECIALIDAD": {
    ver_metrados: true,
    crear_metrados: true,
    editar_metrados: true,
    liberar_metrados: true,
    exportar_planilla: false,
    editar_catalogo: false,
    acceso_admin: false,
    acceso_liquidaciones: false,
    gestionar_obreros: true,
    ver_dashboard: true,
  },
  COORDINADOR: {
    ver_metrados: true,
    crear_metrados: true,
    editar_metrados: true,
    liberar_metrados: true,
    exportar_planilla: false,
    editar_catalogo: false,
    acceso_admin: false,
    acceso_liquidaciones: false,
    gestionar_obreros: true,
    ver_dashboard: true,
  },
  CALIDAD: {
    ver_metrados: true,
    crear_metrados: false,
    editar_metrados: false,
    liberar_metrados: true,
    exportar_planilla: false,
    editar_catalogo: false,
    acceso_admin: false,
    acceso_liquidaciones: false,
    gestionar_obreros: false,
    ver_dashboard: true,
  },
  METRADOR: {
    ver_metrados: true,
    crear_metrados: true,
    editar_metrados: true,
    liberar_metrados: false,
    exportar_planilla: false,
    editar_catalogo: false,
    acceso_admin: false,
    acceso_liquidaciones: false,
    gestionar_obreros: false,
    ver_dashboard: true,
  },
  VEEDOR: {
    ver_metrados: true,
    crear_metrados: false,
    editar_metrados: false,
    liberar_metrados: false,
    exportar_planilla: false,
    editar_catalogo: false,
    acceso_admin: false,
    acceso_liquidaciones: false,
    gestionar_obreros: false,
    ver_dashboard: true,
  },
  SUPERVISOR: {
    ver_metrados: true,
    crear_metrados: false,
    editar_metrados: false,
    liberar_metrados: true,
    exportar_planilla: true,
    editar_catalogo: false,
    acceso_admin: false,
    acceso_liquidaciones: false,
    gestionar_obreros: false,
    ver_dashboard: true,
  },
  LIQUIDACIONES: {
    ver_metrados: true,
    crear_metrados: true,
    editar_metrados: true,
    liberar_metrados: false,
    exportar_planilla: true,
    editar_catalogo: false,
    acceso_admin: false,
    acceso_liquidaciones: true,
    gestionar_obreros: false,
    ver_dashboard: true,
  },
};

const PERMISOS_LABELS: {
  key: keyof PermisosSistema;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "ver_metrados", label: "Ver metrados", icon: Eye },
  { key: "crear_metrados", label: "Crear metrados", icon: Plus },
  { key: "editar_metrados", label: "Editar metrados", icon: Edit2 },
  { key: "liberar_metrados", label: "Liberar (Calidad)", icon: UserCheck },
  { key: "exportar_planilla", label: "Exportar planilla", icon: Upload },
  { key: "editar_catalogo", label: "Editar catálogo", icon: FileText },
  { key: "acceso_admin", label: "Acceso admin", icon: Lock },
  { key: "acceso_liquidaciones", label: "Liquidaciones", icon: Shield },
  { key: "gestionar_obreros", label: "Gestionar obreros", icon: HardHat },
  { key: "ver_dashboard", label: "Ver Dashboard", icon: LayoutDashboard },
];

const ROLES_TODOS: RolSistema[] = [
  "RESIDENTE",
  "METRADOR",
  "VEEDOR",
  "JEFE ESPECIALIDAD",
  "CALIDAD",
  "SUPERVISOR",
  "COORDINADOR",
  "LIQUIDACIONES",
  "ADMIN",
];

function mapearUsuarioBD(row: any): UsuarioSistema {
  const permisos_json = row.permisos_json ?? {};
  return {
    id: row.id,
    nombre: row.nombre_completo ?? "",
    email: row.correo_institucional ?? "",
    rol: (row.cargo_rol as RolSistema) ?? "METRADOR",
    especialidades: Array.isArray(row.especialidades) ? row.especialidades : [],
    activo: row.is_active ?? true,
    created_at: row.created_at ?? "",
    dni_username: row.dni_username ?? "",
    es_administrador_presupuesto: row.es_administrador_presupuesto ?? false,
    es_gerencia: row.es_gerencia ?? false,
    area: row.area ?? "",
    last_login: row.last_login ?? undefined,
    permisos: {
      ver_metrados: permisos_json.ver_metrados ?? false,
      crear_metrados: permisos_json.crear_metrados ?? false,
      editar_metrados: permisos_json.editar_metrados ?? false,
      liberar_metrados: permisos_json.liberar_metrados ?? false,
      exportar_planilla: permisos_json.exportar_planilla ?? false,
      editar_catalogo: permisos_json.editar_catalogo ?? false,
      acceso_admin: permisos_json.acceso_admin ?? false,
      acceso_liquidaciones: permisos_json.acceso_liquidaciones ?? false,
      gestionar_obreros: permisos_json.gestionar_obreros ?? false,
      ver_dashboard: permisos_json.ver_dashboard ?? false,
    },
  };
}

function mapearUIaBD(u: UsuarioSistema) {
  return {
    id: u.id,
    dni_username: u.dni_username?.trim() || null,
    nombre_completo: u.nombre,
    correo_institucional: u.email,
    cargo_rol: u.rol,
    especialidades: u.especialidades,
    especialidad: u.especialidades[0] ?? null,
    is_active: u.activo,
    permisos_json: u.permisos,
    es_administrador_presupuesto: u.es_administrador_presupuesto ?? false,
    es_gerencia: u.es_gerencia ?? false,
    area: u.area?.trim() || null,
  };
}

function Toggle({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={disabled ? undefined : () => onChange(!value)}
      className="flex-shrink-0 rounded-full transition-colors relative"
      style={{
        width: 32,
        height: 17,
        backgroundColor: value ? "#1A6BFF" : "#E2E8F0",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <div
        className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform shadow-sm"
        style={{ left: value ? "15px" : "2px" }}
      />
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-[10px] font-semibold uppercase tracking-wider mb-1"
      style={{
        color: "#94A3B8",
        
        letterSpacing: "0.07em",
      }}
    >
      {children}
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-3.5 space-y-3"
      style={{ backgroundColor: "#FAFBFC", border: "1px solid #EEF1F5" }}
    >
      <span
        className="block text-[10px] font-semibold uppercase tracking-wider"
        style={{
          color: "#A3ADBD",
          
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </span>
      {children}
    </div>
  );
}

interface ModalProps {
  usuario: UsuarioSistema | null;
  modo: "crear" | "editar";
  especialidadesDisponibles: string[];
  onClose: () => void;
  onSave: (u: UsuarioSistema, passwordHash?: string) => Promise<void>;
}

function ModalUsuario({
  usuario,
  onClose,
  onSave,
  modo,
  especialidadesDisponibles,
}: ModalProps) {
  function splitNombre(nombre: string) {
    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1)
      return { nombres: partes[0], apPaterno: "", apMaterno: "" };
    if (partes.length === 2)
      return { nombres: partes[0], apPaterno: partes[1], apMaterno: "" };
    return {
      nombres: partes.slice(0, partes.length - 2).join(" "),
      apPaterno: partes[partes.length - 2],
      apMaterno: partes[partes.length - 1],
    };
  }

  const nombreSplit = splitNombre(usuario?.nombre ?? "");

  const { user: userLogueado } = useAuthStore();
  const esPropioUsuario = !!(
    usuario?.id &&
    userLogueado?.id &&
    usuario.id === userLogueado.id
  );

  const base: UsuarioSistema = usuario ?? {
    id: crypto.randomUUID(),
    nombre: "",
    email: "",
    rol: "METRADOR",
    especialidades: [],
    activo: true,
    created_at: new Date().toISOString().slice(0, 10),
    permisos: PERMISOS_DEFAULT["METRADOR"],
  };

  const [form, setForm] = useState<UsuarioSistema>(base);
  const [nombres, setNombres] = useState(nombreSplit.nombres);
  const [apPaterno, setApPaterno] = useState(nombreSplit.apPaterno);
  const [apMaterno, setApMaterno] = useState(nombreSplit.apMaterno);
  const [correoEditado, setCorreoEditado] = useState(false);
  const [verificandoCorreo, setVerificandoCorreo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dniUsername, setDniUsername] = useState(usuario?.dni_username ?? "");
  const [esAdminPresupuesto, setEsAdminPresupuesto] = useState(
    usuario?.es_administrador_presupuesto ?? false,
  );
  const [esGerencia, setEsGerencia] = useState(usuario?.es_gerencia ?? false);
  const [passwordInicial, setPasswordInicial] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isDirty =
    nombres.trim() !== "" ||
    apPaterno.trim() !== "" ||
    dniUsername.trim() !== "" ||
    passwordInicial.trim() !== "";
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  function handleTryClose() {
    if (isDirty && modo === "crear") setShowExitConfirm(true);
    else onClose();
  }
  function generarContrasenaSegura(): string {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const digits = "23456789";
    const special = "@#$%&*!";
    const all = upper + lower + digits + special;
    let pwd = "";
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 6; i++)
      pwd += all[Math.floor(Math.random() * all.length)];
    return pwd
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }
  function getPasswordStrength(pwd: string): {
    label: string;
    color: string;
    width: string;
  } {
    if (pwd.length === 0) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: "Débil", color: "#EF4444", width: "33%" };
    if (score === 2 || score === 3)
      return { label: "Media", color: "#F59E0B", width: "66%" };
    return { label: "Fuerte", color: "#22C55E", width: "100%" };
  }

  const strength = getPasswordStrength(passwordInicial);
  const passwordsMatch =
    confirmPassword.length > 0 && passwordInicial === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && passwordInicial !== confirmPassword;
  const AREA_POR_ROL: Partial<Record<RolSistema, string>> = {
    RESIDENTE: "Costos y Presupuestos",
    METRADOR: "Costos y Presupuestos",
    VEEDOR: "Costos y Presupuestos",
    "JEFE ESPECIALIDAD": "Costos y Presupuestos",
    CALIDAD: "Costos y Presupuestos",
    SUPERVISOR: "Costos y Presupuestos",
  };
  const areaAutomatica = AREA_POR_ROL[form.rol];
  const [area, setArea] = useState<string>(
    usuario?.["area"] ?? areaAutomatica ?? "",
  );
  const [areaOtros, setAreaOtros] = useState(false);

  const AREAS_PREDEFINIDAS = [
    "Costos y Presupuestos",
    "Gerencia",
    "Administración",
    "Logística",
    "Recursos Humanos",
    "Calidad",
    "Supervisión",
    "Liquidaciones",
  ];

  useEffect(() => {
    if (modo === "editar" || correoEditado) return;
    const nombreCompleto = [nombres, apPaterno, apMaterno]
      .filter(Boolean)
      .join(" ");
    const codigoEsp = form.especialidades[0] ?? "";
    const correo = generarCorreo(
      nombres,
      apPaterno,
      apMaterno,
      form.rol,
      codigoEsp,
    );
    setForm((f) => ({ ...f, nombre: nombreCompleto, email: correo }));
  }, [
    nombres,
    apPaterno,
    apMaterno,
    form.rol,
    form.especialidades[0],
    modo,
    correoEditado,
  ]);

  useEffect(() => {
    if (modo === "crear") return;
    const nombreCompleto = [nombres, apPaterno, apMaterno]
      .filter(Boolean)
      .join(" ");
    setForm((f) => ({ ...f, nombre: nombreCompleto }));
  }, [nombres, apPaterno, apMaterno, modo]);

  function handleRolChange(rol: RolSistema) {
    setForm((f) => ({ ...f, rol, permisos: PERMISOS_DEFAULT[rol] }));
    const autoArea = AREA_POR_ROL[rol];
    if (autoArea) setArea(autoArea);
    else setArea("");
  }

  function toggleEsp(esp: string) {
    setForm((f) => ({
      ...f,
      especialidades: f.especialidades.includes(esp)
        ? f.especialidades.filter((e) => e !== esp)
        : [...f.especialidades, esp],
    }));
  }

  function handlePermiso(key: keyof PermisosSistema, val: boolean) {
    setForm((f) => ({ ...f, permisos: { ...f.permisos, [key]: val } }));
  }

  async function handleGuardar() {
    if (!nombres.trim()) {
      setError("El nombre es requerido");
      return;
    }
    if (!apPaterno.trim()) {
      setError("El apellido paterno es requerido");
      return;
    }
    if (!form.email.trim()) {
      setError("El correo es requerido");
      return;
    }

    setVerificandoCorreo(true);
    try {
      const { data: existente } = await supabase
        .from("usuarios_sistema")
        .select("id")
        .eq("correo_institucional", form.email.trim())
        .neq("id", form.id)
        .maybeSingle();

      if (existente) {
        setError("Este correo ya está en uso por otro usuario");
        setVerificandoCorreo(false);
        return;
      }
    } catch {
      setError("Error al verificar el correo");
      setVerificandoCorreo(false);
      return;
    }
    setVerificandoCorreo(false);

    if (modo === "crear") {
      if (!passwordInicial.trim() || passwordInicial.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      if (passwordInicial !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }
    }

    if (dniUsername.trim() && !/^\d{8}$/.test(dniUsername.trim())) {
      setError("El DNI debe tener exactamente 8 dígitos numéricos");
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const passwordHash =
        modo === "crear" && passwordInicial
          ? await bcrypt.hash(passwordInicial, 10)
          : undefined;
      await onSave(
        {
          ...form,
          nombre: form.nombre.toUpperCase(),
          dni_username: dniUsername.trim() || undefined,
          es_administrador_presupuesto: esAdminPresupuesto,
          es_gerencia: esGerencia,
          area: area.trim() || undefined,
        },
        passwordHash,
      );
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  }

  const cargandoGuardar = guardando || verificandoCorreo;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleTryClose();
      }}
    >
      {/* Spacer clickeable izquierdo */}
      <div className="flex-1" onClick={handleTryClose} />

      {/* Drawer */}
      <div
        className="flex flex-col h-full shadow-2xl"
        style={{
          width: 520,
          backgroundColor: "#FFFFFF",
          borderLeft: "1px solid #E5E9F0",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #F1F5F9" }}
        >
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "#1A6BFF" }} />
            <h3
              className="font-semibold text-sm"
              style={{ color: "#1A2B45", fontFamily: "DM Sans, sans-serif" }}
            >
              {modo === "crear"
                ? "Nuevo usuario del sistema"
                : `Editar — ${form.nombre}`}
            </h3>
          </div>
          <button
            onClick={handleTryClose}
            className="rounded-lg p-1"
            className="text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Banner confirmación de salida sin guardar */}
        {showExitConfirm && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{
              backgroundColor: "#FEF3C7",
              borderBottom: "1px solid #FCD34D",
            }}
          >
            <span
              className="text-xs"
              style={{
                color: "#92400E",
                
              }}
            >
              ¿Salir sin guardar? Se perderán los datos.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold"
                style={{
                  border: "1px solid #FCD34D",
                  color: "#92400E",
                  backgroundColor: "transparent",
                  
                }}
              >
                Seguir editando
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                style={{
                  backgroundColor: "#DC2626",
                  
                }}
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        {/* Body */}
        <div
          className="p-5 space-y-3"
          style={modo === "editar" ? { backgroundColor: "#F0FDF4" } : undefined}
        >
          {error && (
            <div
              className="px-3 py-2 rounded-lg text-xs"
              style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}
            >
              {error}
            </div>
          )}

          {/* Datos personales */}
          <Section title="Datos personales">
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Nombres",
                  value: nombres,
                  onChange: setNombres,
                  placeholder: "Juan Carlos",
                },
                {
                  label: "Ap. Paterno",
                  value: apPaterno,
                  onChange: setApPaterno,
                  placeholder: "Pérez",
                },
                {
                  label: "Ap. Materno",
                  value: apMaterno,
                  onChange: setApMaterno,
                  placeholder: "López",
                },
              ].map((field) => (
                <div key={field.label}>
                  <FieldLabel>{field.label}</FieldLabel>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{
                      borderColor: "#E2E8F0",
                      backgroundColor: "#FFFFFF",
                      color: "#1A2B45",
                      
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <FieldLabel>
                  Correo institucional
                  {modo === "crear" && !correoEditado && (
                    <span
                      className="ml-1.5 normal-case font-normal"
                      style={{ color: "#1A6BFF" }}
                    >
                      · auto
                    </span>
                  )}
                </FieldLabel>
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => {
                    setCorreoEditado(true);
                    setForm((f) => ({ ...f, email: e.target.value }));
                  }}
                  placeholder="jcpl.ast.arq@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{
                    borderColor: correoEditado ? "#F59E0B" : "#E2E8F0",
                    backgroundColor: "#FFFFFF",
                    color: "#1A2B45",
                    
                  }}
                />
                {correoEditado && modo === "crear" && (
                  <button
                    onClick={() => setCorreoEditado(false)}
                    className="text-[11px] mt-1"
                    style={{ color: "#1A6BFF" }}
                  >
                    ↺ Auto-generar
                  </button>
                )}
              </div>

              <div>
                <FieldLabel>DNI / Usuario</FieldLabel>
                <input
                  type="text"
                  value={dniUsername}
                  onChange={(e) =>
                    setDniUsername(
                      e.target.value.replace(/\D/g, "").slice(0, 8),
                    )
                  }
                  placeholder="12345678"
                  maxLength={8}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{
                    borderColor:
                      dniUsername.length > 0 && dniUsername.length < 8
                        ? "#F87171"
                        : "#E2E8F0",
                    backgroundColor: "#FFFFFF",
                    color: "#1A2B45",
                    
                    letterSpacing: "0.06em",
                  }}
                />
                {dniUsername.length > 0 && dniUsername.length < 8 && (
                  <p className="text-[10px] mt-1" style={{ color: "#EF4444" }}>
                    Faltan {8 - dniUsername.length}
                  </p>
                )}
              </div>
            </div>
          </Section>

          {/* Contraseña inicial — solo en modo crear */}
          {modo === "crear" && (
            <Section title="Contraseña inicial">
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px]"
                  style={{
                    color: "#64748B",
                    
                  }}
                >
                  Define una contraseña o genera una segura
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nueva = generarContrasenaSegura();
                    setPasswordInicial(nueva);
                    setConfirmPassword(nueva);
                    setShowPassword(true);
                    setShowConfirm(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                  style={{
                    color: "#1A6BFF",
                    backgroundColor: "#EEF4FF",
                    
                  }}
                >
                  <KeyRound size={11} /> Generar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Contraseña</FieldLabel>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInicial}
                      onChange={(e) => setPasswordInicial(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-8 rounded-lg border text-sm outline-none"
                      style={{
                        borderColor:
                          passwordInicial.length > 0
                            ? strength.color
                            : "#E2E8F0",
                        backgroundColor: "#FFFFFF",
                        color: "#1A2B45",
                        
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordInicial.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      <div
                        className="h-1 w-full rounded-full"
                        style={{ backgroundColor: "#E2E8F0" }}
                      >
                        <div
                          className="h-1 rounded-full transition-all duration-300"
                          style={{
                            width: strength.width,
                            backgroundColor: strength.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: strength.color }}
                      >
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <FieldLabel>Confirmar</FieldLabel>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-8 rounded-lg border text-sm outline-none"
                      style={{
                        borderColor: passwordsMismatch
                          ? "#EF4444"
                          : passwordsMatch
                            ? "#22C55E"
                            : "#E2E8F0",
                        backgroundColor: passwordsMismatch
                          ? "#FEF2F2"
                          : passwordsMatch
                            ? "#F0FDF4"
                            : "#FFFFFF",
                        color: "#1A2B45",
                        
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <p
                      className="text-[10px] mt-1 font-semibold"
                      style={{ color: passwordsMatch ? "#22C55E" : "#EF4444" }}
                    >
                      {passwordsMatch ? "✓ Coinciden" : "✗ No coinciden"}
                    </p>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Rol y Área */}
          <Section title="Rol y ubicación">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Rol en el sistema</FieldLabel>
                <div className="flex items-center gap-2">
                  <span
                    className="flex-shrink-0 px-2 py-1 rounded-full text-[11px] font-bold"
                    style={{
                      backgroundColor: ROL_STYLE[form.rol].bg,
                      color: ROL_STYLE[form.rol].color,
                      
                    }}
                  >
                    {formatRol(form.rol)}
                  </span>
                  <select
                    value={form.rol}
                    onChange={(e) =>
                      handleRolChange(e.target.value as RolSistema)
                    }
                    disabled={esPropioUsuario}
                    className="flex-1 px-2.5 py-2 rounded-lg border text-xs outline-none"
                    style={{
                      borderColor: "#E2E8F0",
                      backgroundColor: esPropioUsuario ? "#F1F5F9" : "#FFFFFF",
                      color: "#1A2B45",
                      
                      opacity: esPropioUsuario ? 0.6 : 1,
                      cursor: esPropioUsuario ? "not-allowed" : "pointer",
                    }}
                  >
                    {ROLES_TODOS.map((rol) => (
                      <option key={rol} value={rol}>
                        {formatRol(rol)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <FieldLabel>
                  Área
                  {AREA_POR_ROL[form.rol] && (
                    <span
                      className="ml-1.5 normal-case font-normal"
                      style={{ color: "#1A6BFF" }}
                    >
                      · auto
                    </span>
                  )}
                </FieldLabel>
                {!areaOtros ? (
                  <select
                    value={AREAS_PREDEFINIDAS.includes(area) ? area : ""}
                    onChange={(e) => {
                      if (e.target.value === "__otros__") {
                        setAreaOtros(true);
                        setArea("");
                      } else {
                        setArea(e.target.value);
                      }
                    }}
                    className="w-full px-2.5 py-2 rounded-lg border text-xs outline-none"
                    style={{
                      borderColor: "#E2E8F0",
                      backgroundColor: AREA_POR_ROL[form.rol]
                        ? "#F1F5F9"
                        : "#FFFFFF",
                      color: area ? "#1A2B45" : "#94A3B8",
                      
                    }}
                  >
                    <option value="" disabled>
                      Seleccionar…
                    </option>
                    {AREAS_PREDEFINIDAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                    <option value="__otros__">Otros…</option>
                  </select>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Área manual…"
                      autoFocus
                      className="flex-1 px-2.5 py-2 rounded-lg border text-xs outline-none"
                      style={{
                        borderColor: "#F59E0B",
                        backgroundColor: "#FFFBEB",
                        color: "#1A2B45",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAreaOtros(false);
                        setArea(AREA_POR_ROL[form.rol] ?? "");
                      }}
                      className="px-2 py-2 rounded-lg border text-xs"
                      style={{
                        borderColor: "#E2E8F0",
                        color: "#94A3B8",
                        backgroundColor: "#FFFFFF",
                      }}
                      title="Volver"
                    >
                      ↺
                    </button>
                  </div>
                )}
              </div>
            </div>
            {esPropioUsuario && (
              <p className="text-[10px]" className="text-slate-400">
                No puedes cambiar tu propio rol
              </p>
            )}
          </Section>

          {/* Especialidades */}
          <Section title="Especialidades asignadas">
            <div className="flex flex-wrap gap-1.5">
              {especialidadesDisponibles.map((esp) => {
                const active = form.especialidades.includes(esp);
                const esPrimera = form.especialidades[0] === esp;
                return (
                  <button
                    key={esp}
                    onClick={() => toggleEsp(esp)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all"
                    style={{
                      backgroundColor: active ? "#1A6BFF" : "#FFFFFF",
                      color: active ? "#FFFFFF" : "#64748B",
                      borderColor: active ? "#1A6BFF" : "#E2E8F0",
                      
                      outline: esPrimera ? "2px solid #93C5FD" : "none",
                    }}
                  >
                    {esp}
                    {esPrimera ? " ★" : ""}
                  </button>
                );
              })}
            </div>
            {form.especialidades.length > 0 && (
              <p className="text-[10px]" className="text-slate-400">
                ★ se usa en el correo generado
              </p>
            )}
          </Section>

          {/* Permisos */}
          <Section title="Permisos del sistema">
            {esPropioUsuario && (
              <div
                className="text-[11px] rounded-lg px-3 py-2"
                style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
              >
                ⚠️ No puedes modificar tus propios permisos
              </div>
            )}
            <div className="grid grid-cols-2 gap-y-1.5">
              {PERMISOS_LABELS.map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-2 py-0.5">
                  <Toggle
                    value={form.permisos[key]}
                    onChange={(val) => handlePermiso(key, val)}
                    disabled={esPropioUsuario}
                  />
                  <Icon size={12} className="text-slate-400" />
                  <span
                    className="text-[11px]"
                    style={{
                      color: "#334155",
                      
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Atributos y estado */}
          <Section title="Atributos y estado">
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "Admin. presupuesto",
                  value: esAdminPresupuesto,
                  onChange: setEsAdminPresupuesto,
                  locked: esPropioUsuario,
                },
                {
                  label: "Gerencia",
                  value: esGerencia,
                  onChange: setEsGerencia,
                  locked: esPropioUsuario,
                },
                {
                  label: "Usuario activo",
                  value: form.activo,
                  onChange: (v: boolean) =>
                    setForm((f) => ({ ...f, activo: v })),
                  locked: false,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1.5 rounded-lg py-2.5 px-1"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #F1F5F9",
                  }}
                >
                  <Toggle
                    value={item.value}
                    onChange={item.onChange}
                    disabled={item.locked}
                  />
                  <span
                    className="text-[10px] text-center leading-tight"
                    style={{
                      color: "#334155",
                      
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: "1px solid #F1F5F9" }}
        >
          <button
            onClick={handleTryClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{
              border: "1px solid #E2E8F0",
              color: "#64748B",
              backgroundColor: "transparent",
              
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={cargandoGuardar}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2"
            style={{
              backgroundColor: cargandoGuardar ? "#93C5FD" : "#1A6BFF",
              
            }}
          >
            {cargandoGuardar && <Loader2 size={12} className="animate-spin" />}
            {verificandoCorreo
              ? "Verificando correo..."
              : guardando
                ? "Guardando..."
                : modo === "crear"
                  ? "Crear usuario"
                  : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModalResetProps {
  usuario: UsuarioSistema;
  onClose: () => void;
}

function ModalResetPassword({ usuario, onClose }: ModalResetProps) {
  const adminUser = useAuthStore((s) => s.user);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [estado, setEstado] = useState<"idle" | "cargando" | "ok" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function getPasswordStrength(pwd: string): {
    label: string;
    color: string;
    width: string;
  } {
    if (pwd.length === 0) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: "Débil", color: "#EF4444", width: "33%" };
    if (score <= 3) return { label: "Media", color: "#F59E0B", width: "66%" };
    return { label: "Fuerte", color: "#22C55E", width: "100%" };
  }

  function generarContrasenaSegura(): string {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const digits = "23456789";
    const special = "@#$%&*!";
    const all = upper + lower + digits + special;
    let pwd = "";
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 6; i++)
      pwd += all[Math.floor(Math.random() * all.length)];
    return pwd
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }

  const strength = getPasswordStrength(password);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const EyeIcon = ({ show }: { show: boolean }) =>
    show ? (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );

  async function handleReset() {
    if (!password.trim() || password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden");
      return;
    }
    if (!adminUser?.id) {
      setErrorMsg("No se pudo identificar al administrador");
      return;
    }
    setEstado("cargando");
    setErrorMsg(null);
    try {
      const hash = await bcrypt.hash(password, 10);
      const { error } = await (supabase.rpc as any)("reset_user_password", {
        p_admin_id: adminUser.id,
        p_user_id: usuario.id,
        p_password_hash: hash,
      });
      if (error) throw new Error(error.message);
      setEstado("ok");
      setTimeout(() => onClose(), 1500);
    } catch (e: any) {
      setErrorMsg(e.message ?? "Error al resetear");
      setEstado("error");
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="rounded-xl shadow-xl overflow-hidden"
        style={{
          width: 400,
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E9F0",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #F1F5F9" }}
        >
          <div className="flex items-center gap-2">
            <Key size={16} style={{ color: "#F59E0B" }} />
            <h3
              className="font-semibold text-sm"
              style={{ color: "#1A2B45", fontFamily: "DM Sans, sans-serif" }}
            >
              Resetear contraseña — {usuario.nombre}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div
            className="px-3 py-2 rounded-lg text-xs"
            style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
          >
            Nueva contraseña para <strong>{usuario.nombre}</strong>
          </div>

          {errorMsg && (
            <div
              className="px-3 py-2 rounded-lg text-xs"
              style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}
            >
              {errorMsg}
            </div>
          )}

          {estado === "ok" ? (
            <div
              className="flex items-center gap-2 px-3 py-3 rounded-lg"
              style={{ backgroundColor: "#DCFCE7", color: "#166534" }}
            >
              <Check size={16} />
              <span className="text-sm font-semibold">
                ¡Contraseña reseteada con éxito!
              </span>
            </div>
          ) : (
            <>
              {/* Botón sugerir contraseña */}
              <button
                type="button"
                onClick={() => {
                  const nueva = generarContrasenaSegura();
                  setPassword(nueva);
                  setConfirmPassword(nueva);
                  setShowPassword(true);
                  setShowConfirm(true);
                }}
                className="w-full px-3 py-2 rounded-lg border text-xs font-semibold transition-colors flex items-center justify-center"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#64748B",
                  backgroundColor: "#F8FAFC",
                  
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F1F5F9";
                  e.currentTarget.style.color = "#1A2B45";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#F8FAFC";
                  e.currentTarget.style.color = "#64748B";
                }}
              >
                <KeyRound size={12} style={{ marginRight: 6 }} /> Generar
                contraseña segura
              </button>

              {/* Nueva contraseña */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{
                    color: "#94A3B8",
                    
                    fontSize: 10,
                  }}
                >
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 rounded-lg border text-sm outline-none"
                    style={{
                      borderColor:
                        password.length > 0 ? strength.color : "#E2E8F0",
                      backgroundColor: "#F8FAFC",
                      color: "#1A2B45",
                      
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    <div
                      className="h-1 w-full rounded-full"
                      style={{ backgroundColor: "#E2E8F0" }}
                    >
                      <div
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: strength.width,
                          backgroundColor: strength.color,
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: strength.color }}
                    >
                      Contraseña {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{
                    color: "#94A3B8",
                    
                    fontSize: 10,
                  }}
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 rounded-lg border text-sm outline-none"
                    style={{
                      borderColor: passwordsMismatch
                        ? "#EF4444"
                        : passwordsMatch
                          ? "#22C55E"
                          : "#E2E8F0",
                      backgroundColor: passwordsMismatch
                        ? "#FEF2F2"
                        : passwordsMatch
                          ? "#F0FDF4"
                          : "#F8FAFC",
                      color: "#1A2B45",
                      
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <EyeIcon show={showConfirm} />
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p
                    className="text-[10px] mt-1 font-semibold"
                    style={{ color: passwordsMatch ? "#22C55E" : "#EF4444" }}
                  >
                    {passwordsMatch
                      ? "✓ Las contraseñas coinciden"
                      : "✗ Las contraseñas no coinciden"}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {estado !== "ok" && (
          <div
            className="flex items-center justify-end gap-2 px-5 py-3"
            style={{ borderTop: "1px solid #F1F5F9" }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{
                border: "1px solid #E2E8F0",
                color: "#64748B",
                backgroundColor: "transparent",
                
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleReset}
              disabled={estado === "cargando"}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2"
              style={{
                backgroundColor: estado === "cargando" ? "#FCD34D" : "#F59E0B",
                
              }}
            >
              {estado === "cargando" && (
                <Loader2 size={12} className="animate-spin" />
              )}
              {estado === "cargando" ? "Reseteando..." : "Resetear contraseña"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type FiltroRol = RolSistema | "ALL";

function PermisosChip({ permisos }: { permisos: PermisosSistema }) {
  const [open, setOpen] = useState(false);
  const total = PERMISOS_LABELS.length;
  const activos = PERMISOS_LABELS.filter(({ key }) => permisos[key]).length;
  const pct = Math.round((activos / total) * 100);
  const color =
    activos === 0
      ? "#CBD5E1"
      : activos <= 3
        ? "#F59E0B"
        : activos <= 6
          ? "#1A6BFF"
          : "#22C55E";

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold transition-all"
        style={{
          backgroundColor: color + "18",
          color,
          
          border: `1px solid ${color}30`,
        }}
      >
        <Shield size={10} />
        {activos}/{total}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl shadow-xl py-2"
          style={{
            width: 220,
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E9F0",
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {/* barra de progreso */}
          <div
            className="px-3 pb-2 mb-1"
            style={{ borderBottom: "1px solid #F1F5F9" }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  color: "#94A3B8",
                  
                }}
              >
                Permisos activos
              </span>
              <span
                className="text-[10px] font-bold"
                style={{ color, fontFamily: "JetBrains Mono, monospace" }}
              >
                {pct}%
              </span>
            </div>
            <div
              className="h-1 w-full rounded-full"
              style={{ backgroundColor: "#F1F5F9" }}
            >
              <div
                className="h-1 rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>

          {/* lista */}
          <div className="px-3 space-y-0.5">
            {PERMISOS_LABELS.map(({ key, label, icon: Icon }) => {
              const activo = permisos[key];
              return (
                <div key={key} className="flex items-center gap-2 py-0.5">
                  {activo ? (
                    <Check
                      size={11}
                      style={{ color: "#22C55E", flexShrink: 0 }}
                    />
                  ) : (
                    <Minus
                      size={11}
                      style={{ color: "#E2E8F0", flexShrink: 0 }}
                    />
                  )}
                  <Icon
                    size={10}
                    style={{
                      color: activo ? "#64748B" : "#CBD5E1",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="text-[11px]"
                    style={{
                      color: activo ? "#1A2B45" : "#CBD5E1",
                      
                      fontWeight: activo ? 500 : 400,
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPersonal() {
  const [modalReset, setModalReset] = useState<UsuarioSistema | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [especialidadesDisponibles, setEspecialidadesDisponibles] = useState<
    string[]
  >([]);
  const [cargando, setCargando] = useState(true);
  const [filtroRol, setFiltroRol] = useState<FiltroRol>("ALL");
  const [busqueda, setBusqueda] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<UsuarioSistema | null>(
    null,
  );
  const [confirmDeleteFinal, setConfirmDeleteFinal] =
    useState<UsuarioSistema | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [highlightType, setHighlightType] = useState<
    "created" | "saved" | null
  >(null);
  const [modal, setModal] = useState<{
    abierto: boolean;
    usuario: UsuarioSistema | null;
    modo: "crear" | "editar";
  }>({ abierto: false, usuario: null, modo: "crear" });
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  const [esMobile, setEsMobile] = useState(false);
  useEffect(() => {
    const check = () => setEsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      const { data: usuariosData, error: errU } = await supabase
        .from("usuarios_sistema")
        .select(
          "id, nombre_completo, correo_institucional, cargo_rol, especialidades, permisos_json, is_active, created_at, dni_username, area, es_administrador_presupuesto, es_gerencia, last_login",
        )
        .neq("dni_username", "SISTEMA")
        .order("nombre_completo");

      if (errU) throw errU;
      setUsuarios((usuariosData ?? []).map(mapearUsuarioBD));

      const { data: espData, error: errE } = await supabase
        .from("especialidades")
        .select("nombre")
        .eq("estado_activo", true)
        .order("nombre");

      if (errE) throw errE;
      setEspecialidadesDisponibles((espData ?? []).map((e: any) => e.nombre));
    } catch (e) {
      console.error("Error cargando datos:", e);
    } finally {
      setCargando(false);
    }
  }

  async function handleEliminar(u: UsuarioSistema) {
    setEliminando(true);
    try {
      const { error } = await supabase
        .from("usuarios_sistema")
        .delete()
        .eq("id", u.id);
      if (error) throw new Error(error.message);
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id));
      setConfirmDelete(null);
    } catch (e: any) {
      console.error("Error eliminando usuario:", e.message);
    } finally {
      setEliminando(false);
    }
  }

  async function handleSave(u: UsuarioSistema, passwordHash?: string) {
    const payload = {
      ...mapearUIaBD(u),
      ...(passwordHash ? { password_hash: passwordHash } : {}),
    };
    const { error } = await supabase
      .from("usuarios_sistema")
      .upsert(payload, { onConflict: "id" });

    if (error) throw new Error(error.message);

    const esEdicion = usuarios.some((x) => x.id === u.id);

    setUsuarios((prev) => {
      const idx = prev.findIndex((x) => x.id === u.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = u;
        return next;
      }
      return [u, ...prev];
    });

    setHighlightId(u.id);
    setHighlightType(esEdicion ? "saved" : "created");
    setTimeout(() => {
      setHighlightId(null);
      setHighlightType(null);
      cargarDatos();
    }, 5000);
  }

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return usuarios.filter((u) => {
      const coincideRol = filtroRol === "ALL" || u.rol === filtroRol;
      const coincideBusqueda =
        q === "" ||
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.dni_username ?? "").toLowerCase().includes(q) ||
        u.rol.toLowerCase().includes(q) ||
        u.especialidades.some((e) => e.toLowerCase().includes(q));
      return coincideRol && coincideBusqueda;
    });
  }, [usuarios, filtroRol, busqueda]);

  const contadores = useMemo(() => {
    const c: Partial<Record<FiltroRol, number>> = { ALL: usuarios.length };
    ROLES_TODOS.forEach((rol) => {
      c[rol] = usuarios.filter((u) => u.rol === rol).length;
    });
    return c;
  }, [usuarios]);

  function exportarExcel() {
    const fecha = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
    const wb = XLSX.utils.book_new();

    // ── Hoja 1: Personal del Sistema ──
    const headers = [
      "N°", "NOMBRE COMPLETO", "CORREO", "DNI/USUARIO", "ROL", "ÁREA",
      "ESPECIALIDADES", "ESTADO", "ÚLTIMO ACCESO",
      "Ver metrados", "Crear metrados", "Editar metrados", "Liberar (Calidad)",
      "Exportar planilla", "Editar catálogo", "Acceso admin", "Liquidaciones",
      "Gestionar obreros", "Ver Dashboard",
      "Admin Presupuesto", "Gerencia",
    ];

    const filas = usuariosFiltrados.map((u, i) => [
      i + 1,
      u.nombre,
      u.email,
      u.dni_username ?? "—",
      u.rol,
      u.area ?? "—",
      u.especialidades.join(", ") || "—",
      u.activo ? "Activo" : "Inactivo",
      formatFecha(u.last_login),
      u.permisos.ver_metrados ? "✓" : "—",
      u.permisos.crear_metrados ? "✓" : "—",
      u.permisos.editar_metrados ? "✓" : "—",
      u.permisos.liberar_metrados ? "✓" : "—",
      u.permisos.exportar_planilla ? "✓" : "—",
      u.permisos.editar_catalogo ? "✓" : "—",
      u.permisos.acceso_admin ? "✓" : "—",
      u.permisos.acceso_liquidaciones ? "✓" : "—",
      u.permisos.gestionar_obreros ? "✓" : "—",
      u.permisos.ver_dashboard ? "✓" : "—",
      u.es_administrador_presupuesto ? "✓" : "—",
      u.es_gerencia ? "✓" : "—",
    ]);

    const ws = XLSX.utils.aoa_to_sheet([
      [`SISTEMA GORE CUSCO — Personal del Sistema`],
      [`Exportado: ${fecha}   |   Total: ${usuariosFiltrados.length} usuarios   |   Filtro: ${filtroRol === "ALL" ? "Todos los roles" : filtroRol}`],
      [],
      headers,
      ...filas,
    ]);

    // Anchos de columna
    ws["!cols"] = [
      { wch: 4 }, { wch: 38 }, { wch: 34 }, { wch: 12 }, { wch: 16 }, { wch: 22 },
      { wch: 30 }, { wch: 9 }, { wch: 14 },
      { wch: 13 }, { wch: 14 }, { wch: 14 }, { wch: 15 },
      { wch: 15 }, { wch: 13 }, { wch: 13 }, { wch: 13 },
      { wch: 15 }, { wch: 13 },
      { wch: 16 }, { wch: 10 },
    ];

    // Merge título
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 20 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 20 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Personal del Sistema");

    // ── Hoja 2: Resumen por Rol ──
    const ws2 = XLSX.utils.aoa_to_sheet([
      ["ROL", "TOTAL", "ACTIVOS", "INACTIVOS"],
      ...ROLES_TODOS.map(rol => {
        const grupo = usuarios.filter(u => u.rol === rol);
        return [formatRol(rol), grupo.length, grupo.filter(u => u.activo).length, grupo.filter(u => !u.activo).length];
      }),
      [],
      ["TOTAL GENERAL", `=SUM(B2:B${ROLES_TODOS.length + 1})`, `=SUM(C2:C${ROLES_TODOS.length + 1})`, `=SUM(D2:D${ROLES_TODOS.length + 1})`],
    ]);
    ws2["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Resumen por Rol");

    XLSX.writeFile(wb, `GORE_Cusco_Personal_${fecha}.xlsx`);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-1 overflow-hidden bg-slate-50">
        {/* Sub-sidebar */}
        <div
          className="hidden md:flex flex-col flex-shrink-0 border-r pt-4 pb-4 transition-all duration-200 bg-white border-slate-200 overflow-hidden"
          style={{ width: sidebarColapsado ? 40 : 180 }}
        >
          {/* Header sidebar con botón colapsar */}
          <div className="flex items-center justify-between px-3 mb-3">
            {!sidebarColapsado && (
              <span
                className="text-xs font-semibold text-slate-500"
                style={{
                  color: "#94A3B8",
                  
                  fontSize: 10,
                  
                }}
              >
                Filtrar por rol
              </span>
            )}
            <button
              onClick={() => setSidebarColapsado((v) => !v)}
              className="rounded-md p-1 transition-colors"
              style={{
                color: "#94A3B8",
                marginLeft: sidebarColapsado ? "auto" : 0,
              }}
              title={sidebarColapsado ? "Expandir filtros" : "Colapsar filtros"}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F1F5F9";
                e.currentTarget.style.color = "#1A6BFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#94A3B8";
              }}
            >
              {sidebarColapsado ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              )}
            </button>
          </div>

          {!sidebarColapsado && (
            <>
              {(["ALL", ...ROLES_TODOS] as FiltroRol[]).map((rol) => {
                const isActive = filtroRol === rol;
                const count = contadores[rol] ?? 0;
                return (
                  <button
                    key={formatRol(rol)}
                    onClick={() => setFiltroRol(rol)}
                    className="flex items-center justify-between px-4 py-2 mx-2 rounded-lg mb-0.5 transition-all"
                    style={{
                      backgroundColor: isActive ? "#EEF4FF" : "transparent",
                      color: isActive ? "#1A6BFF" : "#64748B",
                      
                      fontSize: "12px",
                      fontWeight: isActive ? 600 : 400,
                      textAlign: "left",
                    }}
                  >
                    <span>{rol === "ALL" ? "Todos" : formatRol(rol)}</span>
                    {count > 0 && (
                      <span
                        className="text-xs rounded-full px-1.5 py-0.5"
                        style={{
                          backgroundColor: isActive ? "#1A6BFF" : "#F1F5F9",
                          color: isActive ? "#FFFFFF" : "#94A3B8",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}

              <div
                className="mx-4 my-3"
                style={{ height: 1, backgroundColor: "#F1F5F9" }}
              />

              <div
                className="px-4 mb-2 text-xs font-semibold text-slate-500"
                style={{
                  color: "#94A3B8",
                  
                  fontSize: 10,
                  
                }}
              >
                Puede liberar
              </div>
              <div className="px-4 space-y-1">
                {ROLES_TODOS.filter(
                  (r) => PERMISOS_DEFAULT[r].liberar_metrados,
                ).map((r) => {
                  const s = ROL_STYLE[r];
                  return (
                    <div key={r} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          color: "#64748B",
                          
                        }}
                      >
                        {r}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Main */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{
              backgroundColor: "#FFFFFF",
              borderBottom: "1px solid #E5E9F0",
            }}
          >
            <div>
              <h2
                className="font-semibold"
                style={{
                  color: "#1A2B45",
                  
                  fontSize: 14,
                }}
              >
                Personal del Sistema
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{
                  color: "#94A3B8",
                  
                }}
              >
                {cargando
                  ? "Cargando..."
                  : `${usuariosFiltrados.length} usuarios${filtroRol !== "ALL" ? ` con rol "${filtroRol}"` : " en total"}`}
              </p>
            </div>
            {/* Honeypot anti-autocomplete */}
            <input
              type="text"
              style={{ display: "none" }}
              autoComplete="username"
              readOnly
            />
            <input
              type="password"
              style={{ display: "none" }}
              autoComplete="current-password"
              readOnly
            />

            <div className="flex items-center gap-3">
              {/* Buscador único */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                  width: 260,
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#1A6BFF")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              >
                <Search size={13} style={{ color: "#94A3B8", flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Nombre, correo, DNI, rol, especialidad…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  autoComplete="off"
                  name="busqueda-usuarios"
                  className="outline-none bg-transparent text-xs w-full"
                  style={{
                    color: "#1A2B45",
                    
                  }}
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda("")}
                    style={{ color: "#CBD5E1", flexShrink: 0 }}
                    title="Limpiar búsqueda"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <button
                onClick={exportarExcel}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all"
                style={{
                  borderColor: "#22C55E",
                  color: "#16A34A",
                  backgroundColor: "#F0FDF4",
                  
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#DCFCE7";
                  e.currentTarget.style.borderColor = "#16A34A";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#F0FDF4";
                  e.currentTarget.style.borderColor = "#22C55E";
                }}
                title="Exportar a Excel"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Exportar
              </button>
              <button
                onClick={() =>
                  setModal({ abierto: true, usuario: null, modo: "crear" })
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-semibold"
                style={{
                  backgroundColor: "#1A6BFF",
                  
                }}
              >
                <Plus size={13} />
                Nuevo usuario
              </button>
            </div>
          </div>
          {/* Tabla / Cards */}
          <div className="flex-1 overflow-auto">
            {cargando ? (
              <div className="flex items-center justify-center h-40">
                <Loader2
                  size={24}
                  className="animate-spin"
                  style={{ color: "#1A6BFF" }}
                />
              </div>
            ) : esMobile ? (
              /* ── VISTA MOBILE: cards ── */
              <div className="p-3 space-y-2">
                {usuariosFiltrados.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users
                      size={32}
                      style={{ color: "#CBD5E1", margin: "0 auto 8px" }}
                    />
                    <div
                      className="text-sm"
                      style={{
                        color: "#94A3B8",
                        
                      }}
                    >
                      No hay usuarios
                      {filtroRol !== "ALL" ? ` con rol "${filtroRol}"` : ""}
                    </div>
                  </div>
                ) : (
                  usuariosFiltrados.map((u) => {
                    const rolStyle = ROL_STYLE[u.rol] ?? {
                      bg: "#F1F5F9",
                      color: "#1A2B45",
                    };
                    const avatarStyle = getAvatarColor(u.nombre);
                    return (
                      <div
                        key={u.id}
                        className="rounded-xl p-3 transition-colors duration-700"
                        style={{
                          backgroundColor:
                            highlightId === u.id && highlightType !== null
                              ? "#F0FDF4"
                              : modal.usuario?.id === u.id &&
                                  modal.abierto &&
                                  modal.modo === "editar"
                                ? "#FFF7ED"
                                : "#FFFFFF",
                          border: "1px solid #E5E9F0",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        {/* Card header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                              style={{
                                backgroundColor: avatarStyle.bg,
                                color: avatarStyle.color,
                              }}
                            >
                              {getInitials(u.nombre)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="text-xs font-semibold"
                                  style={{
                                    color: "#1A2B45",
                                    
                                  }}
                                >
                                  {u.nombre}
                                </span>
                                {u.es_administrador_presupuesto && (
                                  <span
                                    title="Admin presupuesto"
                                    className="flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold"
                                    style={{
                                      backgroundColor: "#DCFCE7",
                                      color: "#166534",
                                    }}
                                  >
                                    $
                                  </span>
                                )}
                                {u.es_gerencia && (
                                  <span className="text-[10px]">🏢</span>
                                )}
                              </div>
                              <div
                                className="text-xs"
                                style={{
                                  color: "#94A3B8",
                                  
                                }}
                              >
                                {u.email}
                              </div>
                              {u.dni_username && (
                                <div
                                  className="text-xs"
                                  style={{
                                    color: "#CBD5E1",
                                    
                                    fontSize: 10,
                                  }}
                                >
                                  {u.dni_username}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Rol badge */}
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: rolStyle.bg,
                              color: rolStyle.color,
                              
                              fontSize: 10,
                            }}
                          >
                            {formatRol(u.rol)}
                          </span>
                        </div>

                        {/* Especialidades */}
                        {u.especialidades.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {u.especialidades.map((esp) => (
                              <span
                                key={esp}
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: "#F1F5F9",
                                  color: "#64748B",
                                  
                                  fontSize: 10,
                                  border: "0.5px solid #E2E8F0",
                                }}
                              >
                                {esp}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer card: estado + último acceso + acciones */}
                        <div
                          className="flex items-center justify-between mt-2 pt-2"
                          style={{ borderTop: "1px solid #F1F5F9" }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  backgroundColor: u.activo
                                    ? "#22C55E"
                                    : "#CBD5E1",
                                }}
                              />
                              <span
                                className="text-xs"
                                style={{
                                  color: u.activo ? "#22C55E" : "#94A3B8",
                                  
                                }}
                              >
                                {u.activo ? "Activo" : "Inactivo"}
                              </span>
                            </div>
                            <span
                              className="text-xs"
                              style={{
                                color: "#CBD5E1",
                                
                              }}
                            >
                              ·
                            </span>
                            <span
                              className="text-xs"
                              style={{
                                color: "#94A3B8",
                                
                              }}
                            >
                              {formatFecha(u.last_login)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                setModal({
                                  abierto: true,
                                  usuario: u,
                                  modo: "editar",
                                })
                              }
                              className="px-2 py-1 rounded-lg border text-xs"
                              style={{
                                borderColor: "#E2E8F0",
                                color: "#64748B",
                                backgroundColor: "transparent",
                              }}
                              title="Editar"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalReset(u);
                              }}
                              className="px-2 py-1 rounded-lg border text-xs"
                              style={{
                                borderColor: "#FCD34D",
                                color: "#F59E0B",
                                backgroundColor: "#FFFBEB",
                              }}
                              title="Resetear contraseña"
                            >
                              <Key size={11} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(u)}
                              className="px-2 py-1 rounded-lg border text-xs"
                              style={{
                                borderColor: "#FECACA",
                                color: "#EF4444",
                                backgroundColor: "#FEF2F2",
                              }}
                              title="Eliminar"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* ── VISTA DESKTOP: tabla original ── */
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {[
                      { label: "USUARIO", check: false },
                      { label: "ROL", check: false },
                      { label: "ESPECIALIDADES", check: false },
                      { label: "ESTADO", check: false },
                      { label: "PERMISOS", check: false },
                      { label: "ÚLTIMO ACCESO", check: false },
                      { label: "ACCIONES", check: false },
                    ].map(({ label, check }) => (
                      <th
                        key={label}
                        className={`${check ? "px-1.5" : "px-4"} py-2.5 text-left`}
                        style={{
                          backgroundColor: "#F1F5F9",
                          color: "#64748B",
                          
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          borderRight: "1px solid #E2E8F0",
                          borderBottom: "2px solid #CBD5E1",
                          whiteSpace: "nowrap",
                          textAlign: check ? "center" : "left",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u, idx) => {
                    const rolStyle = ROL_STYLE[u.rol] ?? {
                      bg: "#F1F5F9",
                      color: "#1A2B45",
                    };
                    const avatarStyle = getAvatarColor(u.nombre);
                    return (
                      <tr
                        key={u.id}
                        className="transition-colors duration-700"
                        style={{
                          backgroundColor:
                            highlightId === u.id && highlightType !== null
                              ? "#F0FDF4"
                              : modal.usuario?.id === u.id &&
                                  modal.abierto &&
                                  modal.modo === "editar"
                                ? "#FFF7ED"
                                : idx % 2 === 0
                                  ? "#FFFFFF"
                                  : "#FAFBFD",
                          borderBottom: "1px solid #F1F5F9",
                        }}
                      >
                        {/* Usuario */}
                        <td
                          className="px-4 py-2.5"
                          style={{ borderRight: "1px solid #F1F5F9" }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                              style={{
                                backgroundColor: avatarStyle.bg,
                                color: avatarStyle.color,
                              }}
                            >
                              {getInitials(u.nombre)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="text-xs font-semibold"
                                  style={{
                                    color: "#1A2B45",
                                    
                                  }}
                                >
                                  {u.nombre}
                                </div>
                                {u.es_administrador_presupuesto && (
                                  <span
                                    title="Administrador de presupuesto"
                                    className="flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold flex-shrink-0"
                                    style={{
                                      backgroundColor: "#DCFCE7",
                                      color: "#166534",
                                    }}
                                  >
                                    $
                                  </span>
                                )}
                                {u.es_gerencia && (
                                  <span
                                    title="Gerencia"
                                    className="text-[10px] flex-shrink-0"
                                  >
                                    🏢
                                  </span>
                                )}
                              </div>
                              <div
                                className="text-xs"
                                style={{
                                  color: "#94A3B8",
                                  
                                }}
                              >
                                {u.email}
                              </div>
                              {u.dni_username && (
                                <div
                                  className="text-xs"
                                  style={{
                                    color: "#CBD5E1",
                                    
                                    fontSize: 10,
                                  }}
                                >
                                  {u.dni_username}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Rol */}
                        <td
                          className="px-4 py-2.5"
                          style={{
                            borderRight: "1px solid #F1F5F9",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: rolStyle.bg,
                              color: rolStyle.color,
                              
                              fontSize: 10,
                            }}
                          >
                            {formatRol(u.rol)}
                          </span>
                        </td>

                        {/* Especialidades */}
                        <td
                          className="px-4 py-2.5"
                          style={{ borderRight: "1px solid #F1F5F9" }}
                        >
                          <div className="flex flex-wrap gap-1">
                            {u.especialidades.length === 0 ? (
                              <span style={{ color: "#CBD5E1", fontSize: 10 }}>
                                —
                              </span>
                            ) : (
                              u.especialidades.map((esp) => (
                                <span
                                  key={esp}
                                  className="text-xs px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: "#F1F5F9",
                                    color: "#64748B",
                                    
                                    fontSize: 10,
                                    border: "0.5px solid #E2E8F0",
                                  }}
                                >
                                  {esp}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Estado */}
                        <td
                          className="px-4 py-2.5"
                          style={{
                            borderRight: "1px solid #F1F5F9",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: u.activo
                                  ? "#22C55E"
                                  : "#CBD5E1",
                              }}
                            />
                            <span
                              className="text-xs"
                              style={{
                                color: u.activo ? "#22C55E" : "#94A3B8",
                                
                              }}
                            >
                              {u.activo ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </td>

                        {/* Permisos — chip + popover */}
                        <td
                          className="px-4 py-2.5"
                          style={{ borderRight: "1px solid #F1F5F9" }}
                        >
                          <PermisosChip permisos={u.permisos} />
                        </td>

                        {/* Último acceso */}
                        <td
                          className="px-4 py-2.5"
                          style={{
                            borderRight: "1px solid #F1F5F9",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            className="text-xs"
                            style={{
                              color: "#94A3B8",
                              
                            }}
                          >
                            {formatFecha(u.last_login)}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                setModal({
                                  abierto: true,
                                  usuario: u,
                                  modo: "editar",
                                })
                              }
                              className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-all duration-150"
                              style={{
                                borderColor: "#E2E8F0",
                                color: "#64748B",
                                backgroundColor: "transparent",
                                
                              }}
                              title="Editar usuario"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#EEF4FF";
                                e.currentTarget.style.borderColor = "#1A6BFF";
                                e.currentTarget.style.color = "#1A6BFF";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                                e.currentTarget.style.borderColor = "#E2E8F0";
                                e.currentTarget.style.color = "#64748B";
                              }}
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalReset(u);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-all duration-150"
                              style={{
                                borderColor: "#FCD34D",
                                color: "#F59E0B",
                                backgroundColor: "#FFFBEB",
                                
                              }}
                              title="Resetear contraseña"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#FEF3C7";
                                e.currentTarget.style.borderColor = "#F59E0B";
                                e.currentTarget.style.color = "#D97706";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#FFFBEB";
                                e.currentTarget.style.borderColor = "#FCD34D";
                                e.currentTarget.style.color = "#F59E0B";
                              }}
                            >
                              <Key size={11} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(u)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-all duration-150"
                              style={{
                                borderColor: "#FECACA",
                                color: "#EF4444",
                                backgroundColor: "#FEF2F2",
                                
                              }}
                              title="Eliminar usuario"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#FEE2E2";
                                e.currentTarget.style.borderColor = "#EF4444";
                                e.currentTarget.style.color = "#DC2626";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "#FEF2F2";
                                e.currentTarget.style.borderColor = "#FECACA";
                                e.currentTarget.style.color = "#EF4444";
                              }}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {usuariosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Users
                          size={32}
                          style={{ color: "#CBD5E1", margin: "0 auto 8px" }}
                        />
                        <div
                          className="text-sm"
                          style={{
                            color: "#94A3B8",
                            
                          }}
                        >
                          No hay usuarios
                          {filtroRol !== "ALL" ? ` con rol "${filtroRol}"` : ""}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal.abierto && (
        <ModalUsuario
          usuario={modal.usuario}
          modo={modal.modo}
          especialidadesDisponibles={especialidadesDisponibles}
          onClose={() => setModal((m) => ({ ...m, abierto: false }))}
          onSave={handleSave}
        />
      )}
      {modalReset && (
        <ModalResetPassword
          usuario={modalReset}
          onClose={() => setModalReset(null)}
        />
      )}
      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(null);
          }}
        >
          <div
            className="rounded-xl shadow-xl overflow-hidden"
            style={{
              width: 380,
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E9F0",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #F1F5F9" }}
            >
              <div className="flex items-center gap-2">
                <Trash2 size={16} style={{ color: "#EF4444" }} />
                <h3
                  className="font-semibold text-sm"
                  style={{
                    color: "#1A2B45",
                    
                  }}
                >
                  Eliminar usuario
                </h3>
              </div>
              <button
                onClick={() => setConfirmDelete(null)}
                className="text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <div
                className="px-3 py-3 rounded-lg text-xs"
                style={{
                  backgroundColor: "#FEF2F2",
                  color: "#991B1B",
                  lineHeight: 1.6,
                }}
              >
                Estás a punto de eliminar a{" "}
                <strong>{confirmDelete.nombre}</strong> del sistema.
                <br />
                Esta acción <strong>no se puede deshacer</strong>.
              </div>
              <p
                className="text-xs"
                style={{
                  color: "#64748B",
                  
                }}
              >
                ¿Estás seguro que deseas continuar?
              </p>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-2 px-5 py-3"
              style={{ borderTop: "1px solid #F1F5F9" }}
            >
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{
                  border: "1px solid #E2E8F0",
                  color: "#64748B",
                  backgroundColor: "transparent",
                  
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => setConfirmDeleteFinal(confirmDelete)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2"
                style={{
                  backgroundColor: "#EF4444",
                  
                }}
              >
                Continuar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CONFIRMACIÓN FINAL — irreversible */}
      {confirmDeleteFinal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(127,0,0,0.2)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteFinal(null);
          }}
        >
          <div
            className="rounded-xl shadow-xl overflow-hidden"
            style={{
              width: 380,
              backgroundColor: "#FFF5F5",
              border: "2px solid #EF4444",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-5 py-4"
              style={{ backgroundColor: "#EF4444" }}
            >
              <AlertTriangle size={16} style={{ color: "#FFFFFF" }} />
              <h3
                className="font-semibold text-sm"
                style={{ color: "#FFFFFF", fontFamily: "DM Sans, sans-serif" }}
              >
                CONFIRMACIÓN FINAL — ACCIÓN IRREVERSIBLE
              </h3>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <p
                className="text-xs"
                style={{
                  color: "#7F1D1D",
                  
                  lineHeight: 1.6,
                }}
              >
                Estás a punto de eliminar definitivamente a{" "}
                <strong style={{ color: "#DC2626" }}>
                  {confirmDeleteFinal.nombre}
                </strong>
                .
              </p>
              <p
                className="text-xs font-bold"
                style={{
                  color: "#DC2626",
                  
                }}
              >
                Esta acción no se puede deshacer.
              </p>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-2 px-5 py-3"
              style={{ borderTop: "1px solid #FECACA" }}
            >
              <button
                onClick={() => setConfirmDeleteFinal(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{
                  border: "1px solid #E2E8F0",
                  color: "#64748B",
                  backgroundColor: "transparent",
                  
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleEliminar(confirmDeleteFinal);
                  setConfirmDeleteFinal(null);
                  setConfirmDelete(null);
                }}
                disabled={eliminando}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2"
                style={{
                  backgroundColor: eliminando ? "#F87171" : "#DC2626",
                  
                }}
                onMouseEnter={(e) => {
                  if (!eliminando)
                    e.currentTarget.style.backgroundColor = "#B91C1C";
                }}
                onMouseLeave={(e) => {
                  if (!eliminando)
                    e.currentTarget.style.backgroundColor = "#DC2626";
                }}
              >
                {eliminando && <Loader2 size={12} className="animate-spin" />}
                <Trash2 size={12} />
                {eliminando ? "Eliminando..." : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
