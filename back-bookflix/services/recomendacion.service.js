const lecturaModel = require('../models/lectura.model');

const LIMITE = 10;

// Usuarios sin lecturas: los mas leidos. Usuarios con lecturas: libros de sus categorias y autores
// favoritos que aun no han leido (si faltan, se completa con los mas leidos).
async function obtenerParaUsuario(idUsuario) {
  const lecturas = await lecturaModel.contarLecturasDeUsuario(idUsuario);
  if (lecturas === 0) {
    return { tipo: 'populares', libros: await lecturaModel.masLeidos(LIMITE) };
  }
  const categorias = await lecturaModel.categoriasTopDeUsuario(idUsuario);
  const autores = await lecturaModel.autoresTopDeUsuario(idUsuario);
  const libros = await lecturaModel.candidatosParaUsuario(idUsuario, categorias, autores, LIMITE);
  if (libros.length === 0) {
    return { tipo: 'populares', libros: await lecturaModel.masLeidos(LIMITE) };
  }
  return { tipo: 'afinidad', libros };
}

module.exports = { obtenerParaUsuario };
