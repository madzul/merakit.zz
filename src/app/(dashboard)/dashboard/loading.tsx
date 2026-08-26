export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div className="h-7 w-40 animate-pulse rounded bg-neutral-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-neutral-200" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
            <div className="mt-4 h-7 w-20 animate-pulse rounded bg-neutral-200" />
            <div className="mt-3 h-3 w-28 animate-pulse rounded bg-neutral-100" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card xl:col-span-2">
          <div className="h-4 w-56 animate-pulse rounded bg-neutral-200" />
          <div className="mt-2 h-3 w-72 animate-pulse rounded bg-neutral-100" />
          <div className="mt-6 h-64 w-full animate-pulse rounded-lg bg-neutral-100" />
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
          <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-neutral-100" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-card">
            <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-10 animate-pulse rounded-lg bg-neutral-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
