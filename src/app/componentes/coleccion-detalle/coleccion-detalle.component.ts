import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AvisoService } from '../../servicios/aviso.service';
import { BibliotecaService } from '../../servicios/biblioteca.service';
import { ColeccionDetalle, Libro } from '../../modelos/modelos';
import { LibroCardComponent } from '../libro-card/libro-card.component';
import { mensajeError } from '../../util/errores';

@Component({
  selector: 'app-coleccion-detalle',
  standalone: true,
  imports: [RouterLink, LibroCardComponent],
  templateUrl: './coleccion-detalle.component.html'
})
export class ColeccionDetalleComponent implements OnInit {
  private biblioteca = inject(BibliotecaService);
  private avisos = inject(AvisoService);
  private id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  coleccion = signal<ColeccionDetalle | null>(null);
  error = signal('');

  ngOnInit() {
    this.biblioteca.obtenerColeccion(this.id).subscribe({
      next: (c) => this.coleccion.set(c),
      error: (e) => this.error.set(mensajeError(e))
    });
  }

  quitar(libro: Libro) {
    this.biblioteca.quitarLibro(this.id, libro.id).subscribe({
      next: () => this.coleccion.update((c) => (c ? { ...c, libros: c.libros.filter((l) => l.id !== libro.id) } : c)),
      error: (e) => this.avisos.error(mensajeError(e))
    });
  }
}
