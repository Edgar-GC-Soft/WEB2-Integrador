import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../util/config';
import { Libro, PaginaLibros, Recomendaciones } from '../modelos/modelos';

@Injectable({ providedIn: 'root' })
export class LibrosService {
  private http = inject(HttpClient);

  listar(filtros: { buscar?: string; categoria?: string; idioma?: string; pagina?: number }) {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v) params = params.set(k, String(v)); });
    return this.http.get<PaginaLibros>(`${API_URL}/libros`, { params });
  }
  categorias() { return this.http.get<string[]>(`${API_URL}/libros/categorias`); }
  obtener(id: number) { return this.http.get<Libro>(`${API_URL}/libros/${id}`); }
  recomendaciones() { return this.http.get<Recomendaciones>(`${API_URL}/recomendaciones`); }
}
