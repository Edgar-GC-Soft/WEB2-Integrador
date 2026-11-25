const router = require('express').Router();
const c = require('../controlador/recomendaciones.controller');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, c.obtener);

module.exports = router;
