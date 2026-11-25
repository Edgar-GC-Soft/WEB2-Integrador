// Crea la base de datos, las tablas y el usuario administrador.  Uso: node seed.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const config = require('./config/config');

(async () => {
  const { host, port, user, password, database } = config.db;
  const conexion = await mysql.createConnection({ host, port, user, password, multipleStatements: true });

  await conexion.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; USE \`${database}\`;`
  );
  await conexion.query(fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8'));
  console.log('Base de datos y tablas listas.');

  const [[rol]] = await conexion.query("SELECT id_rol FROM roles WHERE nombre = 'administrador'");
  const [[existente]] = await conexion.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [config.admin.correo]);

  if (existente) {
    await conexion.query('UPDATE usuarios SET id_rol = ? WHERE id_usuario = ?', [rol.id_rol, existente.id_usuario]);
    console.log(`El usuario ${config.admin.correo} ya existia: ahora es administrador.`);
  } else {
    const hash = await bcrypt.hash(config.admin.password, 10);
    await conexion.query(
      'INSERT INTO usuarios (id_rol, nombre, correo, contrasena_hash, fecha_aceptacion_terminos) VALUES (?, ?, ?, ?, NOW())',
      [rol.id_rol, config.admin.nombre, config.admin.correo, hash]
    );
    console.log(`Administrador creado: ${config.admin.correo}`);
  }
  await conexion.end();
})().catch((e) => {
  console.error('Error en el seed:', e.message);
  process.exit(1);
});
