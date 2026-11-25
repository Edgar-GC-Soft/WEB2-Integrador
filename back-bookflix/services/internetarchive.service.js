const config = require('../config/config');
const { USER_AGENT } = require('./openlibrary.service');

const urlTexto = (ia) => `https://archive.org/download/${encodeURIComponent(ia)}/${encodeURIComponent(ia)}_djvu.txt`;

// Comprueba (pidiendo solo los primeros bytes) que el item tenga texto disponible
async function tieneTexto(ia) {
  try {
    const resp = await fetch(urlTexto(ia), {
      headers: { 'User-Agent': USER_AGENT, Range: 'bytes=0-255' },
      signal: AbortSignal.timeout(15000)
    });
    if (resp.body) resp.body.cancel().catch(() => {});
    return resp.ok;
  } catch (e) {
    return false;
  }
}

async function primerIdConTexto(ids) {
  for (const ia of ids.slice(0, 3)) {
    if (await tieneTexto(ia)) return ia;
  }
  return null;
}

async function descargarTexto(ia) {
  const resp = await fetch(urlTexto(ia), { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(60000) });
  if (!resp.ok) throw new Error(`Internet Archive respondió ${resp.status}`);
  return resp.text();
}

// Une las lineas partidas por el OCR y agrupa los parrafos en fragmentos de tamaño parecido.
// Devuelve un arreglo de fragmentos; cada fragmento es un arreglo de parrafos.
function aFragmentos(texto, tamano = config.fragmentoCaracteres) {
  const limpio = texto
    .replace(/\r/g, '')
    .replace(/-\n(?=\p{L})/gu, '')
    .replace(/([^\n])\n(?!\n)/g, '$1 ');
  const parrafos = limpio.split(/\n{2,}/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);

  const fragmentos = [];
  let actual = [];
  let largo = 0;
  for (const p of parrafos) {
    actual.push(p);
    largo += p.length;
    if (largo >= tamano) {
      fragmentos.push(actual);
      actual = [];
      largo = 0;
    }
  }
  if (actual.length) fragmentos.push(actual);
  return fragmentos;
}

module.exports = { primerIdConTexto, descargarTexto, aFragmentos };
