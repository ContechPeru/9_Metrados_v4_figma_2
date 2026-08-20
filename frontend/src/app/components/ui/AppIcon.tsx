import React from 'react';

export interface AppIconProps {
  size?: number;
  className?: string;
  color?: string;
  variant?: 'gradient' | 'solid' | 'white';
  style?: React.CSSProperties;
}

/**
 * AppIcon: Logotipo oficial con diseño de letra "i" estilizada en forma de nota musical (corchea).
 * Representa la fluidez, ritmo de avance y precisión de la plataforma de metrados.
 */
export const AppIcon: React.FC<AppIconProps> = ({
  size = 24,
  className = '',
  color,
  variant = 'gradient',
  style,
}) => {
  const gradientId = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-label="Logo Metrados (i musical)"
    >
      <defs>
        {variant === 'gradient' && (
          <>
            <linearGradient
              id={`body-grad-${gradientId}`}
              x1="6"
              y1="4"
              x2="26"
              y2="28"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="45%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
            <linearGradient
              id={`dot-grad-${gradientId}`}
              x1="12"
              y1="3"
              x2="20"
              y2="9"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </>
        )}
      </defs>

      {/* 1. Punto superior de la "i" (Esfera armónica / nota resonante) */}
      <circle
        cx="16"
        cy="5.8"
        r="3.2"
        fill={
          color ||
          (variant === 'white'
            ? '#FFFFFF'
            : variant === 'solid'
            ? '#1A6BFF'
            : `url(#dot-grad-${gradientId})`)
        }
      />
      {/* Brillo interno del punto */}
      {variant === 'gradient' && (
        <circle cx="15" cy="4.8" r="1" fill="#FFFFFF" opacity="0.65" />
      )}

      {/* 2. Cabeza de la nota musical en la base (inclinación de corchea) */}
      <ellipse
        cx="11.5"
        cy="22.2"
        rx="4.6"
        ry="3.4"
        transform="rotate(-24 11.5 22.2)"
        fill={
          color ||
          (variant === 'white'
            ? '#FFFFFF'
            : variant === 'solid'
            ? '#1A6BFF'
            : `url(#body-grad-${gradientId})`)
        }
      />

      {/* 3. Mástil / Cuerpo vertical de la "i" */}
      <rect
        x="14.4"
        y="10.8"
        width="3.2"
        height="11.8"
        rx="1.6"
        fill={
          color ||
          (variant === 'white'
            ? '#FFFFFF'
            : variant === 'solid'
            ? '#1A6BFF'
            : `url(#body-grad-${gradientId})`)
        }
      />

      {/* 4. Corchea / Bandera musical ondulante en la parte superior derecha del mástil */}
      <path
        d="M17.6 10.8C20.8 11.2 24.6 13.4 24.9 16.8C25.0 17.8 23.9 18.4 23.0 17.7C21.1 16.2 19.1 15.2 17.6 15.0V10.8Z"
        fill={
          color ||
          (variant === 'white'
            ? '#FFFFFF'
            : variant === 'solid'
            ? '#1A6BFF'
            : `url(#body-grad-${gradientId})`)
        }
      />
    </svg>
  );
};

export default AppIcon;
