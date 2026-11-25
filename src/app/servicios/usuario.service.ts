import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../util/config';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);

  actualizarNombre(nombre: string) { return this.http.put<{ mensaje: string }>(`${API_URL}/usuarios/perfil`, { nombre }); }
  cambiarContrasena(actual: string, nueva: string) { return this.http.put<{ mensaje: string }>(`${API_URL}/usuarios/contrasena`, { actual, nueva }); }
  eliminarCuenta(contrasena: string) { return this.http.delete<{ mensaje: string }>(`${API_URL}/usuarios/cuenta`, { body: { contrasena } }); }
}
