import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { BibliotecaService } from '../../servicios/biblioteca.service';
import { LibrosService } from '../../servicios/libros.service';
import { ItemHistorial, Recomendaciones } from '../../modelos/modelos';
import { LibroCardComponent } from '../libro-card/libro-card.component';
import { mensajeError } from '../../util/errores';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, LibroCardComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  auth = inject(AuthService);
  private libros = inject(LibrosService);
  private biblioteca = inject(BibliotecaService);

  recomendaciones = signal<Recomendaciones | null>(null);
  continuar = signal<ItemHistorial[]>([]);
  cargando = signal(true);
  error = signal('');

  ngOnInit() {
    this.libros.recomendaciones().subscribe({
      next: (r) => { this.recomendaciones.set(r); this.cargando.set(false); },
      error: (e) => { this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
    // "Continuar leyendo" solo para suscriptores
    if (this.auth.esSuscriptor()) {
      this.biblioteca.historial().subscribe({
        next: (h) => this.continuar.set(h.slice(0, 4)),
        error: () => {}
      });
    }
  }
}
