const config = require('../config/config');
const { AppError } = require('../middleware/errores');

const USER_AGENT = `BookFlix/1.0 (${config.contactoApi})`;

// Busca libros en Open Library y deja solo los de acceso publico con un item de Internet Archive
async function buscar({ consulta, idioma, limite }) {
  const params = new URLSearchParams({
    q: consulta,
    fields: 'key,title,author_name,first_publish_year,cover_i,ia,ebook_access,subject,language',
    limit: String(limite),
    has_fulltext: 'true'
  });
  if (idioma) params.set('language', idioma);

  let resp;
  try {
    resp = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(20000)
    });
  } catch (e) {
    throw new AppError('Open Library no está disponible por ahora. El catálogo existente sigue funcionando.', 503, 'OPENLIBRARY_NO_DISPONIBLE');
  }
  if (!resp.ok) throw new AppError('Open Library respondió con un error. Intenta más tarde.', 503, 'OPENLIBRARY_NO_DISPONIBLE');

  const datos = await resp.json();
  return (datos.docs || []).filter(
    (d) => d.title && d.ebook_access === 'public' && Array.isArray(d.ia) && d.ia.length > 0
  );
}

module.exports = { buscar, USER_AGENT };
