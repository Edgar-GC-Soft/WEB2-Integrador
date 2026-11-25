import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../util/config';
import { Coleccion, ColeccionDetalle, ItemHistorial, Libro } from '../modelos/modelos';

@Injectable({ providedIn: 'root' })
export class BibliotecaService {
  private http = inject(HttpClient);
  private base = `${API_URL}/biblioteca`;

  favoritos() { return this.http.get<Libro[]>(`${this.base}/favoritos`); }
  agregarFavorito(idLibro: number) { return this.http.post(`${this.base}/favoritos/${idLibro}`, {}); }
  quitarFavorito(idLibro: number) { return this.http.delete(`${this.base}/favoritos/${idLibro}`); }

  colecciones() { return this.http.get<Coleccion[]>(`${this.base}/colecciones`); }
  crearColeccion(nombre: string) { return this.http.post<Coleccion>(`${this.base}/colecciones`, { nombre }); }
  obtenerColeccion(id: number) { return this.http.get<ColeccionDetalle>(`${this.base}/colecciones/${id}`); }
  renombrarColeccion(id: number, nombre: string) { return this.http.put(`${this.base}/colecciones/${id}`, { nombre }); }
  eliminarColeccion(id: number) { return this.http.delete(`${this.base}/colecciones/${id}`); }
  agregarLibro(idColeccion: number, idLibro: number) { return this.http.post(`${this.base}/colecciones/${idColeccion}/libros/${idLibro}`, {}); }
  quitarLibro(idColeccion: number, idLibro: number) { return this.http.delete(`${this.base}/colecciones/${idColeccion}/libros/${idLibro}`); }

  historial() { return this.http.get<ItemHistorial[]>(`${this.base}/historial`); }
}
