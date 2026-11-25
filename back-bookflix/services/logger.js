const fs = require('fs');
const path = require('path');

const carpeta = path.join(__dirname, '..', 'logs');

function escribir(nivel, mensaje) {
  const linea = `[${new Date().toISOString()}] ${nivel}: ${mensaje}`;
  (nivel === 'ERROR' ? console.error : console.log)(linea);
  try {
    fs.mkdirSync(carpeta, { recursive: true });
    fs.appendFileSync(path.join(carpeta, 'servidor.log'), linea + '\n');
  } catch (e) { /* si no se puede escribir el archivo, solo se muestra en consola */ }
}

module.exports = {
  info: (m) => escribir('INFO', m),
  error: (e) => escribir('ERROR', e && e.stack ? e.stack : String(e))
};
