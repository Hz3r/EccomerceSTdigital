import type { Block } from "./page.blocks.js";

// Plantillas de las páginas de ayuda. Se muestran mientras el admin no las personalice y sirven para
// "Restaurar plantilla". La tienda reemplaza {tienda}, {whatsapp}, {email} y {horario} con los datos
// de Contenido del sitio, así que siguen siendo correctas aunque cambies tu marca o tu número.

export interface PageTemplate {
  slug: string;
  titulo: string;
  resumen: string;
  bloques: Block[];
}

const comoComprar: PageTemplate = {
  slug: "como-comprar",
  titulo: "¿Cómo comprar?",
  resumen: "Compra en 4 pasos y recibe tus accesos en minutos. Aquí te explicamos todo, con videos.",
  bloques: [
    {
      tipo: "texto",
      texto:
        "Comprar en {tienda} es rápido y seguro. No necesitas escribirnos: eliges tu servicio, pagas desde tu celular y tus accesos llegan a tu cuenta, a tu correo y a tu WhatsApp.",
    },
    { tipo: "titulo", texto: "Compra en 4 pasos" },
    {
      tipo: "pasos",
      items: [
        { titulo: "Elige tu servicio", texto: "Busca el servicio (Netflix, Spotify, Canva…), elige el plan y la duración y toca **Añadir al carrito**." },
        { titulo: "Ingresa o crea tu cuenta", texto: "Puedes entrar con tu correo o con Google en un toque. Tu carrito se mantiene." },
        { titulo: "Paga como prefieras", texto: "Yape, Plin, transferencia, tarjeta o Binance Pay. Si pagas con Yape o Plin, sube la captura de la constancia desde tu galería o tomando una foto." },
        { titulo: "Recibe tus accesos", texto: "Cuando confirmamos el pago, tus accesos aparecen en **Mi cuenta → Mis accesos** y te los enviamos por correo y WhatsApp." },
      ],
    },
    { tipo: "aviso", variante: "exito", texto: "Confirmamos los pagos en pocos minutos dentro de nuestro horario de atención: {horario}." },
    { tipo: "titulo", texto: "Pagar con Yape o Plin" },
    {
      tipo: "texto",
      texto:
        "En la página de pago verás el número, el titular y el QR. Paga **el monto exacto** y escribe el código de tu pedido (por ejemplo, ORD-123…) en el mensaje.\n\n- Si estás en el mismo celular, toca **Descargar QR** y elígelo desde tu galería en la app.\n- Toma una captura de la constancia y súbela: el número de operación es opcional.",
    },
    { tipo: "titulo", texto: "¿Dónde veo mis accesos?" },
    {
      tipo: "texto",
      texto:
        "En **Mi cuenta → Mis accesos** verás usuario, contraseña, perfil y PIN de cada servicio, con un botón para copiarlos. La contraseña aparece oculta hasta que toques el ojo.",
    },
    { tipo: "boton", texto: "Ver productos", url: "/products" },
  ],
};

const preguntasFrecuentes: PageTemplate = {
  slug: "preguntas-frecuentes",
  titulo: "Preguntas frecuentes",
  resumen: "Respuestas rápidas sobre compras, pagos, entregas y garantía.",
  bloques: [
    {
      tipo: "faq",
      titulo: "Compras y pagos",
      items: [
        { pregunta: "¿Qué medios de pago aceptan?", respuesta: "Yape, Plin, transferencia bancaria y, cuando están activos, tarjeta (Izipay) y Binance Pay. Todos los medios disponibles aparecen al pagar tu pedido." },
        { pregunta: "¿Necesito una cuenta para comprar?", respuesta: "Sí. Puedes ver el catálogo sin cuenta, pero para comprar necesitas ingresar (con tu correo o con Google). Así tus pedidos y accesos quedan guardados en un solo lugar." },
        { pregunta: "¿Cuánto tardan en confirmar mi pago?", respuesta: "Normalmente unos minutos dentro de nuestro horario de atención ({horario}). La página de tu pedido se actualiza sola cuando lo confirmamos." },
        { pregunta: "Pagué un monto distinto, ¿qué hago?", respuesta: "Escríbenos por el chat de ayuda o por WhatsApp ({whatsapp}) con el código de tu pedido. Te ayudamos a completar o devolver la diferencia." },
      ],
    },
    {
      tipo: "faq",
      titulo: "Entregas y accesos",
      items: [
        { pregunta: "¿Cómo recibo mis accesos?", respuesta: "En **Mi cuenta → Mis accesos**, por correo y por WhatsApp. Te avisamos con una notificación en cuanto están listos." },
        { pregunta: "¿Puedo cambiar la contraseña de la cuenta?", respuesta: "No. Si el servicio es una cuenta compartida o un perfil, cambiar la contraseña, el correo o los perfiles anula la garantía. Sigue siempre las indicaciones que vienen con tus accesos." },
        { pregunta: "¿En cuántos dispositivos puedo usarlo?", respuesta: "Depende del plan. La cantidad de pantallas o dispositivos se indica en la descripción de cada plan." },
      ],
    },
    {
      tipo: "faq",
      titulo: "Garantía y soporte",
      items: [
        { pregunta: "¿Qué pasa si mi acceso deja de funcionar?", respuesta: "Tu compra tiene garantía durante todo el plan. Escríbenos y lo solucionamos o lo reemplazamos sin costo. Revisa la página de Garantía y reemplazos." },
        { pregunta: "¿Cómo los contacto?", respuesta: "Con el botón de ayuda de la tienda, por WhatsApp ({whatsapp}) o por correo ({email}). Horario: {horario}." },
      ],
    },
  ],
};

const garantia: PageTemplate = {
  slug: "garantia",
  titulo: "Garantía y reemplazos",
  resumen: "Tu servicio funciona durante todo el plan. Si algo falla, lo solucionamos.",
  bloques: [
    { tipo: "texto", texto: "Todas las compras en {tienda} tienen **garantía durante todo el periodo contratado**. Si tu acceso deja de funcionar por una causa que no depende de ti, lo reparamos o lo reemplazamos sin costo." },
    { tipo: "titulo", texto: "¿Qué cubre la garantía?" },
    {
      tipo: "texto",
      texto:
        "- Accesos que dejan de funcionar o piden una contraseña distinta.\n- Perfiles o pantallas que no corresponden a tu plan.\n- Servicios que no se activaron después de confirmar tu pago.",
    },
    { tipo: "titulo", texto: "¿Qué no cubre?" },
    {
      tipo: "texto",
      texto:
        "- Cambiar la contraseña, el correo, el plan o los perfiles de la cuenta.\n- Compartir los accesos con otras personas o usarlos en más dispositivos de los permitidos.\n- Bloqueos o cambios de políticas del proveedor del servicio provocados por un mal uso.\n- Problemas de tu dispositivo o de tu conexión a internet.",
    },
    { tipo: "titulo", texto: "Cómo pedir un reemplazo" },
    {
      tipo: "pasos",
      items: [
        { titulo: "Escríbenos", texto: "Por el botón de ayuda o por WhatsApp ({whatsapp}) con el código de tu pedido." },
        { titulo: "Cuéntanos qué pasa", texto: "Una captura del error nos ayuda a resolverlo más rápido." },
        { titulo: "Lo solucionamos", texto: "Reparamos o reemplazamos tu acceso, normalmente en menos de 24 horas dentro de nuestro horario ({horario}). Los nuevos datos aparecen en Mis accesos." },
      ],
    },
    { tipo: "titulo", texto: "Devoluciones" },
    { tipo: "texto", texto: "Si no podemos entregar tu servicio o reemplazarlo dentro de un plazo razonable, te devolvemos el dinero proporcional al tiempo que no pudiste usar, por el mismo medio de pago." },
    { tipo: "aviso", variante: "info", texto: "Tus derechos como consumidor están protegidos por el Código de Protección y Defensa del Consumidor (Ley N.º 29571)." },
  ],
};

const terminos: PageTemplate = {
  slug: "terminos",
  titulo: "Términos y condiciones",
  resumen: "Las reglas de uso de la tienda y de los servicios que compras.",
  bloques: [
    { tipo: "texto", texto: "Al comprar en {tienda} aceptas estos términos. Léelos con calma; si tienes dudas, escríbenos a {email}." },
    { tipo: "titulo", texto: "1. Qué vendemos" },
    { tipo: "texto", texto: "{tienda} vende acceso a servicios digitales de terceros (streaming, música, software, IA y otros) por el periodo indicado en cada plan. Las marcas pertenecen a sus respectivos dueños; {tienda} no está afiliada a ellas." },
    { tipo: "titulo", texto: "2. Cuenta y compras" },
    { tipo: "texto", texto: "- Para comprar debes crear una cuenta con datos verdaderos y mantener tu contraseña en secreto.\n- Los precios están en soles (S/) e incluyen los impuestos aplicables.\n- Un pedido se confirma cuando verificamos el pago completo." },
    { tipo: "titulo", texto: "3. Entrega" },
    { tipo: "texto", texto: "Entregamos los accesos en tu cuenta, por correo y por WhatsApp, normalmente en minutos después de confirmar el pago y dentro de nuestro horario ({horario})." },
    { tipo: "titulo", texto: "4. Uso correcto" },
    { tipo: "texto", texto: "- Usa los accesos solo en la cantidad de dispositivos de tu plan.\n- No cambies contraseñas, correos, perfiles ni datos de la cuenta.\n- No revendas ni compartas los accesos.\n\nEl mal uso anula la garantía y puede llevar a la cancelación del servicio sin reembolso." },
    { tipo: "titulo", texto: "5. Garantía y reembolsos" },
    { tipo: "texto", texto: "Las condiciones de garantía, reemplazos y devoluciones están en la página [Garantía y reemplazos](/ayuda/garantia)." },
    { tipo: "titulo", texto: "6. Cambios en los servicios" },
    { tipo: "texto", texto: "Los proveedores pueden cambiar sus precios, catálogos o condiciones. Si un cambio impide seguir dando el servicio, te ofreceremos un reemplazo equivalente o la devolución proporcional." },
    { tipo: "titulo", texto: "7. Reclamos" },
    { tipo: "texto", texto: "Puedes presentar un reclamo escribiendo a {email}. Te responderemos en un plazo máximo de 15 días hábiles, según la normativa peruana de protección al consumidor." },
    { tipo: "titulo", texto: "8. Cambios a estos términos" },
    { tipo: "texto", texto: "Podemos actualizar estos términos. La versión vigente es la publicada en esta página; las compras ya realizadas se rigen por los términos vigentes al momento de comprar." },
  ],
};

const privacidad: PageTemplate = {
  slug: "privacidad",
  titulo: "Política de privacidad",
  resumen: "Qué datos guardamos, para qué los usamos y cómo los protegemos.",
  bloques: [
    { tipo: "texto", texto: "En {tienda} cuidamos tus datos personales conforme a la Ley N.º 29733, Ley de Protección de Datos Personales, y su reglamento." },
    { tipo: "titulo", texto: "Datos que recopilamos" },
    { tipo: "texto", texto: "- **Cuenta:** nombre, correo y, si ingresas con Google, tu foto de perfil.\n- **Pedidos:** productos comprados, número de WhatsApp (si lo das) y notas.\n- **Pagos:** medio de pago, número de operación y la captura del comprobante. **No guardamos datos de tarjetas**: los procesa la pasarela de pago.\n- **Soporte:** los mensajes que nos envías por el chat o WhatsApp." },
    { tipo: "titulo", texto: "Para qué los usamos" },
    { tipo: "texto", texto: "- Procesar tus pedidos y confirmar tus pagos.\n- Entregarte tus accesos y avisarte de cambios en tus pedidos.\n- Atender tus consultas y reclamos.\n- Enviarte novedades y ofertas, solo si te suscribiste al boletín (puedes darte de baja cuando quieras)." },
    { tipo: "titulo", texto: "Cómo los protegemos" },
    { tipo: "texto", texto: "Las contraseñas se guardan cifradas, los accesos que te entregamos se almacenan cifrados y los comprobantes de pago solo los ve nuestro equipo. No vendemos ni alquilamos tus datos." },
    { tipo: "titulo", texto: "Con quién los compartimos" },
    { tipo: "texto", texto: "Solo con proveedores que necesitamos para funcionar (pasarelas de pago, envío de correos y WhatsApp Business), y únicamente con los datos indispensables para cada tarea." },
    { tipo: "titulo", texto: "Tus derechos" },
    { tipo: "texto", texto: "Puedes pedir acceder, corregir o eliminar tus datos, u oponerte a su uso, escribiendo a {email}. Te responderemos en los plazos que establece la ley." },
    { tipo: "aviso", variante: "info", texto: "Si tienes preguntas sobre esta política, escríbenos a {email}." },
  ],
};

export const PAGE_TEMPLATES: PageTemplate[] = [comoComprar, preguntasFrecuentes, garantia, terminos, privacidad];
export const FIXED_SLUGS = PAGE_TEMPLATES.map((t) => t.slug);
export const templateFor = (slug: string) => PAGE_TEMPLATES.find((t) => t.slug === slug);

/** Contenido inicial de una guía nueva del blog "¿Cómo comprar?". */
export const GUIDE_STARTER: Block[] = [
  { tipo: "texto", texto: "Cuéntale al cliente en una o dos líneas qué va a aprender en esta guía." },
  { tipo: "pasos", items: [
    { titulo: "Primer paso", texto: "Explica qué tiene que hacer." },
    { titulo: "Segundo paso", texto: "Agrega una captura o un video si ayuda." },
  ] },
  { tipo: "aviso", variante: "info", texto: "¿Dudas? Escríbenos por WhatsApp al {whatsapp}." },
];
