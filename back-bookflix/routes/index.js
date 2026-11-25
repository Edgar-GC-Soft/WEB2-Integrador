const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./usuarios.routes'));
router.use('/suscripciones', require('./suscripciones.routes'));
router.use('/webhooks', require('./webhooks.routes'));
router.use('/libros', require('./libros.routes'));
router.use('/lector', require('./lector.routes'));
router.use('/biblioteca', require('./biblioteca.routes'));
router.use('/recomendaciones', require('./recomendaciones.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
