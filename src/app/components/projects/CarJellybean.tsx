// Generic car silhouette SVG used as jellybean placeholder
// Each car type gets a slightly different aspect ratio color

const carColors: Record<string, string> = {
  "crv-trailsport": "#2A2A3A",
  "hrv-sport": "#1A1A2A",
  "crv-lx": "#2A2A3A",
  "odyssey-exl": "#222232",
  "civic-hybrid": "#1E1E2E",
};

export function CarJellybean({ offerId, className = "" }: { offerId: string; className?: string }) {
  const color = carColors[offerId] ?? "#2A2A3A";
  return (
    <svg
      viewBox="0 0 220 110"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.18))" }}
    >
      {/* Body */}
      <ellipse cx="110" cy="75" rx="95" ry="22" fill={color} opacity="0.15" />
      {/* Main body */}
      <path
        d="M20 72 C20 72 25 55 55 50 C70 47 85 38 110 36 C135 34 155 44 170 50 C190 56 200 65 200 72 Z"
        fill={color}
      />
      {/* Cabin */}
      <path
        d="M65 50 C72 38 90 28 110 27 C130 26 148 36 158 50 Z"
        fill={color}
        opacity="0.85"
      />
      {/* Windows */}
      <path
        d="M70 49 C76 39 90 31 110 30 C128 29 143 37 153 49 Z"
        fill="#B8D4E8"
        opacity="0.6"
      />
      {/* Windshield divider */}
      <line x1="110" y1="30" x2="110" y2="50" stroke={color} strokeWidth="1.5" opacity="0.5" />
      {/* Wheels */}
      <circle cx="62" cy="73" r="14" fill="#111" />
      <circle cx="62" cy="73" r="9" fill="#444" />
      <circle cx="62" cy="73" r="4" fill="#888" />
      <circle cx="158" cy="73" r="14" fill="#111" />
      <circle cx="158" cy="73" r="9" fill="#444" />
      <circle cx="158" cy="73" r="4" fill="#888" />
      {/* Headlights */}
      <ellipse cx="196" cy="64" rx="5" ry="3" fill="#FFEEBB" opacity="0.8" />
      <ellipse cx="24" cy="64" rx="5" ry="3" fill="#FFEEBB" opacity="0.5" />
      {/* Door lines */}
      <line x1="110" y1="50" x2="112" y2="72" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <line x1="145" y1="47" x2="147" y2="72" stroke={color} strokeWidth="0.8" opacity="0.3" />
      <line x1="75" y1="47" x2="77" y2="72" stroke={color} strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}
