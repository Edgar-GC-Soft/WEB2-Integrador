const pool = require('../config/db');

const BASE = `SELECT u.id_usuario, u.nombre, u.correo, u.contrasena_hash, r.nombre AS rol
              FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol`;

async function crear({ nombre, correo, hash }) {
  const [[rol]] = await pool.query("SELECT id_rol FROM roles WHERE nombre = 'usuario'");
  const [r] = await pool.query(
    'INSERT INTO usuarios (id_rol, nombre, correo, contrasena_hash, fecha_aceptacion_terminos) VALUES (?, ?, ?, ?, NOW())',
    [rol.id_rol, nombre, correo, hash]
  );
  return r.insertId;
}

async function buscarPorCorreo(correo) {
  const [[u]] = await pool.query(`${BASE} WHERE u.correo = ?`, [correo]);
  return u || null;
}

async function buscarPorId(id) {
  const [[u]] = await pool.query(`${BASE} WHERE u.id_usuario = ?`, [id]);
  return u || null;
}

async function actualizarNombre(id, nombre) {
  await pool.query('UPDATE usuarios SET nombre = ? WHERE id_usuario = ?', [nombre, id]);
}

async function actualizarContrasena(id, hash) {
  await pool.query('UPDATE usuarios SET contrasena_hash = ? WHERE id_usuario = ?', [hash, id]);
}

async function actualizarIndicadorSuscripcion(id, activo) {
  await pool.query('UPDATE usuarios SET suscripcion_activa = ? WHERE id_usuario = ?', [activo ? 1 : 0, id]);
}

// --- Recuperacion de contrasena (el token vence en 1 hora y es de un solo uso) ---
async function crearToken(idUsuario, tokenHash) {
  await pool.query(
    'INSERT INTO tokens_recuperacion (id_usuario, token_hash, fecha_expiracion) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
    [idUsuario, tokenHash]
  );
}

async function buscarTokenVigente(tokenHash) {
  const [[t]] = await pool.query(
    'SELECT * FROM tokens_recuperacion WHERE token_hash = ? AND usado = 0 AND fecha_expiracion > NOW()',
    [tokenHash]
  );
  return t || null;
}

async function marcarTokenUsado(idToken) {
  await pool.query('UPDATE tokens_recuperacion SET usado = 1 WHERE id_token = ?', [idToken]);
}

// --- Derechos ARCO ---
async function crearSolicitudArco(idUsuario, tipo, descripcion) {
  await pool.query('INSERT INTO solicitudes_arco (id_usuario, tipo, descripcion) VALUES (?, ?, ?)', [idUsuario, tipo, descripcion || null]);
}

module.exports = {
  crear, buscarPorCorreo, buscarPorId, actualizarNombre, actualizarContrasena, actualizarIndicadorSuscripcion,
  crearToken, buscarTokenVigente, marcarTokenUsado, crearSolicitudArco
};
