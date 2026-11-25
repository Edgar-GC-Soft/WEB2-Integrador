import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../servicios/auth.service';
import { AvisoService } from '../servicios/aviso.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const avisos = inject(AvisoService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Token vencido o invalido: se cierra la sesion (menos en login/registro, donde 401 es "datos incorrectos")
      if (err.status === 401 && !req.url.includes('/auth/')) {
        auth.logout();
        avisos.info('Tu sesión expiró. Inicia sesión de nuevo.');
      } else if (err.status === 0) {
        avisos.error('No se pudo conectar con el servidor.');
      }
      return throwError(() => err);
    })
  );
};
