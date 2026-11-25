import { HttpInterceptorFn } from '@angular/common/http';
import { API_URL } from './config';

// Agrega el token a cada peticion que va al backend
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('bf_token');
  if (token && req.url.startsWith(API_URL)) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
