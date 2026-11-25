const pool = require('../config/db');
const { COLUMNAS, formatear } = require('./libro.model');

// ---------- Registro interno de lecturas (todos los usuarios) ----------
async function registrarLectura(idUsuario, idLibro) {
  await pool.query('INSERT INTO registro_lecturas (id_usuario, id_libro) VALUES (?, ?)', [idUsuario, idLibro]);
}

async function contarLecturasDeUsuario(idUsuario) {
  const [[r]] = await pool.query('SELECT COUNT(*) AS total FROM registro_lecturas WHERE id_usuario = ?', [idUsuario]);
  return r.total;
}

// ---------- Historial / ultimo punto de lectura (solo suscriptores) ----------
async function guardarPunto(idUsuario, idLibro, punto) {
  await pool.query(
    `INSERT INTO historial_lectura (id_usuario, id_libro, ultimo_punto) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE ultimo_punto = VALUES(ultimo_punto), fecha_ultima_lectura = CURRENT_TIMESTAMP`,
    [idUsuario, idLibro, punto]
  );
}

async function obtenerPunto(idUsuario, idLibro) {
  const [[f]] = await pool.query('SELECT ultimo_punto FROM historial_lectura WHERE id_usuario = ? AND id_libro = ?', [idUsuario, idLibro]);
  return f ? f.ultimo_punto : 0;
}

async function listarHistorial(idUsuario, limite = 50) {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS}, h.ultimo_punto, h.fecha_ultima_lectura
       FROM historial_lectura h JOIN libros l ON l.id_libro = h.id_libro
      WHERE h.id_usuario = ? AND l.activo = 1 ORDER BY h.fecha_ultima_lectura DESC LIMIT ?`,
    [idUsuario, limite]
  );
  return filas.map((f) => ({ libro: formatear(f), ultimoPunto: f.ultimo_punto, fecha: f.fecha_ultima_lectura }));
}

// ---------- Preferencias del lector ----------
async function obtenerPreferencias(idUsuario) {
  const [[f]] = await pool.query('SELECT * FROM preferencias_lector WHERE id_usuario = ?', [idUsuario]);
  return f ? { modoOscuro: !!f.modo_oscuro, tamanoLetra: f.tamano_letra, tipografia: f.tipografia, interlineado: Number(f.interlineado) } : null;
}

async function guardarPreferencias(idUsuario, p) {
  await pool.query(
    `INSERT INTO preferencias_lector (id_usuario, modo_oscuro, tamano_letra, tipografia, interlineado) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE modo_oscuro = VALUES(modo_oscuro), tamano_letra = VALUES(tamano_letra),
                             tipografia = VALUES(tipografia), interlineado = VALUES(interlineado)`,
    [idUsuario, p.modoOscuro ? 1 : 0, p.tamanoLetra, p.tipografia, p.interlineado]
  );
}

// ---------- Datos para recomendaciones ----------
async function masLeidos(limite) {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS}, COUNT(r.id_registro) AS lecturas
       FROM libros l LEFT JOIN registro_lecturas r ON r.id_libro = l.id_libro
      WHERE l.activo = 1 GROUP BY l.id_libro ORDER BY lecturas DESC, l.id_libro DESC LIMIT ?`,
    [limite]
  );
  return filas.map(formatear);
}

async function categoriasTopDeUsuario(idUsuario, limite = 3) {
  const [filas] = await pool.query(
    `SELECT lc.id_categoria FROM registro_lecturas r JOIN libro_categoria lc ON lc.id_libro = r.id_libro
      WHERE r.id_usuario = ? GROUP BY lc.id_categoria ORDER BY COUNT(*) DESC LIMIT ?`,
    [idUsuario, limite]
  );
  return filas.map((f) => f.id_categoria);
}

async function autoresTopDeUsuario(idUsuario, limite = 3) {
  const [filas] = await pool.query(
    `SELECT l.autor FROM registro_lecturas r JOIN libros l ON l.id_libro = r.id_libro
      WHERE r.id_usuario = ? GROUP BY l.autor ORDER BY COUNT(*) DESC LIMIT ?`,
    [idUsuario, limite]
  );
  return filas.map((f) => f.autor);
}

// Libros activos de esas categorias o autores que el usuario aun no ha leido
async function candidatosParaUsuario(idUsuario, categorias, autores, limite) {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS},
            (SELECT COUNT(*) FROM registro_lecturas rl WHERE rl.id_libro = l.id_libro) AS lecturas
       FROM libros l
      WHERE l.activo = 1
        AND l.id_libro NOT IN (SELECT id_libro FROM registro_lecturas WHERE id_usuario = ?)
        AND (l.autor IN (?) OR EXISTS (SELECT 1 FROM libro_categoria lc WHERE lc.id_libro = l.id_libro AND lc.id_categoria IN (?)))
      ORDER BY lecturas DESC, l.id_libro DESC LIMIT ?`,
    [idUsuario, autores.length ? autores : [''], categorias.length ? categorias : [0], limite]
  );
  return filas.map(formatear);
}

module.exports = {
  registrarLectura, contarLecturasDeUsuario, guardarPunto, obtenerPunto, listarHistorial,
  obtenerPreferencias, guardarPreferencias, masLeidos, categoriasTopDeUsuario, autoresTopDeUsuario, candidatosParaUsuario
};
