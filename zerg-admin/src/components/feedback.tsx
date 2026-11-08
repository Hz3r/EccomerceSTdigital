"use client"

import * as React from "react"
import { Toaster, toast } from "sonner"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Avisos suaves del panel en lugar de window.alert / window.confirm:
// - toast.success / toast.error (sonner): mensajes breves que desaparecen solos.
// - confirmAction({...}): ventana de confirmación con el estilo del panel; devuelve una promesa.
export { toast }

interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  /** Acción que borra o no se puede deshacer: botón en rojo. */
  destructive?: boolean
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

let pending: PendingConfirm | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

/** Pregunta antes de una acción. `if (!(await confirmAction({ title: "¿Eliminar?" }))) return` */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  pending?.resolve(false)
  return new Promise((resolve) => {
    pending = { ...options, resolve }
    notify()
  })
}

function settle(ok: boolean) {
  pending?.resolve(ok)
  pending = null
  notify()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

// Sigue el tema claro/oscuro del panel (clase "dark" en <html>).
function useDarkClass() {
  return React.useSyncExternalStore(
    (cb) => {
      const obs = new MutationObserver(cb)
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
      return () => obs.disconnect()
    },
    () => document.documentElement.classList.contains("dark"),
    () => true
  )
}

/** Se monta una vez en el layout del panel. */
export function FeedbackProvider() {
  const current = React.useSyncExternalStore(subscribe, () => pending, () => null)
  const dark = useDarkClass()

  return (
    <>
      <Toaster
        theme={dark ? "dark" : "light"}
        position="bottom-right"
        richColors
        closeButton
        duration={4000}
        toastOptions={{ className: "font-sans" }}
      />
      <Dialog open={current !== null} onOpenChange={(open) => !open && settle(false)}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {current?.destructive && <AlertTriangle className="size-4 text-destructive" />}
              {current?.title}
            </DialogTitle>
            {current?.description && <DialogDescription>{current.description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {current?.cancelText ?? "Cancelar"}
            </Button>
            <Button variant={current?.destructive ? "destructive" : "default"} onClick={() => settle(true)} autoFocus>
              {current?.confirmText ?? "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
