import React, { useId } from 'react';

// Decorative "research network" layer: connected nodes, molecules and
// formula glyphs, drawn as a repeating SVG tile over maroon backgrounds.
const nodes = [
  [20, 30], [95, 18], [170, 60], [230, 25], [60, 110], [140, 130],
  [210, 150], [30, 190], [110, 210], [190, 230], [250, 200],
];

const links = [
  [0, 1], [1, 2], [2, 3], [0, 4], [1, 4], [4, 5], [2, 5], [5, 6],
  [3, 6], [4, 7], [7, 8], [5, 8], [8, 9], [6, 9], [6, 10], [9, 10],
];

const ResearchBackground = ({ className = '', opacity = 0.25, color = '#ecc566' }) => {
  const id = useId().replace(/:/g, '');

  return (
    <svg
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <defs>
        <pattern id={`net-${id}`} width="260" height="260" patternUnits="userSpaceOnUse">
          <g stroke={color} strokeWidth="0.7" fill="none" opacity="0.8">
            {links.map(([a, b]) => (
              <line key={`${a}-${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />
            ))}
          </g>
          <g fill={color}>
            {nodes.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3 : 1.8} />
            ))}
          </g>
          {/* Benzene-style molecule */}
          <g stroke={color} strokeWidth="0.8" fill="none" opacity="0.6" transform="translate(150 85)">
            <polygon points="12,0 24,7 24,21 12,28 0,21 0,7" />
            <line x1="24" y1="7" x2="34" y2="1" />
            <circle cx="36" cy="0" r="2" />
          </g>
          <g fill={color} opacity="0.55" fontFamily="Georgia, serif" fontSize="16">
            <text x="70" y="70">π</text>
            <text x="225" y="110">Σ</text>
            <text x="15" y="245">∫</text>
            <text x="150" y="190" fontSize="10">f(x)</text>
          </g>
        </pattern>
        <radialGradient id={`fade-${id}`} cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </radialGradient>
        <mask id={`mask-${id}`}>
          <rect width="100%" height="100%" fill={`url(#fade-${id})`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#net-${id})`} mask={`url(#mask-${id})`} />
    </svg>
  );
};

export default ResearchBackground;
