export default function Loading() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-none lg:px-8 animate-pulse">
      <div className="h-7 w-48 bg-rose-100 dark:bg-slate-700 rounded-xl mb-6" />
      <div className="h-24 bg-rose-100 dark:bg-slate-700 rounded-2xl mb-4" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-rose-50 dark:bg-slate-800 rounded-2xl" />)}
      </div>
      {[1,2,3,4].map(i => <div key={i} className="h-14 bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-slate-700 mb-2" />)}
    </div>
  )
}
