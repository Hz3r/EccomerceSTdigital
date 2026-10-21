"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import api from "@/lib/axios";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (nombre: string, email: string, password: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<GoogleAuthResult>;
  logout: () => void;
}

// Resultado de "Continuar con Google": cuenta nueva, cuenta que ya existía o cuenta con contraseña vinculada a Google.
export type GoogleAuthStatus = "created" | "existing" | "linked";
export interface GoogleAuthResult {
  user: User;
  status: GoogleAuthStatus;
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
          if (freshUser.rol !== "CLIENTE") {
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

  const startSession = useCallback((userData: User, newToken: string) => {
    if (userData.rol !== "CLIENTE") {
      throw new Error("Esta cuenta es de administrador: ingresa desde el panel admin");
    }
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post("/auth/login", { email, password });
      startSession(response.data.data.user, response.data.data.token);
      return response.data.data.user as User;
    },
    [startSession]
  );

  const register = useCallback(
    async (nombre: string, email: string, password: string) => {
      const response = await api.post("/auth/register", { nombre, email, password });
      startSession(response.data.data.user, response.data.data.token);
      return response.data.data.user as User;
    },
    [startSession]
  );

  // Ingreso o registro con Google: el backend verifica el token y crea o vincula la cuenta.
  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const response = await api.post("/auth/google", { credential });
      const { user: userData, token: newToken, status } = response.data.data;
      startSession(userData, newToken);
      return { user: userData as User, status: (status ?? "existing") as GoogleAuthStatus };
    },
    [startSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.google?.accounts.id.disableAutoSelect();
    window.location.replace("/");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, loginWithGoogle, logout }}>
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
