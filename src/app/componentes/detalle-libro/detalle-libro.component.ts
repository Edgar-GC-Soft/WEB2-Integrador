import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { AvisoService } from '../../servicios/aviso.service';
import { BibliotecaService } from '../../servicios/biblioteca.service';
import { LibrosService } from '../../servicios/libros.service';
import { Coleccion, Libro } from '../../modelos/modelos';
import { mensajeError } from '../../util/errores';

@Component({
  selector: 'app-detalle-libro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './detalle-libro.component.html'
})
export class DetalleLibroComponent implements OnInit {
  auth = inject(AuthService);
  private libros = inject(LibrosService);
  private biblioteca = inject(BibliotecaService);
  private avisos = inject(AvisoService);
  private id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  libro = signal<Libro | null>(null);
  esFavorito = signal(false);
  colecciones = signal<Coleccion[]>([]);
  coleccionElegida = '';
  error = signal('');

  ngOnInit() {
    this.libros.obtener(this.id).subscribe({
      next: (l) => this.libro.set(l),
      error: (e) => this.error.set(mensajeError(e))
    });
    this.biblioteca.favoritos().subscribe({ next: (f) => this.esFavorito.set(f.some((l) => l.id === this.id)), error: () => {} });
    this.biblioteca.colecciones().subscribe({ next: (c) => this.colecciones.set(c), error: () => {} });
  }

  alternarFavorito() {
    const peticion = this.esFavorito() ? this.biblioteca.quitarFavorito(this.id) : this.biblioteca.agregarFavorito(this.id);
    peticion.subscribe({
      next: () => {
        this.esFavorito.update((v) => !v);
        this.avisos.exito(this.esFavorito() ? 'Agregado a favoritos' : 'Quitado de favoritos');
      },
      error: (e) => this.avisos.error(mensajeError(e)) // aqui llega el aviso del limite del plan gratuito
    });
  }

  agregarAColeccion() {
    if (!this.coleccionElegida) { this.avisos.info('Elige una colección.'); return; }
    this.biblioteca.agregarLibro(Number(this.coleccionElegida), this.id).subscribe({
      next: () => this.avisos.exito('Libro agregado a la colección'),
      error: (e) => this.avisos.error(mensajeError(e))
    });
  }
}
