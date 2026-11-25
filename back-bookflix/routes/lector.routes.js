const router = require('express').Router();
const c = require('../controlador/lector.controller');
const { verificarToken, requerirSuscripcion } = require('../middleware/auth');

router.use(verificarToken);
router.get('/preferencias', c.obtenerPreferencias);
router.put('/preferencias', requerirSuscripcion, c.guardarPreferencias);
router.get('/:id/fragmento/:n', c.fragmento);
router.post('/:id/lectura', c.registrarLectura);
router.get('/:id/punto', c.obtenerPunto);
router.put('/:id/punto', c.guardarPunto);

module.exports = router;
