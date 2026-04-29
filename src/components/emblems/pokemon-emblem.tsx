"use client";

const Bolt = () => (
  // Lightning bolt centered at (0,0), tip pointing toward y=-94 outward edge,
  // narrow inward end at y=-28. Z-shape with 1 zigzag.
  <path
    d="M -2 -94 L -14 -52 L 4 -52 L -8 -28 L 16 -56 L 0 -56 L 8 -94 Z"
    fill="url(#pokeGold)"
    filter="url(#pokeEmboss)"
  />
);

const StarSpark = ({ x, y, size = 1 }: { x: number; y: number; size?: number }) => {
  const s = size;
  return (
    <path
      d={`M ${x} ${y} l ${2.5 * s} ${5 * s} ${5.5 * s} ${1 * s} -${4 * s} ${4 * s} ${1 * s} ${5.5 * s} -${5 * s} -${2.5 * s} -${5 * s} ${2.5 * s} ${1 * s} -${5.5 * s} -${4 * s} -${4 * s} ${5.5 * s} -${1 * s} z`}
      fill="url(#pokeGold)"
      opacity="0.85"
    />
  );
};

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

      {/* Cruciform lightning */}
      <g transform="translate(128 128)">
        <g><Bolt /></g>
        <g transform="rotate(90)"><Bolt /></g>
        <g transform="rotate(180)"><Bolt /></g>
        <g transform="rotate(270)"><Bolt /></g>
        <circle r="14" fill="url(#pokeGold)" filter="url(#pokeEmboss)" />
        <circle r="6" fill="#082f49" />
      </g>

      {/* 4 stars in diagonal corners */}
      <StarSpark x={190} y={64} size={1.4} />
      <StarSpark x={64} y={64} size={1.4} />
      <StarSpark x={190} y={192} size={1.4} />
      <StarSpark x={64} y={192} size={1.4} />
    </svg>
  );
}
