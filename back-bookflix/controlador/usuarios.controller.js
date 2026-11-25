const usuarioModel = require('../models/usuario.model');
const authService = require('../services/auth.service');
const suscripcionService = require('../services/suscripcion.service');
const { AppError, asyncHandler } = require('../middleware/errores');

exports.perfil = asyncHandler(async (req, res) => {
  const u = await usuarioModel.buscarPorId(req.usuario.id);
  if (!u) throw new AppError('Usuario no encontrado', 404, 'NO_ENCONTRADO');
  res.json({
    usuario: { id: u.id_usuario, nombre: u.nombre, correo: u.correo, rol: u.rol },
    plan: await suscripcionService.obtenerPlan(u.id_usuario)
  });
});

exports.actualizarPerfil = asyncHandler(async (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  if (nombre.length < 2 || nombre.length > 100) throw new AppError('Escribe un nombre válido', 400, 'DATO_INVALIDO');
  await usuarioModel.actualizarNombre(req.usuario.id, nombre);
  res.json({ mensaje: 'Perfil actualizado' });
});

exports.cambiarContrasena = asyncHandler(async (req, res) => {
  await authService.cambiarContrasena(req.usuario.id, req.body.actual, req.body.nueva);
  res.json({ mensaje: 'Contraseña actualizada' });
});

exports.eliminarCuenta = asyncHandler(async (req, res) => {
  await authService.eliminarCuenta(req.usuario.id, req.body.contrasena);
  res.json({ mensaje: 'Tu cuenta fue eliminada' });
});
