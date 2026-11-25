const recomendacionService = require('../services/recomendacion.service');
const { asyncHandler } = require('../middleware/errores');

exports.obtener = asyncHandler(async (req, res) => {
  res.json(await recomendacionService.obtenerParaUsuario(req.usuario.id));
});
