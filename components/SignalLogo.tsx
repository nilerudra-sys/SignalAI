export function SignalLogo({ className = 'h-[21px] w-[21px]' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Signal"
      role="img"
      className={`shrink-0 ${className}`}
    >
      <rect x="0.5" y="17" width="3" height="5" rx="1.5" fill="#c3c5c0" />
      <rect x="5.5" y="12" width="3" height="10" rx="1.5" fill="#9b9e9a" />
      <rect
        x="10.5"
        y="2"
        width="3"
        height="20"
        rx="1.5"
        fill="#17427f"
        className="origin-[11.5px_22px] animate-sig-pulse"
      />
      <rect x="15.5" y="14" width="3" height="8" rx="1.5" fill="#9b9e9a" />
      <rect x="20.5" y="18" width="3" height="4" rx="1.5" fill="#c3c5c0" />
    </svg>
  );
}
