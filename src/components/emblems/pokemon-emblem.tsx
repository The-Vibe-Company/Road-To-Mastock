"use client";

export function PokemonEmblem({ size = 224 }: { size?: number }) {
  return (
    <svg viewBox="0 0 256 256" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pokeField" cx="50%" cy="38%" r="68%">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>
        <linearGradient id="pokeGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="40%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#a16207" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>
        <linearGradient id="pokeYellow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <filter id="pokeEmboss" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.7" />
        </filter>
      </defs>

      <g stroke="url(#pokeGold)" strokeWidth="3" strokeLinecap="round">
        <line x1="128" y1="2" x2="128" y2="14" />
        <line x1="254" y1="128" x2="242" y2="128" />
        <line x1="128" y1="254" x2="128" y2="242" />
        <line x1="2" y1="128" x2="14" y2="128" />
      </g>
      <circle cx="128" cy="128" r="118" fill="url(#pokeField)" stroke="url(#pokeGold)" strokeWidth="4" />
      <circle cx="128" cy="128" r="102" fill="none" stroke="url(#pokeGold)" strokeWidth="1.2" strokeDasharray="3 5" opacity="0.5" />

      {/* Lightning sparks behind for energy */}
      <g fill="url(#pokeGold)" opacity="0.55">
        <path d="M 48 96 L 38 116 L 50 116 L 42 138 L 60 116 L 48 116 Z" />
        <path d="M 208 96 L 218 116 L 206 116 L 214 138 L 196 116 L 208 116 Z" />
      </g>

      {/* Cute creature head + body (chibi, fox/rodent hybrid) */}
      <g filter="url(#pokeEmboss)">
        {/* Pointy ears with inner detail */}
        <polygon points="78,86 92,38 110,90" fill="url(#pokeYellow)" stroke="#0a0a0a" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="178,86 164,38 146,90" fill="url(#pokeYellow)" stroke="#0a0a0a" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="86,84 92,58 100,86" fill="#854d0e" />
        <polygon points="170,84 164,58 156,86" fill="#854d0e" />

        {/* Round body */}
        <ellipse cx="128" cy="146" rx="60" ry="58" fill="url(#pokeYellow)" stroke="#0a0a0a" strokeWidth="2.5" />
      </g>

      {/* Eyes */}
      <g>
        <ellipse cx="106" cy="138" rx="11" ry="13" fill="#0a0a0a" />
        <ellipse cx="150" cy="138" rx="11" ry="13" fill="#0a0a0a" />
        <circle cx="110" cy="133" r="4" fill="#fff" />
        <circle cx="154" cy="133" r="4" fill="#fff" />
      </g>

      {/* Cheeks (red dots) */}
      <circle cx="86" cy="156" r="7" fill="#dc2626" opacity="0.85" />
      <circle cx="170" cy="156" r="7" fill="#dc2626" opacity="0.85" />

      {/* Mouth */}
      <path d="M 118 162 Q 128 172 138 162" stroke="#0a0a0a" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
