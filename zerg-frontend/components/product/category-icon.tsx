import { Briefcase, Gamepad2, Music, Palette, ShieldCheck, Sparkles, Tv } from "lucide-react";

export function CategoryIcon({ slug, className }: { slug?: string; className?: string }) {
  switch (slug) {
    case "streaming":
      return <Tv className={className} />;
    case "musica":
      return <Music className={className} />;
    case "diseno":
      return <Palette className={className} />;
    case "productividad":
      return <Briefcase className={className} />;
    case "gaming":
      return <Gamepad2 className={className} />;
    case "seguridad":
      return <ShieldCheck className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}
