const bibliotecaModel = require('../models/biblioteca.model');
const lecturaModel = require('../models/lectura.model');
const bibliotecaService = require('../services/biblioteca.service');
const { asyncHandler, entero } = require('../middleware/errores');

// ----- Favoritos -----
exports.listarFavoritos = asyncHandler(async (req, res) => res.json(await bibliotecaModel.listarFavoritos(req.usuario.id)));

exports.agregarFavorito = asyncHandler(async (req, res) => {
  await bibliotecaService.agregarFavorito(req.usuario.id, entero(req.params.idLibro, 'idLibro'));
  res.status(201).json({ mensaje: 'Agregado a favoritos' });
});

exports.quitarFavorito = asyncHandler(async (req, res) => {
  await bibliotecaModel.quitarFavorito(req.usuario.id, entero(req.params.idLibro, 'idLibro'));
  res.json({ mensaje: 'Quitado de favoritos' });
});

// ----- Colecciones -----
exports.listarColecciones = asyncHandler(async (req, res) => res.json(await bibliotecaModel.listarColecciones(req.usuario.id)));

exports.crearColeccion = asyncHandler(async (req, res) => {
  res.status(201).json(await bibliotecaService.crearColeccion(req.usuario.id, req.body.nombre));
});

exports.obtenerColeccion = asyncHandler(async (req, res) => {
  res.json(await bibliotecaService.obtenerColeccion(req.usuario.id, entero(req.params.id)));
});

exports.renombrarColeccion = asyncHandler(async (req, res) => {
  await bibliotecaService.renombrarColeccion(req.usuario.id, entero(req.params.id), req.body.nombre);
  res.json({ mensaje: 'Colección renombrada' });
});

exports.eliminarColeccion = asyncHandler(async (req, res) => {
  await bibliotecaService.eliminarColeccion(req.usuario.id, entero(req.params.id));
  res.json({ mensaje: 'Colección eliminada' });
});

exports.agregarLibroAColeccion = asyncHandler(async (req, res) => {
  await bibliotecaService.agregarLibroAColeccion(req.usuario.id, entero(req.params.id), entero(req.params.idLibro, 'idLibro'));
  res.status(201).json({ mensaje: 'Libro agregado a la colección' });
});

exports.quitarLibroDeColeccion = asyncHandler(async (req, res) => {
  await bibliotecaService.quitarLibroDeColeccion(req.usuario.id, entero(req.params.id), entero(req.params.idLibro, 'idLibro'));
  res.json({ mensaje: 'Libro quitado de la colección' });
});

// ----- Historial (solo suscriptores, se protege en la ruta) -----
exports.historial = asyncHandler(async (req, res) => res.json(await lecturaModel.listarHistorial(req.usuario.id)));
