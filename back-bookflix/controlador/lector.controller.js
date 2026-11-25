const lectorService = require('../services/lector.service');
const lecturaModel = require('../models/lectura.model');
const suscripcionService = require('../services/suscripcion.service');
const { asyncHandler, entero } = require('../middleware/errores');

exports.fragmento = asyncHandler(async (req, res) => {
  res.json(await lectorService.obtenerFragmento(entero(req.params.id), entero(req.params.n, 'fragmento'), req.usuario));
});

// Se llama una vez al abrir el libro: queda en el registro interno de lecturas (todos los usuarios)
exports.registrarLectura = asyncHandler(async (req, res) => {
  await lectorService.registrarLectura(req.usuario.id, entero(req.params.id));
  res.status(201).json({ registrado: true });
});

// Ultimo punto de lectura: solo se guarda y se devuelve a suscriptores
exports.obtenerPunto = asyncHandler(async (req, res) => {
  const plan = await suscripcionService.obtenerPlan(req.usuario.id);
  res.json({ punto: plan.esSuscriptor ? await lecturaModel.obtenerPunto(req.usuario.id, entero(req.params.id)) : 0 });
});

exports.guardarPunto = asyncHandler(async (req, res) => {
  const plan = await suscripcionService.obtenerPlan(req.usuario.id);
  if (!plan.esSuscriptor) return res.json({ guardado: false });
  await lecturaModel.guardarPunto(req.usuario.id, entero(req.params.id), entero(req.body.punto, 'punto'));
  res.json({ guardado: true });
});

exports.obtenerPreferencias = asyncHandler(async (req, res) => {
  const plan = await suscripcionService.obtenerPlan(req.usuario.id);
  res.json(await lectorService.obtenerPreferencias(req.usuario.id, plan.esSuscriptor));
});

exports.guardarPreferencias = asyncHandler(async (req, res) => {
  res.json(await lectorService.guardarPreferencias(req.usuario.id, req.body));
});
