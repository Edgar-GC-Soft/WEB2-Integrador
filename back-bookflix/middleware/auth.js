const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { AppError, asyncHandler } = require('./errores');
const suscripcionService = require('../services/suscripcion.service');

// Valida el token JWT y deja los datos del usuario en req.usuario
function verificarToken(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return next(new AppError('Debes iniciar sesión', 401, 'NO_AUTENTICADO'));
  }
  try {
    const datos = jwt.verify(token, config.jwt.secreto);
    req.usuario = { id: datos.id, rol: datos.rol };
    next();
  } catch (e) {
    next(new AppError('Tu sesión expiró. Inicia sesión de nuevo.', 401, 'TOKEN_INVALIDO'));
  }
}

// Ejemplo: requerirRol('administrador')
const requerirRol = (...roles) => (req, res, next) =>
  roles.includes(req.usuario.rol)
    ? next()
    : next(new AppError('No tienes permiso para esta acción', 403, 'SIN_PERMISO'));

// Funciones exclusivas de suscriptores (se verifica en la base de datos, no solo en el token)
const requerirSuscripcion = asyncHandler(async (req, res, next) => {
  const plan = await suscripcionService.obtenerPlan(req.usuario.id);
  if (!plan.esSuscriptor) {
    throw new AppError('Esta función es solo para suscriptores', 403, 'REQUIERE_SUSCRIPCION');
  }
  next();
});

module.exports = { verificarToken, requerirRol, requerirSuscripcion };
