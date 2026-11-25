export interface Usuario { id: number; nombre: string; correo: string; rol: 'usuario' | 'administrador'; }

export interface PlanUsuario {
  esSuscriptor: boolean;
  estado: 'ninguna' | 'pendiente' | 'activa' | 'cancelada' | 'pago_fallido' | 'expirada';
  fechaRenovacion: string | null;
  fechaFin: string | null;
}

export interface Perfil { usuario: Usuario; plan: PlanUsuario; }

export interface Libro {
  id: number; titulo: string; autor: string; idioma: string; anio: number | null;
  portada: string | null; activo: boolean; categorias: string[]; lecturas?: number;
}

export interface PaginaLibros { libros: Libro[]; total: number; pagina: number; totalPaginas: number; }

export interface Fragmento { titulo: string; indice: number; total: number; parrafos: string[]; }

export interface PreferenciasLector { modoOscuro: boolean; tamanoLetra: number; tipografia: string; interlineado: number; }

export interface Coleccion { id: number; nombre: string; totalLibros: number; }
export interface ColeccionDetalle { id: number; nombre: string; libros: Libro[]; }

export interface ItemHistorial { libro: Libro; ultimoPunto: number; fecha: string; }

export interface InfoPlanes { precio: number; moneda: string; paypal: { disponible: boolean }; }

export interface ResumenImportacion { importados: number; omitidos: number; errores: number; detalle: string[]; }

export interface Recomendaciones { tipo: 'populares' | 'afinidad'; libros: Libro[]; }
