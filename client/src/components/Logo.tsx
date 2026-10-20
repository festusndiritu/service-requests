import { Landmark } from 'lucide-react';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white ${
          light ? 'bg-white/10 ring-1 ring-white/25' : 'bg-brand-600 shadow-sm'
        }`}
      >
        <Landmark size={22} strokeWidth={1.75} aria-hidden />
      </span>

      <span className="leading-tight">
        <span className={`block text-sm font-bold ${light ? 'text-white' : 'text-slate-900'}`}>Murang'a County</span>
        <span className={`block text-xs ${light ? 'text-slate-300' : 'text-slate-500'}`}>Service Requests</span>
      </span>
    </div>
  );
}
