const router = require('express').Router();
const c = require('../controlador/libros.controller');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);
router.get('/categorias', c.categorias);
router.get('/', c.listar);
router.get('/:id', c.obtener);

module.exports = router;
