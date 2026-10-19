import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image src="/zerg-logo.png" alt="ZERG" width={900} height={369} priority className="h-full w-auto" />
      <span className="rounded-md bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-brand-strong uppercase dark:text-brand-bright">
        Admin
      </span>
    </span>
  );
}
