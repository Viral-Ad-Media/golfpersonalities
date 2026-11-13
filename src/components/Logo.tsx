export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8">
        <circle cx="16" cy="16" r="15" fill="currentColor" opacity="0.12" />
        <path d="M13 6v20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M13 6l10 4-10 4z" fill="currentColor" />
        <ellipse cx="16" cy="26" rx="8" ry="2" fill="currentColor" opacity="0.35" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight">
        Golf<span className="text-brand-500">Personalities</span>
      </span>
    </span>
  );
}
