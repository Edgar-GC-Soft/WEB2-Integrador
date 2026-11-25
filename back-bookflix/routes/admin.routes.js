const router = require('express').Router();
const c = require('../controlador/admin.controller');
const { verificarToken, requerirRol } = require('../middleware/auth');

router.use(verificarToken, requerirRol('administrador'));
router.post('/importar', c.importar);
router.get('/libros', c.listar);
router.put('/libros/:id/estado', c.cambiarEstado);

module.exports = router;
