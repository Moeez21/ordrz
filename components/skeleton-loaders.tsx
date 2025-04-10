import { Skeleton } from "@/components/ui/skeleton"

export function ProductImageSkeleton() {
  return (
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px]">
      <Skeleton className="w-full h-full" />
    </div>
  )
}

export function ProductInfoSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-12 w-full mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-10 w-32 mb-4" />
    </div>
  )
}

export function BannerSkeleton() {
  return (
    <div className="relative w-full h-80 md:h-[500px] lg:h-[600px]">
      <Skeleton className="w-full h-full" />
    </div>
  )
}

export function FeaturedItemsSkeleton() {
  return (
    <div className="mb-12">
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex flex-col">
              <Skeleton className="h-52 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export function CategoryNavSkeleton() {
  return (
    <div className="py-3">
      <div className="flex space-x-2 overflow-hidden">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex border rounded-lg overflow-hidden">
      <div className="p-4 flex-1">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-auto w-24 md:w-32" />
    </div>
  )
}

export function CategorySectionSkeleton() {
  return (
    <div className="pt-4 mb-14">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Skeleton */}
      <div className="border-b py-4 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-20 rounded-md hidden md:block" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
        </div>
      </div>

      {/* Banner Skeleton */}
      <BannerSkeleton />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
        {/* Order Type Indicator Skeleton */}
        <Skeleton className="h-20 w-full mb-8 rounded-lg" />

        {/* Featured Items Skeleton */}
        <FeaturedItemsSkeleton />

        {/* Category Nav Skeleton */}
        <CategoryNavSkeleton />

        {/* Category Sections Skeleton */}
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <CategorySectionSkeleton key={i} />
          ))}
      </main>

      {/* Footer Skeleton */}
      <div className="border-t py-10 px-4 md:px-6 lg:px-8 mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="flex items-start gap-4">
              <Skeleton className="h-20 w-20 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="flex gap-3 mt-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-4 w-48 mx-auto mt-10" />
        </div>
      </div>
    </div>
  )
}
