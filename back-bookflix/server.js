require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./config/config');
const pool = require('./config/db');
const logger = require('./services/logger');
const rutas = require('./routes');
const { noEncontrado, manejarErrores } = require('./middleware/errores');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl })); // solo acepta peticiones del frontend
app.use(express.json({ limit: '1mb' }));

app.get('/api/salud', (req, res) => res.json({ ok: true }));
app.use('/api', rutas);
app.use(noEncontrado);
app.use(manejarErrores);

async function iniciar() {
  try {
    await pool.query('SELECT 1');
  } catch (e) {
    logger.error(new Error(`No se pudo conectar a MySQL: ${e.message}. Revisa el .env y ejecuta "node seed.js".`));
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) logger.info('AVISO: define JWT_SECRET en el .env (ahora se usa un secreto de desarrollo).');
  app.listen(config.puerto, () => logger.info(`BookFlix API lista en http://localhost:${config.puerto}/api`));
}

iniciar();
