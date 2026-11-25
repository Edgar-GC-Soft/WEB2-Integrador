import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../util/config';
import { InfoPlanes, PlanUsuario } from '../modelos/modelos';

@Injectable({ providedIn: 'root' })
export class SuscripcionService {
  private http = inject(HttpClient);

  planes() { return this.http.get<InfoPlanes>(`${API_URL}/suscripciones/planes`); }
  crearOrden() { return this.http.post<{ id: string; total: number; urlPago: string }>(`${API_URL}/suscripciones/orden`, {}); }
  capturarOrden(orderId: string) { return this.http.post<PlanUsuario>(`${API_URL}/suscripciones/capturar/${encodeURIComponent(orderId)}`, {}); }
  reanudarPagoPendiente() {
    return this.http.post<{ plan?: PlanUsuario; urlPago?: string }>(`${API_URL}/suscripciones/reanudar-pendiente`, {});
  }
  confirmar(suscripcionId: string) { return this.http.post<PlanUsuario>(`${API_URL}/suscripciones/confirmar`, { suscripcionId }); }
  cancelar() { return this.http.post<PlanUsuario>(`${API_URL}/suscripciones/cancelar`, {}); }
}
