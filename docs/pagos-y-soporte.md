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

### Conectar el chat con WhatsApp (siguiente fase, recomendado)
Para que lo que escribes en el panel llegue al WhatsApp del cliente (y al revés) hace falta la **WhatsApp Business
Cloud API** de Meta (número dedicado, verificación del negocio y plantillas para escribir después de 24 h).
Opciones:
- **Directo con Meta** (sin costo de plataforma, solo las tarifas por conversación de Meta).
- **Proveedor (BSP)**: 360dialog, Twilio u otros, que simplifican el alta a cambio de una tarifa mensual.

El modelo de datos ya lo contempla (`Conversation.canal = WHATSAPP`): el webhook de WhatsApp crearía o continuaría la
conversación y la respuesta del admin se enviaría por la API en lugar de quedar solo en la web.
