"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageField, type UploadFolder } from "@/components/image-field"

interface ImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onSave: (url: string) => void
  title?: string
  folder?: UploadFolder
}

export function ImageModal({ open, onOpenChange, value, onSave, title = "Imagen", folder = "general" }: ImageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {/* Se vuelve a montar en cada apertura para partir del valor actual */}
        {open && (
          <ImageModalBody
            key={value}
            value={value}
            folder={folder}
            onCancel={() => onOpenChange(false)}
            onSave={(url) => {
              onSave(url)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ImageModalBody({ value, folder, onCancel, onSave }: {
  value: string
  folder: UploadFolder
  onCancel: () => void
  onSave: (url: string) => void
}) {
  const [url, setUrl] = React.useState(value)
  return (
    <>
      <ImageField value={url} onChange={setUrl} folder={folder} previewClassName="size-28" />
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(url)}>Guardar</Button>
      </DialogFooter>
    </>
  )
}
