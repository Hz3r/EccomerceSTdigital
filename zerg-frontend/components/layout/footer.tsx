import Link from "next/link";
import { MessageCircle, Mail, Clock, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { mockCategories } from "@/lib/mock-data";

const PAYMENT_METHODS = ["Yape", "Plin", "VISA", "Mastercard", "PayPal", "Binance"];

const COLUMNS = [
  {
    title: "Tienda",
    links: [
      { label: "Todos los productos", href: "/products" },
      { label: "Ofertas", href: "/products?ofertas=1" },
      ...mockCategories.slice(0, 3).map((c) => ({ label: c.nombre, href: `/products?categoria=${c.slug}` })),
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "¿Cómo comprar?", href: "#" },
      { label: "Preguntas frecuentes", href: "#" },
      { label: "Garantía y reemplazos", href: "#" },
      { label: "Términos y condiciones", href: "#" },
      { label: "Política de privacidad", href: "#" },
    ],
  },
  {
    title: "Mi cuenta",
    links: [
      { label: "Ingresar", href: "/login" },
      { label: "Crear cuenta", href: "/register" },
      { label: "Mis pedidos", href: "/account" },
      { label: "Carrito", href: "/cart" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="border-t bg-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-6">
          <div>
            <Logo className="h-10" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Tu tienda de servicios digitales: streaming, música, IA y más, con entrega inmediata y soporte real.
            </p>

            <a
              href="#"
              className="mt-6 flex max-w-xs items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-brand/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand-strong">
                <MessageCircle className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Escríbenos por WhatsApp</span>
                <span className="block text-xs text-muted-foreground">Respondemos en minutos, todos los días</span>
              </span>
            </a>

            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-brand-strong" />
                soporte@zerg.store
              </li>
              <li className="flex items-center gap-2">
                <Clock className="size-4 text-brand-strong" />
                Lun a Dom · 8:00 a 23:00
              </li>
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm font-medium transition-colors hover:text-brand-strong">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-brand-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-3 md:items-center md:px-6">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-white/50 uppercase">Métodos de pago</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <span
                  key={m}
                  className="rounded-md border border-white/20 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white/85"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div className="md:text-center">
            <p className="text-[11px] font-bold tracking-widest text-white/50 uppercase">Entrega</p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">
              <Zap className="size-4 fill-brand-yellow text-brand-yellow" />
              Digital e inmediata a tu correo
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-[11px] font-bold tracking-widest text-white/50 uppercase">Compra segura</p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4 text-brand" />
              Garantía durante todo tu plan
            </p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/50 md:px-6">
            © {new Date().getFullYear()} ZERG. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
