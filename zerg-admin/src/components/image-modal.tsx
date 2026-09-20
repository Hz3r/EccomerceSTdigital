"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ImageIcon, UploadIcon, LinkIcon, TrashIcon } from "lucide-react"

interface ImageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onSave: (url: string) => void
  title?: string
}

export function ImageModal({
  open,
  onOpenChange,
  value,
  onSave,
  title = "Imagen",
}: ImageModalProps) {
  const [url, setUrl] = React.useState(value)
  const [preview, setPreview] = React.useState(value)
  const [activeTab, setActiveTab] = React.useState<string>("url")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (open) {
      setUrl(value)
      setPreview(value)
    }
  }, [open, value])

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)
    setPreview(newUrl)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUrl(objectUrl)
  }

  const handleRemove = () => {
    setUrl("")
    setPreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = () => {
    onSave(url)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-4">
            {preview ? (
              <img
                src={preview}
                alt="Vista previa"
                className="max-h-48 rounded-md object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="size-10" />
                <span className="text-xs">Sin imagen</span>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v ?? "url")}>
            <TabsList>
              <TabsTrigger value="url">
                <LinkIcon className="size-3.5" />
                URL
              </TabsTrigger>
              <TabsTrigger value="upload">
                <UploadIcon className="size-3.5" />
                Subir archivo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url">
              <div className="flex flex-col gap-2">
                <Label htmlFor="image-url">URL de la imagen</Label>
                <Input
                  id="image-url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={url.startsWith("blob:") ? "" : url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="upload">
              <div className="flex flex-col gap-2">
                <Label>Seleccionar archivo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="size-4" />
                  Elegir archivo
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP o GIF. Max 5MB.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          {preview && (
            <Button variant="destructive" onClick={handleRemove}>
              <TrashIcon className="size-4" />
              Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
