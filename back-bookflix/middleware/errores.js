const logger = require('../services/logger');

class AppError extends Error {
  constructor(mensaje, estado = 400, codigo = 'ERROR') {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
  }
}

// Permite usar async/await en los controladores sin try/catch
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function entero(valor, nombre = 'id') {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 0) throw new AppError(`El valor de "${nombre}" no es válido`, 400, 'DATO_INVALIDO');
  return n;
}

function noEncontrado(req, res) {
  res.status(404).json({ mensaje: 'Ruta no encontrada', codigo: 'NO_ENCONTRADO' });
}

// Formato uniforme de errores: { mensaje, codigo }
function manejarErrores(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo de la petición no es un JSON válido', codigo: 'JSON_INVALIDO' });
  }
  if (!(err instanceof AppError)) logger.error(err);
  const estado = err instanceof AppError ? err.estado : 500;
  res.status(estado).json({
    mensaje: err instanceof AppError ? err.message : 'Error interno del servidor',
    codigo: err instanceof AppError ? err.codigo : 'ERROR_INTERNO'
  });
}

module.exports = { AppError, asyncHandler, entero, noEncontrado, manejarErrores };
