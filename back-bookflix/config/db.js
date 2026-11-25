const mysql = require('mysql2/promise');
const config = require('./config');

// Todas las consultas usan marcadores "?" para evitar inyeccion SQL.
const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

module.exports = pool;
