import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-lg font-bold tracking-tight text-slate-900">ZERG</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu tienda de servicios digitales y streaming.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Tienda</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/products" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Productos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Soporte</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">contacto@zerg.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">Términos de servicio</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">Política de privacidad</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ZERG. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
