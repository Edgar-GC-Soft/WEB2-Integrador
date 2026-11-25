import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LibrosService } from '../../servicios/libros.service';
import { Libro } from '../../modelos/modelos';
import { LibroCardComponent } from '../libro-card/libro-card.component';
import { mensajeError } from '../../util/errores';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [FormsModule, LibroCardComponent],
  templateUrl: './catalogo.component.html'
})
export class CatalogoComponent implements OnInit {
  private librosService = inject(LibrosService);

  buscar = '';
  categoria = '';
  idioma = '';

  libros = signal<Libro[]>([]);
  categorias = signal<string[]>([]);
  total = signal(0);
  pagina = signal(1);
  totalPaginas = signal(1);
  cargando = signal(false);
  error = signal('');

  ngOnInit() {
    this.librosService.categorias().subscribe({ next: (c) => this.categorias.set(c), error: () => {} });
    this.cargar(1);
  }

  cargar(pagina: number) {
    this.cargando.set(true);
    this.error.set('');
    this.librosService.listar({ buscar: this.buscar.trim(), categoria: this.categoria, idioma: this.idioma, pagina }).subscribe({
      next: (r) => {
        this.libros.set(r.libros);
        this.total.set(r.total);
        this.pagina.set(r.pagina);
        this.totalPaginas.set(r.totalPaginas);
        this.cargando.set(false);
        window.scrollTo({ top: 0 });
      },
      error: (e) => { this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }
}
