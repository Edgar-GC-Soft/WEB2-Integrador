import { Injectable, signal } from '@angular/core';

export interface Aviso { id: number; tipo: 'exito' | 'error' | 'info'; texto: string; }

@Injectable({ providedIn: 'root' })
export class AvisoService {
  avisos = signal<Aviso[]>([]);
  private contador = 0;

  exito(texto: string) { this.mostrar('exito', texto); }
  error(texto: string) { this.mostrar('error', texto); }
  info(texto: string) { this.mostrar('info', texto); }

  private mostrar(tipo: Aviso['tipo'], texto: string) {
    const id = ++this.contador;
    this.avisos.update((lista) => [...lista, { id, tipo, texto }]);
    setTimeout(() => this.avisos.update((lista) => lista.filter((a) => a.id !== id)), 4500);
  }
}
