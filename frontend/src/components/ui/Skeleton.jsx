/**
 * Skeleton — animated shimmer placeholder for loading states.
 */
export default function Skeleton({ className = '', variant = 'text', width, height }) {
  const variants = {
    text: 'h-4 rounded-md',
    title: 'h-7 rounded-lg',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-xl',
  }

  const style = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  }

  return (
    <div
      className={`skeleton-shimmer ${variants[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}
