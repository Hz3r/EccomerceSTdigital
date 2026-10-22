"use client"

import { Toast } from "@base-ui/react/toast"
import { CheckCircle2, Info, XIcon } from "lucide-react"
import { cn } from "cn"

// Gestor global: permite mostrar avisos desde cualquier parte con `toast.add({ ... })`.
export const toastManager = Toast.createToastManager()

type ToastType = "success" | "info"

export const toast = {
  success: (title: string, description?: string) => toastManager.add({ title, description, type: "success" }),
  info: (title: string, description?: string) => toastManager.add({ title, description, type: "info" }),
}

export function Toaster({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager} timeout={6000}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-24 z-[100] flex w-[calc(100vw-2rem)] flex-col gap-2 outline-none sm:right-6 sm:bottom-26 sm:w-[24rem]">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

function ToastList() {
  const { toasts } = Toast.useToastManager()
  return toasts.map((t) => {
    const Icon = (t.type as ToastType) === "success" ? CheckCircle2 : Info
    return (
      <Toast.Root
        key={t.id}
        toast={t}
        className={cn(
          "relative flex items-start gap-3 rounded-2xl border bg-popover p-4 pr-10 text-popover-foreground shadow-xl ring-1 ring-foreground/5 select-none",
          "translate-x-(--toast-swipe-movement-x) transition-[transform,opacity] duration-300 ease-out",
          "data-starting-style:translate-y-4 data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:data-[swipe-direction=right]:translate-x-full"
        )}
      >
        <Icon className={cn("mt-0.5 size-5 shrink-0", t.type === "success" ? "text-brand-strong" : "text-brand-yellow")} />
        <Toast.Content className="min-w-0 flex-1">
          <Toast.Title className="text-sm font-bold" />
          <Toast.Description className="mt-0.5 text-sm text-muted-foreground" />
        </Toast.Content>
        <Toast.Close
          aria-label="Cerrar aviso"
          className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <XIcon className="size-4" />
        </Toast.Close>
      </Toast.Root>
    )
  })
}
