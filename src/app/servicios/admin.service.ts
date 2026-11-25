import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../util/config';
import { PaginaLibros, ResumenImportacion } from '../modelos/modelos';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  importar(datos: { consulta: string; idioma: string; limite: number; categoria: string }) {
    return this.http.post<ResumenImportacion>(`${API_URL}/admin/importar`, datos);
  }
  listar(pagina: number, buscar: string) {
    let params = new HttpParams().set('pagina', pagina);
    if (buscar) params = params.set('buscar', buscar);
    return this.http.get<PaginaLibros>(`${API_URL}/admin/libros`, { params });
  }
  cambiarEstado(id: number, activo: boolean) {
    return this.http.put<{ mensaje: string }>(`${API_URL}/admin/libros/${id}/estado`, { activo });
  }
}
