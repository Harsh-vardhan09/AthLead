import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const EventCardSkeleton = () => {
  return (
    <div className="h-65 w-auto bg-white/5 border border-white/10 rounded-xl overflow-hidden p-3">
      
      {/* Top Gradient Line */}
      <div className="h-1 w-full mb-3">
        <Skeleton height={3} />
      </div>

      {/* Header */}
      <div className="flex gap-3 my-3">
        <Skeleton circle width={40} height={40} />
        <div className="flex-1">
          <Skeleton height={14} width="80%" />
          <Skeleton height={10} width="50%" />
        </div>
      </div>

      {/* Info Section */}
      <div className="flex justify-around my-6">
        <div className="w-1/2 space-y-2">
          <Skeleton height={10} width="70%" />
          <Skeleton height={10} width="60%" />
        </div>
        <div className="w-1/2 space-y-2">
          <Skeleton height={10} width="70%" />
          <Skeleton height={10} width="60%" />
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 px-2">
        <Skeleton width={50} height={20} borderRadius={20} />
        <Skeleton width={50} height={20} borderRadius={20} />
        <Skeleton width={50} height={20} borderRadius={20} />
      </div>

      {/* Button */}
      <div className="flex justify-center mt-6">
        <Skeleton height={40} width="80%" borderRadius={12} />
      </div>
    </div>
  );
};

export default EventCardSkeleton;