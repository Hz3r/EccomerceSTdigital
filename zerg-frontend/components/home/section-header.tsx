import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "Ver todo",
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {href && (
          <Link
            href={href}
            className="hidden items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-brand hover:text-brand-strong sm:inline-flex dark:hover:text-brand"
          >
            {linkLabel}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
