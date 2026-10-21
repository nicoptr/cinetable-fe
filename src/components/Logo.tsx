const OUTER = "70.66 0.11 99.89 29.34 99.89 70.66 70.66 99.89 29.34 99.89 0.11 70.66 0.11 29.34 29.34 0.11";

const SEATS = [
  [74.75, 25.25],
  [85, 50],
  [74.75, 74.75],
  [50, 85],
  [25.25, 74.75],
  [15, 50],
  [25.25, 25.25],
];

/** Tavola rotonda con otto amici dentro un doppio ottagono (src/app/icon.svg è lo stesso disegno). */
export function Logo({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="-6 -6 112 112" width={size} height={size} aria-hidden="true" className={className}>
      <polygon points={OUTER} fill="none" stroke="#c9a24a" strokeWidth="3" strokeLinejoin="round" />
      <polygon points="68.37 5.65 94.35 31.63 94.35 68.37 68.37 94.35 31.63 94.35 5.65 68.37 5.65 31.63 31.63 5.65" fill="none" stroke="#c9a24a" strokeWidth="0.9" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="22" fill="#c9a24a" />
      <circle cx="50" cy="15" r="5.5" fill="#8a2028" />
      {SEATS.map(([cx, cy]) => (
        <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="5.5" fill="#ece5dc" />
      ))}
    </svg>
  );
}

/** Il logo inciso nella ceralacca d'oro: bruno scuro, fili più spessi perché piccolo, il posto rosso più cupo. */
export function SealMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-6 -6 112 112" aria-hidden="true" className={className}>
      <polygon points={OUTER} fill="none" stroke="#3a2a0c" strokeWidth="5" strokeLinejoin="round" />
      <polygon points="67.60 7.50 92.50 32.40 92.50 67.60 67.60 92.50 32.40 92.50 7.50 67.60 7.50 32.40 32.40 7.50" fill="none" stroke="#3a2a0c" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="21" fill="#3a2a0c" />
      <circle cx="50" cy="15" r="6" fill="#6e1820" />
      {SEATS.map(([cx, cy]) => (
        <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="6" fill="#3a2a0c" />
      ))}
    </svg>
  );
}

/** "Cinetable" in sans pesante e stretto, con il punto bordeaux. */
export function Wordmark() {
  return (
    <span className="font-[Inter,system-ui,sans-serif] font-extrabold tracking-[-0.04em]">
      Cinetable<span aria-hidden="true" className="text-[#8a2028]">.</span>
    </span>
  );
}
