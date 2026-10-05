export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-72 bg-gray-100 rounded"></div>
        </div>
        <div className="h-10 w-28 bg-gray-100 rounded-xl"></div>
      </div>

      {/* Content grid skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <div className="h-5 w-36 bg-gray-200 rounded"></div>
        <div className="space-y-3 pt-2">
          <div className="h-12 bg-gray-50 rounded-xl border border-gray-100"></div>
          <div className="h-12 bg-gray-50 rounded-xl border border-gray-100"></div>
          <div className="h-12 bg-gray-50 rounded-xl border border-gray-100"></div>
          <div className="h-12 bg-gray-50 rounded-xl border border-gray-100"></div>
          <div className="h-12 bg-gray-50 rounded-xl border border-gray-100"></div>
        </div>
      </div>
    </div>
  )
}
