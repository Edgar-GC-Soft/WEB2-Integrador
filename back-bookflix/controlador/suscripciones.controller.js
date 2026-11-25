const suscripcionService = require('../services/suscripcion.service');
const { asyncHandler } = require('../middleware/errores');

exports.planes = (req, res) => res.json(suscripcionService.infoPlanes());

exports.estado = asyncHandler(async (req, res) => {
  res.json(await suscripcionService.obtenerPlan(req.usuario.id));
});

exports.crearOrden = asyncHandler(async (req, res) => {
  res.status(201).json(await suscripcionService.crearOrden(req.usuario.id));
});

exports.capturarOrden = asyncHandler(async (req, res) => {
  res.json(await suscripcionService.capturarOrden(req.usuario.id, req.params.orderId));
});

exports.reanudarPagoPendiente = asyncHandler(async (req, res) => {
  res.json(await suscripcionService.reanudarPagoPendiente(req.usuario.id));
});

exports.confirmar = asyncHandler(async (req, res) => {
  res.json(await suscripcionService.confirmar(req.usuario.id, req.body.suscripcionId));
});

exports.cancelar = asyncHandler(async (req, res) => {
  res.json(await suscripcionService.cancelar(req.usuario.id));
});

// PayPal envia aqui los avisos (webhooks). Si algo falla responde con error para que PayPal reintente.
exports.webhook = asyncHandler(async (req, res) => {
  await suscripcionService.procesarWebhook(req.headers, req.body);
  res.status(200).json({ recibido: true });
});
