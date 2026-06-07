const Skeleton = ({ className }) => {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />;
};

export const ProfileSkeleton = () => (
  <div className="flex gap-3">
    <Skeleton className="w-25 h-25 rounded-full" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-32" />
    </div>
  </div>
);

export const LeaderboardSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i}>
        <td colSpan="6" className="p-2">
          <div className="h-6 w-full animate-pulse bg-white/10 rounded" />
        </td>
      </tr>
    ))}
  </>
);

export const ChartSkeleton = () => (
  <div className="h-62.5 flex items-center justify-center">
    <Skeleton className="w-full h-full rounded-xl" />
  </div>
);
