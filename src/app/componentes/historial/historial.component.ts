import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BibliotecaService } from '../../servicios/biblioteca.service';
import { ItemHistorial } from '../../modelos/modelos';
import { mensajeError } from '../../util/errores';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './historial.component.html'
})
export class HistorialComponent implements OnInit {
  private biblioteca = inject(BibliotecaService);

  items = signal<ItemHistorial[]>([]);
  cargando = signal(true);
  error = signal('');

  ngOnInit() {
    this.biblioteca.historial().subscribe({
      next: (h) => { this.items.set(h); this.cargando.set(false); },
      error: (e) => { this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }
}
