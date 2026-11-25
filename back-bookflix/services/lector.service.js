const fs = require('fs');
const path = require('path');
const libroModel = require('../models/libro.model');
const lecturaModel = require('../models/lectura.model');
const ia = require('./internetarchive.service');
const logger = require('./logger');
const { AppError } = require('../middleware/errores');

const CARPETA_CACHE = path.join(__dirname, '..', 'cache', 'textos');
const MAX_EN_MEMORIA = 5;
const memoria = new Map(); // idLibro -> fragmentos

const PREFERENCIAS_POR_DEFECTO = { modoOscuro: false, tamanoLetra: 18, tipografia: 'serif', interlineado: 1.7 };
const TIPOGRAFIAS = ['serif', 'sans', 'mono'];

// Los textos se guardan en disco la primera vez que se leen (copia local)
async function cargarFragmentos(libro) {
  if (memoria.has(libro.id_libro)) return memoria.get(libro.id_libro);

  fs.mkdirSync(CARPETA_CACHE, { recursive: true });
  const archivo = path.join(CARPETA_CACHE, `${libro.id_libro}.json`);
  let fragmentos = null;

  if (fs.existsSync(archivo)) {
    try { fragmentos = JSON.parse(fs.readFileSync(archivo, 'utf8')); } catch (e) { fragmentos = null; }
  }
  if (!fragmentos) {
    try {
      fragmentos = ia.aFragmentos(await ia.descargarTexto(libro.ia_id));
    } catch (e) {
      logger.error(e);
      throw new AppError('No se pudo cargar el texto del libro. Intenta de nuevo.', 502, 'TEXTO_NO_DISPONIBLE');
    }
    if (!fragmentos.length) throw new AppError('Este libro no tiene texto disponible.', 502, 'TEXTO_NO_DISPONIBLE');
    fs.writeFileSync(archivo, JSON.stringify(fragmentos));
  }

  if (memoria.size >= MAX_EN_MEMORIA) memoria.delete(memoria.keys().next().value);
  memoria.set(libro.id_libro, fragmentos);
  return fragmentos;
}

async function obtenerFragmento(idLibro, indice, usuario) {
  const libro = await libroModel.obtenerFila(idLibro);
  if (!libro || (!libro.activo && usuario.rol !== 'administrador')) {
    throw new AppError('El libro no existe o no está disponible', 404, 'LIBRO_NO_ENCONTRADO');
  }
  const fragmentos = await cargarFragmentos(libro);
  const i = Math.min(Math.max(indice, 0), fragmentos.length - 1);
  return { titulo: libro.titulo, indice: i, total: fragmentos.length, parrafos: fragmentos[i] };
}

async function registrarLectura(idUsuario, idLibro) {
  const libro = await libroModel.obtenerFila(idLibro);
  if (!libro) throw new AppError('El libro no existe', 404, 'LIBRO_NO_ENCONTRADO');
  await lecturaModel.registrarLectura(idUsuario, idLibro);
}

async function obtenerPreferencias(idUsuario, esSuscriptor) {
  if (!esSuscriptor) return PREFERENCIAS_POR_DEFECTO;
  return (await lecturaModel.obtenerPreferencias(idUsuario)) || PREFERENCIAS_POR_DEFECTO;
}

async function guardarPreferencias(idUsuario, datos) {
  const p = {
    modoOscuro: datos.modoOscuro === true,
    tamanoLetra: Math.min(Math.max(parseInt(datos.tamanoLetra, 10) || 18, 14), 32),
    tipografia: TIPOGRAFIAS.includes(datos.tipografia) ? datos.tipografia : 'serif',
    interlineado: Math.min(Math.max(Number(datos.interlineado) || 1.7, 1.2), 2.4)
  };
  p.interlineado = Math.round(p.interlineado * 10) / 10;
  await lecturaModel.guardarPreferencias(idUsuario, p);
  return p;
}

module.exports = { obtenerFragmento, registrarLectura, obtenerPreferencias, guardarPreferencias };
