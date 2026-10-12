import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Servicios digitales
            <br />
            <span className="text-blue-600">de primera</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground md:text-lg">
            Streaming, herramientas y más. Accede a los mejores servicios con los mejores precios.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/products">
              <Button size="lg">
                <ShoppingBag className="size-4" />
                Ver productos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col items-center rounded-xl border p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Zap className="size-6" />
            </div>
            <h3 className="mt-4 font-semibold">Activación instantánea</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Recibe tus credenciales al instante después de tu compra.
            </p>
          </div>
          <div className="flex flex-col items-center rounded-xl border p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Shield className="size-6" />
            </div>
            <h3 className="mt-4 font-semibold">Soporte 24/7</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Estamos aquí para ayudarte cuando lo necesites.
            </p>
          </div>
          <div className="flex flex-col items-center rounded-xl border p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <ShoppingBag className="size-6" />
            </div>
            <h3 className="mt-4 font-semibold">Los mejores precios</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Planes flexibles que se adaptan a tu presupuesto.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
