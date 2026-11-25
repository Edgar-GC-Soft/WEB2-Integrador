const pool = require('../config/db');

const CAMPOS_EDITABLES = ['estado', 'fecha_inicio', 'fecha_proxima_renovacion', 'fecha_fin'];

async function crear(idUsuario, paypalId) {
  const [r] = await pool.query(
    "INSERT INTO suscripciones (id_usuario, paypal_subscription_id, estado) VALUES (?, ?, 'pendiente')",
    [idUsuario, paypalId]
  );
  return r.insertId;
}

async function buscarPorPaypalId(paypalId) {
  const [[s]] = await pool.query('SELECT * FROM suscripciones WHERE paypal_subscription_id = ?', [paypalId]);
  return s || null;
}

async function buscarActualDeUsuario(idUsuario) {
  const [[s]] = await pool.query('SELECT * FROM suscripciones WHERE id_usuario = ? ORDER BY id_suscripcion DESC LIMIT 1', [idUsuario]);
  return s || null;
}

async function actualizar(idSuscripcion, campos) {
  const claves = Object.keys(campos).filter((k) => CAMPOS_EDITABLES.includes(k));
  if (!claves.length) return;
  const sql = `UPDATE suscripciones SET ${claves.map((k) => `${k} = ?`).join(', ')} WHERE id_suscripcion = ?`;
  await pool.query(sql, [...claves.map((k) => campos[k]), idSuscripcion]);
}

// Devuelve cuantas filas se insertaron (0 = el pago ya estaba registrado)
async function registrarPago({ idSuscripcion, paypalPaymentId, monto, moneda, fecha }) {
  const [r] = await pool.query(
    "INSERT IGNORE INTO pagos (id_suscripcion, paypal_payment_id, monto, moneda, estado, fecha_pago) VALUES (?, ?, ?, ?, 'completado', ?)",
    [idSuscripcion, paypalPaymentId, monto, moneda, fecha]
  );
  return r.affectedRows;
}

async function contarPagos(idSuscripcion) {
  const [[r]] = await pool.query('SELECT COUNT(*) AS total FROM pagos WHERE id_suscripcion = ?', [idSuscripcion]);
  return r.total;
}

// --- Eventos de webhook (para que un evento repetido no se procese dos veces) ---
async function buscarEvento(paypalEventId) {
  const [[e]] = await pool.query('SELECT * FROM eventos_webhook WHERE paypal_event_id = ?', [paypalEventId]);
  return e || null;
}

async function registrarEvento(paypalEventId, tipo) {
  await pool.query('INSERT IGNORE INTO eventos_webhook (paypal_event_id, tipo_evento) VALUES (?, ?)', [paypalEventId, tipo]);
}

async function marcarEventoProcesado(paypalEventId, idSuscripcion) {
  await pool.query('UPDATE eventos_webhook SET procesado = 1, id_suscripcion = ? WHERE paypal_event_id = ?', [idSuscripcion || null, paypalEventId]);
}

module.exports = {
  crear, buscarPorPaypalId, buscarActualDeUsuario, actualizar, registrarPago, contarPagos,
  buscarEvento, registrarEvento, marcarEventoProcesado
};
