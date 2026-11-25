import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../util/config';
import { Fragmento, PreferenciasLector } from '../modelos/modelos';

@Injectable({ providedIn: 'root' })
export class LectorService {
  private http = inject(HttpClient);

  fragmento(id: number, n: number) { return this.http.get<Fragmento>(`${API_URL}/lector/${id}/fragmento/${n}`); }
  registrarLectura(id: number) { return this.http.post(`${API_URL}/lector/${id}/lectura`, {}); }
  punto(id: number) { return this.http.get<{ punto: number }>(`${API_URL}/lector/${id}/punto`); }
  guardarPunto(id: number, punto: number) { return this.http.put(`${API_URL}/lector/${id}/punto`, { punto }); }
  preferencias() { return this.http.get<PreferenciasLector>(`${API_URL}/lector/preferencias`); }
  guardarPreferencias(p: PreferenciasLector) { return this.http.put<PreferenciasLector>(`${API_URL}/lector/preferencias`, p); }
}
