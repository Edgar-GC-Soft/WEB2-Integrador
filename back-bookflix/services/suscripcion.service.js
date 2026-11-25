const config = require('../config/config');
const suscripcionModel = require('../models/suscripcion.model');
const usuarioModel = require('../models/usuario.model');
const paypal = require('./paypal.service');
const mail = require('./mail.service');
const { AppError } = require('../middleware/errores');

const ESTADOS_PAYPAL = {
  ACTIVE: 'activa',
  APPROVAL_PENDING: 'pendiente',
  APPROVED: 'pendiente',
  SUSPENDED: 'pago_fallido',
  CANCELLED: 'cancelada',
  EXPIRED: 'expirada'
};

const aFecha = (valor) => (valor ? new Date(valor) : null);

// Plan actual del usuario. Es suscriptor si la suscripcion esta activa o si cancelo
// pero aun no termina el periodo que ya pago.
async function obtenerPlan(idUsuario) {
  const sub = await suscripcionModel.buscarActualDeUsuario(idUsuario);
  if (!sub) return { esSuscriptor: false, estado: 'ninguna', fechaRenovacion: null, fechaFin: null };
  const dentroDePeriodo = sub.fecha_fin && new Date(sub.fecha_fin) > new Date();
  const esSuscriptor = sub.estado === 'activa' || (['cancelada', 'pago_fallido', 'expirada'].includes(sub.estado) && !!dentroDePeriodo);
  return {
    esSuscriptor,
    estado: sub.estado,
    fechaRenovacion: sub.estado === 'activa' ? sub.fecha_proxima_renovacion : null,
    fechaFin: sub.fecha_fin
  };
}

async function sincronizarIndicador(idUsuario) {
  const plan = await obtenerPlan(idUsuario);
  await usuarioModel.actualizarIndicadorSuscripcion(idUsuario, plan.esSuscriptor);
}

// Aplica a la suscripcion local lo que PayPal dice de ella
async function aplicarEstadoPaypal(sub, datos) {
  const estado = ESTADOS_PAYPAL[datos.status] || sub.estado;
  const campos = { estado };
  if (estado === 'activa') {
    campos.fecha_inicio = sub.fecha_inicio || aFecha(datos.start_time) || new Date();
    campos.fecha_proxima_renovacion = aFecha(datos.billing_info && datos.billing_info.next_billing_time);
    campos.fecha_fin = null;
  }
  await suscripcionModel.actualizar(sub.id_suscripcion, campos);
  await sincronizarIndicador(sub.id_usuario);
}

// Se llama cuando el usuario aprueba el pago en PayPal. Se consulta a PayPal directamente
// (no se confia en lo que manda el navegador) y se verifica que la suscripcion sea de ese usuario.
async function confirmar(idUsuario, paypalId) {
  if (!paypalId) throw new AppError('Falta el identificador de la suscripción', 400, 'DATO_INVALIDO');
  const datos = await paypal.obtenerSuscripcion(paypalId);
  if (config.paypal.planId && datos.plan_id !== config.paypal.planId) {
    throw new AppError('La suscripción no corresponde al plan de BookFlix', 400, 'PLAN_INVALIDO');
  }
  if (String(datos.custom_id) !== String(idUsuario)) {
    throw new AppError('La suscripción no pertenece a tu cuenta', 403, 'SIN_PERMISO');
  }
  let sub = await suscripcionModel.buscarPorPaypalId(paypalId);
  if (!sub) {
    await suscripcionModel.crear(idUsuario, paypalId);
    sub = await suscripcionModel.buscarPorPaypalId(paypalId);
  }
  await aplicarEstadoPaypal(sub, datos);
  return obtenerPlan(idUsuario);
}

async function cancelar(idUsuario) {
  const sub = await suscripcionModel.buscarActualDeUsuario(idUsuario);
  if (!sub || sub.estado !== 'activa') {
    throw new AppError('No tienes una suscripción activa para cancelar', 400, 'SIN_SUSCRIPCION');
  }
  await paypal.cancelarSuscripcion(sub.paypal_subscription_id, 'Cancelada por el usuario');
  const fin = sub.fecha_proxima_renovacion || new Date();
  await suscripcionModel.actualizar(sub.id_suscripcion, { estado: 'cancelada', fecha_fin: fin });
  await sincronizarIndicador(idUsuario);
  const usuario = await usuarioModel.buscarPorId(idUsuario);
  mail.enviarAvisoCancelacion(usuario, fin);
  return obtenerPlan(idUsuario);
}

// ---------- Webhooks de PayPal ----------

// Si la suscripcion aun no existe en la base (el webhook llego antes que la confirmacion), se crea con custom_id
async function buscarOCrearSuscripcion(paypalId) {
  let sub = await suscripcionModel.buscarPorPaypalId(paypalId);
  if (sub) return sub;
  const datos = await paypal.obtenerSuscripcion(paypalId);
  const idUsuario = Number(datos.custom_id);
  if (!idUsuario || !(await usuarioModel.buscarPorId(idUsuario))) return null;
  await suscripcionModel.crear(idUsuario, paypalId);
  sub = await suscripcionModel.buscarPorPaypalId(paypalId);
  return sub;
}

async function registrarCobro(sub, recurso) {
  const pagosAntes = await suscripcionModel.contarPagos(sub.id_suscripcion);
  const fechaPago = aFecha(recurso.create_time) || new Date();
  const insertados = await suscripcionModel.registrarPago({
    idSuscripcion: sub.id_suscripcion,
    paypalPaymentId: recurso.id,
    monto: recurso.amount ? recurso.amount.total : config.precioMxn,
    moneda: recurso.amount ? recurso.amount.currency : 'MXN',
    fecha: fechaPago
  });
  if (!insertados) return; // pago repetido

  const detalles = await paypal.obtenerSuscripcion(sub.paypal_subscription_id).catch(() => ({ status: 'ACTIVE' }));
  await aplicarEstadoPaypal(sub, { ...detalles, status: 'ACTIVE' });

  const usuario = await usuarioModel.buscarPorId(sub.id_usuario);
  const proxima = aFecha(detalles.billing_info && detalles.billing_info.next_billing_time);
  mail.enviarComprobante(usuario, recurso.amount ? recurso.amount.total : config.precioMxn, recurso.amount ? recurso.amount.currency : 'MXN', fechaPago);
  if (pagosAntes > 0) mail.enviarAvisoRenovacion(usuario, proxima);
}

async function manejarEvento(tipo, sub, recurso) {
  switch (tipo) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED': {
      const detalles = await paypal.obtenerSuscripcion(sub.paypal_subscription_id).catch(() => ({ status: 'ACTIVE' }));
      await aplicarEstadoPaypal(sub, detalles);
      break;
    }
    case 'PAYMENT.SALE.COMPLETED':
      await registrarCobro(sub, recurso);
      break;
    case 'BILLING.SUBSCRIPTION.CANCELLED': {
      const yaCancelada = sub.estado === 'cancelada';
      const fin = sub.fecha_fin || sub.fecha_proxima_renovacion || new Date();
      await suscripcionModel.actualizar(sub.id_suscripcion, { estado: 'cancelada', fecha_fin: fin });
      await sincronizarIndicador(sub.id_usuario);
      if (!yaCancelada) mail.enviarAvisoCancelacion(await usuarioModel.buscarPorId(sub.id_usuario), fin);
      break;
    }
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      await suscripcionModel.actualizar(sub.id_suscripcion, { estado: 'expirada', fecha_fin: new Date() });
      await sincronizarIndicador(sub.id_usuario);
      break;
    case 'BILLING.SUBSCRIPTION.SUSPENDED':
    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      await suscripcionModel.actualizar(sub.id_suscripcion, { estado: 'pago_fallido' });
      await sincronizarIndicador(sub.id_usuario);
      break;
    default:
      break; // eventos que no nos interesan
  }
}

async function procesarWebhook(headers, evento) {
  if (!evento || !evento.id || !evento.event_type) throw new AppError('Webhook inválido', 400, 'WEBHOOK_INVALIDO');
  if (!(await paypal.verificarWebhook(headers, evento))) {
    throw new AppError('No se pudo verificar el webhook', 400, 'WEBHOOK_INVALIDO');
  }
  // Idempotencia: un evento ya procesado no se vuelve a procesar
  const previo = await suscripcionModel.buscarEvento(evento.id);
  if (previo && previo.procesado) return;
  if (!previo) await suscripcionModel.registrarEvento(evento.id, evento.event_type);

  const recurso = evento.resource || {};
  const paypalId = evento.event_type === 'PAYMENT.SALE.COMPLETED' ? recurso.billing_agreement_id : recurso.id;
  const sub = paypalId ? await buscarOCrearSuscripcion(paypalId) : null;
  if (sub) await manejarEvento(evento.event_type, sub, recurso);
  await suscripcionModel.marcarEventoProcesado(evento.id, sub ? sub.id_suscripcion : null);
}

function infoPlanes() {
  return {
    precio: config.precioMxn,
    moneda: 'MXN',
    paypal: { clientId: config.paypal.clientId, planId: config.paypal.planId }
  };
}

module.exports = { obtenerPlan, confirmar, cancelar, procesarWebhook, infoPlanes };
