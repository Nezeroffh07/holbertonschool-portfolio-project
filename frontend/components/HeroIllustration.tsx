export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 480 480"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-md"
    >
      <defs>
        <style>
          {`
            @keyframes float1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
            @keyframes float2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(12px); } }
            @keyframes float3 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
            @keyframes pulseSoft { 0%,100% { opacity: 0.35; } 50% { opacity: 0.6; } }
            .float-1 { animation: float1 5s ease-in-out infinite; transform-origin: center; }
            .float-2 { animation: float2 6s ease-in-out infinite; transform-origin: center; }
            .float-3 { animation: float3 4.5s ease-in-out infinite; transform-origin: center; }
            .pulse-bg { animation: pulseSoft 4s ease-in-out infinite; }
          `}
        </style>
      </defs>

      {/* Arxa fon dairələri */}
      <circle cx="240" cy="240" r="200" fill="#D3E8BF" className="pulse-bg" />
      <circle cx="240" cy="240" r="150" fill="#CAEAF1" opacity="0.5" />

      {/* Mərkəzi "layihə lövhəsi" kartı */}
      <g className="float-1">
        <rect x="140" y="150" width="200" height="150" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
        <rect x="160" y="172" width="90" height="10" rx="5" fill="#16423C" />
        <rect x="160" y="192" width="140" height="6" rx="3" fill="#E2E8F0" />
        <rect x="160" y="206" width="110" height="6" rx="3" fill="#E2E8F0" />
        <rect x="160" y="230" width="60" height="24" rx="12" fill="#44766C" />
        <circle cx="290" cy="242" r="12" fill="#D3E8BF" />
        <circle cx="270" cy="242" r="12" fill="#CAEAF1" />
      </g>

      {/* Üzən istifadəçi profili 1 */}
      <g className="float-2">
        <circle cx="100" cy="130" r="34" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
        <circle cx="100" cy="120" r="12" fill="#44766C" />
        <path d="M78 148c4-14 40-14 44 0" fill="#44766C" />
      </g>

      {/* Üzən istifadəçi profili 2 */}
      <g className="float-3">
        <circle cx="380" cy="150" r="30" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
        <circle cx="380" cy="141" r="10" fill="#16423C" />
        <path d="M361 165c3-12 34-12 38 0" fill="#16423C" />
      </g>

      {/* Üzən istifadəçi profili 3 */}
      <g className="float-2">
        <circle cx="120" cy="340" r="28" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
        <circle cx="120" cy="332" r="9" fill="#CAEAF1" />
        <path d="M103 353c3-11 32-11 35 0" fill="#5B9A8E" />
      </g>

      {/* Bağlayıcı xətlər (əlaqə/komanda hissi) */}
      <g stroke="#44766C" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5">
        <line x1="130" y1="150" x2="200" y2="200" />
        <line x1="360" y1="170" x2="300" y2="210" />
        <line x1="140" y1="330" x2="200" y2="270" />
      </g>

      {/* Kiçik "check" ikonlu üzən nişan */}
      <g className="float-3">
        <circle cx="360" cy="320" r="26" fill="#44766C" />
        <path
          d="M348 320l8 8 16-16"
          stroke="#FFFFFF"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
