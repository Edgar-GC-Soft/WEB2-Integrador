import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../servicios/auth.service';

// Solo administradores
export const roleGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.asegurarPerfil().pipe(map(() => (auth.esAdmin() ? true : router.createUrlTree(['/sin-acceso']))));
};
