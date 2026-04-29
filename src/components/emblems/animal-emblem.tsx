"use client";

export function AnimalEmblem({ size = 224 }: { size?: number }) {
  return (
    <svg viewBox="0 0 256 256" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="aniField" cx="50%" cy="38%" r="68%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#022c22" />
        </radialGradient>
        <linearGradient id="aniGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="40%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <filter id="aniEmboss" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.7" />
        </filter>
      </defs>

      <g stroke="url(#aniGold)" strokeWidth="3" strokeLinecap="round">
        <line x1="128" y1="2" x2="128" y2="14" />
        <line x1="254" y1="128" x2="242" y2="128" />
        <line x1="128" y1="254" x2="128" y2="242" />
        <line x1="2" y1="128" x2="14" y2="128" />
      </g>
      <circle cx="128" cy="128" r="118" fill="url(#aniField)" stroke="url(#aniGold)" strokeWidth="4" />
      <circle cx="128" cy="128" r="102" fill="none" stroke="url(#aniGold)" strokeWidth="1.2" strokeDasharray="3 5" opacity="0.55" />

      {/* Paw print */}
      <g fill="url(#aniGold)" filter="url(#aniEmboss)">
        {/* Main pad */}
        <path d="M 84 152 Q 128 116 172 152 Q 184 196 128 208 Q 72 196 84 152 Z" />
        {/* 4 toe pads */}
        <ellipse cx="76" cy="100" rx="17" ry="24" transform="rotate(-18 76 100)" />
        <ellipse cx="106" cy="78" rx="17" ry="26" transform="rotate(-8 106 78)" />
        <ellipse cx="150" cy="78" rx="17" ry="26" transform="rotate(8 150 78)" />
        <ellipse cx="180" cy="100" rx="17" ry="24" transform="rotate(18 180 100)" />
      </g>
    </svg>
  );
}
