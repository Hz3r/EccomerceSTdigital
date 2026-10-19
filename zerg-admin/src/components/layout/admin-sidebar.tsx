"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar-content";

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  open: false,
  setOpen: () => {},
  collapsed: false,
  toggleCollapsed: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

const EVENT = "zerg-admin-sidebar";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

const isCollapsed = () => document.documentElement.dataset.sidebar === "collapsed";

export function AdminSidebar({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  // El estado vive en <html data-sidebar> (lo fija un script antes de pintar) para no parpadear.
  const collapsed = useSyncExternalStore(subscribe, isCollapsed, () => false);

  const toggleCollapsed = () => {
    const next = isCollapsed() ? "expanded" : "collapsed";
    document.documentElement.dataset.sidebar = next;
    try {
      localStorage.setItem("admin-sidebar", next);
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <SidebarContext.Provider value={{ open, setOpen, collapsed, toggleCollapsed }}>
      {children}
      {/* Escritorio y tablet: fijo, ancho completo o compacto (solo íconos) */}
      <aside className="rail hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col collapsed:md:w-[72px]">
        <SidebarContent />
      </aside>

      {/* Móvil: panel deslizable con el menú completo */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" showCloseButton={false} className="w-72 bg-sidebar p-0">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <SidebarContent onLinkClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </SidebarContext.Provider>
  );
}
