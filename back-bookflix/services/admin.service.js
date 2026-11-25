const libroModel = require('../models/libro.model');
const openLibrary = require('./openlibrary.service');
const internetArchive = require('./internetarchive.service');
const { AppError } = require('../middleware/errores');

const CODIGOS_IDIOMA = { es: 'spa', en: 'eng' };
const SUBTEMAS_A_IGNORAR = /accessible|protected|daisy|in library|large type|lending|open library|overdrive|internet archive|fiction, general/i;

function elegirCategorias(doc, categoriaForzada) {
  if (categoriaForzada) return [categoriaForzada];
  return (doc.subject || [])
    .filter((s) => typeof s === 'string' && s.length >= 3 && s.length <= 40 && !SUBTEMAS_A_IGNORAR.test(s))
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

// Importa libros desde Open Library (metadatos) verificando que Internet Archive tenga el texto.
// Los libros quedan INACTIVOS hasta que el administrador verifique que son de dominio publico.
async function importar({ consulta, idioma, limite, categoria }) {
  const texto = String(consulta || '').trim();
  if (texto.length < 2) throw new AppError('Escribe qué quieres buscar (título, autor o tema)', 400, 'DATO_INVALIDO');
  const cantidad = Math.min(Math.max(parseInt(limite, 10) || 20, 1), 50);
  const codigo = CODIGOS_IDIOMA[idioma] || '';

  // Se piden mas resultados de los necesarios porque algunos se descartan (sin texto en Internet Archive)
  const candidatos = await openLibrary.buscar({ consulta: texto, idioma: codigo, limite: Math.min(cantidad * 3, 100) });

  const resumen = { importados: 0, omitidos: 0, errores: 0, detalle: [] };
  for (const doc of candidatos) {
    if (resumen.importados >= cantidad) break;
    try {
      if (await libroModel.existePorOlKey(doc.key)) { resumen.omitidos++; continue; }
      const iaId = await internetArchive.primerIdConTexto(doc.ia);
      if (!iaId) { resumen.errores++; resumen.detalle.push(`"${doc.title}": sin texto disponible`); continue; }

      const idiomaLibro = idioma || ((doc.language || []).includes('spa') ? 'es' : 'en');
      const idLibro = await libroModel.crear({
        olKey: doc.key,
        iaId,
        titulo: String(doc.title).slice(0, 255),
        autor: String((doc.author_name || ['Autor desconocido'])[0]).slice(0, 255),
        idioma: idiomaLibro,
        anio: doc.first_publish_year,
        coverId: doc.cover_i
      });
      for (const nombre of elegirCategorias(doc, categoria && categoria.trim())) {
        await libroModel.asignarCategoria(idLibro, nombre.slice(0, 80));
      }
      resumen.importados++;
    } catch (e) {
      resumen.errores++;
      resumen.detalle.push(`"${doc.title}": ${e.message}`);
    }
  }
  resumen.detalle = resumen.detalle.slice(0, 20);
  return resumen;
}

module.exports = { importar };
