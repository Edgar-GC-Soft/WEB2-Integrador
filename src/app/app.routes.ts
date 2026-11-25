import { Routes } from '@angular/router';
import { authGuard } from './guard/auth.guard';
import { roleGuard } from './guard/role.guard';
import { suscriptorGuard } from './guard/suscriptor.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },

  // Publicas (el visitante solo ve registro, inicio de sesion, planes y textos legales)
  { path: 'login', title: 'Iniciar sesión', loadComponent: () => import('./componentes/login/login.component').then((m) => m.LoginComponent) },
  { path: 'registro', title: 'Crear cuenta', loadComponent: () => import('./componentes/registro/registro.component').then((m) => m.RegistroComponent) },
  { path: 'recuperar', title: 'Recuperar contraseña', loadComponent: () => import('./componentes/recuperar/recuperar.component').then((m) => m.RecuperarComponent) },
  { path: 'restablecer/:token', title: 'Nueva contraseña', loadComponent: () => import('./componentes/restablecer/restablecer.component').then((m) => m.RestablecerComponent) },
  { path: 'planes', title: 'Planes', loadComponent: () => import('./componentes/planes/planes.component').then((m) => m.PlanesComponent) },
  { path: 'pago-paypal', title: 'Confirmar pago', canActivate: [authGuard], loadComponent: () => import('./componentes/pago-paypal/pago-paypal-retorno.component').then((m) => m.PagoPaypalRetornoComponent) },
  { path: 'privacidad', title: 'Aviso de privacidad', loadComponent: () => import('./componentes/privacidad/privacidad.component').then((m) => m.PrivacidadComponent) },
  { path: 'terminos', title: 'Términos y condiciones', loadComponent: () => import('./componentes/terminos/terminos.component').then((m) => m.TerminosComponent) },
  { path: 'sin-acceso', title: 'Sin acceso', loadComponent: () => import('./componentes/sin-acceso/sin-acceso.component').then((m) => m.SinAccesoComponent) },

  // Requieren sesion
  { path: 'inicio', title: 'Inicio', canActivate: [authGuard], loadComponent: () => import('./componentes/inicio/inicio.component').then((m) => m.InicioComponent) },
  { path: 'catalogo', title: 'Catálogo', canActivate: [authGuard], loadComponent: () => import('./componentes/catalogo/catalogo.component').then((m) => m.CatalogoComponent) },
  { path: 'libro/:id', title: 'Detalle del libro', canActivate: [authGuard], loadComponent: () => import('./componentes/detalle-libro/detalle-libro.component').then((m) => m.DetalleLibroComponent) },
  { path: 'leer/:id', title: 'Lector', canActivate: [authGuard], loadComponent: () => import('./componentes/lector/lector.component').then((m) => m.LectorComponent) },
  { path: 'favoritos', title: 'Favoritos', canActivate: [authGuard], loadComponent: () => import('./componentes/favoritos/favoritos.component').then((m) => m.FavoritosComponent) },
  { path: 'colecciones', title: 'Colecciones', canActivate: [authGuard], loadComponent: () => import('./componentes/colecciones/colecciones.component').then((m) => m.ColeccionesComponent) },
  { path: 'colecciones/:id', title: 'Colección', canActivate: [authGuard], loadComponent: () => import('./componentes/coleccion-detalle/coleccion-detalle.component').then((m) => m.ColeccionDetalleComponent) },
  { path: 'perfil', title: 'Mi perfil', canActivate: [authGuard], loadComponent: () => import('./componentes/perfil/perfil.component').then((m) => m.PerfilComponent) },

  // Solo suscriptores
  { path: 'historial', title: 'Historial', canActivate: [authGuard, suscriptorGuard], loadComponent: () => import('./componentes/historial/historial.component').then((m) => m.HistorialComponent) },

  // Solo administrador
  { path: 'admin', title: 'Administración', canActivate: [authGuard, roleGuard], loadComponent: () => import('./componentes/admin/admin.component').then((m) => m.AdminComponent) },

  { path: '**', redirectTo: 'inicio' }
];
