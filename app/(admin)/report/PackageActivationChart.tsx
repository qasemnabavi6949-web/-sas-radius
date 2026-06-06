'use client';

'use client';

export default function PackageActivationChart({ data }: { data: any[] }) { 
  return (
    <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/40 p-6 text-slate-400 text-sm">
      نمودار فعال‌سازی پکیج‌ها ({data?.length || 0} رکورد یافت شد)
    </div>
  ); 
}
