# Pagos y soporte

## Métodos de pago

| Método | Estado | Cómo se confirma |
|---|---|---|
| **Directo** (Yape, Plin, transferencia) | Activo | El cliente sube la captura y el n.º de operación; el admin confirma o rechaza en **Órdenes**. |
| **Tarjeta (Izipay)** | Listo, falta credenciales | Formulario incrustado de Izipay + IPN firmada (HMAC-SHA256). |
| **Binance Pay (USDT)** | Listo, falta credenciales | Orden en Binance Pay + webhook firmado (RSA-SHA256). |

Los métodos sin credenciales se muestran en la tienda como **Próximamente** y no se pueden elegir.
Los datos del pago directo (titular, Yape, Plin, QR, cuentas) y el tipo de cambio USDT se editan en el admin: **Contenido del sitio → Pagos**.

### Izipay (tarjetas)
1. Afiliar el negocio en izipay.pe y entrar al **Back Office Vendedor**.
2. *Configuración → Tienda → Claves de API REST*: copiar usuario, contraseña, clave pública y clave HMAC-SHA-256.
3. En `zerg-backend/.env`: `IZIPAY_USERNAME`, `IZIPAY_PASSWORD`, `IZIPAY_PUBLIC_KEY`, `IZIPAY_HMAC_KEY`.
4. Registrar la URL de notificación (IPN): `<BACKEND_PUBLIC_URL>/api/payments/webhooks/izipay`.
5. Probar con las claves de **test** antes de pasar a producción.

Alternativas si Izipay no conviene: **Culqi**, **Niubiz** o **Mercado Pago** (mismo patrón: token en el backend + webhook).

### Cripto
- **Binance Pay Merchant** (implementado): requiere cuenta de comercio verificada en merchant.binance.com.
  Variables: `BINANCE_PAY_API_KEY`, `BINANCE_PAY_SECRET`, `BACKEND_PUBLIC_URL` (para el webhook).
- Si no se consigue la cuenta de comercio, un **intermediario** acepta USDT y otras monedas sin KYB de Binance:
  **NOWPayments** (factura alojada + IPN HMAC-SHA512) o **Cryptomus**. Se agregan como un proveedor más en
  `zerg-backend/src/modules/payments/providers/` siguiendo el mismo patrón (crear cobro + webhook firmado).

> En local, los webhooks necesitan una URL pública: usar un túnel (ngrok, VS Code devtunnels) y ponerla en `BACKEND_PUBLIC_URL`.

## Soporte

- **Botón de ayuda** (abajo a la derecha en toda la tienda) con dos opciones:
  - **Chatear aquí**: el cliente (con o sin cuenta) elige un tema y escribe; llega a **Mensajes** en el admin, en vivo.
  - **Escribir por WhatsApp**: abre `wa.me` con un mensaje listo (número en *Contenido del sitio → Contacto y pie*).
- Desde el admin, si el cliente dejó su teléfono, **Continuar por WhatsApp** abre la conversación en WhatsApp.

### WhatsApp Business (Cloud API de Meta)
Con las variables `WHATSAPP_*` del backend, el panel **Mensajes** recibe y responde los chats de tu número de WhatsApp Business.

1. En [developers.facebook.com](https://developers.facebook.com) crea una app de tipo *Empresa* y agrega el producto **WhatsApp**.
2. Copia el **Phone Number ID** y genera un **token permanente** (Configuración del negocio → Usuarios del sistema).
   Ponlos en `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_TOKEN`.
3. En *Configuración de la app → Básica* copia la **clave secreta** → `WHATSAPP_APP_SECRET`.
4. Inventa un texto para `WHATSAPP_VERIFY_TOKEN` y registra el webhook en WhatsApp → Configuración:
   URL `<BACKEND_PUBLIC_URL>/api/whatsapp/webhook`, el mismo verify token, y suscribe el campo **messages**.
5. Reinicia el backend. En Mensajes verás "WhatsApp Business conectado".

**Regla de 24 h de Meta:** puedes responder con texto libre hasta 24 h después del último mensaje del cliente. Fuera de esa
ventana solo se envían **plantillas aprobadas**:
- `WHATSAPP_TEMPLATE_REPLY`: plantilla con `{{1}}` = texto de tu respuesta.
- `WHATSAPP_TEMPLATE_CREDENTIALS`: plantilla (categoría *Utilidad*) con `{{1}}` nombre, `{{2}}` n.º de pedido y `{{3}}` accesos.
  Ejemplo: *"Hola {{1}}, tus accesos del pedido {{2}} están listos: {{3}}. También los ves en Mi cuenta → Mis accesos."*

## Entrega de credenciales
En **Órdenes → Ver** está la sección **Accesos del cliente**: por cada producto llenas usuario/correo, contraseña, perfil,
PIN, enlace, vencimiento e indicaciones, y eliges por dónde enviarlos:
- **Mis accesos (web)**: el cliente los ve en *Mi cuenta → Mis accesos* (con botón copiar y contraseña oculta) y recibe un aviso.
- **Correo**: vía [Resend](https://resend.com) (`RESEND_API_KEY` y `EMAIL_FROM` de un dominio verificado).
- **WhatsApp Business**: texto completo si el cliente te escribió en las últimas 24 h; si no, la plantilla de credenciales.

Cada canal es independiente (si uno falla los otros se envían) y el pedido pasa a **Enviado**. Las credenciales se guardan
cifradas (AES-256-GCM) con `CREDENTIALS_KEY`; si cambias esa clave, las ya guardadas dejan de poder leerse.
