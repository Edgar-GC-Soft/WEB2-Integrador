const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/errores');

exports.registro = asyncHandler(async (req, res) => {
  await authService.registrar(req.body);
  res.status(201).json({ mensaje: 'Cuenta creada. Ya puedes iniciar sesión.' });
});

exports.login = asyncHandler(async (req, res) => {
  res.json({ token: await authService.iniciarSesion(req.body) });
});

exports.recuperar = asyncHandler(async (req, res) => {
  await authService.solicitarRecuperacion(req.body.correo);
  res.json({ mensaje: 'Si el correo está registrado, te enviamos un enlace para crear una nueva contraseña.' });
});

exports.restablecer = asyncHandler(async (req, res) => {
  await authService.restablecerContrasena(req.body.token, req.body.contrasena);
  res.json({ mensaje: 'Tu contraseña se actualizó. Ya puedes iniciar sesión.' });
});
