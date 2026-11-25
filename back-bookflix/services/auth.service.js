const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const usuarioModel = require('../models/usuario.model');
const mail = require('./mail.service');
const { AppError } = require('../middleware/errores');
const { esContrasenaValida, MSG_CONTRASENA } = require('../middleware/validar');

const sha256 = (texto) => crypto.createHash('sha256').update(texto).digest('hex');

async function registrar({ nombre, correo, contrasena }) {
  const correoLimpio = correo.trim().toLowerCase();
  if (await usuarioModel.buscarPorCorreo(correoLimpio)) {
    throw new AppError('Ese correo ya está registrado', 409, 'CORREO_DUPLICADO');
  }
  const hash = await bcrypt.hash(contrasena, 10);
  const id = await usuarioModel.crear({ nombre: nombre.trim(), correo: correoLimpio, hash });
  mail.enviarBienvenida({ nombre: nombre.trim(), correo: correoLimpio }); // no se espera: si falla no afecta el registro
  return id;
}

async function iniciarSesion({ correo, contrasena }) {
  const usuario = await usuarioModel.buscarPorCorreo(String(correo).trim().toLowerCase());
  const correcta = usuario && (await bcrypt.compare(contrasena, usuario.contrasena_hash));
  // Mensaje generico: no se revela si fallo el correo o la contrasena
  if (!correcta) throw new AppError('Correo o contraseña incorrectos', 401, 'CREDENCIALES_INVALIDAS');
  return jwt.sign({ id: usuario.id_usuario, rol: usuario.rol }, config.jwt.secreto, { expiresIn: config.jwt.expira });
}

// Siempre responde igual, exista o no el correo
async function solicitarRecuperacion(correo) {
  const usuario = await usuarioModel.buscarPorCorreo(String(correo || '').trim().toLowerCase());
  if (!usuario) return;
  const token = crypto.randomBytes(32).toString('hex');
  await usuarioModel.crearToken(usuario.id_usuario, sha256(token));
  mail.enviarRecuperacion(usuario, `${config.frontendUrl}/restablecer/${token}`);
}

async function restablecerContrasena(token, nueva) {
  if (!esContrasenaValida(nueva)) throw new AppError(MSG_CONTRASENA, 400, 'DATO_INVALIDO');
  const registro = await usuarioModel.buscarTokenVigente(sha256(String(token || '')));
  if (!registro) throw new AppError('El enlace no es válido o ya expiró. Solicita uno nuevo.', 400, 'TOKEN_INVALIDO');
  await usuarioModel.actualizarContrasena(registro.id_usuario, await bcrypt.hash(nueva, 10));
  await usuarioModel.marcarTokenUsado(registro.id_token);
}

async function cambiarContrasena(idUsuario, actual, nueva) {
  if (!esContrasenaValida(nueva)) throw new AppError(MSG_CONTRASENA, 400, 'DATO_INVALIDO');
  const usuario = await usuarioModel.buscarPorId(idUsuario);
  if (!usuario || !(await bcrypt.compare(String(actual || ''), usuario.contrasena_hash))) {
    throw new AppError('La contraseña actual no es correcta', 400, 'CREDENCIALES_INVALIDAS');
  }
  await usuarioModel.actualizarContrasena(idUsuario, await bcrypt.hash(nueva, 10));
}

module.exports = { registrar, iniciarSesion, solicitarRecuperacion, restablecerContrasena, cambiarContrasena };
