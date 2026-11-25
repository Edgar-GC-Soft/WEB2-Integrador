import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../servicios/auth.service';

// Solo usuarios con sesion iniciada
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estaLogueado()) {
    return router.createUrlTree(['/login'], { queryParams: { volver: state.url } });
  }
  return auth.asegurarPerfil().pipe(map((ok) => (ok ? true : router.createUrlTree(['/login']))));
};
