const libroModel = require('../models/libro.model');
const { AppError, asyncHandler, entero } = require('../middleware/errores');

const POR_PAGINA = 12;

exports.listar = asyncHandler(async (req, res) => {
  const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
  const { libros, total } = await libroModel.listar({
    buscar: String(req.query.buscar || '').trim(),
    categoria: String(req.query.categoria || '').trim(),
    idioma: ['es', 'en'].includes(req.query.idioma) ? req.query.idioma : '',
    pagina,
    porPagina: POR_PAGINA,
    soloActivos: true
  });
  res.json({ libros, total, pagina, totalPaginas: Math.max(Math.ceil(total / POR_PAGINA), 1) });
});

exports.categorias = asyncHandler(async (req, res) => {
  res.json(await libroModel.listarCategorias());
});

exports.obtener = asyncHandler(async (req, res) => {
  const libro = await libroModel.obtenerPorId(entero(req.params.id));
  if (!libro || !libro.activo) throw new AppError('El libro no existe o no está disponible', 404, 'LIBRO_NO_ENCONTRADO');
  res.json(libro);
});
