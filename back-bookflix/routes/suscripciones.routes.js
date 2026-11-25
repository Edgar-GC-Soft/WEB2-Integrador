const router = require('express').Router();
const c = require('../controlador/suscripciones.controller');
const { verificarToken } = require('../middleware/auth');

router.get('/planes', c.planes); // publica: los visitantes tambien pueden ver los planes
router.get('/estado', verificarToken, c.estado);
router.post('/confirmar', verificarToken, c.confirmar);
router.post('/cancelar', verificarToken, c.cancelar);

module.exports = router;
