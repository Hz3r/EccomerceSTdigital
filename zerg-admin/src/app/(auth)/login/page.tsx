"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MailIcon, Store } from "lucide-react";
import Image from "next/image";
import { PasswordInput } from "@/components/ui/password-imput";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      window.location.replace("/");
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      window.location.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#2d59db] p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 z-0 pointer-events-none opacity-40 md:opacity-60">
        <Image
          src={'/images/background-login.png'}
          alt=""
          width={500}
          height={500}
          className="object-contain"
          priority
        />
      </div>
      <div className="absolute bottom-0 left-0 z-0 pointer-events-none opacity-40 md:opacity-60">
        <Image
          alt=""
          src={'/images/Ellipse.png'}
          width={250}
          height={250}
          className="object-contain"
          priority
        />
      </div>
      <Card className="w-full max-w-md bg-transparent z-10 xt-white border-none shadow-none ring-0">
        <CardHeader className="text-center">
          <Store className="mx-auto h-24 w-24" color="white" />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="relative">

              <MailIcon className="absolute left-2 top-2 h-4 w-4 text-white" />

              <Input
                id="email"
                type="email"
                placeholder="email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="placeholder:text-white pl-7 text-white"
              />
            </div>

            <div className="relative">

              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className=" text-white   placeholder:text-white" />
            </div>

            <Button type="submit" className="w-full bg-white text-[#2148C0] hover:bg-white/80 border-none rounded-sm" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "LOGIN"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
