import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="ZERG — Inicio" className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src="/zerg-logo.png"
        alt="ZERG"
        width={900}
        height={369}
        priority={priority}
        className="h-full w-auto"
      />
    </Link>
  );
}
