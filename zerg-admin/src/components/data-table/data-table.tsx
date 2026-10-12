"use client"

import * as React from "react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

export interface DataTableColumn<T> {
  key: string
  label: string
  className?: string
  render?: (item: T) => React.ReactNode
  hideOnMobile?: boolean
}

export interface DataTableAction<T> {
  label: string
  icon?: React.ReactNode
  variant?: "default" | "outline" | "ghost" | "destructive"
  onClick: (item: T) => void
  show?: (item: T) => boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  actions?: DataTableAction<T>[]
  searchPlaceholder?: string
  searchKey?: string
  pageSize?: number
  emptyMessage?: string
  onSearch?: (term: string) => void
  headerActions?: React.ReactNode
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions,
  searchPlaceholder = "Buscar...",
  searchKey,
  pageSize = 10,
  emptyMessage = "No hay datos disponibles",
  onSearch,
  headerActions,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [mobileView, setMobileView] = React.useState<"table" | "cards">("cards")

  const filteredData = React.useMemo(() => {
    if (!search || !searchKey) return data
    const term = search.toLowerCase()
    return data.filter((item) => {
      const value = item[searchKey]
      return value && String(value).toLowerCase().includes(term)
    })
  }, [data, search, searchKey])

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  React.useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const handleSearch = (value: string) => {
    setSearch(value)
    onSearch?.(value)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <DataTableMobileToggle view={mobileView} onToggle={setMobileView} />
          {headerActions}
        </div>
      </div>

      <div className={cn("rounded-lg border", mobileView === "table" ? "block" : "hidden sm:block")}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(mobileView === "table" ? "table-cell" : "hidden sm:table-cell", col.className)}
                >
                  {col.label}
                </TableHead>
              ))}
              {actions && actions.length > 0 && (
                <TableHead className={cn("w-[100px]", mobileView === "table" ? "table-cell" : "hidden sm:table-cell")}>
                  Acciones
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        mobileView === "table" ? "table-cell" : "hidden sm:table-cell",
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(item)
                        : String(item[col.key] ?? "")}
                    </TableCell>
                  ))}
                  {actions && actions.length > 0 && (
                    <TableCell className={mobileView === "table" ? "table-cell" : "hidden sm:table-cell"}>
                      <div className="flex items-center gap-1">
                        {actions
                          .filter((action) => !action.show || action.show(item))
                          .map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              variant={action.variant ?? "ghost"}
                              size="icon-xs"
                              onClick={() => action.onClick(item)}
                              title={action.label}
                            >
                              {action.icon}
                            </Button>
                          ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {mobileView === "cards" && (
        <MobileCard
          data={paginatedData}
          columns={columns}
          actions={actions}
          emptyMessage={emptyMessage}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filteredData.length} resultado(s)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function MobileCard<T extends Record<string, unknown>>({
  data,
  columns,
  actions,
  emptyMessage = "No hay datos disponibles",
}: {
  data: T[]
  columns: DataTableColumn<T>[]
  actions?: DataTableAction<T>[]
  emptyMessage?: string
}) {
  const visibleColumns = columns.filter((col) => !col.hideOnMobile)

  if (data.length === 0) {
    return (
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {data.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border bg-card p-3 ring-1 ring-foreground/10"
        >
          <div className="flex flex-col gap-2">
            {visibleColumns.map((col) => (
              <div key={col.key} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{col.label}</span>
                <span className="text-sm font-medium">
                  {col.render
                    ? col.render(item)
                    : String(item[col.key] ?? "")}
                </span>
              </div>
            ))}
          </div>
          {actions && actions.length > 0 && (
            <div className="mt-3 flex items-center gap-2 border-t pt-3">
              {actions
                .filter((action) => !action.show || action.show(item))
                .map((action, actionIndex) => (
                  <Button
                    key={actionIndex}
                    variant={action.variant ?? "ghost"}
                    size="xs"
                    onClick={() => action.onClick(item)}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function DataTableMobileToggle({
  view,
  onToggle,
}: {
  view: "table" | "cards"
  onToggle: (view: "table" | "cards") => void
}) {
  return (
    <div className="flex sm:hidden">
      <Button
        variant={view === "table" ? "default" : "outline"}
        size="xs"
        onClick={() => onToggle("table")}
      >
        Tabla
      </Button>
      <Button
        variant={view === "cards" ? "default" : "outline"}
        size="xs"
        onClick={() => onToggle("cards")}
      >
        Tarjetas
      </Button>
    </div>
  )
}
