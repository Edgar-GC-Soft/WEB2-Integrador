require('dotenv').config();

const sandbox = (process.env.PAYPAL_MODO || 'sandbox') === 'sandbox';

module.exports = {
  puerto: Number(process.env.PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  jwt: {
    secreto: process.env.JWT_SECRET || 'secreto_de_desarrollo',
    expira: process.env.JWT_EXPIRA || '24h'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bookflix'
  },
  limites: { favoritos: 5, colecciones: 2 },
  precioMxn: 69,
  fragmentoCaracteres: 2500,
  contactoApi: process.env.CONTACTO_API || 'contacto@bookflix.local',
  paypal: {
    urlBase: sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com',
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    planId: process.env.PAYPAL_PLAN_ID || '',
    webhookId: process.env.PAYPAL_WEBHOOK_ID || ''
  },
  correo: {
    usuario: process.env.CORREO_USUARIO || '',
    password: process.env.CORREO_PASSWORD_APP || ''
  },
  admin: {
    nombre: process.env.ADMIN_NOMBRE || 'Administrador',
    correo: process.env.ADMIN_CORREO || 'admin@bookflix.com',
    password: process.env.ADMIN_PASSWORD || 'Admin1234'
  }
};
