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
// Los administradores siempre tienen los beneficios de suscriptor, sin pagar.
async function obtenerPlan(idUsuario) {
  const plan = await planSegunSuscripcion(idUsuario);
  const usuario = await usuarioModel.buscarPorId(idUsuario);
  if (usuario && usuario.rol === 'administrador') return { ...plan, esSuscriptor: true, esAdmin: true };
  return plan;
}

async function planSegunSuscripcion(idUsuario) {
  let sub = await suscripcionModel.buscarActualDeUsuario(idUsuario);
  if (!sub) return { esSuscriptor: false, estado: 'ninguna', fechaRenovacion: null, fechaFin: null };
  if (sub.estado === 'activa' && sub.fecha_fin && new Date(sub.fecha_fin) <= new Date()) {
    await suscripcionModel.actualizar(sub.id_suscripcion, { estado: 'expirada' });
    sub = { ...sub, estado: 'expirada' };
  }
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

function sumarUnMes(fecha) {
  const resultado = new Date(fecha);
  const dia = resultado.getDate();
  resultado.setDate(1);
  resultado.setMonth(resultado.getMonth() + 1);
  const ultimoDia = new Date(resultado.getFullYear(), resultado.getMonth() + 1, 0).getDate();
  resultado.setDate(Math.min(dia, ultimoDia));
  return resultado;
}

async function crearOrden(idUsuario) {
  const plan = await obtenerPlan(idUsuario);
  if (plan.esSuscriptor) throw new AppError('Ya tienes acceso activo a BookFlix', 409, 'SUSCRIPCION_ACTIVA');

  const orden = await paypal.crearOrden({
    intent: 'CAPTURE',
    purchase_units: [{
      custom_id: String(idUsuario),
      description: 'Acceso mensual a BookFlix',
      amount: { currency_code: 'MXN', value: Number(config.precioMxn).toFixed(2) }
    }],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: 'BookFlix',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: `${config.frontendUrl}/pago-paypal`,
          cancel_url: `${config.frontendUrl}/planes?paypal=cancel`
        }
      }
    }
  });
  const enlace = orden.links && orden.links.find((link) => ['payer-action', 'approve'].includes(link.rel));
  if (!orden.id || !enlace) {
    throw new AppError('PayPal no devolvió el enlace para completar el pago', 502, 'PAYPAL_ERROR');
  }
  await suscripcionModel.crear(idUsuario, orden.id);
  return { id: orden.id, total: config.precioMxn, urlPago: enlace.href };
}

async function capturarOrden(idUsuario, orderId) {
  if (!orderId) throw new AppError('Falta el identificador de la orden', 400, 'DATO_INVALIDO');
  const sub = await suscripcionModel.buscarPorPaypalId(orderId);
  if (!sub) throw new AppError('No se encontró la orden de pago', 404, 'ORDEN_NO_ENCONTRADA');
  if (String(sub.id_usuario) !== String(idUsuario)) {
    throw new AppError('La orden no pertenece a tu cuenta', 403, 'SIN_PERMISO');
  }
  if (sub.estado === 'activa') return obtenerPlan(idUsuario);
  if (sub.estado !== 'pendiente') throw new AppError('La orden ya no se puede procesar', 409, 'ORDEN_NO_PROCESABLE');

  const orden = await paypal.obtenerOrden(orderId);
  const unidadOrden = (orden.purchase_units || [])[0];
  if (orden.id !== orderId || String(unidadOrden && unidadOrden.custom_id) !== String(idUsuario)) {
    throw new AppError('La orden de PayPal no corresponde a tu cuenta', 409, 'PAGO_NO_VERIFICADO');
  }

  let resultado = orden;
  if (orden.status !== 'COMPLETED') {
    if (orden.status !== 'APPROVED') {
      throw new AppError('PayPal todavía no ha aprobado el pago', 409, 'PAGO_NO_APROBADO');
    }
    try {
      resultado = await paypal.capturarOrden(orderId);
    } catch (error) {
      const actualizado = await paypal.obtenerOrden(orderId);
      if (actualizado.status !== 'COMPLETED') throw error;
      resultado = actualizado;
    }
  }

  let unidad = (resultado.purchase_units || [])[0];
  let captura = (unidad && unidad.payments && unidad.payments.captures || [])
    .find((pago) => pago.status === 'COMPLETED');
  if (!captura && resultado.status === 'COMPLETED') {
    resultado = await paypal.obtenerOrden(orderId);
    unidad = (resultado.purchase_units || [])[0];
    captura = (unidad && unidad.payments && unidad.payments.captures || [])
      .find((pago) => pago.status === 'COMPLETED');
  }
  const montoValido = captura && captura.amount &&
    captura.amount.currency_code === 'MXN' &&
    Math.round(Number(captura.amount.value) * 100) === Math.round(Number(config.precioMxn) * 100);
  if (resultado.id !== orderId || resultado.status !== 'COMPLETED' || !montoValido) {
    throw new AppError('No se pudo verificar el monto y el estado del pago', 409, 'PAGO_NO_VERIFICADO');
  }

  const fechaInicio = aFecha(captura.create_time) || new Date();
  const pagoRegistrado = await suscripcionModel.registrarPago({
    idSuscripcion: sub.id_suscripcion,
    paypalPaymentId: captura.id,
    monto: captura.amount.value,
    moneda: captura.amount.currency_code,
    fecha: fechaInicio
  });
  await suscripcionModel.actualizar(sub.id_suscripcion, {
    estado: 'activa',
    fecha_inicio: fechaInicio,
    fecha_proxima_renovacion: null,
    fecha_fin: sumarUnMes(fechaInicio)
  });
  await sincronizarIndicador(idUsuario);
  if (pagoRegistrado) {
    const usuario = await usuarioModel.buscarPorId(idUsuario);
    await mail.enviarComprobante(usuario, captura.amount.value, captura.amount.currency_code, fechaInicio);
  }
  return obtenerPlan(idUsuario);
}

async function reanudarPagoPendiente(idUsuario) {
  const sub = await suscripcionModel.buscarActualDeUsuario(idUsuario);
  if (!sub || sub.estado !== 'pendiente') {
    return { plan: await obtenerPlan(idUsuario) };
  }

  const orden = await paypal.obtenerOrden(sub.paypal_subscription_id);
  if (['CREATED', 'PAYER_ACTION_REQUIRED'].includes(orden.status)) {
    const enlace = (orden.links || []).find((link) => ['payer-action', 'approve'].includes(link.rel));
    if (!enlace || !enlace.href) {
      throw new AppError('PayPal no devolvió el enlace para continuar el pago', 502, 'PAYPAL_ERROR');
    }
    return { urlPago: enlace.href };
  }
  if (orden.status === 'VOIDED') {
    await suscripcionModel.actualizar(sub.id_suscripcion, { estado: 'pago_fallido' });
    await sincronizarIndicador(idUsuario);
    return { plan: await obtenerPlan(idUsuario) };
  }
  return { plan: await capturarOrden(idUsuario, sub.paypal_subscription_id) };
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

// Al eliminar la cuenta: si hay una suscripcion recurrente activa en PayPal se cancela para que no se le siga cobrando
async function cancelarCobroRecurrente(idUsuario) {
  const sub = await suscripcionModel.buscarActualDeUsuario(idUsuario);
  if (sub && sub.estado === 'activa' && sub.fecha_proxima_renovacion) {
    await paypal.cancelarSuscripcion(sub.paypal_subscription_id, 'Cuenta eliminada por el usuario');
  }
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
    paypal: { disponible: Boolean(config.paypal.clientId && config.paypal.clientSecret) }
  };
}

module.exports = {
  obtenerPlan, crearOrden, capturarOrden, reanudarPagoPendiente, confirmar, cancelar, cancelarCobroRecurrente, procesarWebhook, infoPlanes
};
