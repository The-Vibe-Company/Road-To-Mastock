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

      {/* Laurel arcs */}
      <g stroke="url(#aniGold)" strokeWidth="1.6" fill="none" opacity="0.85">
        <path d="M 56 198 Q 32 148 60 96" />
        <path d="M 200 198 Q 224 148 196 96" />
      </g>
      {/* Laurel leaves */}
      <g fill="url(#aniGold)" opacity="0.85">
        <ellipse cx="46" cy="178" rx="3.5" ry="9" transform="rotate(-65 46 178)" />
        <ellipse cx="40" cy="152" rx="3.5" ry="9" transform="rotate(-50 40 152)" />
        <ellipse cx="44" cy="124" rx="3.5" ry="9" transform="rotate(-30 44 124)" />
        <ellipse cx="54" cy="102" rx="3.5" ry="9" transform="rotate(-10 54 102)" />
        <ellipse cx="210" cy="178" rx="3.5" ry="9" transform="rotate(65 210 178)" />
        <ellipse cx="216" cy="152" rx="3.5" ry="9" transform="rotate(50 216 152)" />
        <ellipse cx="212" cy="124" rx="3.5" ry="9" transform="rotate(30 212 124)" />
        <ellipse cx="202" cy="102" rx="3.5" ry="9" transform="rotate(10 202 102)" />
      </g>

      {/* 3 diagonal claw slashes */}
      <g transform="translate(128 128) rotate(-25)" filter="url(#aniEmboss)">
        <rect x="-78" y="-38" width="158" height="11" rx="5.5" fill="url(#aniGold)" />
        <rect x="-86" y="-6" width="172" height="13" rx="6.5" fill="url(#aniGold)" />
        <rect x="-72" y="26" width="148" height="11" rx="5.5" fill="url(#aniGold)" />
      </g>
    </svg>
  );
}
