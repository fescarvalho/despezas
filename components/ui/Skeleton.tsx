'use client'

interface SkeletonProps {
  width?: string
  height?: string
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ width, height = '14px', className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, ...style }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton width="60%" height="12px" />
      <Skeleton width="80%" height="28px" />
      <Skeleton width="40%" height="12px" />
    </div>
  )
}

export function SkeletonTransaction() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: 6 }}>
      <Skeleton width="44px" height="44px" style={{ borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width="55%" height="14px" />
        <Skeleton width="35%" height="12px" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <Skeleton width="70px" height="16px" />
        <Skeleton width="40px" height="11px" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTransaction key={i} />
      ))}
    </div>
  )
}
