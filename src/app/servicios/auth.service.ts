import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { API_URL } from '../util/config';
import { Perfil, PlanUsuario, Usuario } from '../modelos/modelos';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  usuario = signal<Usuario | null>(null);
  plan = signal<PlanUsuario | null>(null);
  esAdmin = computed(() => this.usuario()?.rol === 'administrador');
  esSuscriptor = computed(() => !!this.plan()?.esSuscriptor);

  /** Hay token guardado y todavia no vence */
  estaLogueado(): boolean {
    const token = localStorage.getItem('bf_token');
    if (!token) return false;
    try {
      const datos = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !datos.exp || datos.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  registrar(datos: { nombre: string; correo: string; contrasena: string; aceptaPrivacidad: boolean; mayorEdad: boolean }) {
    return this.http.post<{ mensaje: string }>(`${API_URL}/auth/registro`, datos);
  }

  login(correo: string, contrasena: string): Observable<Perfil> {
    return this.http.post<{ token: string }>(`${API_URL}/auth/login`, { correo, contrasena }).pipe(
      tap((r) => localStorage.setItem('bf_token', r.token)),
      switchMap(() => this.cargarPerfil())
    );
  }

  cargarPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${API_URL}/usuarios/perfil`).pipe(
      tap((p) => {
        this.usuario.set(p.usuario);
        this.plan.set(p.plan);
      })
    );
  }

  /** Para los guards: espera a tener el perfil cargado (rol y plan) */
  asegurarPerfil(): Observable<boolean> {
    if (this.usuario()) return of(true);
    return this.cargarPerfil().pipe(map(() => true), catchError(() => of(false)));
  }

  recuperar(correo: string) {
    return this.http.post<{ mensaje: string }>(`${API_URL}/auth/recuperar`, { correo });
  }

  restablecer(token: string, contrasena: string) {
    return this.http.post<{ mensaje: string }>(`${API_URL}/auth/restablecer`, { token, contrasena });
  }

  logout() {
    localStorage.removeItem('bf_token');
    this.usuario.set(null);
    this.plan.set(null);
    this.router.navigate(['/login']);
  }
}
