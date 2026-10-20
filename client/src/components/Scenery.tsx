
function Windows({ x, y, cols, rows, gap = 14 }: { x: number; y: number; cols: number; rows: number; gap?: number }) {
  return (
    <g fill="#e0f2fe" opacity=".85">
      {Array.from({ length: rows }).flatMap((_, r) =>
        Array.from({ length: cols }).map((__, c) => <rect key={`${r}-${c}`} x={x + c * gap} y={y + r * gap} width="6" height="8" rx="1" />),
      )}
    </g>
  );
}

export function HeroScene({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 640" preserveAspectRatio="xMidYMax slice" aria-hidden className={className}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dc3f0" />
          <stop offset="0.7" stopColor="#d6eefb" />
          <stop offset="1" stopColor="#f1f8ee" />
        </linearGradient>
        <linearGradient id="far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c9fb8" />
          <stop offset="1" stopColor="#a9c4d3" />
        </linearGradient>
      </defs>
      <rect width="1440" height="640" fill="url(#sky)" />
      <g fill="#fff" opacity=".7">
        <ellipse cx="300" cy="110" rx="120" ry="22" />
        <ellipse cx="380" cy="96" rx="80" ry="18" />
        <ellipse cx="1050" cy="150" rx="140" ry="20" />
        <ellipse cx="1140" cy="136" rx="90" ry="16" />
      </g>
      <path d="M0 330 L170 250 L300 300 L470 200 L640 290 L780 230 L960 310 L1120 240 L1300 300 L1440 260 V640 H0Z" fill="url(#far)" />
      <path d="M0 400 Q180 330 360 390 T720 380 T1080 370 T1440 390 V640 H0Z" fill="#5f9c6b" />
      <path d="M0 440 Q240 380 480 440 T960 430 T1440 440 V640 H0Z" fill="#3f8a55" />
      <g>
        <rect x="860" y="300" width="76" height="190" fill="#e8eef3" />
        <rect x="860" y="300" width="76" height="8" fill="#b6c4cf" />
        <Windows x={870} y={318} cols={4} rows={9} />
        <rect x="950" y="368" width="120" height="122" fill="#f3f0e8" />
        <rect x="950" y="368" width="120" height="8" fill="#c9b9a0" />
        <Windows x={962} y={386} cols={7} rows={5} gap={15} />
        <rect x="1085" y="400" width="90" height="90" fill="#e6ddd0" />
        <polygon points="1075,400 1130,372 1185,400" fill="#a8553f" />
        <Windows x={1097} y={414} cols={5} rows={4} gap={15} />
        <rect x="760" y="396" width="86" height="94" fill="#dfe7ec" />
        <Windows x={772} y={410} cols={5} rows={4} gap={14} />
        <rect x="1190" y="420" width="80" height="70" fill="#f0e9dd" />
        <polygon points="1182,420 1230,396 1278,420" fill="#8f4b39" />
        <rect x="690" y="430" width="60" height="60" fill="#ede7da" />
        <polygon points="684,430 720,410 756,430" fill="#a8553f" />
      </g>
      <path d="M0 500 Q200 450 420 500 T860 490 T1440 500 V640 H0Z" fill="#2f7a49" />
      <path d="M0 560 Q260 520 560 560 T1440 550 V640 H0Z" fill="#256b3f" />
      <g fill="#1d5a35">
        {[60, 150, 260, 1300, 1380, 1230].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={520 + (i % 2) * 14} r={28 + (i % 3) * 6} />
            <circle cx={x + 24} cy={530 + (i % 2) * 14} r={22} />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function HillsScene({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMax slice" aria-hidden className={className}>
      <path d="M0 250 L120 170 L230 230 L360 120 L480 220 L600 160 V420 H0Z" fill="#fff" opacity=".1" />
      <path d="M0 300 Q150 220 300 290 T600 270 V420 H0Z" fill="#000" opacity=".16" />
      <path d="M0 340 Q180 290 360 340 T600 330 V420 H0Z" fill="#000" opacity=".22" />
      <path d="M0 380 Q220 350 420 385 T600 375 V420 H0Z" fill="#000" opacity=".3" />
    </svg>
  );
}
