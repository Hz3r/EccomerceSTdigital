"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
} from "@/components/data-table/data-table"
import { useAuth } from "@/hooks/useAuth"
import { useLiveVersion } from "@/lib/live"
import api from "@/lib/axios"
import {
  PencilIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react"
import type { User } from "@/types"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = React.useState<User[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [formName, setFormName] = React.useState("")
  const [formRol, setFormRol] = React.useState<"ADMIN" | "CLIENTE">("CLIENTE")
  const [isSaving, setIsSaving] = React.useState(false)

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await api.get("/users")
      setUsers(res.data.data)
    } catch {
      // error handled by interceptor
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Se actualiza en vivo con los cambios de la tienda y de otras pestañas
  const liveVersion = useLiveVersion("users")
  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers, liveVersion])

  const handleToggleStatus = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive })
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      )
    } catch {
      // error handled by interceptor
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormName(user.nombre)
    setFormRol(user.rol)
    setOpen(true)
  }

  const handleSave = async () => {
    if (!editingUser) return
    setIsSaving(true)
    try {
      const res = await api.put(`/users/${editingUser.id}`, {
        nombre: formName,
        rol: formRol,
      })
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...res.data.data } : u))
      )
      setOpen(false)
    } catch {
      // error handled by interceptor
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) return
    if (!window.confirm(`¿Eliminar a ${user.nombre}?`)) return
    try {
      await api.delete(`/users/${user.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } catch {
      // error handled by interceptor
    }
  }

  const columns: DataTableColumn<User>[] = [
    {
      key: "nombre",
      label: "Nombre",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt={item.nombre} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <UserIcon className="h-6 w-6 text-muted-foreground" />
          )}
          <span>{item.nombre}</span>
        </div>
      ),
    },
    { key: "email", label: "Email", hideOnMobile: true },
    {
      key: "rol",
      label: "Rol",
      render: (item) => (
        <Badge variant={item.rol === "ADMIN" ? "default" : "secondary"}>
          {item.rol}
        </Badge>
      ),
    },
    {
      key: "isActive",
      label: "Estado",
      render: (item) => (
        <Badge
          variant={item.isActive ? "default" : "secondary"}
          className="cursor-pointer select-none"
          onClick={(e) => {
            e.stopPropagation()
            handleToggleStatus(item)
          }}
        >
          {item.isActive ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ]

  const actions: DataTableAction<User>[] = [
    {
      label: "Editar",
      icon: <PencilIcon className="size-3.5" />,
      onClick: (item) => handleEdit(item),
    },
    {
      label: "Eliminar",
      icon: <TrashIcon className="size-3.5" />,
      variant: "destructive",
      onClick: (item) => handleDelete(item),
      show: (item) => item.id !== currentUser?.id,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona los usuarios de tu tienda
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <DataTable
              data={users as unknown as Record<string, unknown>[]}
              columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
              actions={actions as unknown as DataTableAction<Record<string, unknown>>[]}
              searchPlaceholder="Buscar usuario..."
              searchKey="nombre"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Nombre completo"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rol">Rol</Label>
              <Input
                id="rol"
                placeholder="ADMIN o CLIENTE"
                value={formRol}
                onChange={(e) => setFormRol(e.target.value.toUpperCase() as "ADMIN" | "CLIENTE")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
