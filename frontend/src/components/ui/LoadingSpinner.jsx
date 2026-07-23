/**
 * LoadingSpinner — elegant dual-ring spinner with accent color.
 * Variant 'dots' renders animated pulse dots for inline contexts.
 */
export default function LoadingSpinner({ size = 'md', variant = 'ring', className = '' }) {
  if (variant === 'dots') {
    const dotSizes = { sm: 'w-1 h-1', md: 'w-1.5 h-1.5', lg: 'w-2 h-2' }
    return (
      <span
        className={`inline-flex items-center gap-1 ${className}`}
        role="status"
        aria-label="Loading"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`${dotSizes[size]} rounded-full bg-accent`}
            style={{
              animation: 'pulse-dot 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </span>
    )
  }

  const ringDims = { sm: 16, md: 28, lg: 44 }
  const dim = ringDims[size]
  const stroke = size === 'lg' ? 3 : 2.5
  const r = (dim - stroke * 2) / 2
  const circ = 2 * Math.PI * r

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        fill="none"
        aria-hidden="true"
        style={{ animation: 'spin-ring 0.8s linear infinite' }}
      >
        {/* Track ring */}
        <circle
          cx={dim / 2} cy={dim / 2} r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-line-strong"
          strokeLinecap="round"
        />
        {/* Active arc */}
        <circle
          cx={dim / 2} cy={dim / 2} r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-accent"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * 0.72}
          transform={`rotate(-90 ${dim / 2} ${dim / 2})`}
        />
      </svg>
    </span>
  )
}
