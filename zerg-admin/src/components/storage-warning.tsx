"use client"

import * as React from "react"
import { AlertTriangle } from "lucide-react"
import api from "@/lib/axios"

/**
 * Aviso si el backend está en la nube sin almacenamiento persistente: en Railway el disco del
 * contenedor se borra en cada despliegue y las imágenes subidas dejan de cargar.
 */
export function StorageWarning() {
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    api
      .get<{ data: { persistente: boolean } }>("/upload/status")
      .then((res) => {
        if (!cancelled) setShow(!res.data.data.persistente)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!show) return null
  return (
    <div role="alert" className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
      <div>
        <p className="font-semibold">Las imágenes que subas se borrarán en el próximo despliegue</p>
        <p className="mt-1 text-muted-foreground">
          El backend está en Railway sin un Volume. Agrégalo en Railway (servicio del backend → clic derecho → Attach Volume, ruta{" "}
          <code className="rounded bg-muted px-1">/data</code>) y vuelve a desplegar. Luego vuelve a subir las imágenes que ya no cargan.
        </p>
      </div>
    </div>
  )
}
