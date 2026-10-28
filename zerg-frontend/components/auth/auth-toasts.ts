import { toast } from "@/components/ui/toast";
import type { GoogleAuthResult } from "@/hooks/useAuth";
import type { User } from "@/types";

const firstName = (user: User) => user.nombre.split(" ")[0] || user.nombre;

// Avisos al terminar de ingresar o registrarse. Con Google, registro e ingreso son el mismo
// paso: si la cuenta ya existía se entra igual y se le cuenta al cliente qué pasó.
export function announceGoogle({ user, status }: GoogleAuthResult, from: "login" | "register") {
  if (status === "created") {
    toast.success(`¡Bienvenido, ${firstName(user)}!`, "Creamos tu cuenta con Google. Ya puedes comprar.");
  } else if (status === "linked") {
    toast.info("Vinculamos Google a tu cuenta", `Ya tenías una cuenta con ${user.email}. Desde ahora también puedes entrar con Google.`);
  } else if (from === "register") {
    toast.info("Ya tenías una cuenta", `Encontramos tu cuenta con ${user.email}, así que iniciamos tu sesión.`);
  } else {
    toast.success(`¡Hola de nuevo, ${firstName(user)}!`);
  }
}

export function announceLogin(user: User) {
  toast.success(`¡Hola de nuevo, ${firstName(user)}!`);
}

export function announceRegister(user: User) {
  toast.success(`¡Bienvenido, ${firstName(user)}!`, "Tu cuenta está lista. Ya puedes comprar.");
}
