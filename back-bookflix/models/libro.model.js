const pool = require('../config/db');

// Columnas que se devuelven al frontend (incluye las categorias en una sola cadena)
const COLUMNAS = `l.id_libro, l.titulo, l.autor, l.idioma, l.anio_publicacion, l.cover_id, l.activo,
  (SELECT GROUP_CONCAT(c.nombre SEPARATOR '||') FROM libro_categoria lc
     JOIN categorias c ON c.id_categoria = lc.id_categoria WHERE lc.id_libro = l.id_libro) AS categorias`;

function formatear(f) {
  return {
    id: f.id_libro,
    titulo: f.titulo,
    autor: f.autor,
    idioma: f.idioma,
    anio: f.anio_publicacion,
    portada: f.cover_id ? `https://covers.openlibrary.org/b/id/${f.cover_id}-M.jpg` : null,
    activo: !!f.activo,
    categorias: f.categorias ? f.categorias.split('||') : [],
    ...(f.lecturas !== undefined ? { lecturas: Number(f.lecturas) } : {})
  };
}

async function listar({ buscar, categoria, idioma, pagina, porPagina, soloActivos }) {
  const donde = [];
  const params = [];
  if (soloActivos) donde.push('l.activo = 1');
  if (buscar) {
    donde.push('(l.titulo LIKE ? OR l.autor LIKE ?)');
    params.push(`%${buscar}%`, `%${buscar}%`);
  }
  if (idioma) {
    donde.push('l.idioma = ?');
    params.push(idioma);
  }
  if (categoria) {
    donde.push(`EXISTS (SELECT 1 FROM libro_categoria lc2 JOIN categorias c2 ON c2.id_categoria = lc2.id_categoria
                         WHERE lc2.id_libro = l.id_libro AND c2.nombre = ?)`);
    params.push(categoria);
  }
  const where = donde.length ? `WHERE ${donde.join(' AND ')}` : '';
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM libros l ${where}`, params);
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS} FROM libros l ${where} ORDER BY l.titulo ASC LIMIT ? OFFSET ?`,
    [...params, porPagina, (pagina - 1) * porPagina]
  );
  return { libros: filas.map(formatear), total };
}

async function obtenerPorId(id) {
  const [[f]] = await pool.query(`SELECT ${COLUMNAS} FROM libros l WHERE l.id_libro = ?`, [id]);
  return f ? formatear(f) : null;
}

// Fila completa (incluye ia_id), solo para uso interno del backend
async function obtenerFila(id) {
  const [[f]] = await pool.query('SELECT * FROM libros WHERE id_libro = ?', [id]);
  return f || null;
}

async function listarCategorias() {
  const [filas] = await pool.query(
    `SELECT DISTINCT c.nombre FROM categorias c
       JOIN libro_categoria lc ON lc.id_categoria = c.id_categoria
       JOIN libros l ON l.id_libro = lc.id_libro
      WHERE l.activo = 1 ORDER BY c.nombre`
  );
  return filas.map((f) => f.nombre);
}

async function existePorOlKey(olKey) {
  const [[f]] = await pool.query('SELECT id_libro FROM libros WHERE ol_key = ?', [olKey]);
  return !!f;
}

async function crear({ olKey, iaId, titulo, autor, idioma, anio, coverId }) {
  const [r] = await pool.query(
    'INSERT INTO libros (ol_key, ia_id, titulo, autor, idioma, anio_publicacion, cover_id, activo) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
    [olKey, iaId, titulo, autor, idioma, anio || null, coverId || null]
  );
  return r.insertId;
}

async function asignarCategoria(idLibro, nombre) {
  await pool.query('INSERT IGNORE INTO categorias (nombre) VALUES (?)', [nombre]);
  const [[c]] = await pool.query('SELECT id_categoria FROM categorias WHERE nombre = ?', [nombre]);
  await pool.query('INSERT IGNORE INTO libro_categoria (id_libro, id_categoria) VALUES (?, ?)', [idLibro, c.id_categoria]);
}

async function cambiarEstado(id, activo) {
  const [r] = await pool.query('UPDATE libros SET activo = ? WHERE id_libro = ?', [activo ? 1 : 0, id]);
  return r.affectedRows;
}

module.exports = {
  COLUMNAS, formatear, listar, obtenerPorId, obtenerFila, listarCategorias,
  existePorOlKey, crear, asignarCategoria, cambiarEstado
};
