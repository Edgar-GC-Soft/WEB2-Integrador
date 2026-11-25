const router = require('express').Router();
const c = require('../controlador/suscripciones.controller');

router.post('/paypal', c.webhook); // sin token: la autenticidad se verifica con la firma de PayPal

module.exports = router;
