const pool = require('../config/db');
const libroModel = require('./libro.model');

const { COLUMNAS, formatear } = libroModel;

// ---------- Favoritos ----------
async function contarFavoritos(idUsuario) {
  const [[r]] = await pool.query('SELECT COUNT(*) AS total FROM favoritos WHERE id_usuario = ?', [idUsuario]);
  return r.total;
}

async function existeFavorito(idUsuario, idLibro) {
  const [[f]] = await pool.query('SELECT 1 AS existe FROM favoritos WHERE id_usuario = ? AND id_libro = ?', [idUsuario, idLibro]);
  return !!f;
}

async function agregarFavorito(idUsuario, idLibro) {
  await pool.query('INSERT IGNORE INTO favoritos (id_usuario, id_libro) VALUES (?, ?)', [idUsuario, idLibro]);
}

async function quitarFavorito(idUsuario, idLibro) {
  await pool.query('DELETE FROM favoritos WHERE id_usuario = ? AND id_libro = ?', [idUsuario, idLibro]);
}

async function listarFavoritos(idUsuario) {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS} FROM favoritos f JOIN libros l ON l.id_libro = f.id_libro
      WHERE f.id_usuario = ? AND l.activo = 1 ORDER BY f.fecha_agregado DESC`,
    [idUsuario]
  );
  return filas.map(formatear);
}

// ---------- Colecciones ----------
async function contarColecciones(idUsuario) {
  const [[r]] = await pool.query('SELECT COUNT(*) AS total FROM colecciones WHERE id_usuario = ?', [idUsuario]);
  return r.total;
}

async function crearColeccion(idUsuario, nombre) {
  const [r] = await pool.query('INSERT INTO colecciones (id_usuario, nombre) VALUES (?, ?)', [idUsuario, nombre]);
  return r.insertId;
}

async function listarColecciones(idUsuario) {
  const [filas] = await pool.query(
    `SELECT c.id_coleccion AS id, c.nombre,
            (SELECT COUNT(*) FROM coleccion_libros cl WHERE cl.id_coleccion = c.id_coleccion) AS totalLibros
       FROM colecciones c WHERE c.id_usuario = ? ORDER BY c.fecha_creacion DESC`,
    [idUsuario]
  );
  return filas.map((f) => ({ id: f.id, nombre: f.nombre, totalLibros: Number(f.totalLibros) }));
}

// Devuelve la coleccion solo si pertenece al usuario
async function obtenerColeccion(idUsuario, idColeccion) {
  const [[c]] = await pool.query('SELECT id_coleccion AS id, nombre FROM colecciones WHERE id_coleccion = ? AND id_usuario = ?', [idColeccion, idUsuario]);
  return c || null;
}

async function renombrarColeccion(idColeccion, nombre) {
  await pool.query('UPDATE colecciones SET nombre = ? WHERE id_coleccion = ?', [nombre, idColeccion]);
}

async function eliminarColeccion(idColeccion) {
  await pool.query('DELETE FROM colecciones WHERE id_coleccion = ?', [idColeccion]);
}

async function listarLibrosColeccion(idColeccion) {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS} FROM coleccion_libros cl JOIN libros l ON l.id_libro = cl.id_libro
      WHERE cl.id_coleccion = ? AND l.activo = 1 ORDER BY cl.fecha_agregado DESC`,
    [idColeccion]
  );
  return filas.map(formatear);
}

async function agregarLibroColeccion(idColeccion, idLibro) {
  await pool.query('INSERT IGNORE INTO coleccion_libros (id_coleccion, id_libro) VALUES (?, ?)', [idColeccion, idLibro]);
}

async function quitarLibroColeccion(idColeccion, idLibro) {
  await pool.query('DELETE FROM coleccion_libros WHERE id_coleccion = ? AND id_libro = ?', [idColeccion, idLibro]);
}

module.exports = {
  contarFavoritos, existeFavorito, agregarFavorito, quitarFavorito, listarFavoritos,
  contarColecciones, crearColeccion, listarColecciones, obtenerColeccion, renombrarColeccion,
  eliminarColeccion, listarLibrosColeccion, agregarLibroColeccion, quitarLibroColeccion
};
