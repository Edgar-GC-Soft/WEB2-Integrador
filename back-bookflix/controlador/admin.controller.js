const adminService = require('../services/admin.service');
const libroModel = require('../models/libro.model');
const { AppError, asyncHandler, entero } = require('../middleware/errores');

const POR_PAGINA = 15;

exports.importar = asyncHandler(async (req, res) => {
  res.json(await adminService.importar(req.body));
});

exports.listar = asyncHandler(async (req, res) => {
  const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
  const { libros, total } = await libroModel.listar({
    buscar: String(req.query.buscar || '').trim(),
    categoria: '',
    idioma: '',
    pagina,
    porPagina: POR_PAGINA,
    soloActivos: false
  });
  res.json({ libros, total, pagina, totalPaginas: Math.max(Math.ceil(total / POR_PAGINA), 1) });
});

exports.cambiarEstado = asyncHandler(async (req, res) => {
  if (typeof req.body.activo !== 'boolean') throw new AppError('Indica si el libro debe estar activo', 400, 'DATO_INVALIDO');
  const filas = await libroModel.cambiarEstado(entero(req.params.id), req.body.activo);
  if (!filas) throw new AppError('El libro no existe', 404, 'LIBRO_NO_ENCONTRADO');
  res.json({ mensaje: req.body.activo ? 'Libro activado' : 'Libro desactivado' });
});
