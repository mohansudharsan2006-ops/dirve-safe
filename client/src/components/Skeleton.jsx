export function Skeleton({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '', 
  count = 1,
  circle = false
}) {
  const skeletons = Array(count).fill(0);
  const baseClass = `${circle ? 'rounded-full' : 'rounded-lg'} dm-skeleton ${width} ${height}`;

  return (
    <>
      {skeletons.map((_, i) => (
        <div key={i} className={`${baseClass} ${className} mb-2 last:mb-0`} />
      ))}
    </>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`dm-card ${className}`}>
      <Skeleton height="h-6" width="w-24" className="mb-4" />
      <Skeleton height="h-4" width="w-full" className="mb-2" />
      <Skeleton height="h-4" width="w-3/4" />
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={className}>
      {Array(lines).fill(0).map((_, i) => (
        <Skeleton 
          key={i} 
          height="h-4" 
          width={i === lines - 1 ? 'w-2/3' : 'w-full'} 
          className="mb-2"
        />
      ))}
    </div>
  );
}
