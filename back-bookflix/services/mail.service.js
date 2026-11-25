const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('./logger');

let transporte = null;

function obtenerTransporte() {
  if (!config.correo.usuario || !config.correo.password) return null;
  if (!transporte) {
    transporte = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: config.correo.usuario, pass: config.correo.password }
    });
  }
  return transporte;
}

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fecha = (d) => new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

const plantilla = (titulo, cuerpo) =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#222">
     <h2 style="color:#1a56db">BookFlix</h2><h3>${titulo}</h3>${cuerpo}
     <hr><small>Este es un mensaje automático de BookFlix.</small></div>`;

// Nunca lanza error: si el correo falla, solo se registra en la bitacora y la plataforma sigue funcionando
async function enviar(para, asunto, html) {
  try {
    const t = obtenerTransporte();
    if (!t) {
      logger.info(`Correo NO enviado (SMTP sin configurar): "${asunto}" para ${para}`);
      return false;
    }
    await t.sendMail({ from: `"BookFlix" <${config.correo.usuario}>`, to: para, subject: asunto, html });
    return true;
  } catch (e) {
    logger.error(e);
    return false;
  }
}

const enviarBienvenida = (u) =>
  enviar(u.correo, 'Bienvenido a BookFlix', plantilla(`¡Hola, ${esc(u.nombre)}!`,
    '<p>Tu cuenta se creó correctamente. Ya puedes explorar el catálogo y leer libros desde tu navegador.</p>'));

const enviarComprobante = (u, monto, moneda, fechaPago) =>
  enviar(u.correo, 'Comprobante de pago - BookFlix', plantilla('Pago recibido',
    `<p>Recibimos tu pago de <b>$${Number(monto).toFixed(2)} ${esc(moneda)}</b> el ${fecha(fechaPago)}.</p>
     <p>Tu suscripción mensual de BookFlix está activa.</p>`));

const enviarAvisoRenovacion = (u, proximaFecha) =>
  enviar(u.correo, 'Tu suscripción se renovó - BookFlix', plantilla('Suscripción renovada',
    `<p>Tu suscripción mensual se renovó correctamente.${proximaFecha ? ` Tu próxima renovación es el ${fecha(proximaFecha)}.` : ''}</p>
     <p>Puedes cancelarla en cualquier momento desde tu perfil.</p>`));

const enviarAvisoCancelacion = (u, fechaFin) =>
  enviar(u.correo, 'Cancelaste tu suscripción - BookFlix', plantilla('Suscripción cancelada',
    `<p>Cancelaste tu suscripción. Conservas tus beneficios hasta el ${fecha(fechaFin)}.</p>
     <p>Después volverás al plan gratuito y conservarás tus favoritos y colecciones.</p>`));

function enviarRecuperacion(u, enlace) {
  if (!obtenerTransporte()) logger.info(`Enlace de recuperación (modo desarrollo): ${enlace}`);
  return enviar(u.correo, 'Recupera tu contraseña - BookFlix', plantilla('Recuperar contraseña',
    `<p>Hola, ${esc(u.nombre)}. Usa este enlace para crear una nueva contraseña. Vence en 1 hora y solo funciona una vez:</p>
     <p><a href="${enlace}">${enlace}</a></p><p>Si no lo solicitaste, ignora este mensaje.</p>`));
}

module.exports = { enviarBienvenida, enviarComprobante, enviarAvisoRenovacion, enviarAvisoCancelacion, enviarRecuperacion };
