const config = require('../config/config');
const logger = require('./logger');
const { AppError } = require('../middleware/errores');

const base = config.paypal.urlBase;
let cache = { token: null, expira: 0 };

// Si PayPal no responde, se informa al usuario sin afectar el resto de la plataforma
async function peticion(url, opciones) {
  try {
    return await fetch(url, { ...opciones, signal: AbortSignal.timeout(15000) });
  } catch (e) {
    logger.error(e);
    throw new AppError('PayPal no está disponible por ahora. Intenta más tarde.', 503, 'PAYPAL_NO_DISPONIBLE');
  }
}

async function obtenerToken() {
  if (cache.token && Date.now() < cache.expira) return cache.token;
  if (!config.paypal.clientId || !config.paypal.clientSecret) {
    throw new AppError('PayPal no está configurado en el servidor', 503, 'PAYPAL_NO_CONFIGURADO');
  }
  const credenciales = Buffer.from(`${config.paypal.clientId}:${config.paypal.clientSecret}`).toString('base64');
  const resp = await peticion(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credenciales}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    logger.error(new Error(`PayPal token: ${resp.status} ${JSON.stringify(datos)}`));
    throw new AppError('No se pudo autenticar con PayPal', 503, 'PAYPAL_NO_DISPONIBLE');
  }
  cache = { token: datos.access_token, expira: Date.now() + (datos.expires_in - 60) * 1000 };
  return cache.token;
}

async function api(metodo, ruta, cuerpo) {
  const token = await obtenerToken();
  const resp = await peticion(`${base}${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  const texto = await resp.text();
  let datos = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch (e) { datos = null; }
  if (!resp.ok) {
    logger.error(new Error(`PayPal ${metodo} ${ruta} -> ${resp.status} ${texto}`));
    throw new AppError('PayPal rechazó la operación', resp.status >= 500 ? 503 : 400, 'PAYPAL_ERROR');
  }
  return datos;
}

const obtenerSuscripcion = (id) => api('GET', `/v1/billing/subscriptions/${encodeURIComponent(id)}`);
const cancelarSuscripcion = (id, motivo) => api('POST', `/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`, { reason: motivo });
const crearOrden = (cuerpo) => api('POST', '/v2/checkout/orders', cuerpo);
const obtenerOrden = (id) => api('GET', `/v2/checkout/orders/${encodeURIComponent(id)}`);
const capturarOrden = (id) => api('POST', `/v2/checkout/orders/${encodeURIComponent(id)}/capture`);

// Verifica que el webhook realmente venga de PayPal
async function verificarWebhook(headers, evento) {
  if (!config.paypal.webhookId) {
    logger.error(new Error('Falta PAYPAL_WEBHOOK_ID en el .env: no se puede verificar el webhook'));
    return false;
  }
  const datos = await api('POST', '/v1/notifications/verify-webhook-signature', {
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: config.paypal.webhookId,
    webhook_event: evento
  });
  return datos && datos.verification_status === 'SUCCESS';
}

// Usadas por database/paypal-setup.js
const crearProducto = (cuerpo) => api('POST', '/v1/catalogs/products', cuerpo);
const crearPlan = (cuerpo) => api('POST', '/v1/billing/plans', cuerpo);
const crearWebhook = (cuerpo) => api('POST', '/v1/notifications/webhooks', cuerpo);

module.exports = {
  obtenerSuscripcion, cancelarSuscripcion, verificarWebhook, crearProducto, crearPlan, crearWebhook,
  crearOrden, obtenerOrden, capturarOrden
};
