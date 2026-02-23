import Container from "@/components/ui/Container";

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-red-500/8 rounded-lg ${className ?? ""}`} />
  );
}

export default function MenuLoading() {
  return (
    <div className="pt-22 sm:pt-24 md:pt-28 pb-12 sm:pb-16">
      <Container>
        <div className="text-center mb-6 sm:mb-8">
          <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mx-auto mb-2 sm:mb-3" />
          <Skeleton className="h-5 sm:h-6 w-64 sm:w-80 mx-auto" />
        </div>

        {/* Tab skeleton */}
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 sm:h-10 w-20 sm:w-24 rounded-full shrink-0" />
          ))}
        </div>

        {/* Card grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl sm:rounded-2xl overflow-hidden">
              <Skeleton className="h-28 sm:h-40 rounded-none" />
              <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2">
                <Skeleton className="h-3 sm:h-4 w-3/4" />
                <Skeleton className="h-2.5 sm:h-3 w-1/2" />
                <Skeleton className="h-2.5 sm:h-3 w-full hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
