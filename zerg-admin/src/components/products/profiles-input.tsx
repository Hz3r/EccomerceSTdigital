"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

// Sugerencias al escribir; se puede poner cualquier texto (ej. "3 perfiles", "Pantalla 4K").
export const PERFILES_SUGERIDOS = ["1 perfil", "2 perfiles", "3 perfiles", "4 perfiles", "5 perfiles", "Cuenta completa"]

/** Campo "Perfiles" de un plan, con sugerencias. Vacío = la tienda no muestra perfiles para ese plan. */
export function ProfilesInput({ value, onChange, id, className }: {
  value: string
  onChange: (v: string) => void
  id?: string
  className?: string
}) {
  const listId = React.useId()
  return (
    <>
      <Input
        id={id}
        aria-label="Perfiles"
        placeholder="—"
        list={listId}
        maxLength={60}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
      <datalist id={listId}>
        {PERFILES_SUGERIDOS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </>
  )
}
