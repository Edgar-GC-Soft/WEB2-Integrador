import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { AvisoService } from '../../servicios/aviso.service';
import { BibliotecaService } from '../../servicios/biblioteca.service';
import { Libro } from '../../modelos/modelos';
import { LibroCardComponent } from '../libro-card/libro-card.component';
import { mensajeError } from '../../util/errores';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [RouterLink, LibroCardComponent],
  templateUrl: './favoritos.component.html'
})
export class FavoritosComponent implements OnInit {
  auth = inject(AuthService);
  private biblioteca = inject(BibliotecaService);
  private avisos = inject(AvisoService);

  libros = signal<Libro[]>([]);
  cargando = signal(true);

  ngOnInit() {
    this.biblioteca.favoritos().subscribe({
      next: (l) => { this.libros.set(l); this.cargando.set(false); },
      error: (e) => { this.avisos.error(mensajeError(e)); this.cargando.set(false); }
    });
  }

  quitar(libro: Libro) {
    this.biblioteca.quitarFavorito(libro.id).subscribe({
      next: () => this.libros.update((lista) => lista.filter((l) => l.id !== libro.id)),
      error: (e) => this.avisos.error(mensajeError(e))
    });
  }
}
