const router = require('express').Router();
const c = require('../controlador/auth.controller');
const { validarRegistro, validarLogin } = require('../middleware/validar');

router.post('/registro', validarRegistro, c.registro);
router.post('/login', validarLogin, c.login);
router.post('/recuperar', c.recuperar);
router.post('/restablecer', c.restablecer);

module.exports = router;
