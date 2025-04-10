export function ProductOptionsModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b">
          <div className="h-6 w-3/4 bg-gray-300 animate-pulse rounded"></div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Product image and name */}
          <div className="flex items-center mb-4">
            <div className="h-16 w-16 bg-gray-300 animate-pulse rounded mr-3"></div>
            <div>
              <div className="h-5 w-40 bg-gray-300 animate-pulse rounded mb-1"></div>
              <div className="h-4 w-24 bg-gray-300 animate-pulse rounded"></div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="mb-4">
                <div className="h-6 w-48 bg-gray-300 animate-pulse rounded mb-2"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-12 w-full bg-gray-300 animate-pulse rounded flex items-center p-3">
                      <div className="h-5 w-5 rounded-full bg-gray-400 animate-pulse mr-3"></div>
                      <div className="h-4 w-32 bg-gray-400 animate-pulse rounded"></div>
                      <div className="h-4 w-16 bg-gray-400 animate-pulse rounded ml-auto"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="h-10 w-full bg-gray-300 animate-pulse rounded"></div>
        </div>
      </div>
    </div>
  )
}
