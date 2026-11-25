// Crea en PayPal Sandbox el plan de $69 MXN/mes y el webhook.
//   node database/paypal-setup.js plan
//   node database/paypal-setup.js webhook https://TU-URL.ngrok-free.app
// Copia el ID que imprime al .env (PAYPAL_PLAN_ID / PAYPAL_WEBHOOK_ID).
const config = require('../config/config');
const paypal = require('../services/paypal.service');

const EVENTOS = [
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.EXPIRED',
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
  'PAYMENT.SALE.COMPLETED'
];

async function crearPlan() {
  const producto = await paypal.crearProducto({
    name: 'BookFlix Suscripción',
    description: 'Suscripción mensual a BookFlix',
    type: 'DIGITAL',
    category: 'DIGITAL_MEDIA_BOOKS_MOVIES_MUSIC'
  });
  const plan = await paypal.crearPlan({
    product_id: producto.id,
    name: 'BookFlix Mensual',
    description: 'Favoritos y colecciones ilimitados, historial y personalización del lector',
    status: 'ACTIVE',
    billing_cycles: [{
      frequency: { interval_unit: 'MONTH', interval_count: 1 },
      tenure_type: 'REGULAR',
      sequence: 1,
      total_cycles: 0,
      pricing_scheme: { fixed_price: { value: String(config.precioMxn), currency_code: 'MXN' } }
    }],
    payment_preferences: { auto_bill_outstanding: true, setup_fee_failure_action: 'CONTINUE', payment_failure_threshold: 3 }
  });
  console.log(`Plan creado. Agrega al .env:\nPAYPAL_PLAN_ID=${plan.id}`);
}

async function crearWebhook(urlPublica) {
  if (!urlPublica) throw new Error('Indica la URL pública de ngrok. Ej: node database/paypal-setup.js webhook https://abc.ngrok-free.app');
  const webhook = await paypal.crearWebhook({
    url: `${urlPublica.replace(/\/$/, '')}/api/webhooks/paypal`,
    event_types: EVENTOS.map((name) => ({ name }))
  });
  console.log(`Webhook creado. Agrega al .env:\nPAYPAL_WEBHOOK_ID=${webhook.id}`);
}

(async () => {
  const [accion, url] = process.argv.slice(2);
  if (accion === 'plan') await crearPlan();
  else if (accion === 'webhook') await crearWebhook(url);
  else console.log('Uso: node database/paypal-setup.js plan | webhook <url-ngrok>');
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
