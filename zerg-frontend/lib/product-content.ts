import type { Product } from "@/types";

// Textos generales de la página de producto. Cada producto puede reemplazarlos desde el panel.
export const DEFAULT_INCLUYE = [
  "Acceso completo durante el tiempo del plan elegido.",
  "Datos de acceso en tu cuenta (Mis accesos), tu correo y WhatsApp.",
  "Soporte y garantía de reemplazo sin costo.",
];

export const DEFAULT_PASOS = [
  { titulo: "Elige tu plan", texto: "Selecciona la duración que prefieras y agrégala al carrito." },
  { titulo: "Realiza el pago", texto: "Paga con Yape, Plin, transferencia o tarjeta de forma segura." },
  { titulo: "Recibe tu acceso", texto: "Te enviamos los datos de acceso a tu cuenta, correo y WhatsApp en minutos." },
  { titulo: "Disfruta", texto: "Ingresa desde tu TV, celular o computadora. Si algo falla, lo reemplazamos." },
];

export const DEFAULT_FAQS = [
  { pregunta: "¿Cuánto demora la entrega?", respuesta: "La mayoría de pedidos se entregan en menos de 10 minutos. En horas de alta demanda puede tardar hasta 1 hora." },
  { pregunta: "¿Qué pasa si la cuenta deja de funcionar?", respuesta: "Tienes garantía durante todo el plan: te damos un reemplazo sin costo adicional." },
  { pregunta: "¿Puedo usarla en varios dispositivos?", respuesta: "Sí, puedes ingresar desde TV, celular, tablet o computadora, respetando las pantallas de tu plan." },
  { pregunta: "¿Puedo renovar mi plan?", respuesta: "Claro. Te avisaremos antes del vencimiento para que renueves y conserves tu perfil." },
];

const filled = <T,>(list: T[] | null | undefined, fallback: T[]) => (list && list.length > 0 ? list : fallback);

export const productIncluye = (p: Product) => filled(p.incluye, DEFAULT_INCLUYE);
export const productPasos = (p: Product) => filled(p.pasos, DEFAULT_PASOS);
export const productFaqs = (p: Product) => filled(p.faqs, DEFAULT_FAQS);
