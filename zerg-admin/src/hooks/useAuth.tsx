"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import api from "@/lib/axios";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      api
        .get("/auth/profile", {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
        .then((res) => {
          const freshUser = res.data.data;
          if (freshUser.rol !== "ADMIN") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setIsLoading(false);
            return;
          }
          localStorage.setItem("user", JSON.stringify(freshUser));
          setUser(freshUser);
          setToken(savedToken);
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const { user: userData, token: newToken } = response.data.data;

    if (userData.rol !== "ADMIN") {
      throw new Error("No tienes permisos de administrador");
    }

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.location.replace("/login");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
