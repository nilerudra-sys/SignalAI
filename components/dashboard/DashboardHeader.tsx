import { LogoutButton } from '@/components/auth/LogoutButton';

export function DashboardHeader({ planLabel }: { planLabel: string }) {
  return (
    <div className="sticky top-0 z-30 border-b border-hairline bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-6 py-3.5 sm:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-[9px] w-[9px] shrink-0 animate-sig-blink rounded-full bg-cobalt" />
          <span className="text-[15.5px] font-semibold tracking-tight text-graphite">Signal</span>
          <span className="whitespace-nowrap border-l border-hairline pl-2.5 font-mono text-[11px] text-slate-dim">
            {planLabel}
          </span>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
