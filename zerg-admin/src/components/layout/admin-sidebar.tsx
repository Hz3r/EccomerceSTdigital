"use client";

import { useState, createContext, useContext } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar-content";

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  open: false,
  setOpen: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function AdminSidebar({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
      {/* Desktop Sidebar - Fixed */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar - Sheet */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-64 bg-sidebar p-0"
          >
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <SidebarContent onLinkClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </SidebarContext.Provider>
  );
}
