import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../servicios/auth.service';
import { AvisoService } from '../servicios/aviso.service';

// Solo suscriptores; los usuarios gratuitos van a la pantalla de planes con un aviso
export const suscriptorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const avisos = inject(AvisoService);
  return auth.asegurarPerfil().pipe(
    map(() => {
      if (auth.esSuscriptor()) return true;
      avisos.info('Esta función es exclusiva de suscriptores.');
      return router.createUrlTree(['/planes']);
    })
  );
};
