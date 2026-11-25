const config = require('../config/config');
const bibliotecaModel = require('../models/biblioteca.model');
const libroModel = require('../models/libro.model');
const suscripcionService = require('./suscripcion.service');
const { AppError } = require('../middleware/errores');

async function exigirLibroActivo(idLibro) {
  const libro = await libroModel.obtenerPorId(idLibro);
  if (!libro || !libro.activo) throw new AppError('El libro no existe o no está disponible', 404, 'LIBRO_NO_ENCONTRADO');
}

async function exigirColeccion(idUsuario, idColeccion) {
  const coleccion = await bibliotecaModel.obtenerColeccion(idUsuario, idColeccion);
  if (!coleccion) throw new AppError('La colección no existe', 404, 'COLECCION_NO_ENCONTRADA');
  return coleccion;
}

function limpiarNombre(nombre) {
  const limpio = String(nombre || '').trim();
  if (!limpio || limpio.length > 100) throw new AppError('El nombre de la colección debe tener entre 1 y 100 caracteres', 400, 'DATO_INVALIDO');
  return limpio;
}

// ---------- Favoritos (limite de 5 en el plan gratuito) ----------
async function agregarFavorito(idUsuario, idLibro) {
  await exigirLibroActivo(idLibro);
  if (await bibliotecaModel.existeFavorito(idUsuario, idLibro)) return;
  const plan = await suscripcionService.obtenerPlan(idUsuario);
  if (!plan.esSuscriptor && (await bibliotecaModel.contarFavoritos(idUsuario)) >= config.limites.favoritos) {
    throw new AppError(`Llegaste al límite de ${config.limites.favoritos} favoritos del plan gratuito. Suscríbete para agregar más.`, 403, 'LIMITE_PLAN');
  }
  await bibliotecaModel.agregarFavorito(idUsuario, idLibro);
}

// ---------- Colecciones (limite de 2 en el plan gratuito) ----------
async function crearColeccion(idUsuario, nombre) {
  const limpio = limpiarNombre(nombre);
  const plan = await suscripcionService.obtenerPlan(idUsuario);
  if (!plan.esSuscriptor && (await bibliotecaModel.contarColecciones(idUsuario)) >= config.limites.colecciones) {
    throw new AppError(`Llegaste al límite de ${config.limites.colecciones} colecciones del plan gratuito. Suscríbete para crear más.`, 403, 'LIMITE_PLAN');
  }
  const id = await bibliotecaModel.crearColeccion(idUsuario, limpio);
  return { id, nombre: limpio, totalLibros: 0 };
}

async function obtenerColeccion(idUsuario, idColeccion) {
  const coleccion = await exigirColeccion(idUsuario, idColeccion);
  return { ...coleccion, libros: await bibliotecaModel.listarLibrosColeccion(idColeccion) };
}

async function renombrarColeccion(idUsuario, idColeccion, nombre) {
  await exigirColeccion(idUsuario, idColeccion);
  await bibliotecaModel.renombrarColeccion(idColeccion, limpiarNombre(nombre));
}

async function eliminarColeccion(idUsuario, idColeccion) {
  await exigirColeccion(idUsuario, idColeccion);
  await bibliotecaModel.eliminarColeccion(idColeccion);
}

async function agregarLibroAColeccion(idUsuario, idColeccion, idLibro) {
  await exigirColeccion(idUsuario, idColeccion);
  await exigirLibroActivo(idLibro);
  await bibliotecaModel.agregarLibroColeccion(idColeccion, idLibro);
}

async function quitarLibroDeColeccion(idUsuario, idColeccion, idLibro) {
  await exigirColeccion(idUsuario, idColeccion);
  await bibliotecaModel.quitarLibroColeccion(idColeccion, idLibro);
}

module.exports = {
  agregarFavorito, crearColeccion, obtenerColeccion, renombrarColeccion,
  eliminarColeccion, agregarLibroAColeccion, quitarLibroDeColeccion
};
