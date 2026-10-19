"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getCategories } from "@/lib/api";
import { mockCategories } from "@/lib/mock-data";
import { defaultSettings, getSiteSettings, type SiteSettings } from "@/lib/site-settings";
import type { Category } from "@/types";

interface SiteContextType {
  settings: SiteSettings;
  categories: Category[];
}

const SiteContext = createContext<SiteContextType>({ settings: defaultSettings, categories: mockCategories });

// Carga una vez el contenido del sitio y las categorías para el header, la portada y el pie.
export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<SiteContextType>({ settings: defaultSettings, categories: mockCategories });

  useEffect(() => {
    Promise.all([getSiteSettings(), getCategories().catch(() => mockCategories)]).then(([settings, categories]) =>
      setValue({ settings, categories: categories.filter((c) => c.isActive) })
    );
  }, []);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}
