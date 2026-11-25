const router = require('express').Router();
const c = require('../controlador/usuarios.controller');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);
router.get('/perfil', c.perfil);
router.put('/perfil', c.actualizarPerfil);
router.put('/contrasena', c.cambiarContrasena);
router.delete('/cuenta', c.eliminarCuenta);

module.exports = router;
