"use client";
import type { Rarity } from "@/lib/rarities";

const TIER_FIELD: Record<Rarity, [string, string]> = {
  common:    ["#27272a", "#09090b"], // zinc
  uncommon:  ["#064e3b", "#022c22"], // emerald
  rare:      ["#0c4a6e", "#082f49"], // sky
  epic:      ["#4c1d95", "#2e1065"], // violet
  legendary: ["#78350f", "#451a03"], // amber
  mythic:    ["#881337", "#3f0817"], // rose
};

const HOLO = new Set<Rarity>(["legendary", "mythic"]);

export function RarityEmblem({ rarity, size = 224 }: { rarity: Rarity; size?: number }) {
  const [c1, c2] = TIER_FIELD[rarity];
  const fid = `rarField-${rarity}`;
  const gid = `rarGold-${rarity}`;
  const eid = `rarEmboss-${rarity}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 256 256" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id={fid} cx="50%" cy="38%" r="68%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </radialGradient>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="40%" stopColor="#fbbf24" />
            <stop offset="60%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <filter id={eid} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.7" />
          </filter>
        </defs>

        <g stroke={`url(#${gid})`} strokeWidth="3" strokeLinecap="round">
          <line x1="128" y1="2" x2="128" y2="14" />
          <line x1="254" y1="128" x2="242" y2="128" />
          <line x1="128" y1="254" x2="128" y2="242" />
          <line x1="2" y1="128" x2="14" y2="128" />
        </g>
        <circle cx="128" cy="128" r="118" fill={`url(#${fid})`} stroke={`url(#${gid})`} strokeWidth="4" />
        <circle cx="128" cy="128" r="102" fill="none" stroke={`url(#${gid})`} strokeWidth="1.2" strokeDasharray="3 5" opacity="0.55" />

        {rarity === "common" && (
          <g filter={`url(#${eid})`}>
            <polygon points="128,72 178,100 178,156 128,184 78,156 78,100" fill="none" stroke={`url(#${gid})`} strokeWidth="4" />
            <circle cx="128" cy="128" r="10" fill={`url(#${gid})`} />
          </g>
        )}

        {rarity === "uncommon" && (
          <g filter={`url(#${eid})`}>
            <ellipse cx="128" cy="84" rx="22" ry="44" fill={`url(#${gid})`} />
            <ellipse cx="128" cy="84" rx="22" ry="44" fill={`url(#${gid})`} transform="rotate(120 128 128)" />
            <ellipse cx="128" cy="84" rx="22" ry="44" fill={`url(#${gid})`} transform="rotate(240 128 128)" />
            <circle cx="128" cy="128" r="14" fill={`url(#${gid})`} />
            <circle cx="128" cy="128" r="6" fill={c2} />
          </g>
        )}

        {rarity === "rare" && (
          <g filter={`url(#${eid})`}>
            <polygon points="128,60 184,128 128,196 72,128" fill={`url(#${gid})`} fillOpacity="0.18" />
            <g stroke={`url(#${gid})`} strokeWidth="3.5" fill="none" strokeLinejoin="round">
              <polygon points="128,60 184,128 128,196 72,128" />
              <line x1="128" y1="60" x2="128" y2="196" />
              <line x1="72" y1="128" x2="184" y2="128" />
              <line x1="100" y1="84" x2="156" y2="172" />
              <line x1="156" y1="84" x2="100" y2="172" />
            </g>
          </g>
        )}

        {rarity === "epic" && (
          <g filter={`url(#${eid})`}>
            <polygon points="128,52 168,184 88,184" fill={`url(#${gid})`} />
            <polygon points="128,204 88,72 168,72" fill={`url(#${gid})`} />
            <circle cx="128" cy="128" r="22" fill={c2} />
            <circle cx="128" cy="128" r="22" fill="none" stroke={`url(#${gid})`} strokeWidth="2.5" />
          </g>
        )}

        {rarity === "legendary" && (
          <g filter={`url(#${eid})`}>
            <g stroke={`url(#${gid})`} strokeLinecap="round">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => {
                const long = a % 60 === 0;
                const r1 = long ? 78 : 62;
                const r2 = 50;
                const w = long ? 8 : 5;
                const rad = (a * Math.PI) / 180;
                const x1 = 128 + r2 * Math.cos(rad);
                const y1 = 128 + r2 * Math.sin(rad);
                const x2 = 128 + r1 * Math.cos(rad);
                const y2 = 128 + r1 * Math.sin(rad);
                return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w} />;
              })}
            </g>
            <circle cx="128" cy="128" r="36" fill={`url(#${gid})`} />
            <circle cx="128" cy="128" r="22" fill={c2} />
            <circle cx="128" cy="128" r="8" fill={`url(#${gid})`} />
          </g>
        )}

        {rarity === "mythic" && (
          <g filter={`url(#${eid})`}>
            <ellipse cx="128" cy="128" rx="74" ry="38" fill={c2} stroke={`url(#${gid})`} strokeWidth="4" />
            <circle cx="128" cy="128" r="26" fill={`url(#${gid})`} />
            <ellipse cx="128" cy="128" rx="7" ry="26" fill={c2} />
            <circle cx="128" cy="42" r="3.5" fill={`url(#${gid})`} opacity="0.85" />
            <circle cx="214" cy="128" r="3.5" fill={`url(#${gid})`} opacity="0.85" />
            <circle cx="128" cy="214" r="3.5" fill={`url(#${gid})`} opacity="0.85" />
            <circle cx="42" cy="128" r="3.5" fill={`url(#${gid})`} opacity="0.85" />
            <circle cx="68" cy="68" r="2" fill={`url(#${gid})`} opacity="0.5" />
            <circle cx="188" cy="68" r="2" fill={`url(#${gid})`} opacity="0.5" />
            <circle cx="68" cy="188" r="2" fill={`url(#${gid})`} opacity="0.5" />
            <circle cx="188" cy="188" r="2" fill={`url(#${gid})`} opacity="0.5" />
          </g>
        )}
      </svg>

      {HOLO.has(rarity) && (
        <div className="pointer-events-none absolute inset-0 rounded-full holo-shimmer" />
      )}
    </div>
  );
}
