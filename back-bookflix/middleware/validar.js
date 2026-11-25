const { AppError } = require('./errores');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esCorreoValido = (c) => typeof c === 'string' && REGEX_CORREO.test(c.trim());
// Minimo 8 caracteres, con letras y numeros
const esContrasenaValida = (p) => typeof p === 'string' && p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
const MSG_CONTRASENA = 'La contraseña debe tener al menos 8 caracteres, con letras y números';

function validarRegistro(req, res, next) {
  const { nombre, correo, contrasena, aceptaPrivacidad, mayorEdad } = req.body;
  if (!nombre || String(nombre).trim().length < 2) return next(new AppError('Escribe tu nombre', 400, 'DATO_INVALIDO'));
  if (!esCorreoValido(correo)) return next(new AppError('El correo no tiene un formato válido', 400, 'DATO_INVALIDO'));
  if (!esContrasenaValida(contrasena)) return next(new AppError(MSG_CONTRASENA, 400, 'DATO_INVALIDO'));
  if (aceptaPrivacidad !== true) return next(new AppError('Debes aceptar el aviso de privacidad y los términos', 400, 'DATO_INVALIDO'));
  if (mayorEdad !== true) return next(new AppError('Debes confirmar que eres mayor de 18 años', 400, 'DATO_INVALIDO'));
  next();
}

function validarLogin(req, res, next) {
  const { correo, contrasena } = req.body;
  if (!correo || !contrasena) return next(new AppError('Escribe tu correo y contraseña', 400, 'DATO_INVALIDO'));
  next();
}

module.exports = { esCorreoValido, esContrasenaValida, MSG_CONTRASENA, validarRegistro, validarLogin };
