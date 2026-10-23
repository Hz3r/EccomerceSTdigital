"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ListControls, moveItem, removeItem, replaceItem } from "@/components/cms/list-controls"

export interface ProductContent {
  incluye: string[]
  pasos: { titulo: string; texto: string }[]
  faqs: { pregunta: string; respuesta: string }[]
}

const area =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

function Block({ title, hint, children, onAdd, addLabel, canAdd }: {
  title: string
  hint: string
  children: React.ReactNode
  onAdd: () => void
  addLabel: string
  canAdd: boolean
}) {
  return (
    <section className="rounded-xl border">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd} disabled={!canAdd}>
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      </div>
      <div className="space-y-2 p-4">{children}</div>
    </section>
  )
}

const Empty = ({ text }: { text: string }) => <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{text}</p>

/** Contenido de la página del producto. Una sección vacía muestra los textos generales de la tienda. */
export function ProductContentEditor({ value, onChange }: { value: ProductContent; onChange: (v: ProductContent) => void }) {
  const { incluye, pasos, faqs } = value
  const set = <K extends keyof ProductContent>(key: K, list: ProductContent[K]) => onChange({ ...value, [key]: list })

  return (
    <div className="space-y-4">
      <Block
        title="Qué incluye"
        hint="Viñetas en la pestaña Descripción."
        addLabel="Agregar"
        canAdd={incluye.length < 10}
        onAdd={() => set("incluye", [...incluye, ""])}
      >
        {incluye.length === 0 && <Empty text="Vacío: se muestran los puntos generales (acceso completo, entrega en Mis accesos, garantía)." />}
        {incluye.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={item} maxLength={160} placeholder="Ej. Perfil privado en 4K" aria-label={`Qué incluye ${i + 1}`} onChange={(e) => set("incluye", incluye.map((x, j) => (j === i ? e.target.value : x)))} />
            <ListControls index={i} length={incluye.length} label="punto" onMove={(d) => set("incluye", moveItem(incluye, i, d))} onRemove={() => set("incluye", removeItem(incluye, i))} />
          </div>
        ))}
      </Block>

      <Block
        title="Cómo funciona"
        hint="Pasos numerados en la pestaña Cómo funciona (hasta 6)."
        addLabel="Agregar paso"
        canAdd={pasos.length < 6}
        onAdd={() => set("pasos", [...pasos, { titulo: "", texto: "" }])}
      >
        {pasos.length === 0 && <Empty text="Vacío: se muestran los 4 pasos generales (elige, paga, recibe, disfruta)." />}
        {pasos.map((p, i) => (
          <div key={i} className="flex gap-2 rounded-lg border p-2">
            <span className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-ink text-xs font-black text-brand">{i + 1}</span>
            <div className="grid min-w-0 flex-1 gap-1.5">
              <Input value={p.titulo} maxLength={160} placeholder="Título del paso" aria-label={`Título del paso ${i + 1}`} onChange={(e) => set("pasos", replaceItem(pasos, i, { titulo: e.target.value }))} className="h-8 font-semibold" />
              <textarea rows={2} value={p.texto} maxLength={600} placeholder="Explicación corta" aria-label={`Texto del paso ${i + 1}`} onChange={(e) => set("pasos", replaceItem(pasos, i, { texto: e.target.value }))} className={area} />
            </div>
            <ListControls index={i} length={pasos.length} label="paso" onMove={(d) => set("pasos", moveItem(pasos, i, d))} onRemove={() => set("pasos", removeItem(pasos, i))} className="flex-col self-start" />
          </div>
        ))}
      </Block>

      <Block
        title="Preguntas frecuentes"
        hint="Se muestran como acordeón en la pestaña Preguntas frecuentes (hasta 15)."
        addLabel="Agregar pregunta"
        canAdd={faqs.length < 15}
        onAdd={() => set("faqs", [...faqs, { pregunta: "", respuesta: "" }])}
      >
        {faqs.length === 0 && <Empty text="Vacío: se muestran las preguntas generales (entrega, garantía, dispositivos, renovación)." />}
        {faqs.map((f, i) => (
          <div key={i} className="flex gap-2 rounded-lg border p-2">
            <div className="grid min-w-0 flex-1 gap-1.5">
              <Input value={f.pregunta} maxLength={160} placeholder="¿Pregunta?" aria-label={`Pregunta ${i + 1}`} onChange={(e) => set("faqs", replaceItem(faqs, i, { pregunta: e.target.value }))} className="h-8 font-semibold" />
              <textarea rows={2} value={f.respuesta} maxLength={600} placeholder="Respuesta" aria-label={`Respuesta ${i + 1}`} onChange={(e) => set("faqs", replaceItem(faqs, i, { respuesta: e.target.value }))} className={area} />
            </div>
            <ListControls index={i} length={faqs.length} label="pregunta" onMove={(d) => set("faqs", moveItem(faqs, i, d))} onRemove={() => set("faqs", removeItem(faqs, i))} className="flex-col self-start" />
          </div>
        ))}
      </Block>
    </div>
  )
}
