import Link from "next/link";
import { BookOpen, PlayCircle } from "lucide-react";
import { guideHref, type GuideSummary } from "@/lib/help-pages";
import { assetUrl } from "@/lib/site-settings";

export function GuideCard({ guide }: { guide: GuideSummary }) {
  return (
    <Link href={guideHref(guide.slug)} className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden bg-brand-mint">
        {guide.portadaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(guide.portadaUrl)} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex size-full items-center justify-center bg-brand-gradient">
            <BookOpen className="size-10 text-white/80" />
          </div>
        )}
        {guide.video && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">
            <PlayCircle className="size-3.5" /> Video
          </span>
        )}
      </div>
      <div className="flex-1 p-4">
        <p className="font-bold leading-snug group-hover:text-brand-strong">{guide.titulo}</p>
        {guide.resumen && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{guide.resumen}</p>}
      </div>
    </Link>
  );
}
