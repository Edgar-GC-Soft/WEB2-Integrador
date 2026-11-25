const router = require('express').Router();
const c = require('../controlador/biblioteca.controller');
const { verificarToken, requerirSuscripcion } = require('../middleware/auth');

router.use(verificarToken);

router.get('/favoritos', c.listarFavoritos);
router.post('/favoritos/:idLibro', c.agregarFavorito);
router.delete('/favoritos/:idLibro', c.quitarFavorito);

router.get('/colecciones', c.listarColecciones);
router.post('/colecciones', c.crearColeccion);
router.get('/colecciones/:id', c.obtenerColeccion);
router.put('/colecciones/:id', c.renombrarColeccion);
router.delete('/colecciones/:id', c.eliminarColeccion);
router.post('/colecciones/:id/libros/:idLibro', c.agregarLibroAColeccion);
router.delete('/colecciones/:id/libros/:idLibro', c.quitarLibroDeColeccion);

router.get('/historial', requerirSuscripcion, c.historial);

module.exports = router;
